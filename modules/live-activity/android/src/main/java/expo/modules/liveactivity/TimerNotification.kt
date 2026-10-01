package expo.modules.liveactivity

import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import androidx.core.app.AlarmManagerCompat
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.edit
import java.util.Locale
import kotlin.math.roundToInt

internal const val EXTRA_STOPPED_ENDS_AT = "expo.modules.liveactivity.STOPPED_ENDS_AT"

private const val CHANNEL_ID = "live-activity"
private const val NOTIFICATION_ID = 1
private const val SECOND_IN_MS = 1_000.0
private const val MINUTE_IN_MS = 60_000.0

// `src/shared/constants/colors.ts`의 `focus.arc`
private const val FOCUS_COLOR = 0xFF6A5B9C.toInt()

// `rest.arc`는 흰 아이콘과 대비가 4.5:1 미만이라 OS가 어둡게 바꿔 칠해서, 대비가 넘는 `rest.thumbArm`을 씀
private const val REST_COLOR = 0xFF2F7B85.toInt()

// `rest.arc`
private const val REST_PROGRESS_COLOR = 0xFF3F9AA6.toInt()

private const val PREFERENCES_NAME = "live-activity-content"
private const val PROGRESS_STEP_RATIO = 0.01

// 짧은 타이머·배속에서 notify 과다 방지용 하한
private const val MIN_PROGRESS_STEP_MS = 1_000L

private const val SPRITE_ROWS = 9
private const val LARGE_ICON_HEIGHT_RATIO = 0.6

internal data class TimerContent(val mode: String, val progressStartsAt: Double, val endsAt: Double, val language: String?)

internal object TimerNotification {
  // `areNotificationsEnabled`가 거부된 알림 권한까지 반영해 여기서 따로 확인하지 않음
  @SuppressLint("MissingPermission")
  fun show(context: Context, content: TimerContent) {
    val manager = NotificationManagerCompat.from(context)
    // `setTimeoutAfter(0)`은 timeout 없음이라 끝날 시각 경과 시 게시 생략
    if (!manager.areNotificationsEnabled() || content.endsAt <= System.currentTimeMillis()) {
      cancel(context)
      return
    }

    val localized = localizedContext(context, content.language)
    manager.createNotificationChannel(
      NotificationChannelCompat.Builder(CHANNEL_ID, NotificationManagerCompat.IMPORTANCE_LOW)
        .setName(localized.getString(R.string.live_activity_channel))
        .build()
    )

    // iOS fallback(`?? .focus`)과 동일
    val isFocus = content.mode != "rest"
    val minutes = ((content.endsAt - content.progressStartsAt) / MINUTE_IN_MS).roundToInt()
    val endsAt = content.endsAt.toLong()

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(if (isFocus) R.drawable.ic_notification_focus else R.drawable.ic_notification_rest)
      .setColor(if (isFocus) FOCUS_COLOR else REST_COLOR)
      .setLargeIcon(largeIcon(context, if (isFocus) R.drawable.bonfire_hot_still_9 else R.drawable.bonfire_cold_9))
      .setContentTitle(localized.getString(R.string.live_activity_title, minutes))
      .setContentIntent(openAppIntent(context))
      .addAction(0, localized.getString(R.string.live_activity_stop), stopIntent(context, endsAt))
      .setOngoing(true)
      .setRequestPromotedOngoing(true)
      .setOnlyAlertOnce(true)
      .setWhen(endsAt)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setStyle(progressStyle(content, if (isFocus) FOCUS_COLOR else REST_PROGRESS_COLOR))
      // 끝날 시각에 시스템이 알림을 지움. 앱 프로세스가 없어도 동작
      .setTimeoutAfter((endsAt - System.currentTimeMillis()).coerceAtLeast(0))
      .build()

    manager.notify(NOTIFICATION_ID, notification)

    saveContent(context, content)
    scheduleProgressUpdate(context, content)
  }

  // dismiss된 알림은 재게시하지 않음
  fun updateProgress(context: Context) {
    val manager = context.getSystemService(NotificationManager::class.java)
    if (manager.activeNotifications.none { it.id == NOTIFICATION_ID }) return

    val content = loadContent(context) ?: return

    // API 26 미만 `setTimeoutAfter` 미지원 대응으로 끝날 시각 알람에서 cancel
    if (content.endsAt <= System.currentTimeMillis()) cancel(context)
    else show(context, content)
  }

  fun cancel(context: Context) {
    NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
    context.getSystemService(AlarmManager::class.java).cancel(progressUpdateIntent(context))
    preferences(context).edit { clear() }
  }

  // RTC(non-wakeup)라 화면 꺼짐·Doze 중 갱신은 다음 wake까지 지연
  private fun scheduleProgressUpdate(context: Context, content: TimerContent) {
    val step = ((content.endsAt - content.progressStartsAt) * PROGRESS_STEP_RATIO).toLong().coerceAtLeast(MIN_PROGRESS_STEP_MS)
    val next = (System.currentTimeMillis() + step).coerceAtMost(content.endsAt.toLong())

    val alarmManager = context.getSystemService(AlarmManager::class.java)
    val intent = progressUpdateIntent(context)

    if (AlarmManagerCompat.canScheduleExactAlarms(alarmManager)) alarmManager.setExact(AlarmManager.RTC, next, intent)
    else alarmManager.set(AlarmManager.RTC, next, intent)
  }

  private fun progressUpdateIntent(context: Context): PendingIntent =
    PendingIntent.getBroadcast(
      context,
      0,
      Intent(context, ProgressUpdateReceiver::class.java),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )

  private fun preferences(context: Context) = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

  private fun saveContent(context: Context, content: TimerContent) {
    preferences(context).edit {
      putString("mode", content.mode)
      putLong("progressStartsAt", content.progressStartsAt.toLong())
      putLong("endsAt", content.endsAt.toLong())
      putString("language", content.language)
    }
  }

  private fun loadContent(context: Context): TimerContent? {
    val preferences = preferences(context)
    val mode = preferences.getString("mode", null) ?: return null

    return TimerContent(
      mode,
      preferences.getLong("progressStartsAt", 0).toDouble(),
      preferences.getLong("endsAt", 0).toDouble(),
      preferences.getString("language", null)
    )
  }

  // API 36 미만은 `setProgress` 표준 막대로 fallback, 구간 색 미적용
  private fun progressStyle(content: TimerContent, color: Int): NotificationCompat.ProgressStyle {
    val totalSeconds = ((content.endsAt - content.progressStartsAt) / SECOND_IN_MS).toInt().coerceAtLeast(1)
    val elapsedSeconds = ((System.currentTimeMillis() - content.progressStartsAt) / SECOND_IN_MS).toInt()

    return NotificationCompat.ProgressStyle()
      .addProgressSegment(NotificationCompat.ProgressStyle.Segment(totalSeconds).setColor(color))
      .setProgress(elapsedSeconds.coerceIn(0, totalSeconds))
  }

  // 시스템 언어가 아니라 앱에서 고른 언어로 문구를 읽기 위함
  private fun localizedContext(context: Context, language: String?): Context {
    if (language == null) return context

    val configuration = Configuration(context.resources.configuration)
    configuration.setLocale(Locale.forLanguageTag(language))

    return context.createConfigurationContext(configuration)
  }

  // 도트 한 칸을 정수 픽셀로 맞춰 nearest-neighbor로 키워 정사각형 가운데에 둠. 칸 크기가 달라지면 도트가 번짐
  private fun largeIcon(context: Context, resourceId: Int): Bitmap {
    val sprite = BitmapFactory.decodeResource(context.resources, resourceId)
    val size = context.resources.getDimensionPixelSize(android.R.dimen.notification_large_icon_height)
    val dot = (size * LARGE_ICON_HEIGHT_RATIO / SPRITE_ROWS).toInt().coerceAtLeast(1)
    val scaledHeight = SPRITE_ROWS * dot
    val scaled = Bitmap.createScaledBitmap(sprite, sprite.width * scaledHeight / sprite.height, scaledHeight, false)

    val icon = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    Canvas(icon).drawBitmap(scaled, (size - scaled.width) / 2f, (size - scaled.height) / 2f, null)

    return icon
  }

  private fun openAppIntent(context: Context): PendingIntent? {
    val intent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null

    return PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  }

  // Android 12+ notification trampoline 제한으로 Activity를 직접 실행
  // extra는 `PendingIntent` 동일성 비교에서 제외돼 requestCode 분리
  private fun stopIntent(context: Context, endsAt: Long): PendingIntent? {
    val intent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    intent.putExtra(EXTRA_STOPPED_ENDS_AT, endsAt)

    return PendingIntent.getActivity(context, 1, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  }
}

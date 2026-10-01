package expo.modules.liveactivity

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.Context
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.util.Locale
import kotlin.math.roundToInt

internal const val EXTRA_STOPPED_ENDS_AT = "expo.modules.liveactivity.STOPPED_ENDS_AT"

private const val CHANNEL_ID = "live-activity"
private const val NOTIFICATION_ID = 1
private const val MINUTE_IN_MS = 60_000.0

// `src/shared/constants/colors.ts`의 `focus.arc`
private const val FOCUS_COLOR = 0xFF6A5B9C.toInt()

// `rest.arc`는 흰 아이콘과 대비가 4.5:1 미만이라 OS가 어둡게 바꿔 칠해서, 대비가 넘는 `rest.thumbArm`을 씀
private const val REST_COLOR = 0xFF2F7B85.toInt()

private const val SPRITE_ROWS = 9
private const val LARGE_ICON_HEIGHT_RATIO = 0.6

internal object TimerNotification {
  // `areNotificationsEnabled`가 거부된 알림 권한까지 반영해 여기서 따로 확인하지 않음
  @SuppressLint("MissingPermission")
  fun show(context: Context, content: LiveActivityContentRecord) {
    val manager = NotificationManagerCompat.from(context)
    if (!manager.areNotificationsEnabled()) return

    val localized = localizedContext(context, content.language)
    manager.createNotificationChannel(
      NotificationChannelCompat.Builder(CHANNEL_ID, NotificationManagerCompat.IMPORTANCE_LOW)
        .setName(localized.getString(R.string.live_activity_channel))
        .build()
    )

    val isFocus = content.mode == "focus"
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
      .setOnlyAlertOnce(true)
      .setWhen(endsAt)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      // 끝날 시각에 시스템이 알림을 지움. 앱 프로세스가 없어도 동작
      .setTimeoutAfter((endsAt - System.currentTimeMillis()).coerceAtLeast(0))
      .build()

    manager.notify(NOTIFICATION_ID, notification)
  }

  fun cancel(context: Context) {
    NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
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

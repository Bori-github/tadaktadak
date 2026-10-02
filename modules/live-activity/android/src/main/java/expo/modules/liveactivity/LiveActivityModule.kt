package expo.modules.liveactivity

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.edit
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

private const val STOPPED_PREFERENCES_NAME = "live-activity"
private const val STOPPED_ENDS_AT_KEY = "stoppedEndsAt"

// `src/shared/constants/colors.ts`의 `canvas`
private const val CANVAS_COLOR = 0xFF141021.toInt()

class LiveActivityContentRecord : Record {
  @Field val mode: String = "focus"
  @Field val progressStartsAt: Double = 0.0
  @Field val endsAt: Double = 0.0
  @Field val language: String? = null
}

class LiveActivityModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext)

  private val preferences: SharedPreferences
    get() = context.getSharedPreferences(STOPPED_PREFERENCES_NAME, Context.MODE_PRIVATE)

  override fun definition() = ModuleDefinition {
    Name("LiveActivity")

    Events("onStopped")

    OnNewIntent { intent ->
      if (saveStoppedEndsAt(intent)) sendEvent("onStopped")
    }

    // Activity 재생성 시 `onNewIntent` 대신 `getIntent()`로 전달됨
    OnActivityEntersForeground {
      val intent = appContext.currentActivity?.intent ?: return@OnActivityEntersForeground
      if (saveStoppedEndsAt(intent)) sendEvent("onStopped")
    }

    Property("isSupported") { true }

    Property("isEnabled") {
      NotificationManagerCompat.from(context).areNotificationsEnabled()
    }

    AsyncFunction("startAsync") { content: LiveActivityContentRecord ->
      setRecentsScreenshotEnabled(false)
      TimerNotification.show(context, TimerContent(content.mode, content.progressStartsAt, content.endsAt, content.language))
    }

    AsyncFunction("endAsync") {
      setRecentsScreenshotEnabled(true)
      TimerNotification.cancel(context)
    }

    Function("consumeStoppedEndsAt") {
      // 콜드 스타트는 모듈 생성 전에 Activity가 떠 lifecycle 이벤트를 받지 못해 여기서 `getIntent()` 확인
      appContext.currentActivity?.intent?.let { saveStoppedEndsAt(it) }

      if (!preferences.contains(STOPPED_ENDS_AT_KEY)) return@Function null

      val endsAt = preferences.getLong(STOPPED_ENDS_AT_KEY, 0)
      preferences.edit { remove(STOPPED_ENDS_AT_KEY) }

      endsAt
    }
  }

  // 진행 중 스냅샷은 잠금화면 정지로 앱이 열릴 때 지난 남은 시간을 먼저 보여서, 진행 중에는 배경색 단색으로 대체
  private fun setRecentsScreenshotEnabled(enabled: Boolean) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return

    val activity = appContext.currentActivity ?: return
    activity.runOnUiThread {
      // 지정하지 않으면 단색이 테마 기본값 `#FAFAFA`라 어두운 화면 사이에 흰 화면이 끼어서 `canvas`로 지정
      activity.setTaskDescription(ActivityManager.TaskDescription.Builder().setBackgroundColor(CANVAS_COLOR).build())
      activity.setRecentsScreenshotEnabled(enabled)
    }
  }

  // 같은 Intent 재처리 방지로 extra 제거
  private fun saveStoppedEndsAt(intent: Intent): Boolean {
    if (!intent.hasExtra(EXTRA_STOPPED_ENDS_AT)) return false

    val endsAt = intent.getLongExtra(EXTRA_STOPPED_ENDS_AT, 0)
    intent.removeExtra(EXTRA_STOPPED_ENDS_AT)

    // exported Activity라 외부 앱 Intent·Recents 재전달 Intent 무시
    val isFromHistory = (intent.flags and Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0
    if (isFromHistory || endsAt != TimerNotification.activeEndsAt(context)) return false

    preferences.edit { putLong(STOPPED_ENDS_AT_KEY, endsAt) }
    TimerNotification.cancel(context)

    return true
  }
}

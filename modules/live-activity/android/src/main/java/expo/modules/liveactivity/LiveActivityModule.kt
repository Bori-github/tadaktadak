package expo.modules.liveactivity

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.edit
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

private const val PREFERENCES_NAME = "live-activity"
private const val STOPPED_ENDS_AT_KEY = "stoppedEndsAt"

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
    get() = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

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
      TimerNotification.show(context, content)
    }

    AsyncFunction("endAsync") {
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

  // 같은 Intent 재처리 방지로 extra 제거
  private fun saveStoppedEndsAt(intent: Intent): Boolean {
    if (!intent.hasExtra(EXTRA_STOPPED_ENDS_AT)) return false

    val endsAt = intent.getLongExtra(EXTRA_STOPPED_ENDS_AT, 0)
    intent.removeExtra(EXTRA_STOPPED_ENDS_AT)

    preferences.edit { putLong(STOPPED_ENDS_AT_KEY, endsAt) }
    TimerNotification.cancel(context)

    return true
  }
}

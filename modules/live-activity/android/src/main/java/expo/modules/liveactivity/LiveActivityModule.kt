package expo.modules.liveactivity

import android.content.Context
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

  override fun definition() = ModuleDefinition {
    Name("LiveActivity")

    Events("onStopped")

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
      val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
      if (!preferences.contains(STOPPED_ENDS_AT_KEY)) return@Function null

      val endsAt = preferences.getLong(STOPPED_ENDS_AT_KEY, 0)
      preferences.edit { remove(STOPPED_ENDS_AT_KEY) }

      endsAt
    }
  }
}

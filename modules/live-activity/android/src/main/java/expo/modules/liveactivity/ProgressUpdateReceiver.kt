package expo.modules.liveactivity

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class ProgressUpdateReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    TimerNotification.updateProgress(context)
  }
}

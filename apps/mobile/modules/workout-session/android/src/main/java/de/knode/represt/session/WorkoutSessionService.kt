package de.knode.represt.session

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat

/** Hält den App-Prozess während eines Workouts wach und zeigt Übung und Countdown an. */
class WorkoutSessionService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    WorkoutSession.service = this
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(CHANNEL_ID, WorkoutSession.channelName, NotificationManager.IMPORTANCE_LOW)
      channel.setShowBadge(false)
      getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK else 0
    ServiceCompat.startForeground(this, NOTIFICATION_ID, build(), type)
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    if (WorkoutSession.service === this) WorkoutSession.service = null
    super.onDestroy()
  }

  fun refresh() {
    val manager = NotificationManagerCompat.from(this)
    if (!manager.areNotificationsEnabled()) return
    try {
      manager.notify(NOTIFICATION_ID, build())
    } catch (_: SecurityException) {
    }
  }

  private fun build(): Notification {
    val notice = WorkoutSession.notice
    val launch = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
    }
    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.drawable.rr_notification)
      .setContentTitle(notice?.title ?: WorkoutSession.channelName)
      .setContentText(notice?.text)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
    if (launch != null) {
      builder.setContentIntent(PendingIntent.getActivity(this, 0, launch, PendingIntent.FLAG_IMMUTABLE))
    }
    val endsAt = notice?.endsAt
    if (endsAt != null) {
      builder.setWhen(endsAt).setShowWhen(true).setUsesChronometer(true).setChronometerCountDown(true)
    } else {
      builder.setShowWhen(false).setUsesChronometer(false)
    }
    return builder.build()
  }

  companion object {
    private const val CHANNEL_ID = "workout"
    private const val NOTIFICATION_ID = 4711
  }
}

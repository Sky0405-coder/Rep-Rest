package de.knode.represt.session

import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.SoundPool
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.PowerManager
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.content.ContextCompat
import org.json.JSONObject

internal data class Notice(val title: String, val text: String, val endsAt: Long?)

internal data class Cue(
  val at: Long,
  val sound: String?,
  val haptic: String?,
  val notice: Notice?,
  val finish: Boolean,
)

/**
 * Spielt den von JS vorausberechneten Fahrplan (Töne, Vibration, Benachrichtigung)
 * auf einem eigenen Thread ab. So kommen die Töne auch bei gesperrtem Bildschirm,
 * während JS im Hintergrund pausiert. Alle Zustandsänderungen laufen über [handler].
 */
internal object WorkoutSession {
  private const val TAG = "WorkoutSession"
  private val TOKEN = Any()
  private val SOUNDS = mapOf(
    "tick" to R.raw.rr_tick,
    "go" to R.raw.rr_go,
    "gong" to R.raw.rr_gong,
    "done" to R.raw.rr_done,
  )

  private val handler = Handler(HandlerThread("rr-session").apply { start() }.looper)
  private lateinit var context: Context
  private var soundPool: SoundPool? = null
  private val soundIds = mutableMapOf<String, Int>()
  private val loaded = mutableSetOf<Int>()
  private val pending = mutableSetOf<Int>()
  private var wakeLock: PowerManager.WakeLock? = null

  @Volatile var notice: Notice? = null
    private set
  @Volatile var channelName: String = "Workout"
    private set
  @Volatile var service: WorkoutSessionService? = null

  /** Lädt die Töne vor, damit schon der erste Countdown-Beep pünktlich kommt. */
  fun prepare(ctx: Context) {
    context = ctx.applicationContext
    handler.post { loadSounds() }
  }

  fun start(ctx: Context, channel: String) {
    prepare(ctx)
    channelName = channel
    startService()
  }

  private fun startService() {
    try {
      ContextCompat.startForegroundService(context, Intent(context, WorkoutSessionService::class.java))
    } catch (e: Exception) {
      // Ohne Dienst laufen die Töne trotzdem, solange die App im Vordergrund ist.
      Log.w(TAG, "Foreground service not started", e)
    }
  }

  fun update(json: String) {
    val data = JSONObject(json)
    val current = data.optJSONObject("notice")?.let(::parseNotice)
    val list = data.getJSONArray("cues")
    val cues = (0 until list.length()).map { i ->
      val c = list.getJSONObject(i)
      Cue(
        at = c.getLong("at"),
        sound = c.optString("sound").ifEmpty { null },
        haptic = c.optString("haptic").ifEmpty { null },
        notice = c.optJSONObject("notice")?.let(::parseNotice),
        finish = c.optBoolean("finish"),
      )
    }
    // Nach dem Workout-Ende beendet sich der Dienst selbst; geht es weiter (z. B. „Zurück“), neu starten.
    if (service == null && cues.isNotEmpty() && ::context.isInitialized) startService()
    handler.post {
      handler.removeCallbacksAndMessages(TOKEN)
      if (current != null) showNotice(current)
      val now = System.currentTimeMillis()
      val uptime = SystemClock.uptimeMillis()
      for (cue in cues) {
        handler.postAtTime({ fire(cue) }, TOKEN, uptime + (cue.at - now).coerceAtLeast(0))
      }
      // CPU wach halten, bis der letzte Ton gespielt ist (Handler-Zeit steht im Tiefschlaf).
      holdWakeLock(cues.lastOrNull()?.let { it.at - now + 5_000 })
    }
  }

  fun stop() {
    handler.post {
      handler.removeCallbacksAndMessages(TOKEN)
      holdWakeLock(null)
      notice = null
    }
    if (::context.isInitialized) context.stopService(Intent(context, WorkoutSessionService::class.java))
  }

  private fun parseNotice(o: JSONObject) = Notice(
    title = o.optString("title"),
    text = o.optString("text"),
    endsAt = if (o.isNull("endsAt")) null else o.getLong("endsAt"),
  )

  private fun fire(cue: Cue) {
    cue.sound?.let(::play)
    cue.haptic?.let(::vibrate)
    cue.notice?.let(::showNotice)
    if (cue.finish) handler.postDelayed({ stop() }, TOKEN, 3_000)
  }

  private fun showNotice(n: Notice) {
    notice = n
    service?.refresh()
  }

  private fun loadSounds() {
    if (soundPool != null) return
    val attributes = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_MEDIA)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()
    val pool = SoundPool.Builder().setMaxStreams(3).setAudioAttributes(attributes).build()
    pool.setOnLoadCompleteListener { p, id, status ->
      handler.post {
        if (status != 0) return@post
        loaded += id
        if (pending.remove(id)) p.play(id, 1f, 1f, 1, 0, 1f)
      }
    }
    for ((name, res) in SOUNDS) soundIds[name] = pool.load(context, res, 1)
    soundPool = pool
  }

  private fun play(name: String) {
    val pool = soundPool ?: return
    val id = soundIds[name] ?: return
    if (id in loaded) pool.play(id, 1f, 1f, 1, 0, 1f) else pending += id
  }

  private fun vibrate(kind: String) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }
    val effect = if (kind == "tick") {
      VibrationEffect.createOneShot(30, VibrationEffect.DEFAULT_AMPLITUDE)
    } else {
      VibrationEffect.createWaveform(longArrayOf(0, 60, 80, 60), -1)
    }
    vibrator.vibrate(effect)
  }

  private fun holdWakeLock(durationMs: Long?) {
    val lock = wakeLock ?: (context.getSystemService(Context.POWER_SERVICE) as PowerManager)
      .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "represt:workout")
      .apply { setReferenceCounted(false) }
      .also { wakeLock = it }
    if (durationMs != null && durationMs > 0) lock.acquire(durationMs) else if (lock.isHeld) lock.release()
  }
}

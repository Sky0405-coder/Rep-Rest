package de.knode.represt.session

import android.Manifest
import android.os.Build
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WorkoutSessionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WorkoutSession")

    OnCreate {
      appContext.reactContext?.let(WorkoutSession::prepare)
    }

    Function("start") { channelName: String ->
      WorkoutSession.start(appContext.reactContext ?: throw Exceptions.ReactContextLost(), channelName)
    }

    Function("update") { json: String ->
      WorkoutSession.update(json)
    }

    Function("stop") {
      WorkoutSession.stop()
    }

    AsyncFunction("requestNotificationPermission") { promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
        promise.resolve(null)
      } else {
        Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.POST_NOTIFICATIONS)
      }
    }

    OnDestroy {
      WorkoutSession.stop()
    }
  }
}

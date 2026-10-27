# Gemeinsame Umgebung für Android-Builds. Wird von den anderen Skripten eingebunden.
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export JAVA_HOME="${WORKOUT_JAVA_HOME:-$HOME/.local/lib/jdk-17}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
export WORKOUT_AVD="${WORKOUT_AVD:-workout_pixel}"

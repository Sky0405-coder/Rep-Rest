import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Ergänzt app.json um Werte aus dem Build. In CI setzt der Release-Workflow
 * APP_VERSION aus dem Git-Tag (z. B. v0.2.1 → 0.2.1).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const version = process.env.APP_VERSION ?? config.version ?? '0.0.0';
  // Builds für den Play Store dürfen keine APKs nachinstallieren (Store-Richtlinie).
  const selfUpdate = process.env.STORE_BUILD !== '1';
  return {
    ...(config as ExpoConfig),
    version,
    android: {
      ...config.android,
      // Muss bei jedem Update steigen, sonst verweigert Android die Installation.
      versionCode: versionCode(version),
      permissions: [...(config.android?.permissions ?? []), ...(selfUpdate ? ['android.permission.REQUEST_INSTALL_PACKAGES'] : [])],
    },
    extra: {
      ...config.extra,
      updater: selfUpdate ? { github: 'Sky0405-coder/Rep-Rest' } : null,
    },
  };
};

/** 1.2.3 → 10203. Erlaubt bis zu 99 Minor- und Patch-Versionen. */
function versionCode(version: string): number {
  const [major = 0, minor = 0, patch = 0] = version.split('-')[0]!.split('.').map(Number);
  return major * 10_000 + minor * 100 + patch;
}

import { compareVersions } from '@workout/core';
import Constants from 'expo-constants';

export type AvailableUpdate = {
  version: string;
  apkUrl: string;
  sizeBytes: number;
  notes: string;
  pageUrl: string;
};

type GithubRelease = {
  tag_name: string;
  body: string | null;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  assets: { name: string; browser_download_url: string; size: number }[];
};

export function currentVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

/** GitHub-Repo, aus dem Updates kommen, oder null wenn Selbst-Updates abgeschaltet sind (Store-Build). */
export function updateSource(): string | null {
  const updater = Constants.expoConfig?.extra?.updater as { github?: string } | null | undefined;
  return updater?.github ?? null;
}

/** Fragt das neueste Release ab. Liefert null, wenn die installierte Version aktuell ist. */
export async function fetchLatestUpdate(repo: string): Promise<AvailableUpdate | null> {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const release = (await res.json()) as GithubRelease;
  if (release.draft || release.prerelease) return null;
  if (compareVersions(release.tag_name, currentVersion()) <= 0) return null;
  const apk = release.assets.find((a) => a.name.endsWith('.apk'));
  if (!apk) return null;
  return {
    version: release.tag_name.replace(/^v/, ''),
    apkUrl: apk.browser_download_url,
    sizeBytes: apk.size,
    notes: release.body ?? '',
    pageUrl: release.html_url,
  };
}

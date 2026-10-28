import { Platform } from 'react-native';
import { create } from 'zustand';

import { fetchLatestUpdate, updateSource, type AvailableUpdate } from './github';
import { downloadApk, openInstaller } from './install';

type Status = 'idle' | 'checking' | 'upToDate' | 'available' | 'downloading' | 'error';

type UpdaterState = {
  status: Status;
  update: AvailableUpdate | null;
  progress: number;
  error: string | null;
  /** Version, für die der Hinweis mit "Später" weggeklickt wurde (nur für diese Sitzung). */
  dismissed: string | null;
  check: () => Promise<void>;
  install: () => Promise<void>;
  dismiss: () => void;
};

/** Selbst-Updates gibt es nur in der Android-App aus GitHub, nicht im Web oder Store-Build. */
export const updaterSupported = Platform.OS === 'android' && updateSource() !== null;

export const useUpdater = create<UpdaterState>((set, get) => ({
  status: 'idle',
  update: null,
  progress: 0,
  error: null,
  dismissed: null,

  async check() {
    const repo = updateSource();
    if (!updaterSupported || !repo || get().status === 'checking' || get().status === 'downloading') return;
    set({ status: 'checking', error: null });
    try {
      const update = await fetchLatestUpdate(repo);
      set({ update, status: update ? 'available' : 'upToDate' });
    } catch (e) {
      set({ status: 'error', error: (e as Error).message });
    }
  },

  async install() {
    const { update } = get();
    if (!update || get().status === 'downloading') return;
    set({ status: 'downloading', progress: 0, error: null });
    try {
      const apk = await downloadApk(update.apkUrl, update.version, update.sizeBytes, (progress) => set({ progress }));
      set({ status: 'available', progress: 1 });
      await openInstaller(apk);
    } catch (e) {
      set({ status: 'error', error: (e as Error).message });
    }
  },

  dismiss() {
    set({ dismissed: get().update?.version ?? null });
  },
}));

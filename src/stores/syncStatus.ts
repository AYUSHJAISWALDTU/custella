import { create } from 'zustand';

export type SyncState =
  | { kind: 'offline'; pending: number }
  | { kind: 'syncing'; pending: number }
  | { kind: 'synced'; justSynced: number };

type SyncStore = {
  status: SyncState;
  setStatus: (status: SyncState) => void;
};

/**
 * Presentational only until Phase 6. The sync worker becomes the sole writer of this
 * store; nothing else should ever call setStatus.
 */
export const useSyncStatus = create<SyncStore>((set) => ({
  status: { kind: 'synced', justSynced: 0 },
  setStatus: (status) => set({ status }),
}));

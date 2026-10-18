import type { Profile } from './types';

export type AccountUser = { id: string; email: string };
export type AccountSnapshot = {
  user: AccountUser | null; profile: Profile | null; loading: boolean; profileError: boolean;
};
export const emptyAccount: AccountSnapshot = { user: null, profile: null, loading: false, profileError: false };

// The session is authoritative. A late request may never restore a previous identity.
export function createAccountProfileState(
  read: (id: string, signal: AbortSignal) => Promise<unknown>,
  publish: (snapshot: AccountSnapshot) => void,
  timeoutMs = 15000,
) {
  let snapshot: AccountSnapshot = { ...emptyAccount, loading: true };
  let generation = 0;
  let alive = true;
  let pending: { controller: AbortController; promise: Promise<Profile | null> } | null = null;
  let scheduled: ReturnType<typeof setTimeout> | undefined;
  const update = (next: AccountSnapshot) => { snapshot = next; if (alive) publish(next); };
  const invalidate = () => {
    generation++;
    clearTimeout(scheduled); scheduled = undefined;
    pending?.controller.abort(); pending = null;
  };
  const refresh = (): Promise<Profile | null> => {
    if (!alive || !snapshot.user) return Promise.resolve(null);
    if (pending) return pending.promise;
    clearTimeout(scheduled); scheduled = undefined;
    const id = snapshot.user.id, ticket = generation;
    const controller = new AbortController();
    update({ ...snapshot, loading: !snapshot.profile, profileError: false });
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Race with cancellation as well as aborting fetch: stale promises must settle.
    const cancelled = new Promise<never>((_, reject) => {
      controller.signal.addEventListener('abort', () => reject(new Error('Profile request cancelled')), { once: true });
      timer = setTimeout(() => controller.abort(), timeoutMs);
    });
    const promise = Promise.race([Promise.resolve().then(() => read(id, controller.signal)), cancelled])
      .then(data => {
        if (!alive || ticket !== generation || snapshot.user?.id !== id) return null;
        const row = data as Partial<Profile> | null;
        if (!row || row.id !== id || !['owner', 'professional', 'admin'].includes(row.role || '')) throw new Error('Invalid account profile');
        update({ ...snapshot, profile: row as Profile, loading: false, profileError: false });
        return row as Profile;
      })
      .catch(() => {
        if (alive && ticket === generation && snapshot.user?.id === id) update({ ...snapshot, profile: null, loading: false, profileError: true });
        return null;
      })
      .finally(() => { clearTimeout(timer); if (ticket === generation) pending = null; });
    pending = { controller, promise };
    return promise;
  };
  return {
    getSnapshot: () => snapshot,
    acceptUser(user: AccountUser | null, force = false) {
      if (!alive) return;
      const changed = user?.id !== snapshot.user?.id;
      if (changed || force || !user) invalidate();
      if (!user) { update({ ...emptyAccount }); return; }
      update({ ...snapshot, user, ...(changed ? { profile: null, loading: true, profileError: false } : {}) });
      if (changed || force) {
        const ticket = generation;
        // Do not call Supabase from inside its synchronous Auth callback.
        scheduled = setTimeout(() => { if (alive && ticket === generation) void refresh(); }, 0);
      }
    },
    refresh,
    dispose() { alive = false; invalidate(); },
  };
}

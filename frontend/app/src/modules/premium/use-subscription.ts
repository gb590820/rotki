import type { Ref } from 'vue';
import { usePremiumStore } from '@/modules/premium/use-premium-store';

/**
 * Whether the session has an active rotki.com subscription.
 *
 * @remarks
 * Only what rotki.com hosts depends on it: cloud sync and backups, devices, watchers and the remote
 * premium bundle. Local features are unlocked whatever this says, see {@link usePremium}.
 */
export function useSubscription(): Readonly<Ref<boolean>> {
  const { premium } = storeToRefs(usePremiumStore());
  return readonly(premium);
}

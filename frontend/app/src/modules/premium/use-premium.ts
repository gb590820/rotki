import type { ComputedRef } from 'vue';

/**
 * Whether the features computed locally are unlocked.
 *
 * @remarks
 * Always true: no feature that runs on this machine needs a subscription. What rotki.com hosts
 * (cloud sync and backups, devices, watchers, the remote premium bundle) still does, so code gating
 * on those reads {@link useSubscription} instead.
 */
export function usePremium(): ComputedRef<boolean> {
  return computed<boolean>(() => true);
}

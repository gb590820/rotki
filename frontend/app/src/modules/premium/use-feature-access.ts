import type { MaybeRefOrGetter, Ref } from 'vue';
import { usePremium } from '@/modules/premium/use-premium';
import { usePremiumStore } from '@/modules/premium/use-premium-store';
import { useSubscription } from '@/modules/premium/use-subscription';
import { PremiumFeature } from '@/modules/session/types';

export { PremiumFeature };

interface UseFeatureAccessReturn {
  /** Whether the feature can be used */
  allowed: Readonly<Ref<boolean>>;
  /** The minimum subscription tier required for this feature, null if unknown */
  minimumTier: Readonly<Ref<string | null>>;
  /** The user's current subscription tier */
  currentTier: Readonly<Ref<string>>;
  /** Whether the local features are unlocked, see {@link usePremium} */
  premium: Readonly<Ref<boolean>>;
}

/**
 * Facade composable for checking premium feature access.
 *
 * @remarks
 * Every feature computed locally is allowed. Cloud backup is the exception: rotki.com stores the
 * backups, so it needs an active subscription whose tier grants backup space.
 */
export function useFeatureAccess(feature: MaybeRefOrGetter<PremiumFeature>): UseFeatureAccessReturn {
  const store = usePremiumStore();
  const { capabilities } = storeToRefs(store);
  const premium = usePremium();
  const subscription = useSubscription();

  const allowed = computed<boolean>(() => {
    if (toValue(feature) !== PremiumFeature.CLOUD_BACKUP)
      return get(premium);

    return get(subscription) && (get(capabilities)?.maxBackupSizeMb ?? 0) > 0;
  });

  const minimumTier = computed<string | null>(() => {
    const caps = get(capabilities);
    const featureValue = toValue(feature);
    if (featureValue === PremiumFeature.CLOUD_BACKUP)
      return null;

    return caps?.[featureValue]?.minimumTier ?? null;
  });

  const currentTier = computed<string>(() => get(capabilities)?.currentTier ?? 'Free');

  return {
    allowed,
    currentTier,
    minimumTier,
    premium,
  };
}

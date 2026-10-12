import type { AssetBalanceWithPrice } from '@rotki/common';
import type { ComputedRef, DeepReadonly, MaybeRefOrGetter, Ref } from 'vue';
import { startPromise } from '@shared/utils';
import { type AssetResolutionOptions, useAssetInfoRetrieval } from '@/modules/assets/use-asset-info-retrieval';
import { useAggregatedBalances } from '@/modules/balances/use-aggregated-balances';
import { useAssetPageActions } from '@/pages/assets/use-asset-page-actions';

/**
 * Present on the route when the page is showing a collection's parent rather than one asset. Its
 * value is never read - only whether it is there at all.
 */
const COLLECTION_PARENT_QUERY = 'collectionParent';

type AssetInfo = ReturnType<ReturnType<typeof useAssetInfoRetrieval>['useAssetInfo']>;

type ContractInfo = ReturnType<ReturnType<typeof useAssetInfoRetrieval>['useAssetContractInfo']>;

interface UseAssetDetailReturn {
  asset: AssetInfo;
  collectionBalance: ComputedRef<AssetBalanceWithPrice[]>;
  collectionId: ComputedRef<number | undefined>;
  contractInfo: ContractInfo;
  goToEdit: () => void;
  isCollectionParent: ComputedRef<boolean>;
  isCustomAsset: ComputedRef<boolean | undefined>;
  loadingIgnore: DeepReadonly<Ref<boolean>>;
  loadingSpam: DeepReadonly<Ref<boolean>>;
  loadingWhitelist: DeepReadonly<Ref<boolean>>;
  toggleIgnoreAsset: () => Promise<void>;
  toggleSpam: () => Promise<void>;
  toggleWhitelistAsset: () => Promise<void>;
}

export function useAssetDetail(identifier: MaybeRefOrGetter<string>): UseAssetDetailReturn {
  const router = useRouter();
  const route = useRoute();

  const { refetchAssetInfo, useAssetContractInfo, useAssetInfo } = useAssetInfoRetrieval();
  const { useBalances } = useAggregatedBalances();

  const aggregatedBalances = useBalances();

  const isCollectionParent = computed<boolean>(() => !!get(route).query[COLLECTION_PARENT_QUERY]);

  const assetRetrievalOption = computed<AssetResolutionOptions>(() => ({
    collectionParent: get(isCollectionParent),
  }));

  const asset = useAssetInfo(() => toValue(identifier), assetRetrievalOption);
  const contractInfo = useAssetContractInfo(() => toValue(identifier), assetRetrievalOption);

  const {
    loadingIgnore,
    loadingSpam,
    loadingWhitelist,
    toggleIgnoreAsset,
    toggleSpam,
    toggleWhitelistAsset,
  } = useAssetPageActions({
    asset,
    identifier: computed<string>(() => toValue(identifier)),
    refetchAssetInfo,
  });

  const isCustomAsset = computed<boolean | undefined>(() => get(asset)?.isCustomAsset);

  const collectionId = computed<number | undefined>(() => {
    if (!get(isCollectionParent))
      return undefined;

    // A zero or unparsable id reads as absent, the same as no id at all.
    const raw = get(asset)?.collectionId;
    const parsed = raw ? Number.parseInt(raw) : Number.NaN;
    return Number.isNaN(parsed) || parsed === 0 ? undefined : parsed;
  });

  const editRoute = computed(() => ({
    path: get(isCustomAsset) ? '/asset-manager/custom' : '/asset-manager/managed',
    query: {
      id: toValue(identifier),
    },
  }));

  const collectionBalance = computed<AssetBalanceWithPrice[]>(() => {
    if (!get(isCollectionParent))
      return [];

    return get(aggregatedBalances).find(data => data.asset === toValue(identifier))?.breakdown ?? [];
  });

  function goToEdit(): void {
    startPromise(router.push(get(editRoute)));
  }

  return {
    asset,
    collectionBalance,
    collectionId,
    contractInfo,
    goToEdit,
    isCollectionParent,
    isCustomAsset,
    loadingIgnore,
    loadingSpam,
    loadingWhitelist,
    toggleIgnoreAsset,
    toggleSpam,
    toggleWhitelistAsset,
  };
}

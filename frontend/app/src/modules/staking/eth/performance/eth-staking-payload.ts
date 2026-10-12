import type { EthStakingCombinedFilter, EthStakingFilter, EthStakingPayload } from '@rotki/common';

/** The page of validators asked for: how many rows, from which one. */
type PerformancePage = Pick<EthStakingPayload, 'limit' | 'offset'>;

/** Whose staking to query. An empty selection means every validator, so it adds no key. */
function selectionKeys(selection: EthStakingFilter): Pick<EthStakingPayload, 'addresses' | 'validatorIndices'> {
  if ('accounts' in selection) {
    const addresses = selection.accounts.map(account => account.address);
    return addresses.length > 0 ? { addresses } : {};
  }
  const validatorIndices = selection.validators.map(validator => validator.index);
  return validatorIndices.length > 0 ? { validatorIndices } : {};
}

/** The period and status to query, leaving out what is not set. */
function filterKeys(filter: EthStakingCombinedFilter | undefined): EthStakingCombinedFilter {
  return {
    ...(filter?.fromTimestamp ? { fromTimestamp: filter.fromTimestamp } : {}),
    ...(filter?.toTimestamp ? { toTimestamp: filter.toTimestamp } : {}),
    ...(filter?.status ? { status: filter.status } : {}),
  };
}

/**
 * The performance query for whose staking the page shows, over what period and in which status.
 *
 * @remarks
 * The selection is either withdrawal addresses or validators, never both. An empty selection adds
 * no key rather than an empty list, which the backend would read as "none".
 */
export function toPerformancePayload(
  selection: EthStakingFilter,
  filter: EthStakingCombinedFilter | undefined,
  page: PerformancePage,
): EthStakingPayload {
  return { ...page, ...selectionKeys(selection), ...filterKeys(filter) };
}

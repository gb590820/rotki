import type { ActionResult } from '@rotki/common';
import { server } from '@test/setup-files/server';
import { http, HttpResponse } from 'msw';
import { type Pinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionAuthStore } from '@/modules/auth/use-session-auth-store';
import { usePremiumStore } from '@/modules/premium/use-premium-store';
import { type PremiumCapabilities, PremiumFeature, type PremiumFeatureCapability } from '@/modules/session/types';
import { useFeatureAccess } from './use-feature-access';
import { usePremiumWatchers } from './use-premium-watchers';

const backendUrl = process.env.VITE_BACKEND_URL;

function cap(enabled: boolean, minimumTier = 'Free'): PremiumFeatureCapability {
  return { enabled, minimumTier };
}

function mockPremiumCapabilities<T = PremiumCapabilities>(capabilities: T, status: number = 200): ReturnType<typeof http.get> {
  return http.get(`${backendUrl}/api/1/premium/capabilities`, () =>
    HttpResponse.json<ActionResult<T>>({
      message: '',
      result: capabilities,
    }, { status }));
}

describe('modules/premium/use-feature-access', () => {
  let pinia: Pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    const { logged } = storeToRefs(useSessionAuthStore());
    set(logged, true);
  });

  describe('useFeatureAccess', () => {
    it('should allow every local feature without a subscription or capabilities', () => {
      const localFeatures = Object.values(PremiumFeature).filter(feature => feature !== PremiumFeature.CLOUD_BACKUP);
      for (const feature of localFeatures) {
        const { allowed, premium } = useFeatureAccess(feature);
        expect(get(premium), feature).toBe(true);
        expect(get(allowed), feature).toBe(true);
      }
    });

    it('should return allowed=true when user is premium and feature is enabled', () => {
      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);
      set(premium, true);
      set(capabilities, {
        ethStakingView: cap(true, 'Lite'),
      });

      const { allowed } = useFeatureAccess(PremiumFeature.ETH_STAKING_VIEW);

      expect(get(allowed)).toBe(true);
    });

    it('should allow a local feature even when the capabilities report it disabled', () => {
      const store = usePremiumStore();
      const { capabilities } = storeToRefs(store);
      set(capabilities, {
        ethStakingView: cap(false, 'Advanced'),
      });

      const { allowed } = useFeatureAccess(PremiumFeature.ETH_STAKING_VIEW);

      expect(get(allowed)).toBe(true);
    });

    it('should return correct minimumTier from capabilities', () => {
      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);
      set(premium, true);
      set(capabilities, {
        ethStakingView: cap(true, 'Lite'),
        graphsView: cap(false, 'Advanced'),
      });

      const ethAccess = useFeatureAccess(PremiumFeature.ETH_STAKING_VIEW);
      const graphsAccess = useFeatureAccess(PremiumFeature.GRAPHS_VIEW);

      expect(get(ethAccess.minimumTier)).toBe('Lite');
      expect(get(graphsAccess.minimumTier)).toBe('Advanced');
    });

    it('should return null minimumTier when capabilities are not loaded', () => {
      const { minimumTier } = useFeatureAccess(PremiumFeature.ETH_STAKING_VIEW);

      expect(get(minimumTier)).toBeNull();
    });

    it('should return correct currentTier from capabilities', () => {
      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);
      set(premium, true);
      set(capabilities, {
        currentTier: 'Lite',
        ethStakingView: cap(true, 'Lite'),
      });

      const { currentTier } = useFeatureAccess(PremiumFeature.ETH_STAKING_VIEW);

      expect(get(currentTier)).toBe('Lite');
    });

    it('should return Free currentTier when capabilities are not loaded', () => {
      const { currentTier } = useFeatureAccess(PremiumFeature.ETH_STAKING_VIEW);

      expect(get(currentTier)).toBe('Free');
    });

    it('should reactively update the minimum tier when capabilities change', async () => {
      const store = usePremiumStore();
      const { capabilities } = storeToRefs(store);
      set(capabilities, {
        ethStakingView: cap(false, 'Lite'),
      });

      const { minimumTier } = useFeatureAccess(PremiumFeature.ETH_STAKING_VIEW);

      expect(get(minimumTier)).toBe('Lite');

      set(capabilities, {
        ethStakingView: cap(true, 'Advanced'),
      });

      await nextTick();

      expect(get(minimumTier)).toBe('Advanced');
    });

    it('should reactively lock CLOUD_BACKUP when the subscription ends', async () => {
      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);
      set(premium, true);
      set(capabilities, {
        maxBackupSizeMb: 100,
      });

      const { allowed } = useFeatureAccess(PremiumFeature.CLOUD_BACKUP);

      expect(get(allowed)).toBe(true);

      set(premium, false);
      await nextTick();

      expect(get(allowed)).toBe(false);
    });

    it('should return allowed=true for CLOUD_BACKUP when maxBackupSizeMb > 0', () => {
      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);
      set(premium, true);
      set(capabilities, {
        maxBackupSizeMb: 100,
      });

      const { allowed } = useFeatureAccess(PremiumFeature.CLOUD_BACKUP);

      expect(get(allowed)).toBe(true);
    });

    it('should return allowed=false for CLOUD_BACKUP without a subscription', () => {
      const store = usePremiumStore();
      const { capabilities } = storeToRefs(store);
      set(capabilities, {
        maxBackupSizeMb: 100,
      });

      const { allowed } = useFeatureAccess(PremiumFeature.CLOUD_BACKUP);

      expect(get(allowed)).toBe(false);
    });

    it('should return allowed=false for CLOUD_BACKUP when maxBackupSizeMb is 0', () => {
      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);
      set(premium, true);
      set(capabilities, {
        maxBackupSizeMb: 0,
      });

      const { allowed } = useFeatureAccess(PremiumFeature.CLOUD_BACKUP);

      expect(get(allowed)).toBe(false);
    });

    it('should return allowed=false for CLOUD_BACKUP when maxBackupSizeMb is not set', () => {
      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);
      set(premium, true);
      set(capabilities, {});

      const { allowed } = useFeatureAccess(PremiumFeature.CLOUD_BACKUP);

      expect(get(allowed)).toBe(false);
    });

    it('should return null minimumTier for CLOUD_BACKUP', () => {
      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);
      set(premium, true);
      set(capabilities, {
        maxBackupSizeMb: 100,
      });

      const { minimumTier } = useFeatureAccess(PremiumFeature.CLOUD_BACKUP);

      expect(get(minimumTier)).toBeNull();
    });

    it('should return allowed=true for MCP when the capability is enabled', () => {
      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);
      set(premium, true);
      set(capabilities, {
        currentTier: 'Basic',
        mcp: cap(true, 'Basic'),
      });

      const { allowed, minimumTier } = useFeatureAccess(PremiumFeature.MCP);

      expect(get(allowed)).toBe(true);
      expect(get(minimumTier)).toBe('Basic');
    });

    it('should return allowed=true for MCP without a subscription or capabilities', () => {
      const { allowed, minimumTier } = useFeatureAccess(PremiumFeature.MCP);

      expect(get(allowed)).toBe(true);
      expect(get(minimumTier)).toBeNull();
    });

    it('should work with reactive feature parameter', async () => {
      const store = usePremiumStore();
      const { capabilities } = storeToRefs(store);
      set(capabilities, {
        ethStakingView: cap(true, 'Lite'),
        maxBackupSizeMb: 100,
      });

      const feature = ref<PremiumFeature>(PremiumFeature.ETH_STAKING_VIEW);
      const { allowed, minimumTier } = useFeatureAccess(feature);

      expect(get(allowed)).toBe(true);
      expect(get(minimumTier)).toBe('Lite');

      set(feature, PremiumFeature.CLOUD_BACKUP);
      await nextTick();

      expect(get(allowed)).toBe(false);
      expect(get(minimumTier)).toBeNull();
    });
  });

  describe('usePremiumStore - API Integration', () => {
    it('should fetch and parse capabilities via fetchCapabilities', async () => {
      const mockCapabilities: PremiumCapabilities = {
        [PremiumFeature.ASSET_MOVEMENT_MATCHING]: cap(false, 'Advanced'),
        [PremiumFeature.ETH_STAKING_VIEW]: cap(true),
        [PremiumFeature.EVENT_ANALYSIS_VIEW]: cap(false),
        [PremiumFeature.GRAPHS_VIEW]: cap(true),
      };

      server.use(mockPremiumCapabilities(mockCapabilities));
      const { fetchCapabilities } = usePremiumWatchers();

      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);

      set(premium, true);
      await fetchCapabilities();

      expect(get(capabilities)).toEqual(mockCapabilities);
    });

    it('should handle API response with missing capabilities', async () => {
      const partialCapabilities: Partial<PremiumCapabilities> = {
        [PremiumFeature.ETH_STAKING_VIEW]: cap(true),
      };

      server.use(mockPremiumCapabilities<Partial<PremiumCapabilities>>(partialCapabilities));
      const { fetchCapabilities } = usePremiumWatchers();

      const store = usePremiumStore();
      const { premium } = storeToRefs(store);

      set(premium, true);
      await fetchCapabilities();

      const { allowed: ethStakingAllowed } = useFeatureAccess(PremiumFeature.ETH_STAKING_VIEW);
      const { allowed: eventAnalysisAllowed } = useFeatureAccess(PremiumFeature.EVENT_ANALYSIS_VIEW);
      const { allowed: graphsAllowed } = useFeatureAccess(PremiumFeature.GRAPHS_VIEW);

      expect(get(ethStakingAllowed)).toBe(true);
      expect(get(eventAnalysisAllowed)).toBe(true);
      expect(get(graphsAllowed)).toBe(true);
    });

    it('should keep local features allowed when every capability is set to false', async () => {
      const allFalseCapabilities: PremiumCapabilities = {
        [PremiumFeature.ASSET_MOVEMENT_MATCHING]: cap(false),
        [PremiumFeature.ETH_STAKING_VIEW]: cap(false),
        [PremiumFeature.EVENT_ANALYSIS_VIEW]: cap(false),
        [PremiumFeature.GRAPHS_VIEW]: cap(false),
      };

      server.use(mockPremiumCapabilities(allFalseCapabilities));
      const { fetchCapabilities } = usePremiumWatchers();

      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);

      set(premium, true);
      await fetchCapabilities();

      expect(get(capabilities)).toEqual(allFalseCapabilities);

      const { allowed: ethStakingAllowed } = useFeatureAccess(PremiumFeature.ETH_STAKING_VIEW);
      const { allowed: graphsAllowed } = useFeatureAccess(PremiumFeature.GRAPHS_VIEW);
      const { allowed: eventAnalysisAllowed } = useFeatureAccess(PremiumFeature.EVENT_ANALYSIS_VIEW);

      expect(get(ethStakingAllowed)).toBe(true);
      expect(get(graphsAllowed)).toBe(true);
      expect(get(eventAnalysisAllowed)).toBe(true);
    });

    it('should handle API error gracefully', async () => {
      const apiCallSpy = vi.fn(() => HttpResponse.json({ message: 'Internal server error' }, { status: 500 }));

      server.use(
        http.get(`${backendUrl}/api/1/premium/capabilities`, apiCallSpy),
      );
      const { fetchCapabilities } = usePremiumWatchers();

      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);

      set(premium, true);
      await fetchCapabilities();

      expect(apiCallSpy).toHaveBeenCalled();
      expect(get(capabilities)).toBeUndefined();
    });

    it('should clear capabilities on logout', async () => {
      const mockCapabilities: PremiumCapabilities = {
        [PremiumFeature.ASSET_MOVEMENT_MATCHING]: cap(true),
        [PremiumFeature.ETH_STAKING_VIEW]: cap(true),
        [PremiumFeature.EVENT_ANALYSIS_VIEW]: cap(true),
        [PremiumFeature.GRAPHS_VIEW]: cap(true),
      };

      server.use(mockPremiumCapabilities(mockCapabilities));
      const { fetchCapabilities } = usePremiumWatchers();

      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);
      const { logged } = storeToRefs(useSessionAuthStore());

      set(premium, true);
      await fetchCapabilities();

      expect(get(capabilities)).toEqual(mockCapabilities);

      set(logged, false);
      await nextTick();

      expect(get(capabilities)).toBeUndefined();
    });

    it('should integrate with useFeatureAccess after fetchCapabilities', async () => {
      const mockCapabilities: PremiumCapabilities = {
        [PremiumFeature.ASSET_MOVEMENT_MATCHING]: cap(false),
        [PremiumFeature.ETH_STAKING_VIEW]: cap(true),
        [PremiumFeature.EVENT_ANALYSIS_VIEW]: cap(false),
        [PremiumFeature.GRAPHS_VIEW]: cap(true),
      };

      server.use(mockPremiumCapabilities(mockCapabilities));
      const { fetchCapabilities } = usePremiumWatchers();

      const store = usePremiumStore();
      const { premium } = storeToRefs(store);

      const { allowed: ethStakingAllowed } = useFeatureAccess(PremiumFeature.ETH_STAKING_VIEW);
      const { allowed: graphsAllowed } = useFeatureAccess(PremiumFeature.GRAPHS_VIEW);
      const { allowed: eventAnalysisAllowed } = useFeatureAccess(PremiumFeature.EVENT_ANALYSIS_VIEW);

      expect(get(ethStakingAllowed)).toBe(true);
      expect(get(graphsAllowed)).toBe(true);
      expect(get(eventAnalysisAllowed)).toBe(true);

      set(premium, true);
      await fetchCapabilities();

      expect(get(ethStakingAllowed)).toBe(true);
      expect(get(graphsAllowed)).toBe(true);
      expect(get(eventAnalysisAllowed)).toBe(true);
    });

    it('should parse the mcp capability from the backend payload', async () => {
      const mockCapabilities: PremiumCapabilities = {
        currentTier: 'Basic',
        [PremiumFeature.MCP]: cap(true, 'Basic'),
      };

      server.use(mockPremiumCapabilities(mockCapabilities));
      const { fetchCapabilities } = usePremiumWatchers();

      const store = usePremiumStore();
      const { capabilities, premium } = storeToRefs(store);

      const { allowed, minimumTier } = useFeatureAccess(PremiumFeature.MCP);

      expect(get(minimumTier)).toBeNull();

      set(premium, true);
      await fetchCapabilities();

      expect(get(capabilities)).toEqual(mockCapabilities);
      expect(get(allowed)).toBe(true);
      expect(get(minimumTier)).toBe('Basic');
    });

    it('should handle gnosis pay and monerium capabilities', async () => {
      const mockCapabilities: PremiumCapabilities = {
        [PremiumFeature.GNOSIS_PAY]: cap(true, 'Advanced'),
        [PremiumFeature.MONERIUM]: cap(false, 'Advanced'),
      };

      server.use(mockPremiumCapabilities(mockCapabilities));
      const { fetchCapabilities } = usePremiumWatchers();

      const store = usePremiumStore();
      const { premium } = storeToRefs(store);

      const { allowed: gnosisPayAllowed, minimumTier: gnosisPayTier } = useFeatureAccess(PremiumFeature.GNOSIS_PAY);
      const { allowed: moneriumAllowed, minimumTier: moneriumTier } = useFeatureAccess(PremiumFeature.MONERIUM);

      expect(get(gnosisPayAllowed)).toBe(true);
      expect(get(moneriumAllowed)).toBe(true);

      set(premium, true);
      await fetchCapabilities();

      expect(get(gnosisPayAllowed)).toBe(true);
      expect(get(moneriumAllowed)).toBe(true);
      expect(get(gnosisPayTier)).toBe('Advanced');
      expect(get(moneriumTier)).toBe('Advanced');
    });
  });
});

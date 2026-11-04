import { DEBUG } from 'cc/env';
import type { IRewardedAdProvider, RewardedShakePolicy, SpillRevivePolicy } from '../contracts/types';
import { FakeRewardedAdProvider } from '../debug/FakeRewardedAdProvider';
import { TapRewardedAdProvider } from './TapRewardedAdProvider';

export interface RewardedAdEnvironment { provider: IRewardedAdProvider; policy: RewardedShakePolicy }
export interface ReviveAdEnvironment { provider: IRewardedAdProvider; policy: SpillRevivePolicy }

/**
 * Release/Tap builds always use the real Tap adapter. The debug branch is removed by
 * strip_p1c_release_debug.cjs together with the whole debug directory.
 */
export function createRewardedAdEnvironment(policy: RewardedShakePolicy): RewardedAdEnvironment {
  if (DEBUG) {
    const mode = FakeRewardedAdProvider.modeFromQuery();
    if (mode) {
      console.info('[debug-mock] rewarded shake enabled via ?rewardedMock, real ads are NOT shown');
      return { provider: new FakeRewardedAdProvider(mode, policy), policy: { ...policy, enabled: true, adUnitId: 'debug-mock' } };
    }
  }
  return { provider: new TapRewardedAdProvider(policy), policy };
}
export function createReviveAdEnvironment(policy: SpillRevivePolicy): ReviveAdEnvironment {
  if (DEBUG) {
    const mode = FakeRewardedAdProvider.modeFromQuery();
    if (mode) {
      console.info('[debug-mock] spill revive enabled via ?rewardedMock, real ads are NOT shown');
      // Local closed-loop testing only: bypass first-session gates so a fixture spill can reach the offer.
      return {
        provider: new FakeRewardedAdProvider(mode, policy),
        policy: { ...policy, enabled: true, adUnitId: 'debug-mock', minForegroundSecondsFirstSession: 0, requireTutorialComplete: false, requireFirstNaturalRunCompleted: false },
      };
    }
  }
  return { provider: new TapRewardedAdProvider(policy), policy };
}

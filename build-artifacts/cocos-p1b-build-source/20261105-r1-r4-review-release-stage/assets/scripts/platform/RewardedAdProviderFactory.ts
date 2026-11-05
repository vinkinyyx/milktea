
import type { IRewardedAdProvider, RewardedShakePolicy, SpillRevivePolicy } from '../contracts/types';

import { TapRewardedAdProvider } from './TapRewardedAdProvider';

export interface RewardedAdEnvironment { provider: IRewardedAdProvider; policy: RewardedShakePolicy }
export interface ReviveAdEnvironment { provider: IRewardedAdProvider; policy: SpillRevivePolicy }

/**
 * Release/Tap builds always use the real Tap adapter. The debug branch is removed by
 * strip_p1c_release_debug.cjs together with the whole debug directory.
 */
export function createRewardedAdEnvironment(policy: RewardedShakePolicy): RewardedAdEnvironment {
  
  return { provider: new TapRewardedAdProvider(policy), policy };
}
export function createReviveAdEnvironment(policy: SpillRevivePolicy): ReviveAdEnvironment {
  
  return { provider: new TapRewardedAdProvider(policy), policy };
}

import type { Result, RewardedShakePolicy } from '../contracts/types';

/** Validates the runtime rewarded-ad policy. Any malformed file keeps the placement closed. */
export class RewardedAdPolicyLoader {
  static validate(raw: unknown): Result<Readonly<RewardedShakePolicy>> {
    try {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('激励广告策略必须是对象');
      const p = raw as Record<string, unknown>;
      if (typeof p.policyVersion !== 'string' || !p.policyVersion.trim()) throw new Error('policyVersion 缺失');
      if (typeof p.enabled !== 'boolean') throw new Error('enabled 必须是 boolean');
      if (p.adUnitId !== null && (typeof p.adUnitId !== 'string' || !p.adUnitId.trim())) throw new Error('adUnitId 必须是 null 或非空字符串');
      if (p.placement !== 'extra-shake') throw new Error('placement 必须为 extra-shake');
      const amount = (key: string, max: number) => {
        const value = p[key];
        if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > max) throw new Error(`${key} 必须是 0..${max} 的整数`);
        return Number(value);
      };
      const maxPerRun = amount('maxExtraShakesPerRun', 5);
      const maxDaily = amount('maxDailyRewardedShakes', 5);
      const foreground = amount('minForegroundSecondsFirstSession', 600);
      if (typeof p.requireTutorialComplete !== 'boolean' || typeof p.requireFirstNaturalRunCompleted !== 'boolean') throw new Error('资格开关必须是 boolean');
      if (maxPerRun < 1) throw new Error('maxExtraShakesPerRun 至少为 1');
      if (maxDaily > 5) throw new Error('maxDailyRewardedShakes 不得超过每日 5 次');
      const policy: RewardedShakePolicy = {
        enabled: p.enabled, policyVersion: p.policyVersion, adUnitId: p.adUnitId as string | null, placement: 'extra-shake',
        maxExtraShakesPerRun: maxPerRun, maxDailyRewardedShakes: maxDaily, minForegroundSecondsFirstSession: foreground,
        requireTutorialComplete: p.requireTutorialComplete, requireFirstNaturalRunCompleted: p.requireFirstNaturalRunCompleted,
      };
      return { ok: true, data: Object.freeze(policy) };
    } catch (error) {
      return { ok: false, error: { code: 'REWARD_POLICY_INVALID', message: error instanceof Error ? error.message : String(error), retryable: false } };
    }
  }
}

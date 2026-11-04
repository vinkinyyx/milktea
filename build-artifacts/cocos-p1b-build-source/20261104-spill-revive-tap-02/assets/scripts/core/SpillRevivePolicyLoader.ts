import type { Result, SpillRevivePolicy } from '../contracts/types';

/** Validates the runtime spill-revive policy. Any malformed file or missing ad unit keeps the placement closed. */
export class SpillRevivePolicyLoader {
  static validate(raw: unknown): Result<Readonly<SpillRevivePolicy>> {
    try {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('洒出复活策略必须是对象');
      const p = raw as Record<string, unknown>;
      if (typeof p.policyVersion !== 'string' || !p.policyVersion.trim()) throw new Error('policyVersion 缺失');
      if (typeof p.enabled !== 'boolean') throw new Error('enabled 必须是 boolean');
      if (p.adUnitId !== null && (typeof p.adUnitId !== 'string' || !p.adUnitId.trim())) throw new Error('adUnitId 必须是 null 或非空字符串');
      if (p.placement !== 'spill-revive') throw new Error('placement 必须为 spill-revive');
      const amount = (key: string, min: number, max: number) => {
        const value = p[key];
        if (!Number.isSafeInteger(value) || Number(value) < min || Number(value) > max) throw new Error(`${key} 必须是 ${min}..${max} 的整数`);
        return Number(value);
      };
      if (p.maxRevivesPerRun !== 1) throw new Error('maxRevivesPerRun 必须为 1');
      const maxDaily = amount('maxDailyRevives', 1, 3);
      const clearanceDu = amount('clearanceDu', 8, 120);
      const autoDropDelayTicks = amount('autoDropDelayTicks', 0, 240);
      const foreground = amount('minForegroundSecondsFirstSession', 0, 600);
      if (typeof p.requireTutorialComplete !== 'boolean' || typeof p.requireFirstNaturalRunCompleted !== 'boolean') throw new Error('资格开关必须是 boolean');
      const policy: SpillRevivePolicy = {
        enabled: p.enabled, policyVersion: p.policyVersion, adUnitId: p.adUnitId as string | null, placement: 'spill-revive',
        maxRevivesPerRun: 1, maxDailyRevives: maxDaily, clearanceDu, autoDropDelayTicks,
        minForegroundSecondsFirstSession: foreground,
        requireTutorialComplete: p.requireTutorialComplete, requireFirstNaturalRunCompleted: p.requireFirstNaturalRunCompleted,
      };
      return { ok: true, data: Object.freeze(policy) };
    } catch (error) {
      return { ok: false, error: { code: 'REVIVE_POLICY_INVALID', message: error instanceof Error ? error.message : String(error), retryable: false } };
    }
  }
}

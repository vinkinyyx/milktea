import type { LocalProfile, RewardedAdCapability, RewardedReviveLedger, RewardedRevivePending, RewardedReviveReceipt, RunSnapshot, SpillRevivePolicy } from '../contracts/types';

export type ReviveOfferBlock =
  | 'POLICY_DISABLED' | 'AD_UNSUPPORTED' | 'AD_UNCONFIGURED' | 'NO_ACTIVE_RUN' | 'NOT_SPILL_PENDING'
  | 'RUN_LIMIT' | 'TUTORIAL_REQUIRED' | 'FIRST_RUN_REQUIRED' | 'FOREGROUND_REQUIRED' | 'PENDING_ATTEMPT';

/** Quota and eligibility rules for the once-per-run spill revive; pure so tools can test them without storage. */
export class ReviveLedger {
  static readonly EMPTY: RewardedReviveLedger = { dayKey: null, dailyGranted: 0, pendingAttempt: null, receipts: [] };
  static dayKey(nowMs: number): string { return new Date(nowMs + 8 * 60 * 60 * 1000).toISOString().slice(0, 10); }
  static normalize(ledger: RewardedReviveLedger, dayKey: string): RewardedReviveLedger {
    if (ledger.dayKey === dayKey) return ledger;
    return { ...ledger, dayKey, dailyGranted: ledger.receipts.filter((receipt) => receipt.dayKey === dayKey).length };
  }
  static grantedForDay(ledger: RewardedReviveLedger, day: string): number {
    const receipts = ledger.receipts.filter((receipt) => receipt.dayKey === day).length;
    return Math.max(ledger.dayKey === day ? ledger.dailyGranted : 0, receipts);
  }
  static pendingForRun(ledger: RewardedReviveLedger, runId: string | null): RewardedRevivePending | null {
    return runId && ledger.pendingAttempt?.runId === runId ? ledger.pendingAttempt : null;
  }
  static hasReceipt(ledger: RewardedReviveLedger, attemptId: string): boolean {
    return ledger.receipts.some((receipt) => receipt.attemptId === attemptId);
  }
  static checkOffer(input: {
    policy: SpillRevivePolicy; capability: RewardedAdCapability; profile: LocalProfile; run: RunSnapshot | null;
    foregroundSeconds: number; tutorialComplete: boolean; nowMs: number;
  }): { allowed: boolean; block: ReviveOfferBlock | null } {
    const { policy, capability, profile, run, foregroundSeconds, tutorialComplete, nowMs } = input;
    if (!policy.enabled) return { allowed: false, block: 'POLICY_DISABLED' };
    if (capability === 'UNCONFIGURED') return { allowed: false, block: 'AD_UNCONFIGURED' };
    if (capability !== 'SUPPORTED') return { allowed: false, block: 'AD_UNSUPPORTED' };
    if (!run || run.state !== 'PAUSED' || !run.revive.pendingFailure) return { allowed: false, block: 'NOT_SPILL_PENDING' };
    if (run.revive.used >= policy.maxRevivesPerRun) return { allowed: false, block: 'RUN_LIMIT' };
    // 每日复活上限未经用户授权，不阻断；保留 dayKey/dailyGranted/receipts 仅用于审计。
    if (policy.requireTutorialComplete && !tutorialComplete) return { allowed: false, block: 'TUTORIAL_REQUIRED' };
    // 无限模式没有关卡：用“完成一局自然游戏”映射平台的“首个关卡内不展示广告”。60 秒前台保护只约束
    // 首局完成之前，首局完成后不再要求，避免一次性的首次体验保护变成永久的隐形阻断。
    if (!profile.firstNaturalRunCompleted && !(foregroundSeconds >= policy.minForegroundSecondsFirstSession)) return { allowed: false, block: 'FOREGROUND_REQUIRED' };
    if (policy.requireFirstNaturalRunCompleted && !profile.firstNaturalRunCompleted) return { allowed: false, block: 'FIRST_RUN_REQUIRED' };
    if (this.pendingForRun(profile.rewardedRevive, run.runId)) return { allowed: false, block: 'PENDING_ATTEMPT' };
    return { allowed: true, block: null };
  }
  static receiptFor(pending: RewardedRevivePending, nowMs: number): RewardedReviveReceipt {
    return {
      attemptId: pending.attemptId, runId: pending.runId, failureId: pending.failureId, rewardKind: 'spill_revive', amount: 1,
      policyVersion: pending.policyVersion, dayKey: pending.dayKey, status: 'COMMITTED', grantedAt: nowMs,
    };
  }
  static grant(ledger: RewardedReviveLedger, receipt: RewardedReviveReceipt, activeRunId: string | null): RewardedReviveLedger {
    const existing = ledger.receipts.find((item) => item.attemptId === receipt.attemptId);
    if (existing) {
      if (existing.runId !== receipt.runId || existing.failureId !== receipt.failureId || existing.rewardKind !== receipt.rewardKind
        || existing.amount !== receipt.amount || existing.policyVersion !== receipt.policyVersion || existing.dayKey !== receipt.dayKey)
        throw new Error('REWARD_RECEIPT_CONFLICT');
      return ledger;
    }
    const receipts = this.prune([...ledger.receipts, receipt], receipt.dayKey, activeRunId);
    const priorCount = this.grantedForDay(ledger, receipt.dayKey);
    const priorReceiptCount = ledger.receipts.filter((item) => item.dayKey === receipt.dayKey).length;
    const countForReceiptDay = priorCount > priorReceiptCount ? priorCount + 1 : receipts.filter((item) => item.dayKey === receipt.dayKey).length;
    const keepCurrentDay = !!ledger.dayKey && ledger.dayKey > receipt.dayKey;
    return { dayKey: keepCurrentDay ? ledger.dayKey : receipt.dayKey, dailyGranted: keepCurrentDay ? ledger.dailyGranted : countForReceiptDay, pendingAttempt: null, receipts };
  }
  static clearPending(ledger: RewardedReviveLedger): RewardedReviveLedger { return { ...ledger, pendingAttempt: null }; }
  static prune(receipts: RewardedReviveReceipt[], keepDayKey: string, activeRunId: string | null): RewardedReviveReceipt[] {
    const floor = new Date(`${keepDayKey}T00:00:00Z`).getTime() - 6 * 24 * 60 * 60 * 1000;
    return receipts
      .filter((receipt) => receipt.runId === activeRunId || new Date(`${receipt.dayKey}T00:00:00Z`).getTime() >= floor)
      .slice(-64);
  }
}

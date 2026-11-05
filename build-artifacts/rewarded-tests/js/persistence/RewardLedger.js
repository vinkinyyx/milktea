"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardLedger = void 0;
/** Deterministic day/quota rules shared by the service and the automated acceptance tests. */
class RewardLedger {
    /** Asia/Shanghai has no DST; a fixed +08:00 offset keeps the day key stable across devices. */
    static dayKey(nowMs) { return new Date(nowMs + 8 * 60 * 60 * 1000).toISOString().slice(0, 10); }
    static normalize(ledger, today) {
        if (ledger.dayKey === today)
            return ledger;
        return { ...ledger, dayKey: today, dailyGranted: this.grantedForDay(ledger, today) };
    }
    static grantedForDay(ledger, day) {
        const receipts = ledger.receipts.filter(receipt => receipt.dayKey === day).length;
        return Math.max(ledger.dayKey === day ? ledger.dailyGranted : 0, receipts);
    }
    static dailyRemaining(ledger, policy, today) {
        return Math.max(0, policy.maxDailyRewardedShakes - this.grantedForDay(ledger, today));
    }
    static pendingForRun(ledger, runId) {
        var _a;
        return runId && ((_a = ledger.pendingAttempt) === null || _a === void 0 ? void 0 : _a.runId) === runId ? ledger.pendingAttempt : null;
    }
    static hasReceipt(ledger, attemptId) {
        return ledger.receipts.some((receipt) => receipt.attemptId === attemptId);
    }
    static checkOffer(input) {
        const { policy, capability, profile, run, foregroundSeconds, tutorialComplete, nowMs } = input;
        if (!policy.enabled)
            return { allowed: false, block: 'POLICY_DISABLED' };
        if (capability === 'UNCONFIGURED')
            return { allowed: false, block: 'AD_UNCONFIGURED' };
        if (capability !== 'SUPPORTED')
            return { allowed: false, block: 'AD_UNSUPPORTED' };
        if (!run || (run.state !== 'PLAYING' && run.state !== 'PAUSED'))
            return { allowed: false, block: 'NO_ACTIVE_RUN' };
        if (run.shake.baseUsed < 2)
            return { allowed: false, block: 'BASE_SHAKES_REMAINING' };
        if (run.shake.extraGranted >= policy.maxExtraShakesPerRun)
            return { allowed: false, block: 'RUN_LIMIT' };
        const today = this.dayKey(nowMs);
        if (this.dailyRemaining(profile.rewardedShake, policy, today) < 1)
            return { allowed: false, block: 'DAILY_LIMIT' };
        if (policy.requireTutorialComplete && !tutorialComplete)
            return { allowed: false, block: 'TUTORIAL_REQUIRED' };
        if (policy.requireFirstNaturalRunCompleted && !profile.firstNaturalRunCompleted)
            return { allowed: false, block: 'FIRST_RUN_REQUIRED' };
        if (!(foregroundSeconds >= policy.minForegroundSecondsFirstSession))
            return { allowed: false, block: 'FOREGROUND_REQUIRED' };
        if (this.pendingForRun(profile.rewardedShake, run.runId))
            return { allowed: false, block: 'PENDING_ATTEMPT' };
        return { allowed: true, block: null };
    }
    static receiptFor(pending, nowMs) {
        return {
            attemptId: pending.attemptId, runId: pending.runId, rewardKind: 'extra_shake', amount: 1,
            policyVersion: pending.policyVersion, dayKey: pending.dayKey, status: 'COMMITTED', grantedAt: nowMs,
        };
    }
    static grant(ledger, receipt, activeRunId) {
        const existing = ledger.receipts.find(item => item.attemptId === receipt.attemptId);
        if (existing) {
            if (existing.runId !== receipt.runId || existing.rewardKind !== receipt.rewardKind || existing.amount !== receipt.amount || existing.policyVersion !== receipt.policyVersion || existing.dayKey !== receipt.dayKey)
                throw new Error('REWARD_RECEIPT_CONFLICT');
            return ledger;
        }
        const receipts = this.prune([...ledger.receipts, receipt], receipt.dayKey, activeRunId);
        const priorCount = this.grantedForDay(ledger, receipt.dayKey), priorReceiptCount = ledger.receipts.filter(item => item.dayKey === receipt.dayKey).length;
        const countForReceiptDay = priorCount > priorReceiptCount ? priorCount + 1 : receipts.filter(item => item.dayKey === receipt.dayKey).length;
        const keepCurrentDay = !!ledger.dayKey && ledger.dayKey > receipt.dayKey;
        return { dayKey: keepCurrentDay ? ledger.dayKey : receipt.dayKey, dailyGranted: keepCurrentDay ? ledger.dailyGranted : countForReceiptDay, pendingAttempt: null, receipts };
    }
    static clearPending(ledger) {
        return { ...ledger, pendingAttempt: null };
    }
    static prune(receipts, keepDayKey, activeRunId) {
        const floor = new Date(`${keepDayKey}T00:00:00Z`).getTime() - 6 * 24 * 60 * 60 * 1000;
        return receipts
            .filter((receipt) => receipt.runId === activeRunId || new Date(`${receipt.dayKey}T00:00:00Z`).getTime() >= floor)
            .slice(-64);
    }
}
exports.RewardLedger = RewardLedger;
RewardLedger.EMPTY = { dayKey: null, dailyGranted: 0, pendingAttempt: null, receipts: [] };

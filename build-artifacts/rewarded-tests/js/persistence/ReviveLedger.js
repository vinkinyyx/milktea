"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviveLedger = void 0;
/** Quota and eligibility rules for the once-per-run spill revive; pure so tools can test them without storage. */
class ReviveLedger {
    static dayKey(nowMs) { return new Date(nowMs + 8 * 60 * 60 * 1000).toISOString().slice(0, 10); }
    static normalize(ledger, dayKey) {
        if (ledger.dayKey === dayKey)
            return ledger;
        return { ...ledger, dayKey, dailyGranted: ledger.receipts.filter((receipt) => receipt.dayKey === dayKey).length };
    }
    static grantedForDay(ledger, day) {
        const receipts = ledger.receipts.filter((receipt) => receipt.dayKey === day).length;
        return Math.max(ledger.dayKey === day ? ledger.dailyGranted : 0, receipts);
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
        if (!run || run.state !== 'PAUSED' || !run.revive.pendingFailure)
            return { allowed: false, block: 'NOT_SPILL_PENDING' };
        if (run.revive.used >= policy.maxRevivesPerRun)
            return { allowed: false, block: 'RUN_LIMIT' };
        // 每日复活上限未经用户授权，不阻断；保留 dayKey/dailyGranted/receipts 仅用于审计。
        if (policy.requireTutorialComplete && !tutorialComplete)
            return { allowed: false, block: 'TUTORIAL_REQUIRED' };
        if (policy.requireFirstNaturalRunCompleted && !profile.firstNaturalRunCompleted)
            return { allowed: false, block: 'FIRST_RUN_REQUIRED' };
        if (!(foregroundSeconds >= policy.minForegroundSecondsFirstSession))
            return { allowed: false, block: 'FOREGROUND_REQUIRED' };
        if (this.pendingForRun(profile.rewardedRevive, run.runId))
            return { allowed: false, block: 'PENDING_ATTEMPT' };
        return { allowed: true, block: null };
    }
    static receiptFor(pending, nowMs) {
        return {
            attemptId: pending.attemptId, runId: pending.runId, failureId: pending.failureId, rewardKind: 'spill_revive', amount: 1,
            policyVersion: pending.policyVersion, dayKey: pending.dayKey, status: 'COMMITTED', grantedAt: nowMs,
        };
    }
    static grant(ledger, receipt, activeRunId) {
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
    static clearPending(ledger) { return { ...ledger, pendingAttempt: null }; }
    static prune(receipts, keepDayKey, activeRunId) {
        const floor = new Date(`${keepDayKey}T00:00:00Z`).getTime() - 6 * 24 * 60 * 60 * 1000;
        return receipts
            .filter((receipt) => receipt.runId === activeRunId || new Date(`${receipt.dayKey}T00:00:00Z`).getTime() >= floor)
            .slice(-64);
    }
}
exports.ReviveLedger = ReviveLedger;
ReviveLedger.EMPTY = { dayKey: null, dailyGranted: 0, pendingAttempt: null, receipts: [] };

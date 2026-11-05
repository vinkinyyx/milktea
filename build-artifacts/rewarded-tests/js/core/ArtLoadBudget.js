"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeBudgetError = exports.ArtLoadBudget = void 0;
/** Shared foreground-time budget for one startup art batch. Background time never counts toward the deadline. */
class ArtLoadBudget {
    constructor(ownerEpoch, traceId, budgetMs = 15000, initialForegroundMs = 0) {
        this.ownerEpoch = ownerEpoch;
        this.traceId = traceId;
        this.budgetMs = budgetMs;
        this.usedMs = 0;
        this.state = 'ACTIVE';
        this.cancelHandles = [];
        this.usedMs = Math.max(0, initialForegroundMs);
        if (this.usedMs >= this.budgetMs)
            this.state = 'EXPIRED';
    }
    get foregroundMs() { return Math.round(this.usedMs); }
    get remainingMs() { return Math.max(0, this.budgetMs - this.usedMs); }
    get expired() { return this.state === 'EXPIRED'; }
    get active() { return this.state === 'ACTIVE'; }
    get status() { return this.state; }
    /** Advance only while the host is in the foreground. Returns true when this call exhausted the budget. */
    advance(deltaMs, foreground) {
        if (this.state !== 'ACTIVE' || !foreground || !Number.isFinite(deltaMs) || deltaMs <= 0)
            return false;
        this.usedMs += deltaMs;
        if (this.usedMs < this.budgetMs)
            return false;
        this.state = 'EXPIRED';
        this.rejectAll('START_ART_TIMEOUT');
        return true;
    }
    cancel(code = 'START_ART_CANCELLED') {
        if (this.state !== 'ACTIVE')
            return;
        this.state = 'CANCELLED';
        this.rejectAll(code);
    }
    settle() {
        if (this.state !== 'ACTIVE')
            return;
        this.state = 'SETTLED';
        this.resolvePending();
    }
    assertActive() {
        if (this.state === 'EXPIRED')
            throw makeBudgetError('START_ART_TIMEOUT');
        if (this.state === 'CANCELLED')
            throw makeBudgetError('START_ART_CANCELLED');
    }
    /** Rejects when this budget expires or is cancelled, so a never-calling engine callback cannot hang the wait. */
    cancelled() {
        if (this.state === 'EXPIRED')
            return Promise.reject(makeBudgetError('START_ART_TIMEOUT'));
        if (this.state === 'CANCELLED')
            return Promise.reject(makeBudgetError('START_ART_CANCELLED'));
        if (this.state === 'SETTLED')
            return new Promise(() => undefined);
        return new Promise((_, reject) => { this.cancelHandles.push(reject); });
    }
    rejectAll(code) {
        const handles = this.cancelHandles;
        this.cancelHandles = [];
        for (const reject of handles) {
            try {
                reject(makeBudgetError(code));
            }
            catch { /* listener teardown */ }
        }
    }
    resolvePending() { this.cancelHandles = []; }
}
exports.ArtLoadBudget = ArtLoadBudget;
function makeBudgetError(code) {
    const error = new Error(code);
    error.name = 'ArtLoadBudgetError';
    return error;
}
exports.makeBudgetError = makeBudgetError;

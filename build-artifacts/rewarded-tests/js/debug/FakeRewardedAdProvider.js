"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeRewardedAdProvider = void 0;
class FakeRewardedAdProvider {
    constructor(mode, policy) {
        this.mode = mode;
        this.policy = policy;
        this.providerName = 'debug-mock';
        this.shown = false;
    }
    /** `?rewardedMock=ok|cancel|fail|unavailable` only exists in Debug builds. */
    static modeFromQuery() {
        try {
            const location = globalThis.location;
            if (!(location === null || location === void 0 ? void 0 : location.search))
                return null;
            const value = new URLSearchParams(location.search).get('rewardedMock');
            if (value === 'ok' || value === 'cancel' || value === 'fail' || value === 'unavailable')
                return value;
            return null;
        }
        catch {
            return null;
        }
    }
    capability() { return 'SUPPORTED'; }
    prepare() {
        console.info('[debug-mock] simulated rewarded video prepare', { mode: this.mode, policy: this.policy.policyVersion });
        return new Promise((resolve) => setTimeout(() => resolve({ ok: true, data: undefined }), 120));
    }
    show(attemptId) {
        console.info('[debug-mock] simulated rewarded video show', { attemptId, mode: this.mode });
        this.shown = true;
        return new Promise((resolve) => setTimeout(() => {
            if (this.mode === 'ok')
                resolve({ kind: 'COMPLETED', attemptId });
            else if (this.mode === 'cancel')
                resolve({ kind: 'CANCELLED', attemptId, errorCode: 'MOCK_CLOSED_EARLY' });
            else if (this.mode === 'unavailable')
                resolve({ kind: 'UNAVAILABLE', attemptId, errorCode: 'MOCK_NO_FILL' });
            else
                resolve({ kind: 'FAILED', attemptId, errorCode: 'MOCK_FAILED' });
        }, 900));
    }
    dispose() { if (this.shown)
        console.info('[debug-mock] simulated rewarded video disposed'); }
}
exports.FakeRewardedAdProvider = FakeRewardedAdProvider;

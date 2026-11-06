"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TapRewardedAdProvider = void 0;
const tapApi = () => globalThis.tap;
/** Attempt-scoped Tap mini-game adapter. SDK listeners are owned and removed per multiton instance. */
class TapRewardedAdProvider {
    constructor(policy) {
        this.policy = policy;
        this.providerName = 'tap';
        this.active = null;
        this.generation = 0;
        this.disposed = false;
    }
    capability() {
        var _a;
        if (!this.policy.enabled)
            return 'DISABLED';
        if (!this.policy.adUnitId)
            return 'UNCONFIGURED';
        return typeof ((_a = tapApi()) === null || _a === void 0 ? void 0 : _a.createRewardedVideoAd) === 'function' ? 'SUPPORTED' : 'UNSUPPORTED';
    }
    async prepare() {
        if (this.disposed)
            return this.fail('REWARD_AD_DISPOSED');
        const state = this.getInstance();
        if (!state)
            return this.fail('REWARD_AD_UNSUPPORTED');
        if (state.loaded)
            return { ok: true, data: undefined };
        if (state.preparing)
            return state.preparing;
        if (typeof state.instance.load !== 'function') {
            this.release(state);
            return this.fail('REWARD_AD_LOAD_UNSUPPORTED');
        }
        state.preparing = new Promise(resolve => {
            let done = false;
            const finish = (ok, code = 'REWARD_AD_LOAD_FAILED') => {
                if (done || state.closed)
                    return;
                done = true;
                this.clearLoadTimer(state);
                state.preparing = null;
                state.loaded = ok;
                state.loadFinish = null;
                resolve(ok ? { ok: true, data: undefined } : this.fail(code));
                if (!ok) {
                    this.release(state);
                    if (this.active === state)
                        this.active = null;
                }
            };
            state.loadFinish = (ok, code) => finish(ok, code);
            state.loadTimer = setTimeout(() => finish(false, 'REWARD_AD_LOAD_TIMEOUT'), 10000);
            try {
                const p = state.instance.load();
                if (!p || typeof p.then !== 'function') {
                    finish(false, 'REWARD_AD_LOAD_CONTRACT');
                    return;
                }
                p.then(() => finish(true), () => finish(false, 'REWARD_AD_LOAD_REJECTED'));
            }
            catch {
                finish(false, 'REWARD_AD_LOAD_THROW');
            }
        });
        return state.preparing;
    }
    show(attemptId) {
        if (this.disposed)
            return Promise.resolve({ kind: 'FAILED', attemptId, errorCode: 'REWARD_AD_DISPOSED' });
        const state = this.active;
        if (!state || state.closed || !state.loaded || typeof state.instance.show !== 'function') {
            return Promise.resolve({ kind: 'UNAVAILABLE', attemptId, errorCode: 'REWARD_AD_NOT_PREPARED' });
        }
        if (state.pending)
            return Promise.resolve({ kind: 'UNAVAILABLE', attemptId, errorCode: 'REWARD_AD_BUSY' });
        return new Promise(resolve => {
            state.pending = { attemptId, resolve };
            try {
                const p = state.instance.show();
                if (!p || typeof p.then !== 'function')
                    this.finish(state, { kind: 'FAILED', attemptId, errorCode: 'REWARD_AD_SHOW_CONTRACT' });
                // show() resolving only means the call was accepted: the reward still waits for the top-level onClose.
                else
                    p.catch(() => this.finish(state, { kind: 'FAILED', attemptId, errorCode: 'REWARD_AD_SHOW_REJECTED' }));
            }
            catch {
                this.finish(state, { kind: 'FAILED', attemptId, errorCode: 'REWARD_AD_SHOW_THROW' });
            }
        });
    }
    getInstance() {
        if (this.active && !this.active.closed)
            return this.active;
        const api = tapApi();
        if (!(api === null || api === void 0 ? void 0 : api.createRewardedVideoAd) || !this.policy.adUnitId)
            return null;
        let instance;
        try {
            instance = api.createRewardedVideoAd({ adUnitId: this.policy.adUnitId, multiton: true });
        }
        catch {
            return null;
        }
        const state = {
            generation: ++this.generation, instance, loaded: false, preparing: null, pending: null, loadFinish: null, loadTimer: null,
            closed: false, released: false, destroyed: false, registered: [], onLoad: () => { }, onError: () => { }, onClose: () => { },
        };
        // A partially created instance must still be destroyed; validate before claiming ownership.
        if (!instance.onLoad || !instance.offLoad || !instance.onError || !instance.offError || !instance.onClose || !instance.offClose
            || !instance.load || !instance.show) {
            this.release(state);
            return null;
        }
        state.onLoad = () => { var _a; if (state.closed)
            return; state.loaded = true; (_a = state.loadFinish) === null || _a === void 0 ? void 0 : _a.call(state, true); };
        state.onError = () => {
            var _a;
            if (state.closed)
                return;
            state.loaded = false;
            if (state.pending)
                this.finish(state, { kind: 'FAILED', attemptId: state.pending.attemptId, errorCode: 'REWARD_AD_NATIVE_ERROR' });
            else
                (_a = state.loadFinish) === null || _a === void 0 ? void 0 : _a.call(state, false, 'REWARD_AD_LOAD_ERROR');
        };
        state.onClose = result => {
            if (state.closed)
                return;
            const pending = state.pending;
            if (!pending)
                return;
            this.finish(state, (result === null || result === void 0 ? void 0 : result.isEnded) === true ? { kind: 'COMPLETED', attemptId: pending.attemptId }
                : { kind: 'CANCELLED', attemptId: pending.attemptId, errorCode: 'REWARD_AD_CLOSED_EARLY' });
        };
        // Register one listener per try: if the middle one throws, release already-unregistered listeners plus the instance.
        const register = (kind, attach) => {
            try {
                attach();
                state.registered.push(kind);
                return true;
            }
            catch {
                return false;
            }
        };
        if (!register('load', () => instance.onLoad(state.onLoad))
            || !register('error', () => instance.onError(state.onError))
            || !register('close', () => instance.onClose(state.onClose))) {
            this.release(state);
            return null;
        }
        this.active = state;
        return state;
    }
    /** Settle the owning attempt exactly once, then release native resources. Idempotent for duplicate/late closes. */
    finish(state, outcome) {
        const pending = state.pending;
        if (state.closed || !pending || pending.attemptId !== outcome.attemptId)
            return;
        state.closed = true;
        state.pending = null;
        state.loaded = false;
        state.loadFinish = null;
        pending.resolve(outcome);
        this.release(state);
    }
    /** Unregister every registered listener independently, then destroy at most once and drop references. */
    release(state) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (state.released)
            return;
        state.released = true;
        state.closed = true;
        this.clearLoadTimer(state);
        state.loadFinish = null;
        state.preparing = null;
        for (const kind of state.registered) {
            try {
                if (kind === 'load')
                    (_b = (_a = state.instance).offLoad) === null || _b === void 0 ? void 0 : _b.call(_a, state.onLoad);
                else if (kind === 'error')
                    (_d = (_c = state.instance).offError) === null || _d === void 0 ? void 0 : _d.call(_c, state.onError);
                else
                    (_f = (_e = state.instance).offClose) === null || _f === void 0 ? void 0 : _f.call(_e, state.onClose);
            }
            catch { /* an off failure must never block the remaining listeners or destroy */ }
        }
        state.registered = [];
        if (!state.destroyed) {
            state.destroyed = true;
            try {
                (_h = (_g = state.instance).destroy) === null || _h === void 0 ? void 0 : _h.call(_g);
            }
            catch { /* native destroy is best effort and must not throw out */ }
        }
        if (this.active === state)
            this.active = null;
    }
    clearLoadTimer(state) {
        if (state.loadTimer !== null) {
            clearTimeout(state.loadTimer);
            state.loadTimer = null;
        }
    }
    fail(code) { return { ok: false, error: { code, message: code, retryable: true } }; }
    dispose() {
        var _a;
        if (this.disposed)
            return;
        this.disposed = true;
        const state = this.active;
        this.active = null;
        if (!state)
            return;
        if (state.pending)
            this.finish(state, { kind: 'FAILED', attemptId: state.pending.attemptId, errorCode: 'REWARD_AD_DISPOSED' });
        else
            (_a = state.loadFinish) === null || _a === void 0 ? void 0 : _a.call(state, false, 'REWARD_AD_DISPOSED');
        this.release(state);
    }
}
exports.TapRewardedAdProvider = TapRewardedAdProvider;

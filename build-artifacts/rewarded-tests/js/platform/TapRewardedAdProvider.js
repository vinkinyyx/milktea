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
        if (typeof state.instance.load !== 'function')
            return this.fail('REWARD_AD_LOAD_UNSUPPORTED');
        state.preparing = new Promise(resolve => {
            let done = false;
            const finish = (ok, code = 'REWARD_AD_LOAD_FAILED') => { if (done)
                return; done = true; clearTimeout(timer); state.preparing = null; state.loaded = ok; state.loadFinish = null; resolve(ok ? { ok: true, data: undefined } : this.fail(code)); if (!ok) {
                this.detach(state);
                if (this.active === state)
                    this.active = null;
            } };
            const timer = setTimeout(() => finish(false, 'REWARD_AD_LOAD_TIMEOUT'), 10000);
            state.loadFinish = (ok, code) => finish(ok, code);
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
        if (!state || !state.loaded || typeof state.instance.show !== 'function')
            return Promise.resolve({ kind: 'UNAVAILABLE', attemptId, errorCode: 'REWARD_AD_NOT_PREPARED' });
        if (state.pending)
            return Promise.resolve({ kind: 'UNAVAILABLE', attemptId, errorCode: 'REWARD_AD_BUSY' });
        return new Promise(resolve => {
            state.pending = { attemptId, resolve };
            try {
                const p = state.instance.show();
                if (!p || typeof p.then !== 'function')
                    this.finish(state, { kind: 'FAILED', attemptId, errorCode: 'REWARD_AD_SHOW_CONTRACT' });
                else
                    p.catch(() => this.finish(state, { kind: 'FAILED', attemptId, errorCode: 'REWARD_AD_SHOW_REJECTED' }));
            }
            catch {
                this.finish(state, { kind: 'FAILED', attemptId, errorCode: 'REWARD_AD_SHOW_THROW' });
            }
        });
    }
    getInstance() {
        if (this.active)
            return this.active;
        const api = tapApi();
        if (!(api === null || api === void 0 ? void 0 : api.createRewardedVideoAd) || !this.policy.adUnitId)
            return null;
        try {
            const instance = api.createRewardedVideoAd({ adUnitId: this.policy.adUnitId, multiton: true });
            const generation = ++this.generation;
            const state = { generation, instance, loaded: false, preparing: null, pending: null, loadFinish: null, onLoad: () => { }, onError: () => { }, onClose: () => { } };
            state.onLoad = () => { var _a; state.loaded = true; (_a = state.loadFinish) === null || _a === void 0 ? void 0 : _a.call(state, true); };
            state.onError = () => { var _a; state.loaded = false; if (state.pending)
                this.finish(state, { kind: 'FAILED', attemptId: state.pending.attemptId, errorCode: 'REWARD_AD_NATIVE_ERROR' });
            else
                (_a = state.loadFinish) === null || _a === void 0 ? void 0 : _a.call(state, false, 'REWARD_AD_LOAD_ERROR'); };
            state.onClose = result => { const pending = state.pending; if (!pending)
                return; this.finish(state, (result === null || result === void 0 ? void 0 : result.isEnded) === true ? { kind: 'COMPLETED', attemptId: pending.attemptId } : { kind: 'CANCELLED', attemptId: pending.attemptId, errorCode: 'REWARD_AD_CLOSED_EARLY' }); };
            if (!instance.onLoad || !instance.offLoad || !instance.onError || !instance.offError || !instance.onClose || !instance.offClose || !instance.load || !instance.show)
                return null;
            instance.onLoad(state.onLoad);
            instance.onError(state.onError);
            instance.onClose(state.onClose);
            this.active = state;
            return state;
        }
        catch {
            return null;
        }
    }
    finish(state, outcome) { const pending = state.pending; if (!pending || pending.attemptId !== outcome.attemptId)
        return; state.pending = null; state.loaded = false; pending.resolve(outcome); this.detach(state); if (this.active === state)
        this.active = null; }
    detach(state) { var _a, _b, _c, _d, _e, _f, _g, _h; try {
        (_b = (_a = state.instance).offLoad) === null || _b === void 0 ? void 0 : _b.call(_a, state.onLoad);
        (_d = (_c = state.instance).offError) === null || _d === void 0 ? void 0 : _d.call(_c, state.onError);
        (_f = (_e = state.instance).offClose) === null || _f === void 0 ? void 0 : _f.call(_e, state.onClose);
        (_h = (_g = state.instance).destroy) === null || _h === void 0 ? void 0 : _h.call(_g);
    }
    catch { /* per-instance teardown is best effort */ } }
    fail(code) { return { ok: false, error: { code, message: code, retryable: true } }; }
    dispose() { if (this.disposed)
        return; this.disposed = true; const s = this.active; this.active = null; if (s) {
        if (s.pending)
            this.finish(s, { kind: 'FAILED', attemptId: s.pending.attemptId, errorCode: 'REWARD_AD_DISPOSED' });
        this.detach(s);
    } }
}
exports.TapRewardedAdProvider = TapRewardedAdProvider;

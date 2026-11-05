"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardedShakeService = void 0;
const RewardLedger_1 = require("../persistence/RewardLedger");
const RewardedAdCoordinator_1 = require("./RewardedAdCoordinator");
const copy = (value) => JSON.parse(JSON.stringify(value));
function makeUuid() {
    const cryptoApi = globalThis.crypto;
    if (cryptoApi === null || cryptoApi === void 0 ? void 0 : cryptoApi.randomUUID)
        return cryptoApi.randomUUID();
    const bytes = new Uint8Array(16);
    if (cryptoApi === null || cryptoApi === void 0 ? void 0 : cryptoApi.getRandomValues)
        cryptoApi.getRandomValues(bytes);
    else
        for (let i = 0; i < bytes.length; i++)
            bytes[i] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
/**
 * App-scoped rewarded-shake state machine. The pending attempt is persisted before show; a grant is
 * committed before the live engine receives it, so a failed save can never leave spendable ghost shakes.
 */
class RewardedShakeService {
    constructor(env, repo, now) {
        this.env = env;
        this.repo = repo;
        this.now = now;
        this.phase = 'IDLE';
        this.message = null;
        this.retrySettle = false;
        this.busy = false;
        this.stalePending = false;
        this.pendingAttempt = null;
        /** Set only after this process receives a strict, attempt-scoped COMPLETED outcome. */
        this.trustedCompletionAttempt = null;
        this.foregroundSeconds = 0;
        this.host = null;
        this.boundRunId = null;
        this.hostGeneration = 0;
    }
    static create(env, repo, now = () => Date.now()) {
        const service = new RewardedShakeService(env, repo, now);
        const scope = globalThis;
        if (scope.__milkteaRewardedShake) {
            service.env.provider.dispose();
            return scope.__milkteaRewardedShake;
        }
        scope.__milkteaRewardedShake = service;
        return service;
    }
    get policy() { return this.env.policy; }
    bind(host) {
        var _a, _b, _c;
        const nextRun = (_b = (_a = host.getActiveRunSnapshot()) === null || _a === void 0 ? void 0 : _a.runId) !== null && _b !== void 0 ? _b : null;
        if (this.host !== host || this.boundRunId !== nextRun) {
            this.hostGeneration++;
            this.boundRunId = nextRun;
        }
        this.host = host;
        const ledger = (_c = host.getBundle()) === null || _c === void 0 ? void 0 : _c.profile.rewardedShake;
        const run = host.getActiveRunSnapshot();
        this.stalePending = !!((ledger === null || ledger === void 0 ? void 0 : ledger.pendingAttempt) && run && ledger.pendingAttempt.runId === run.runId);
        if (!this.busy) {
            this.phase = 'IDLE';
            this.message = this.stalePending ? '上次广告奖励未得到可信完成确认，未发放。' : null;
            this.retrySettle = false;
        }
    }
    unbind(host) { if (this.host === host)
        this.host = null; }
    setForegroundSeconds(seconds) { this.foregroundSeconds = Math.max(0, seconds); }
    providerDisposed() { return false; }
    dispose() { this.env.provider.dispose(); }
    getView() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const bundle = (_b = (_a = this.host) === null || _a === void 0 ? void 0 : _a.getBundle()) !== null && _b !== void 0 ? _b : null;
        const run = (_d = (_c = this.host) === null || _c === void 0 ? void 0 : _c.getActiveRunSnapshot()) !== null && _d !== void 0 ? _d : null;
        const check = bundle && run
            ? RewardLedger_1.RewardLedger.checkOffer({
                policy: this.env.policy, capability: this.env.provider.capability(), profile: bundle.profile, run,
                foregroundSeconds: this.foregroundSeconds, tutorialComplete: (_f = (_e = this.host) === null || _e === void 0 ? void 0 : _e.isTutorialComplete()) !== null && _f !== void 0 ? _f : false, nowMs: this.now(),
            })
            : { allowed: false, block: 'NO_ACTIVE_RUN' };
        const ledger = (_g = bundle === null || bundle === void 0 ? void 0 : bundle.profile.rewardedShake) !== null && _g !== void 0 ? _g : RewardLedger_1.RewardLedger.EMPTY;
        const today = RewardLedger_1.RewardLedger.dayKey(this.now());
        return {
            phase: this.phase, block: this.stalePending ? 'PENDING_ATTEMPT' : check.block, message: this.message, retrySettle: this.retrySettle,
            capability: this.env.provider.capability(), providerName: this.env.provider.providerName,
            availableExtra: (run === null || run === void 0 ? void 0 : run.shake.extraGranted) !== undefined ? Math.max(0, run.shake.extraGranted - run.shake.extraUsed) : 0,
            grantedThisRun: (_h = run === null || run === void 0 ? void 0 : run.shake.extraGranted) !== null && _h !== void 0 ? _h : 0, runLimit: this.env.policy.maxExtraShakesPerRun,
            dailyRemaining: RewardLedger_1.RewardLedger.dailyRemaining(ledger, this.env.policy, today),
            pendingAttempt: this.stalePending || !!(ledger.pendingAttempt && run && ledger.pendingAttempt.runId === run.runId),
            simulated: this.env.provider.providerName !== 'tap',
        };
    }
    canOffer() { const view = this.getView(); return view.phase === 'IDLE' && view.block === null; }
    openOffer() {
        if (!this.host || this.busy)
            return;
        const check = this.check();
        if (!check.allowed) {
            this.message = this.blockMessage(check.block);
            this.changed();
            return;
        }
        this.phase = 'OFFER';
        this.message = null;
        this.retrySettle = false;
        this.host.pauseForRewardedAd();
        this.changed();
    }
    closeOffer() {
        if (!this.host || this.phase !== 'OFFER' && this.phase !== 'ERROR')
            return;
        this.phase = 'IDLE';
        this.message = null;
        this.retrySettle = false;
        this.changed();
        this.host.resumeFromRewardedAd(null);
    }
    /** Reopens the pending record so the player can abandon an untrusted attempt. */
    openPendingReview() {
        var _a;
        if (!this.host || this.busy)
            return;
        const ledger = (_a = this.host.getBundle()) === null || _a === void 0 ? void 0 : _a.profile.rewardedShake;
        const run = this.host.getActiveRunSnapshot();
        if (!(ledger === null || ledger === void 0 ? void 0 : ledger.pendingAttempt) || !run || ledger.pendingAttempt.runId !== run.runId)
            return;
        this.stalePending = true;
        this.phase = 'ERROR';
        this.retrySettle = false;
        this.message = '上次广告奖励未得到可信完成确认，未发放。可放弃后重新观看。';
        this.host.pauseForRewardedAd();
        this.changed();
    }
    async watch() {
        var _a, _b, _c;
        if (!this.host || this.phase !== 'OFFER' || this.busy)
            return;
        const check = this.check();
        if (!check.allowed) {
            this.message = this.blockMessage(check.block);
            this.changed();
            return;
        }
        const owner = this.host, generation = this.hostGeneration;
        let bundle = owner.getBundle();
        let run = owner.getActiveRunSnapshot();
        if (!bundle || !run) {
            this.message = '当前局不可用';
            this.changed();
            return;
        }
        if (this.env.provider.capability() !== 'SUPPORTED') {
            this.message = this.blockMessage('AD_UNSUPPORTED');
            this.phase = 'ERROR';
            this.changed();
            return;
        }
        if (!RewardedAdCoordinator_1.RewardedAdCoordinator.claim('extra-shake')) {
            this.message = '另有广告正在进行，请稍后再试。';
            this.phase = 'ERROR';
            this.changed();
            return;
        }
        this.busy = true;
        this.phase = 'PREPARING';
        this.message = null;
        this.changed();
        try {
            await this.host.waitForSaveIdle();
            if (this.host !== owner || generation !== this.hostGeneration || ((_a = owner.getActiveRunSnapshot()) === null || _a === void 0 ? void 0 : _a.runId) !== run.runId)
                throw new Error('REWARD_ATTEMPT_OWNER_CHANGED');
            bundle = owner.getBundle();
            run = owner.getActiveRunSnapshot();
            if (!bundle || !run)
                throw new Error('REWARD_ATTEMPT_RUN_MISSING');
            const attemptId = makeUuid();
            const pending = {
                attemptId, runId: run.runId, policyVersion: this.env.policy.policyVersion, amount: 1,
                dayKey: RewardLedger_1.RewardLedger.dayKey(this.now()), startedAt: this.now(),
            };
            const frozen = copy(bundle);
            frozen.profile.rewardedShake = { ...RewardLedger_1.RewardLedger.normalize(frozen.profile.rewardedShake, pending.dayKey), pendingAttempt: pending };
            const pendingCommit = await this.repo.commitBundle(owner.getSaveRevision(), bundle.profile.activeRunId, frozen);
            if (this.host !== owner || generation !== this.hostGeneration || ((_b = owner.getActiveRunSnapshot()) === null || _b === void 0 ? void 0 : _b.runId) !== run.runId)
                throw new Error('REWARD_ATTEMPT_OWNER_CHANGED');
            if (!pendingCommit.ok) {
                this.busy = false;
                this.phase = 'ERROR';
                this.retrySettle = false;
                this.message = '无法写入待确认的广告奖励，广告未展示。';
                this.changed();
                return;
            }
            owner.onRewardedShakeCommitted(frozen, pendingCommit.data.revision);
            this.pendingAttempt = attemptId;
            this.trustedCompletionAttempt = null;
            const prepared = await this.env.provider.prepare();
            if (this.host !== owner || generation !== this.hostGeneration)
                throw new Error('REWARD_ATTEMPT_OWNER_CHANGED');
            if (!prepared.ok) {
                if (!await this.clearPending('广告暂时无法加载，未发放奖励。'))
                    throw new Error('REWARD_PENDING_CLEAR_FAILED');
                this.busy = false;
                return;
            }
            this.phase = 'SHOWING';
            this.changed();
            const outcome = await this.env.provider.show(attemptId);
            if (this.host !== owner || generation !== this.hostGeneration || ((_c = owner.getActiveRunSnapshot()) === null || _c === void 0 ? void 0 : _c.runId) !== run.runId) {
                this.busy = false;
                return;
            }
            if (outcome.kind !== 'COMPLETED') {
                if (!await this.clearPending(outcome.kind === 'CANCELLED' ? '观看未完成，未发放奖励。' : '广告播放失败，未发放奖励。'))
                    throw new Error('REWARD_PENDING_CLEAR_FAILED');
                this.busy = false;
                return;
            }
            this.trustedCompletionAttempt = attemptId;
            this.phase = 'SETTLING';
            this.changed();
            await this.settle(attemptId);
            this.busy = false;
        }
        catch (error) {
            if (this.host === owner && generation === this.hostGeneration) {
                this.phase = 'ERROR';
                this.retrySettle = !!this.pendingAttempt && this.trustedCompletionAttempt === this.pendingAttempt;
                this.message = '广告流程暂时未完成；存档保持待确认状态，可重试或返回游戏。';
                this.changed();
            }
        }
        finally {
            if (this.phase !== 'SHOWING')
                this.busy = false;
            RewardedAdCoordinator_1.RewardedAdCoordinator.release('extra-shake');
        }
    }
    async retrySettlement() {
        if (!this.host || this.busy || !this.pendingAttempt || this.trustedCompletionAttempt !== this.pendingAttempt)
            return;
        this.busy = true;
        this.phase = 'SETTLING';
        this.message = null;
        this.changed();
        try {
            await this.settle(this.pendingAttempt);
        }
        catch {
            this.phase = 'ERROR';
            this.retrySettle = true;
            this.message = '奖励保存仍未完成，可稍后重试。';
            this.changed();
        }
        finally {
            this.busy = false;
        }
    }
    async abandonPending() {
        if (!this.host || this.busy)
            return;
        this.busy = true;
        const cleared = await this.clearPending('已放弃未确认的广告奖励。');
        if (!cleared) {
            this.busy = false;
            this.phase = 'ERROR';
            this.message = '放弃操作未能保存，请重试。';
            this.changed();
            return;
        }
        this.stalePending = false;
        this.pendingAttempt = null;
        this.trustedCompletionAttempt = null;
        this.retrySettle = false;
        this.phase = 'IDLE';
        this.busy = false;
        this.changed();
        this.host.resumeFromRewardedAd('已放弃未确认的广告奖励。');
    }
    acknowledgeGrant() {
        if (!this.host || this.phase !== 'GRANTED')
            return;
        this.phase = 'IDLE';
        this.message = null;
        this.changed();
        this.host.resumeFromRewardedAd(null);
    }
    check() {
        var _a, _b, _c, _d, _e, _f;
        const bundle = (_b = (_a = this.host) === null || _a === void 0 ? void 0 : _a.getBundle()) !== null && _b !== void 0 ? _b : null;
        const run = (_d = (_c = this.host) === null || _c === void 0 ? void 0 : _c.getActiveRunSnapshot()) !== null && _d !== void 0 ? _d : null;
        if (!bundle || !run)
            return { allowed: false, block: 'NO_ACTIVE_RUN' };
        return RewardLedger_1.RewardLedger.checkOffer({
            policy: this.env.policy, capability: this.env.provider.capability(), profile: bundle.profile, run,
            foregroundSeconds: this.foregroundSeconds, tutorialComplete: (_f = (_e = this.host) === null || _e === void 0 ? void 0 : _e.isTutorialComplete()) !== null && _f !== void 0 ? _f : false, nowMs: this.now(),
        });
    }
    async clearPending(message) {
        const owner = this.host, generation = this.hostGeneration;
        if (!owner)
            return false;
        const bundle = owner.getBundle();
        if (bundle) {
            const next = copy(bundle);
            next.profile.rewardedShake = RewardLedger_1.RewardLedger.clearPending(next.profile.rewardedShake);
            const committed = await this.repo.commitBundle(owner.getSaveRevision(), bundle.profile.activeRunId, next);
            if (this.host !== owner || generation !== this.hostGeneration || !committed.ok)
                return false;
            owner.onRewardedShakeCommitted(next, committed.data.revision);
        }
        this.pendingAttempt = null;
        this.phase = 'ERROR';
        this.retrySettle = false;
        this.message = message;
        this.changed();
        this.trustedCompletionAttempt = null;
        owner.resumeFromRewardedAd(message);
        return true;
    }
    async settle(attemptId) {
        var _a, _b, _c, _d;
        const owner = this.host, generation = this.hostGeneration;
        if (!owner)
            return;
        let bundle = owner.getBundle();
        const run = owner.getActiveRunSnapshot();
        if (!bundle || !run)
            return;
        await owner.waitForSaveIdle();
        if (this.host !== owner || generation !== this.hostGeneration || ((_a = owner.getActiveRunSnapshot()) === null || _a === void 0 ? void 0 : _a.runId) !== run.runId)
            return;
        bundle = owner.getBundle();
        if (!bundle)
            return;
        const ledger = bundle.profile.rewardedShake;
        if (RewardLedger_1.RewardLedger.hasReceipt(ledger, attemptId)) {
            // Crash after commit before applying to the live engine: repair the in-memory grant once.
            const receipt = ledger.receipts.find(item => item.attemptId === attemptId);
            const persisted = bundle.run;
            if (!receipt || receipt.runId !== run.runId || !persisted || persisted.runId !== run.runId || persisted.shake.extraGranted < run.shake.extraGranted) {
                this.phase = 'ERROR';
                this.retrySettle = false;
                this.message = '奖励凭证与当前局不匹配，未应用。';
                this.changed();
                return;
            }
            if (persisted.shake.extraGranted > run.shake.extraGranted)
                owner.applyCommittedExtraGrant();
            this.phase = 'GRANTED';
            this.message = null;
            this.retrySettle = false;
            this.pendingAttempt = null;
            this.changed();
            return;
        }
        if (((_b = ledger.pendingAttempt) === null || _b === void 0 ? void 0 : _b.attemptId) !== attemptId || ledger.pendingAttempt.runId !== run.runId) {
            this.phase = 'ERROR';
            this.retrySettle = false;
            this.message = '找不到本局待确认的广告奖励记录，未发放。';
            this.changed();
            return;
        }
        if (run.shake.extraGranted + 1 > this.env.policy.maxExtraShakesPerRun) {
            this.phase = 'ERROR';
            this.retrySettle = false;
            this.message = '本局奖励晃杯已达上限，未发放。';
            this.changed();
            return;
        }
        const pending = ledger.pendingAttempt;
        const sameDay = RewardLedger_1.RewardLedger.normalize(ledger, pending.dayKey);
        if (this.env.policy.maxDailyRewardedShakes - sameDay.dailyGranted < 1) {
            this.phase = 'ERROR';
            this.retrySettle = false;
            this.message = '今日广告奖励已达上限，未发放。';
            this.changed();
            return;
        }
        const nextLedger = RewardLedger_1.RewardLedger.grant(ledger, RewardLedger_1.RewardLedger.receiptFor(pending, this.now()), run.runId);
        const projectedRun = copy(run);
        projectedRun.shake = { ...projectedRun.shake, extraGranted: projectedRun.shake.extraGranted + 1, extraUsed: projectedRun.shake.extraUsed };
        projectedRun.revision += 1;
        const next = copy(bundle);
        next.profile.rewardedShake = nextLedger;
        next.run = projectedRun;
        const committed = await this.repo.commitBundle(owner.getSaveRevision(), run.runId, next);
        if (this.host !== owner || generation !== this.hostGeneration || ((_c = owner.getActiveRunSnapshot()) === null || _c === void 0 ? void 0 : _c.runId) !== run.runId)
            return;
        if (!committed.ok) {
            this.phase = 'ERROR';
            this.retrySettle = true;
            this.message = '广告已完成，但奖励保存失败；请在稍后重试领取。';
            this.changed();
            return;
        }
        const readback = await this.repo.readBundle();
        if (this.host !== owner || generation !== this.hostGeneration)
            return;
        if (!readback.ok || !readback.data.envelope || !RewardLedger_1.RewardLedger.hasReceipt(readback.data.envelope.payload.profile.rewardedShake, attemptId)) {
            this.phase = 'ERROR';
            this.retrySettle = true;
            this.message = '奖励已提交但回读未确认，可重试领取。';
            this.changed();
            return;
        }
        const persistedBundle = readback.data.envelope.payload;
        if (((_d = persistedBundle.run) === null || _d === void 0 ? void 0 : _d.runId) !== run.runId || persistedBundle.run.shake.extraGranted < run.shake.extraGranted + 1) {
            this.phase = 'ERROR';
            this.retrySettle = true;
            this.message = '奖励账本与本局额度未能一致回读，可重试领取。';
            this.changed();
            return;
        }
        owner.onRewardedShakeCommitted(persistedBundle, committed.data.revision);
        owner.applyCommittedExtraGrant();
        this.pendingAttempt = null;
        this.stalePending = false;
        this.phase = 'GRANTED';
        this.message = null;
        this.retrySettle = false;
        this.changed();
    }
    changed() { var _a; (_a = this.host) === null || _a === void 0 ? void 0 : _a.onRewardedShakeChanged(); }
    blockMessage(block) {
        switch (block) {
            case 'POLICY_DISABLED': return '广告奖励尚未开启';
            case 'AD_UNCONFIGURED': return '未配置真实广告位';
            case 'AD_UNSUPPORTED': return '当前环境不支持激励广告';
            case 'NO_ACTIVE_RUN':
            case 'NOT_PLAYING': return '当前局不可用';
            case 'BASE_SHAKES_REMAINING': return '还有基础晃杯次数';
            case 'RUN_LIMIT': return '本局奖励晃杯已达上限';
            case 'DAILY_LIMIT': return '今日广告奖励已达上限';
            case 'TUTORIAL_REQUIRED': return '完成教程后可观看广告';
            case 'FIRST_RUN_REQUIRED': return '完成一局真实游戏后可观看广告';
            case 'FOREGROUND_REQUIRED': return '游戏时间稍短，暂不可观看广告';
            case 'PENDING_ATTEMPT': return '有未确认的广告奖励';
            default: return '暂不可观看广告';
        }
    }
}
exports.RewardedShakeService = RewardedShakeService;

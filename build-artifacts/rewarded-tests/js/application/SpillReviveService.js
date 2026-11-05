"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpillReviveService = void 0;
const ReviveLedger_1 = require("../persistence/ReviveLedger");
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
 * Once-per-run spill revive. The pending attempt is durable before the ad is shown, and the receipt plus
 * the cleaned run snapshot are committed atomically before the live engine is revived.
 */
class SpillReviveService {
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
        this.trustedCompletionAttempt = null;
        this.foregroundSeconds = 0;
        this.host = null;
        this.boundRunId = null;
        this.hostGeneration = 0;
        this.attemptIdentity = null;
    }
    static create(env, repo, now = () => Date.now()) {
        const service = new SpillReviveService(env, repo, now);
        const scope = globalThis;
        if (scope.__milkteaSpillRevive) {
            service.env.provider.dispose();
            return scope.__milkteaSpillRevive;
        }
        scope.__milkteaSpillRevive = service;
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
        const ledger = (_c = host.getBundle()) === null || _c === void 0 ? void 0 : _c.profile.rewardedRevive;
        const run = host.getActiveRunSnapshot();
        this.stalePending = !!((ledger === null || ledger === void 0 ? void 0 : ledger.pendingAttempt) && run && ledger.pendingAttempt.runId === run.runId);
        if (!this.busy) {
            this.phase = 'IDLE';
            this.message = this.stalePending ? '上次复活广告未得到可信完成确认，未发放。' : null;
            this.retrySettle = false;
        }
    }
    unbind(host) { if (this.host === host)
        this.host = null; }
    setForegroundSeconds(seconds) { this.foregroundSeconds = Math.max(0, seconds); }
    dispose() { this.env.provider.dispose(); }
    getView() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const bundle = (_b = (_a = this.host) === null || _a === void 0 ? void 0 : _a.getBundle()) !== null && _b !== void 0 ? _b : null;
        const run = (_d = (_c = this.host) === null || _c === void 0 ? void 0 : _c.getActiveRunSnapshot()) !== null && _d !== void 0 ? _d : null;
        const check = bundle
            ? ReviveLedger_1.ReviveLedger.checkOffer({
                policy: this.env.policy, capability: this.env.provider.capability(), profile: bundle.profile, run,
                foregroundSeconds: this.foregroundSeconds, tutorialComplete: (_f = (_e = this.host) === null || _e === void 0 ? void 0 : _e.isTutorialComplete()) !== null && _f !== void 0 ? _f : false, nowMs: this.now(),
            })
            : { allowed: false, block: 'NO_ACTIVE_RUN' };
        const ledger = (_g = bundle === null || bundle === void 0 ? void 0 : bundle.profile.rewardedRevive) !== null && _g !== void 0 ? _g : ReviveLedger_1.ReviveLedger.EMPTY;
        return {
            phase: this.phase, block: this.stalePending ? 'PENDING_ATTEMPT' : check.block, message: this.message, retrySettle: this.retrySettle,
            capability: this.env.provider.capability(), providerName: this.env.provider.providerName,
            usedThisRun: (_h = run === null || run === void 0 ? void 0 : run.revive.used) !== null && _h !== void 0 ? _h : 0,
            pendingAttempt: this.stalePending || !!(ledger.pendingAttempt && run && ledger.pendingAttempt.runId === run.runId),
            simulated: this.env.provider.providerName !== 'tap', blockingRunId: this.stalePending ? (_j = run === null || run === void 0 ? void 0 : run.runId) !== null && _j !== void 0 ? _j : null : null,
        };
    }
    canOffer() { const view = this.getView(); return view.phase === 'IDLE' && view.block === null; }
    /** Same host/generation and the bound run is still the one this attempt was recorded for. */
    stillOwns(ctx) {
        var _a;
        return this.host === ctx.owner && this.hostGeneration === ctx.generation && ((_a = this.host.getActiveRunSnapshot()) === null || _a === void 0 ? void 0 : _a.runId) === ctx.runId;
    }
    /** After a clear/error, allow the same run to re-watch once more (no daily cap). Guarded by engine/policy checks. */
    retryWatch() {
        if (!this.host || this.busy || this.phase !== 'ERROR' || this.retrySettle || this.stalePending || this.pendingAttempt)
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
    /** Close the offer and settle the frozen run as a normal SPILLED result. */
    closeOffer() {
        if (!this.host || this.phase !== 'OFFER' && this.phase !== 'ERROR')
            return;
        this.phase = 'IDLE';
        this.message = null;
        this.retrySettle = false;
        this.host.declineSpillRevive();
        this.changed();
    }
    async watch() {
        var _a, _b;
        if (!this.host || this.phase !== 'OFFER' || this.busy)
            return;
        const check = this.check();
        if (!check.allowed) {
            this.message = this.blockMessage(check.block);
            this.changed();
            return;
        }
        if (!RewardedAdCoordinator_1.RewardedAdCoordinator.claim('spill-revive')) {
            this.message = '另有广告正在进行，请稍后再试。';
            this.phase = 'ERROR';
            this.changed();
            return;
        }
        const owner = this.host, generation = this.hostGeneration;
        this.busy = true;
        this.phase = 'PREPARING';
        this.message = null;
        this.changed();
        try {
            await this.host.waitForSaveIdle();
            if (this.host !== owner || generation !== this.hostGeneration)
                throw new Error('REVIVE_ATTEMPT_OWNER_CHANGED');
            let bundle = owner.getBundle();
            let run = owner.getActiveRunSnapshot();
            if (!bundle || !(run === null || run === void 0 ? void 0 : run.revive.pendingFailure))
                throw new Error('REVIVE_ATTEMPT_RUN_MISSING');
            if (this.env.provider.capability() !== 'SUPPORTED')
                throw new Error('REVIVE_AD_UNSUPPORTED');
            const attemptId = makeUuid();
            const dayKey = ReviveLedger_1.ReviveLedger.dayKey(this.now());
            const pending = { attemptId, runId: run.runId, failureId: run.revive.pendingFailure.failureId, policyVersion: this.env.policy.policyVersion, amount: 1, dayKey, startedAt: this.now() };
            const frozen = copy(bundle);
            frozen.run = copy(run);
            frozen.profile.rewardedRevive = { ...ReviveLedger_1.ReviveLedger.normalize(frozen.profile.rewardedRevive, dayKey), pendingAttempt: pending };
            const pendingCommit = await this.repo.commitBundle(owner.getSaveRevision(), (_b = (_a = owner.getBundle()) === null || _a === void 0 ? void 0 : _a.profile.activeRunId) !== null && _b !== void 0 ? _b : run.runId, frozen);
            if (this.host !== owner || generation !== this.hostGeneration)
                throw new Error('REVIVE_ATTEMPT_OWNER_CHANGED');
            if (!pendingCommit.ok) {
                this.busy = false;
                this.phase = 'ERROR';
                this.message = '无法写入待确认的复活记录，广告未展示。';
                this.changed();
                return;
            }
            owner.onSpillReviveCommitted(frozen, pendingCommit.data.revision);
            this.pendingAttempt = attemptId;
            this.trustedCompletionAttempt = null;
            this.attemptIdentity = { owner, generation, runId: run.runId, failureId: run.revive.pendingFailure.failureId, attemptId };
            const prepared = await this.env.provider.prepare();
            if (this.host !== owner || generation !== this.hostGeneration)
                throw new Error('REVIVE_ATTEMPT_OWNER_CHANGED');
            if (!prepared.ok) {
                if (!await this.clearPending('复活广告暂时无法加载，未发放奖励。'))
                    throw new Error('REVIVE_PENDING_CLEAR_FAILED');
                this.busy = false;
                return;
            }
            this.phase = 'SHOWING';
            this.changed();
            const outcome = await this.env.provider.show(attemptId);
            if (this.host !== owner || generation !== this.hostGeneration) {
                this.busy = false;
                return;
            }
            if (outcome.kind !== 'COMPLETED') {
                if (!await this.clearPending(outcome.kind === 'CANCELLED' ? '观看未完成，未发放复活。' : '广告播放失败，未发放复活。'))
                    throw new Error('REVIVE_PENDING_CLEAR_FAILED');
                this.busy = false;
                return;
            }
            this.trustedCompletionAttempt = attemptId;
            this.phase = 'SETTLING';
            this.changed();
            await this.settle(attemptId);
            this.busy = false;
        }
        catch {
            if (this.host === owner && generation === this.hostGeneration) {
                this.phase = 'ERROR';
                this.retrySettle = !!this.pendingAttempt && this.trustedCompletionAttempt === this.pendingAttempt;
                this.message = '复活广告流程暂时未完成；存档保持待确认状态，可重试或放弃。';
                this.changed();
            }
        }
        finally {
            if (this.phase !== 'SHOWING')
                this.busy = false;
            RewardedAdCoordinator_1.RewardedAdCoordinator.release('spill-revive');
        }
    }
    /**
     * Retry settlement after an earlier readback or application failure.
     * R2 整改：先读最新完整信封，验证 receipt/runId/failureId/attemptId 身份。
     * 如果凭证已落盘（used1 + 同 attemptId receipt），同步宿主 revision 后直接 apply，
     * 不再重新走 settle 的 CAS 流程（避免冲突和二次发奖）。
     * 没有凭证时才用最新宿主 revision 重试 CAS。
     */
    async retrySettlement() {
        var _a;
        const ctx = this.attemptIdentity;
        if (!this.host || this.busy || !ctx || this.trustedCompletionAttempt !== ctx.attemptId)
            return;
        this.busy = true;
        this.phase = 'SETTLING';
        this.message = null;
        this.changed();
        try {
            const fresh = await this.repo.readBundle();
            if (!this.stillOwns(ctx))
                return;
            if (!fresh.ok || !fresh.data.envelope) {
                this.phase = 'ERROR';
                this.retrySettle = true;
                this.message = '无法读取最新存档，可稍后重试领取。';
                this.changed();
                return;
            }
            const envelope = fresh.data.envelope, freshBundle = envelope.payload;
            const ledger = freshBundle.profile.rewardedRevive, committedRun = freshBundle.run;
            if (ReviveLedger_1.ReviveLedger.hasReceipt(ledger, ctx.attemptId)) {
                const receipt = ledger.receipts.find((r) => r.attemptId === ctx.attemptId);
                // Strict identity check: same attempt/run/failure and the run was already granted (used=1).
                const validReceipt = !!receipt && receipt.runId === ctx.runId && receipt.failureId === ctx.failureId
                    && receipt.rewardKind === 'spill_revive' && receipt.amount === 1;
                const validRun = !!committedRun && committedRun.runId === ctx.runId && committedRun.revive.used === 1
                    && committedRun.revive.committedReceiptId === ctx.attemptId;
                if (!validReceipt || !validRun) {
                    this.phase = 'ERROR';
                    this.retrySettle = false;
                    this.message = '复活凭证与当前局不匹配，未应用。';
                    this.changed();
                    return;
                }
                ctx.owner.onSpillReviveCommitted(freshBundle, envelope.revision);
                if (!this.stillOwns(ctx))
                    return;
                if (ctx.owner.applyCommittedRevive(ctx.attemptId)) {
                    this.pendingAttempt = null;
                    this.stalePending = false;
                    this.attemptIdentity = null;
                    this.phase = 'GRANTED';
                    this.message = null;
                    this.retrySettle = false;
                    this.changed();
                    return;
                }
                this.phase = 'ERROR';
                this.retrySettle = true;
                this.message = '复活凭证已保存但应用失败，可稍后重试领取。';
                this.changed();
                return;
            }
            // No receipt yet: only retry CAS when the pending attempt still belongs to this same run/failure.
            const pending = ledger.pendingAttempt;
            const activeRun = this.host.getActiveRunSnapshot();
            if (!pending || pending.attemptId !== ctx.attemptId || pending.runId !== ctx.runId || pending.failureId !== ctx.failureId
                || !activeRun || activeRun.runId !== ctx.runId || activeRun.revive.used !== 0
                || ((_a = activeRun.revive.pendingFailure) === null || _a === void 0 ? void 0 : _a.failureId) !== ctx.failureId) {
                this.phase = 'ERROR';
                this.retrySettle = false;
                this.message = '找不到本局待确认的复活记录，未发放。';
                this.changed();
                return;
            }
            // Sync the verified envelope+revision (read fresh) before applying the receipt, so the live engine sees the same revision base.
            ctx.owner.onSpillReviveCommitted(freshBundle, envelope.revision);
            if (!this.stillOwns(ctx))
                return;
            await this.settle(ctx.attemptId);
        }
        catch {
            if (this.stillOwns(ctx)) {
                this.phase = 'ERROR';
                this.retrySettle = true;
                this.message = '复活保存仍未完成，可稍后重试。';
                this.changed();
            }
        }
        finally {
            this.busy = false;
        }
    }
    async abandonPending() {
        if (!this.host || this.busy)
            return;
        this.busy = true;
        const cleared = await this.clearPending('已放弃未确认的复活奖励。', false);
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
        this.attemptIdentity = null;
        this.retrySettle = false;
        this.busy = false;
        this.host.declineSpillRevive();
        this.changed();
    }
    acknowledgeGrant() {
        if (!this.host || this.phase !== 'GRANTED')
            return;
        this.phase = 'IDLE';
        this.message = null;
        this.changed();
        this.host.resumeFromRewardedAd('本局已复活，点击继续。');
    }
    check() {
        var _a, _b, _c, _d, _e, _f;
        const bundle = (_b = (_a = this.host) === null || _a === void 0 ? void 0 : _a.getBundle()) !== null && _b !== void 0 ? _b : null;
        const run = (_d = (_c = this.host) === null || _c === void 0 ? void 0 : _c.getActiveRunSnapshot()) !== null && _d !== void 0 ? _d : null;
        if (!bundle || !run)
            return { allowed: false, block: 'NO_ACTIVE_RUN' };
        return ReviveLedger_1.ReviveLedger.checkOffer({ policy: this.env.policy, capability: this.env.provider.capability(), profile: bundle.profile, run,
            foregroundSeconds: this.foregroundSeconds, tutorialComplete: (_f = (_e = this.host) === null || _e === void 0 ? void 0 : _e.isTutorialComplete()) !== null && _f !== void 0 ? _f : false, nowMs: this.now() });
    }
    /**
     * Clear the pending attempt record after an ad load/show failure, cancellation, or incomplete watch.
     * By default does NOT call declineSpillRevive — the pendingFailure stays frozen so the player can manually
     * retry or explicitly end (R3 整改). Only abandonPending() passes resume=false and then calls decline itself.
     */
    async clearPending(message, resume = false) {
        const owner = this.host, generation = this.hostGeneration;
        if (!owner)
            return false;
        const bundle = owner.getBundle();
        if (bundle) {
            const next = copy(bundle);
            next.profile.rewardedRevive = ReviveLedger_1.ReviveLedger.clearPending(next.profile.rewardedRevive);
            const committed = await this.repo.commitBundle(owner.getSaveRevision(), bundle.profile.activeRunId, next);
            if (this.host !== owner || generation !== this.hostGeneration || !committed.ok)
                return false;
            owner.onSpillReviveCommitted(next, committed.data.revision);
        }
        this.pendingAttempt = null;
        this.phase = 'ERROR';
        this.retrySettle = false;
        this.message = message;
        this.changed();
        this.trustedCompletionAttempt = null;
        this.attemptIdentity = null;
        // R3 整改：默认保留 pendingFailure，不提前 SETTLING。
        // owner.declineSpillRevive() 由 closeOffer() 或 abandonPending() 显式调用。
        if (resume) {
            owner.declineSpillRevive();
        }
        return true;
    }
    async settle(attemptId) {
        var _a, _b, _c, _d, _e;
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
        const ledger = bundle.profile.rewardedRevive;
        if (ReviveLedger_1.ReviveLedger.hasReceipt(ledger, attemptId)) {
            const receipt = ledger.receipts.find((item) => item.attemptId === attemptId);
            const persisted = bundle.run;
            if (!receipt || receipt.runId !== run.runId || receipt.failureId !== ((_b = run.revive.pendingFailure) === null || _b === void 0 ? void 0 : _b.failureId)
                || receipt.rewardKind !== 'spill_revive' || receipt.amount !== 1
                || !persisted || persisted.runId !== run.runId || persisted.revive.used !== 1 || persisted.revive.committedReceiptId !== attemptId) {
                this.phase = 'ERROR';
                this.retrySettle = false;
                this.message = '复活凭证与当前局不匹配，未应用。';
                this.changed();
                return;
            }
            owner.onSpillReviveCommitted(bundle, owner.getSaveRevision());
            if (this.host !== owner || generation !== this.hostGeneration)
                return;
            if (!owner.applyCommittedRevive(attemptId)) {
                this.phase = 'ERROR';
                this.retrySettle = false;
                this.message = '复活凭证无法应用到当前局，请返回结算。';
                this.changed();
                return;
            }
            this.phase = 'GRANTED';
            this.message = null;
            this.retrySettle = false;
            this.pendingAttempt = null;
            this.attemptIdentity = null;
            this.changed();
            return;
        }
        if (((_c = ledger.pendingAttempt) === null || _c === void 0 ? void 0 : _c.attemptId) !== attemptId || ledger.pendingAttempt.runId !== run.runId) {
            this.phase = 'ERROR';
            this.retrySettle = false;
            this.message = '找不到本局待确认的复活记录，未发放。';
            this.changed();
            return;
        }
        if (run.revive.used !== 0 || !run.revive.pendingFailure) {
            this.phase = 'ERROR';
            this.retrySettle = false;
            this.message = '本局已不满足复活条件，未发放。';
            this.changed();
            return;
        }
        const pending = ledger.pendingAttempt;
        // 每日上限阻断未经用户授权，已移除（R4 整改）。保留 maxDailyRevives 字段用于审计，不参与阻断。
        // const sameDay = ReviveLedger.normalize(ledger, pending.dayKey);
        // if (this.env.policy.maxDailyRevives - ReviveLedger.grantedForDay(sameDay, pending.dayKey) < 1) {
        //   this.phase = 'ERROR'; this.retrySettle = false; this.message = '今日复活次数已达上限，未发放。'; this.changed(); return;
        // }
        const projected = owner.projectRevive(attemptId);
        if (!projected.ok) {
            this.phase = 'ERROR';
            this.retrySettle = false;
            this.message = projected.error.message;
            this.changed();
            return;
        }
        const nextLedger = ReviveLedger_1.ReviveLedger.grant(ledger, ReviveLedger_1.ReviveLedger.receiptFor(pending, this.now()), run.runId);
        const next = copy(bundle);
        next.profile.rewardedRevive = nextLedger;
        next.run = projected.data;
        const committed = await this.repo.commitBundle(owner.getSaveRevision(), run.runId, next);
        if (this.host !== owner || generation !== this.hostGeneration || ((_d = owner.getActiveRunSnapshot()) === null || _d === void 0 ? void 0 : _d.runId) !== run.runId)
            return;
        if (!committed.ok) {
            this.phase = 'ERROR';
            this.retrySettle = true;
            this.message = '广告已完成，但复活存档保存失败；请稍后重试领取。';
            this.changed();
            return;
        }
        // R2 整改：commit 成功 → 先同步宿主 revision，保证 retry 起点正确。
        // readback 只是二次校验，不应阻塞 revision 更新。
        owner.onSpillReviveCommitted(next, committed.data.revision);
        const readback = await this.repo.readBundle();
        if (this.host !== owner || generation !== this.hostGeneration)
            return;
        if (!readback.ok || !readback.data.envelope) {
            this.phase = 'ERROR';
            this.retrySettle = true;
            this.message = '复活存档回读失败，可重试领取。';
            this.changed();
            return;
        }
        const persistedBundle = readback.data.envelope.payload;
        if (!ReviveLedger_1.ReviveLedger.hasReceipt(persistedBundle.profile.rewardedRevive, attemptId) || ((_e = persistedBundle.run) === null || _e === void 0 ? void 0 : _e.runId) !== run.runId
            || persistedBundle.run.revive.used !== 1 || persistedBundle.run.revive.committedReceiptId !== attemptId) {
            this.phase = 'ERROR';
            this.retrySettle = true;
            this.message = '复活账本与本局状态未能一致回读，可重试领取。';
            this.changed();
            return;
        }
        owner.onSpillReviveCommitted(persistedBundle, readback.data.envelope.revision);
        if (!owner.applyCommittedRevive(attemptId)) {
            this.phase = 'ERROR';
            this.retrySettle = true;
            this.message = '复活已保存，但应用失败，可重试领取。';
            this.changed();
            return;
        }
        this.pendingAttempt = null;
        this.stalePending = false;
        this.attemptIdentity = null;
        this.phase = 'GRANTED';
        this.message = null;
        this.retrySettle = false;
        this.changed();
    }
    changed() { var _a; (_a = this.host) === null || _a === void 0 ? void 0 : _a.onSpillReviveChanged(); }
    blockMessage(block) {
        switch (block) {
            case 'POLICY_DISABLED': return '洒出复活广告尚未开启';
            case 'AD_UNCONFIGURED': return '未配置真实复活广告位';
            case 'AD_UNSUPPORTED': return '当前环境不支持激励广告';
            case 'NO_ACTIVE_RUN':
            case 'NOT_SPILL_PENDING': return '当前没有可复活的洒出局';
            case 'RUN_LIMIT': return '本局已使用过复活';
            case 'TUTORIAL_REQUIRED': return '完成教程后可观看复活广告';
            case 'FIRST_RUN_REQUIRED': return '完成一局真实游戏后可观看复活广告';
            case 'FOREGROUND_REQUIRED': return '游戏时间稍短，暂不可观看复活广告';
            case 'PENDING_ATTEMPT': return '有未确认的复活奖励';
            default: return '暂不可复活';
        }
    }
}
exports.SpillReviveService = SpillReviveService;

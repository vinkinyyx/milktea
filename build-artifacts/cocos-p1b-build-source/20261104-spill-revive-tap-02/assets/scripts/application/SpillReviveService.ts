import type { IBundleSaveRepository, LocalSaveBundle, Result, RewardedAdCapability, RewardedRevivePending, RunSnapshot, SpillRevivePolicy, UUID } from '../contracts/types';
import { ReviveLedger, type ReviveOfferBlock } from '../persistence/ReviveLedger';
import type { ReviveAdEnvironment } from '../platform/RewardedAdProviderFactory';
import { RewardedAdCoordinator } from './RewardedAdCoordinator';

export type SpillRevivePhase = 'IDLE' | 'OFFER' | 'PREPARING' | 'SHOWING' | 'SETTLING' | 'GRANTED' | 'ERROR';
export interface SpillReviveView {
  phase: SpillRevivePhase; block: ReviveOfferBlock | null; message: string | null; retrySettle: boolean;
  capability: RewardedAdCapability; providerName: string; usedThisRun: 0 | 1; dailyRemaining: number;
  pendingAttempt: boolean; simulated: boolean; blockingRunId: string | null;
}
export interface SpillReviveHost {
  getActiveRunSnapshot(): RunSnapshot | null;
  getBundle(): LocalSaveBundle | null;
  getSaveRevision(): number;
  isTutorialComplete(): boolean;
  getForegroundSeconds(): number;
  pauseForRewardedAd(): void;
  resumeFromRewardedAd(notice: string | null): void;
  onSpillReviveChanged(): void;
  onSpillReviveCommitted(bundle: LocalSaveBundle, revision: number): void;
  /** Deterministic cleaned snapshot that must be persisted together with the receipt before the engine mutates. */
  projectRevive(receiptId: string): Result<RunSnapshot>;
  /** Apply the committed receipt to the live engine. Returns false when the run cannot be repaired. */
  applyCommittedRevive(receiptId: string): boolean;
  /** Player declined or the video did not complete; settle the frozen spill normally. */
  declineSpillRevive(): void;
  waitForSaveIdle(): Promise<void>;
}

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
function makeUuid(): string {
  const cryptoApi = (globalThis as unknown as { crypto?: { randomUUID?(): string; getRandomValues?(array: Uint8Array): Uint8Array } }).crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  const bytes = new Uint8Array(16);
  if (cryptoApi?.getRandomValues) cryptoApi.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Once-per-run spill revive. The pending attempt is durable before the ad is shown, and the receipt plus
 * the cleaned run snapshot are committed atomically before the live engine is revived.
 */
export class SpillReviveService {
  private phase: SpillRevivePhase = 'IDLE';
  private message: string | null = null;
  private retrySettle = false;
  private busy = false;
  private stalePending = false;
  private pendingAttempt: UUID | null = null;
  private trustedCompletionAttempt: UUID | null = null;
  private foregroundSeconds = 0;
  private host: SpillReviveHost | null = null;
  private boundRunId: string | null = null;
  private hostGeneration = 0;
  private constructor(private readonly env: ReviveAdEnvironment, private readonly repo: IBundleSaveRepository, private readonly now: () => number) {}
  static create(env: ReviveAdEnvironment, repo: IBundleSaveRepository, now: () => number = () => Date.now()): SpillReviveService {
    const service = new SpillReviveService(env, repo, now);
    const scope = globalThis as unknown as { __milkteaSpillRevive?: SpillReviveService };
    if (scope.__milkteaSpillRevive) { service.env.provider.dispose(); return scope.__milkteaSpillRevive; }
    scope.__milkteaSpillRevive = service;
    return service;
  }
  get policy(): Readonly<SpillRevivePolicy> { return this.env.policy; }
  bind(host: SpillReviveHost): void {
    const nextRun = host.getActiveRunSnapshot()?.runId ?? null;
    if (this.host !== host || this.boundRunId !== nextRun) { this.hostGeneration++; this.boundRunId = nextRun; }
    this.host = host;
    const ledger = host.getBundle()?.profile.rewardedRevive;
    const run = host.getActiveRunSnapshot();
    this.stalePending = !!(ledger?.pendingAttempt && run && ledger.pendingAttempt.runId === run.runId);
    if (!this.busy) { this.phase = 'IDLE'; this.message = this.stalePending ? '上次复活广告未得到可信完成确认，未发放。' : null; this.retrySettle = false; }
  }
  unbind(host: SpillReviveHost): void { if (this.host === host) this.host = null; }
  setForegroundSeconds(seconds: number): void { this.foregroundSeconds = Math.max(0, seconds); }
  dispose(): void { this.env.provider.dispose(); }
  getView(): SpillReviveView {
    const bundle = this.host?.getBundle() ?? null;
    const run = this.host?.getActiveRunSnapshot() ?? null;
    const check = bundle
      ? ReviveLedger.checkOffer({
          policy: this.env.policy, capability: this.env.provider.capability(), profile: bundle.profile, run,
          foregroundSeconds: this.foregroundSeconds, tutorialComplete: this.host?.isTutorialComplete() ?? false, nowMs: this.now(),
        })
      : { allowed: false, block: 'NO_ACTIVE_RUN' as ReviveOfferBlock };
    const ledger = bundle?.profile.rewardedRevive ?? ReviveLedger.EMPTY;
    return {
      phase: this.phase, block: this.stalePending ? 'PENDING_ATTEMPT' : check.block, message: this.message, retrySettle: this.retrySettle,
      capability: this.env.provider.capability(), providerName: this.env.provider.providerName,
      usedThisRun: run?.revive.used ?? 0, dailyRemaining: ReviveLedger.dailyRemaining(ledger, this.env.policy, ReviveLedger.dayKey(this.now())),
      pendingAttempt: this.stalePending || !!(ledger.pendingAttempt && run && ledger.pendingAttempt.runId === run.runId),
      simulated: this.env.provider.providerName !== 'tap', blockingRunId: this.stalePending ? run?.runId ?? null : null,
    };
  }
  canOffer(): boolean { const view = this.getView(); return view.phase === 'IDLE' && view.block === null; }
  openOffer(): void {
    if (!this.host || this.busy) return;
    const check = this.check();
    if (!check.allowed) { this.message = this.blockMessage(check.block); this.changed(); return; }
    this.phase = 'OFFER'; this.message = null; this.retrySettle = false;
    this.host.pauseForRewardedAd(); this.changed();
  }
  /** Close the offer and settle the frozen run as a normal SPILLED result. */
  closeOffer(): void {
    if (!this.host || this.phase !== 'OFFER' && this.phase !== 'ERROR') return;
    this.phase = 'IDLE'; this.message = null; this.retrySettle = false;
    this.host.declineSpillRevive(); this.changed();
  }
  async watch(): Promise<void> {
    if (!this.host || this.phase !== 'OFFER' || this.busy) return;
    const check = this.check();
    if (!check.allowed) { this.message = this.blockMessage(check.block); this.changed(); return; }
    if (!RewardedAdCoordinator.claim('spill-revive')) { this.message = '另有广告正在进行，请稍后再试。'; this.phase = 'ERROR'; this.changed(); return; }
    const owner = this.host, generation = this.hostGeneration;
    this.busy = true; this.phase = 'PREPARING'; this.message = null; this.changed();
    try {
      await this.host.waitForSaveIdle();
      if (this.host !== owner || generation !== this.hostGeneration) throw new Error('REVIVE_ATTEMPT_OWNER_CHANGED');
      let bundle = owner.getBundle(); let run = owner.getActiveRunSnapshot();
      if (!bundle || !run?.revive.pendingFailure) throw new Error('REVIVE_ATTEMPT_RUN_MISSING');
      if (this.env.provider.capability() !== 'SUPPORTED') throw new Error('REVIVE_AD_UNSUPPORTED');
      const attemptId = makeUuid() as UUID;
      const dayKey = ReviveLedger.dayKey(this.now());
      const pending: RewardedRevivePending = { attemptId, runId: run.runId, failureId: run.revive.pendingFailure.failureId, policyVersion: this.env.policy.policyVersion, amount: 1, dayKey, startedAt: this.now() };
      const frozen = copy(bundle);
      frozen.run = copy(run);
      frozen.profile.rewardedRevive = { ...ReviveLedger.normalize(frozen.profile.rewardedRevive, dayKey), pendingAttempt: pending };
      const pendingCommit = await this.repo.commitBundle(owner.getSaveRevision(), owner.getBundle()?.profile.activeRunId ?? run.runId, frozen);
      if (this.host !== owner || generation !== this.hostGeneration) throw new Error('REVIVE_ATTEMPT_OWNER_CHANGED');
      if (!pendingCommit.ok) { this.busy = false; this.phase = 'ERROR'; this.message = '无法写入待确认的复活记录，广告未展示。'; this.changed(); return; }
      owner.onSpillReviveCommitted(frozen, pendingCommit.data.revision);
      this.pendingAttempt = attemptId; this.trustedCompletionAttempt = null;
      const prepared = await this.env.provider.prepare();
      if (this.host !== owner || generation !== this.hostGeneration) throw new Error('REVIVE_ATTEMPT_OWNER_CHANGED');
      if (!prepared.ok) { if (!await this.clearPending('复活广告暂时无法加载，未发放奖励。')) throw new Error('REVIVE_PENDING_CLEAR_FAILED'); this.busy = false; return; }
      this.phase = 'SHOWING'; this.changed();
      const outcome = await this.env.provider.show(attemptId);
      if (this.host !== owner || generation !== this.hostGeneration) { this.busy = false; return; }
      if (outcome.kind !== 'COMPLETED') {
        if (!await this.clearPending(outcome.kind === 'CANCELLED' ? '观看未完成，未发放复活。' : '广告播放失败，未发放复活。')) throw new Error('REVIVE_PENDING_CLEAR_FAILED');
        this.busy = false; return;
      }
      this.trustedCompletionAttempt = attemptId; this.phase = 'SETTLING'; this.changed();
      await this.settle(attemptId); this.busy = false;
    } catch {
      if (this.host === owner && generation === this.hostGeneration) {
        this.phase = 'ERROR'; this.retrySettle = !!this.pendingAttempt && this.trustedCompletionAttempt === this.pendingAttempt;
        this.message = '复活广告流程暂时未完成；存档保持待确认状态，可重试或放弃。'; this.changed();
      }
    } finally { if (this.phase !== 'SHOWING') this.busy = false; RewardedAdCoordinator.release('spill-revive'); }
  }
  async retrySettlement(): Promise<void> {
    if (!this.host || this.busy || !this.pendingAttempt || this.trustedCompletionAttempt !== this.pendingAttempt) return;
    this.busy = true; this.phase = 'SETTLING'; this.message = null; this.changed();
    try { await this.settle(this.pendingAttempt); } catch { this.phase = 'ERROR'; this.retrySettle = true; this.message = '复活保存仍未完成，可稍后重试。'; this.changed(); }
    finally { this.busy = false; }
  }
  async abandonPending(): Promise<void> {
    if (!this.host || this.busy) return;
    this.busy = true;
    const cleared = await this.clearPending('已放弃未确认的复活奖励。', false);
    if (!cleared) { this.busy = false; this.phase = 'ERROR'; this.message = '放弃操作未能保存，请重试。'; this.changed(); return; }
    this.stalePending = false; this.pendingAttempt = null; this.trustedCompletionAttempt = null; this.retrySettle = false; this.busy = false;
    this.host.declineSpillRevive(); this.changed();
  }
  acknowledgeGrant(): void {
    if (!this.host || this.phase !== 'GRANTED') return;
    this.phase = 'IDLE'; this.message = null; this.changed();
    this.host.resumeFromRewardedAd('本局已复活，点击继续。');
  }
  private check() {
    const bundle = this.host?.getBundle() ?? null;
    const run = this.host?.getActiveRunSnapshot() ?? null;
    if (!bundle || !run) return { allowed: false, block: 'NO_ACTIVE_RUN' as ReviveOfferBlock };
    return ReviveLedger.checkOffer({ policy: this.env.policy, capability: this.env.provider.capability(), profile: bundle.profile, run,
      foregroundSeconds: this.foregroundSeconds, tutorialComplete: this.host?.isTutorialComplete() ?? false, nowMs: this.now() });
  }
  private async clearPending(message: string, resume = true): Promise<boolean> {
    const owner = this.host, generation = this.hostGeneration;
    if (!owner) return false;
    const bundle = owner.getBundle();
    if (bundle) {
      const next = copy(bundle);
      next.profile.rewardedRevive = ReviveLedger.clearPending(next.profile.rewardedRevive);
      const committed = await this.repo.commitBundle(owner.getSaveRevision(), bundle.profile.activeRunId, next);
      if (this.host !== owner || generation !== this.hostGeneration || !committed.ok) return false;
      owner.onSpillReviveCommitted(next, committed.data.revision);
    }
    this.pendingAttempt = null; this.phase = 'ERROR'; this.retrySettle = false; this.message = message; this.changed();
    this.trustedCompletionAttempt = null;
    if (resume) { owner.declineSpillRevive(); }
    return true;
  }
  private async settle(attemptId: UUID): Promise<void> {
    const owner = this.host, generation = this.hostGeneration;
    if (!owner) return;
    let bundle = owner.getBundle();
    const run = owner.getActiveRunSnapshot();
    if (!bundle || !run) return;
    await owner.waitForSaveIdle();
    if (this.host !== owner || generation !== this.hostGeneration || owner.getActiveRunSnapshot()?.runId !== run.runId) return;
    bundle = owner.getBundle(); if (!bundle) return;
    const ledger = bundle.profile.rewardedRevive;
    if (ReviveLedger.hasReceipt(ledger, attemptId)) {
      const receipt = ledger.receipts.find((item) => item.attemptId === attemptId);
      const persisted = bundle.run;
      if (!receipt || receipt.runId !== run.runId || !persisted || persisted.runId !== run.runId || persisted.revive.used !== 1 || persisted.revive.committedReceiptId !== attemptId) {
        this.phase = 'ERROR'; this.retrySettle = false; this.message = '复活凭证与当前局不匹配，未应用。'; this.changed(); return;
      }
      if (!owner.applyCommittedRevive(attemptId)) { this.phase = 'ERROR'; this.retrySettle = false; this.message = '复活凭证无法应用到当前局，请返回结算。'; this.changed(); return; }
      this.phase = 'GRANTED'; this.message = null; this.retrySettle = false; this.pendingAttempt = null; this.changed();
      return;
    }
    if (ledger.pendingAttempt?.attemptId !== attemptId || ledger.pendingAttempt.runId !== run.runId) {
      this.phase = 'ERROR'; this.retrySettle = false; this.message = '找不到本局待确认的复活记录，未发放。'; this.changed(); return;
    }
    if (run.revive.used !== 0 || !run.revive.pendingFailure) { this.phase = 'ERROR'; this.retrySettle = false; this.message = '本局已不满足复活条件，未发放。'; this.changed(); return; }
    const pending = ledger.pendingAttempt;
    const sameDay = ReviveLedger.normalize(ledger, pending.dayKey);
    if (this.env.policy.maxDailyRevives - ReviveLedger.grantedForDay(sameDay, pending.dayKey) < 1) {
      this.phase = 'ERROR'; this.retrySettle = false; this.message = '今日复活次数已达上限，未发放。'; this.changed(); return;
    }
    const projected = owner.projectRevive(attemptId);
    if (!projected.ok) { this.phase = 'ERROR'; this.retrySettle = false; this.message = projected.error.message; this.changed(); return; }
    const nextLedger = ReviveLedger.grant(ledger, ReviveLedger.receiptFor(pending, this.now()), run.runId);
    const next = copy(bundle);
    next.profile.rewardedRevive = nextLedger;
    next.run = projected.data;
    const committed = await this.repo.commitBundle(owner.getSaveRevision(), run.runId, next);
    if (this.host !== owner || generation !== this.hostGeneration || owner.getActiveRunSnapshot()?.runId !== run.runId) return;
    if (!committed.ok) { this.phase = 'ERROR'; this.retrySettle = true; this.message = '广告已完成，但复活存档保存失败；请稍后重试领取。'; this.changed(); return; }
    const readback = await this.repo.readBundle();
    if (this.host !== owner || generation !== this.hostGeneration) return;
    if (!readback.ok || !readback.data.envelope) { this.phase = 'ERROR'; this.retrySettle = true; this.message = '复活存档回读失败，可重试领取。'; this.changed(); return; }
    const persistedBundle = readback.data.envelope.payload;
    if (!ReviveLedger.hasReceipt(persistedBundle.profile.rewardedRevive, attemptId) || persistedBundle.run?.runId !== run.runId
      || persistedBundle.run.revive.used !== 1 || persistedBundle.run.revive.committedReceiptId !== attemptId) {
      this.phase = 'ERROR'; this.retrySettle = true; this.message = '复活账本与本局状态未能一致回读，可重试领取。'; this.changed(); return;
    }
    owner.onSpillReviveCommitted(persistedBundle, committed.data.revision);
    if (!owner.applyCommittedRevive(attemptId)) { this.phase = 'ERROR'; this.retrySettle = true; this.message = '复活已保存，但应用失败，可重试领取。'; this.changed(); return; }
    this.pendingAttempt = null; this.stalePending = false; this.phase = 'GRANTED'; this.message = null; this.retrySettle = false; this.changed();
  }
  private changed(): void { this.host?.onSpillReviveChanged(); }
  private blockMessage(block: ReviveOfferBlock | null): string {
    switch (block) {
      case 'POLICY_DISABLED': return '洒出复活广告尚未开启';
      case 'AD_UNCONFIGURED': return '未配置真实复活广告位';
      case 'AD_UNSUPPORTED': return '当前环境不支持激励广告';
      case 'NO_ACTIVE_RUN': case 'NOT_SPILL_PENDING': return '当前没有可复活的洒出局';
      case 'RUN_LIMIT': return '本局已使用过复活';
      case 'DAILY_LIMIT': return '今日复活次数已达上限';
      case 'TUTORIAL_REQUIRED': return '完成教程后可观看复活广告';
      case 'FIRST_RUN_REQUIRED': return '完成一局真实游戏后可观看复活广告';
      case 'FOREGROUND_REQUIRED': return '游戏时间稍短，暂不可观看复活广告';
      case 'PENDING_ATTEMPT': return '有未确认的复活奖励';
      default: return '暂不可复活';
    }
  }
}

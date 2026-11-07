import type { IBundleSaveRepository, LocalSaveBundle, RewardedAdCapability, RewardedShakePending, RewardedShakePolicy, RunSnapshot, UUID } from '../contracts/types';
import { RewardLedger, type RewardOfferBlock } from '../persistence/RewardLedger';
import type { RewardedAdEnvironment } from '../platform/RewardedAdProviderFactory';
import { RewardedAdCoordinator } from './RewardedAdCoordinator';

export type RewardedShakePhase = 'IDLE' | 'OFFER' | 'PREPARING' | 'SHOWING' | 'SETTLING' | 'GRANTED' | 'ERROR';
export interface RewardedShakeView {
  phase: RewardedShakePhase; block: RewardOfferBlock | null; message: string | null; retrySettle: boolean;
  capability: RewardedAdCapability; providerName: string; availableExtra: number; grantedThisRun: number;
  runLimit: number; dailyRemaining: number; pendingAttempt: boolean; simulated: boolean;
}
export interface RewardedShakeHost {
  getActiveRunSnapshot(): RunSnapshot | null;
  getBundle(): LocalSaveBundle | null;
  getSaveRevision(): number;
  isTutorialComplete(): boolean;
  getForegroundSeconds(): number;
  pauseForRewardedAd(): void;
  resumeFromRewardedAd(notice: string | null): void;
  onRewardedShakeChanged(): void;
  onRewardedShakeCommitted(bundle: LocalSaveBundle, revision: number): void;
  /** Apply the missing committed extra shakes (delta, never the consumed count). False means the live repair failed. */
  applyCommittedExtraGrant(amount: number): boolean;
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
 * App-scoped rewarded-shake state machine. The pending attempt is persisted before show; a grant is
 * committed before the live engine receives it, so a failed save can never leave spendable ghost shakes.
 */
export class RewardedShakeService {
  private phase: RewardedShakePhase = 'IDLE';
  private message: string | null = null;
  private retrySettle = false;
  private busy = false;
  private stalePending = false;
  private pendingAttempt: UUID | null = null;
  /** Set only after this process receives a strict, attempt-scoped COMPLETED outcome. */
  private trustedCompletionAttempt: UUID | null = null;
  private foregroundSeconds = 0;
  private host: RewardedShakeHost | null = null;
  private boundRunId: string | null = null;
  private hostGeneration = 0;
  /** Attempt id currently being dropped by clearStalePending; repeated binds must not race the same record. */
  private clearingAttemptId: UUID | null = null;
  private constructor(
    private readonly env: RewardedAdEnvironment,
    private readonly repo: IBundleSaveRepository,
    private readonly now: () => number,
  ) {}
  static create(env: RewardedAdEnvironment, repo: IBundleSaveRepository, now: () => number = () => Date.now()): RewardedShakeService {
    const service = new RewardedShakeService(env, repo, now);
    const scope = globalThis as unknown as { __milkteaRewardedShake?: RewardedShakeService };
    if (scope.__milkteaRewardedShake) { service.env.provider.dispose(); return scope.__milkteaRewardedShake; }
    scope.__milkteaRewardedShake = service;
    return service;
  }
  get policy(): Readonly<RewardedShakePolicy> { return this.env.policy; }
  bind(host: RewardedShakeHost): void {
    const nextRun=host.getActiveRunSnapshot()?.runId??null;
    const changed=this.host!==host||this.boundRunId!==nextRun;
    if(changed){
      this.hostGeneration++;this.boundRunId=nextRun;
      // Attempt-scoped memory belongs to the superseded generation and can never resolve again; reset it so the
      // new host is not stuck on a dead SETTLING or a phantom pending attempt.
      this.busy=false;this.pendingAttempt=null;this.trustedCompletionAttempt=null;
      if(this.phase==='PREPARING'||this.phase==='SHOWING'||this.phase==='SETTLING'){
        this.phase='IDLE';this.message=null;this.retrySettle=false;
      }
    }
    this.host = host;
    const ledger = host.getBundle()?.profile.rewardedShake;
    const run = host.getActiveRunSnapshot();
    this.stalePending = !!(ledger?.pendingAttempt && run && ledger.pendingAttempt.runId === run.runId);
    // A receipt already committed for this run is owned, not re-sold: never re-ask the player to watch, and repair
    // the live grant for free when the engine lags behind the persisted state.
    const receipt = run ? ledger?.receipts?.find((item) => item.runId === run.runId && item.rewardKind === 'extra_shake' && item.amount === 1) : undefined;
    if (this.stalePending && run && !receipt) {
      // A pending attempt from a superseded host can never be confirmed; keeping it would block the new host
      // forever with PENDING_ATTEMPT. Release the block now, drop the record asynchronously.
      this.stalePending = false;
      void this.clearStalePending(host, {
        attemptId: ledger?.pendingAttempt?.attemptId ?? null,
        runId: run.runId, revision: host.getSaveRevision(), generation: this.hostGeneration,
      });
    }
    if (run && receipt) {
      const persisted = host.getBundle()?.run;
      this.busy = false; this.retrySettle = false;
      // Restore the committed TOTAL, not one unit: multiple receipts may have been persisted while memory lagged.
      // extraUsed is untouched, so consumed shakes can never turn into free ones.
      const delta = persisted && persisted.runId === run.runId ? persisted.shake.extraGranted - run.shake.extraGranted : 0;
      if (delta > 0 && !host.applyCommittedExtraGrant(delta)) {
        // Keep the committed receipt as a trusted attempt identity so retrySettlement() can recover for free
        // without re-watching, and never re-sell the same grant.
        this.pendingAttempt = receipt.attemptId; this.trustedCompletionAttempt = receipt.attemptId;
        this.phase = 'ERROR'; this.retrySettle = true;
        this.message = '奖励已保存，但本次恢复未完成；可重试领取，无需再次观看广告。';
        return;
      }
      this.pendingAttempt = null; this.trustedCompletionAttempt = null;
      this.phase = 'GRANTED'; this.message = null;
      return;
    }
    if(!this.busy){this.phase = 'IDLE'; this.message = this.stalePending ? '上次广告奖励未得到可信完成确认，未发放。' : null;this.retrySettle = false;}
  }
  unbind(host: RewardedShakeHost): void { if (this.host === host) this.host = null; }
  /** A superseded batch must never clear the busy flag of a batch that already replaced it on a new host. */
  private releaseBusy(owner: RewardedShakeHost, generation: number): void {
    if (this.host === owner && this.hostGeneration === generation) this.busy = false;
  }
  setForegroundSeconds(seconds: number): void { this.foregroundSeconds = Math.max(0, seconds); }
  providerDisposed(): boolean { return false; }
  dispose(): void { this.env.provider.dispose(); }
  getView(): RewardedShakeView {
    const bundle = this.host?.getBundle() ?? null;
    const run = this.host?.getActiveRunSnapshot() ?? null;
    const check = bundle && run
      ? RewardLedger.checkOffer({
          policy: this.env.policy, capability: this.env.provider.capability(), profile: bundle.profile, run,
          foregroundSeconds: this.foregroundSeconds, tutorialComplete: this.host?.isTutorialComplete() ?? false, nowMs: this.now(),
        })
      : { allowed: false, block: 'NO_ACTIVE_RUN' as RewardOfferBlock };
    const ledger = bundle?.profile.rewardedShake ?? RewardLedger.EMPTY;
    const today = RewardLedger.dayKey(this.now());
    return {
      phase: this.phase, block: this.stalePending ? 'PENDING_ATTEMPT' : check.block, message: this.message, retrySettle: this.retrySettle,
      capability: this.env.provider.capability(), providerName: this.env.provider.providerName,
      availableExtra: run?.shake.extraGranted !== undefined ? Math.max(0, run.shake.extraGranted - run.shake.extraUsed) : 0,
      grantedThisRun: run?.shake.extraGranted ?? 0, runLimit: this.env.policy.maxExtraShakesPerRun,
      dailyRemaining: RewardLedger.dailyRemaining(ledger, this.env.policy, today),
      pendingAttempt: this.stalePending || !!(ledger.pendingAttempt && run && ledger.pendingAttempt.runId === run.runId),
      simulated: this.env.provider.providerName !== 'tap',
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
  closeOffer(): void {
    if (!this.host || this.phase !== 'OFFER' && this.phase !== 'ERROR') return;
    this.phase = 'IDLE'; this.message = null; this.retrySettle = false; this.changed();
    this.host.resumeFromRewardedAd(null);
  }
  /** Reopens the pending record so the player can abandon an untrusted attempt. */
  openPendingReview(): void {
    if (!this.host || this.busy) return;
    const ledger = this.host.getBundle()?.profile.rewardedShake;
    const run = this.host.getActiveRunSnapshot();
    if (!ledger?.pendingAttempt || !run || ledger.pendingAttempt.runId !== run.runId) return;
    this.stalePending = true; this.phase = 'ERROR'; this.retrySettle = false;
    this.message = '上次广告奖励未得到可信完成确认，未发放。可放弃后重新观看。';
    this.host.pauseForRewardedAd(); this.changed();
  }
  async watch(): Promise<void> {
    if (!this.host || this.phase !== 'OFFER' || this.busy) return;
    const check = this.check();
    if (!check.allowed) { this.message = this.blockMessage(check.block); this.changed(); return; }
    const owner=this.host,generation=this.hostGeneration;
    let bundle = owner.getBundle();
    let run = owner.getActiveRunSnapshot();
    if (!bundle || !run) { this.message = '当前局不可用'; this.changed(); return; }
    if (this.env.provider.capability() !== 'SUPPORTED') { this.message = this.blockMessage('AD_UNSUPPORTED'); this.phase = 'ERROR'; this.changed(); return; }
    if (!RewardedAdCoordinator.claim('extra-shake')) { this.message = '另有广告正在进行，请稍后再试。'; this.phase = 'ERROR'; this.changed(); return; }
    this.busy = true; this.phase = 'PREPARING'; this.message = null; this.changed();
    try {
    await this.host.waitForSaveIdle();
    if(this.host!==owner||generation!==this.hostGeneration||owner.getActiveRunSnapshot()?.runId!==run.runId)throw new Error('REWARD_ATTEMPT_OWNER_CHANGED');
    // Sync a revision advanced by a stale-owner cleanup before the reward CAS, otherwise this host can only conflict.
    const synced = await this.repo.readBundle();
    if(this.host!==owner||generation!==this.hostGeneration||owner.getActiveRunSnapshot()?.runId!==run.runId)throw new Error('REWARD_ATTEMPT_OWNER_CHANGED');
    if(synced.ok&&synced.data.envelope){
      const payload=synced.data.envelope.payload;
      if(payload.profile.activeRunId===run.runId&&payload.run?.runId===run.runId&&synced.data.envelope.revision!==owner.getSaveRevision())
        owner.onRewardedShakeCommitted(payload,synced.data.envelope.revision);
    }
    bundle=owner.getBundle();run=owner.getActiveRunSnapshot();if(!bundle||!run)throw new Error('REWARD_ATTEMPT_RUN_MISSING');
    const attemptId = makeUuid() as UUID;
    const pending: RewardedShakePending = {
      attemptId, runId: run.runId, policyVersion: this.env.policy.policyVersion, amount: 1,
      dayKey: RewardLedger.dayKey(this.now()), startedAt: this.now(),
    };
    const frozen = copy(bundle);
    frozen.profile.rewardedShake = { ...RewardLedger.normalize(frozen.profile.rewardedShake, pending.dayKey), pendingAttempt: pending };
    const pendingCommit = await this.repo.commitBundle(owner.getSaveRevision(), bundle.profile.activeRunId, frozen);
    if(this.host!==owner||generation!==this.hostGeneration||owner.getActiveRunSnapshot()?.runId!==run.runId)throw new Error('REWARD_ATTEMPT_OWNER_CHANGED');
    if (!pendingCommit.ok) {
      this.busy = false; this.phase = 'ERROR'; this.retrySettle = false;
      this.message = '无法写入待确认的广告奖励，广告未展示。'; this.changed(); return;
    }
    owner.onRewardedShakeCommitted(frozen, pendingCommit.data.revision);
    this.pendingAttempt = attemptId;
    this.trustedCompletionAttempt = null;
    const prepared = await this.env.provider.prepare();
    if(this.host!==owner||generation!==this.hostGeneration)throw new Error('REWARD_ATTEMPT_OWNER_CHANGED');
    if (!prepared.ok) { if(!await this.clearPending('广告暂时无法加载，未发放奖励。'))throw new Error('REWARD_PENDING_CLEAR_FAILED'); this.releaseBusy(owner, generation); return; }
    this.phase = 'SHOWING'; this.changed();
    const outcome = await this.env.provider.show(attemptId);
    if(this.host!==owner||generation!==this.hostGeneration||owner.getActiveRunSnapshot()?.runId!==run.runId)return;
    if (outcome.kind !== 'COMPLETED') {
      if(!await this.clearPending(outcome.kind === 'CANCELLED' ? '观看未完成，未发放奖励。' : '广告播放失败，未发放奖励。'))throw new Error('REWARD_PENDING_CLEAR_FAILED');
      this.releaseBusy(owner, generation); return;
    }
    this.trustedCompletionAttempt = attemptId;
    this.phase = 'SETTLING'; this.changed();
    await this.settle(attemptId);
    this.releaseBusy(owner, generation);
    }catch(error){if(this.host===owner&&generation===this.hostGeneration){this.phase='ERROR';this.retrySettle=!!this.pendingAttempt&&this.trustedCompletionAttempt===this.pendingAttempt;this.message='广告流程暂时未完成；存档保持待确认状态，可重试或返回游戏。';this.changed();}}
    finally{if(this.host===owner&&generation===this.hostGeneration&&this.phase!=='SHOWING')this.busy=false;RewardedAdCoordinator.release('extra-shake');}
  }
  async retrySettlement(): Promise<void> {
    if (!this.host || this.busy || !this.pendingAttempt || this.trustedCompletionAttempt !== this.pendingAttempt) return;
    const owner=this.host,generation=this.hostGeneration;
    this.busy = true; this.phase = 'SETTLING'; this.message = null; this.changed();
    try{await this.settle(this.pendingAttempt);}catch{if(this.host!==owner||generation!==this.hostGeneration)return;this.phase='ERROR';this.retrySettle=true;this.message='奖励保存仍未完成，可稍后重试。';this.changed();}
    finally{this.releaseBusy(owner,generation);}
  }
  async abandonPending(): Promise<void> {
    if (!this.host || this.busy) return;
    const owner=this.host,generation=this.hostGeneration;
    this.busy = true;
    const cleared=await this.clearPending('已放弃未确认的广告奖励。');
    // A handoff during the write means this generation no longer owns the live UI/run; bind() already reset it.
    if(this.host!==owner||generation!==this.hostGeneration)return;
    if(!cleared){this.busy=false;this.phase='ERROR';this.message='放弃操作未能保存，请重试。';this.changed();return;}
    this.stalePending = false; this.pendingAttempt = null; this.trustedCompletionAttempt = null; this.retrySettle = false; this.phase = 'IDLE'; this.busy = false;
    this.changed();
    this.host.resumeFromRewardedAd('已放弃未确认的广告奖励。');
  }
  acknowledgeGrant(): void {
    if (!this.host || this.phase !== 'GRANTED') return;
    this.phase = 'IDLE'; this.message = null; this.changed();
    this.host.resumeFromRewardedAd(null);
  }
  private check() {
    const bundle = this.host?.getBundle() ?? null;
    const run = this.host?.getActiveRunSnapshot() ?? null;
    if (!bundle || !run) return { allowed: false, block: 'NO_ACTIVE_RUN' as RewardOfferBlock };
    return RewardLedger.checkOffer({
      policy: this.env.policy, capability: this.env.provider.capability(), profile: bundle.profile, run,
      foregroundSeconds: this.foregroundSeconds, tutorialComplete: this.host?.isTutorialComplete() ?? false, nowMs: this.now(),
    });
  }
  /**
   * Drop a pending attempt left behind by a superseded host. No grant, no resume, no run-state change; a CAS
   * failure means a newer attempt already wrote and is simply left alone.
   */
  private async clearStalePending(owner: RewardedShakeHost, expected: {
    attemptId: UUID | null; runId: string; revision: number; generation: number;
  }): Promise<void> {
    if (!expected.attemptId || this.clearingAttemptId === expected.attemptId) return;
    this.clearingAttemptId = expected.attemptId;
    try {
      // Re-read first so only the original pending record is dropped and the write uses the newest revision.
      const fresh = await this.repo.readBundle();
      if (!fresh.ok || !fresh.data.envelope) return;
      const payload = fresh.data.envelope.payload;
      const pending = payload.profile.rewardedShake?.pendingAttempt;
      if (!pending || pending.attemptId !== expected.attemptId || pending.runId !== expected.runId) return;
      const next = copy(payload);
      next.profile.rewardedShake = RewardLedger.clearPending(next.profile.rewardedShake);
      const committed = await this.repo.commitBundle(fresh.data.envelope.revision, payload.profile.activeRunId, next);
      if (!committed.ok) return;
      if (this.host === owner && this.hostGeneration === expected.generation
        && owner.getActiveRunSnapshot()?.runId === expected.runId) {
        owner.onRewardedShakeCommitted(next, committed.data.revision);
      }
    } catch {
      // Best effort: a failed cleanup is retried on the next bind and must never reject unhandled.
    } finally {
      if (this.clearingAttemptId === expected.attemptId) this.clearingAttemptId = null;
    }
  }
  private async clearPending(message: string): Promise<boolean> {
    const owner=this.host,generation=this.hostGeneration;
    if (!owner) return false;
    const runId = owner.getActiveRunSnapshot()?.runId ?? null;
    const bundle = owner.getBundle();
    if (bundle) {
      const next = copy(bundle);
      next.profile.rewardedShake = RewardLedger.clearPending(next.profile.rewardedShake);
      let committed: Awaited<ReturnType<IBundleSaveRepository['commitBundle']>>;
      try { committed = await this.repo.commitBundle(owner.getSaveRevision(), bundle.profile.activeRunId, next); }
      catch { return false; }
      if(this.host!==owner||generation!==this.hostGeneration||!committed.ok)return false;
      if (runId !== null && owner.getActiveRunSnapshot()?.runId !== runId) return false;
      owner.onRewardedShakeCommitted(next, committed.data.revision);
    }
    this.pendingAttempt = null; this.phase = 'ERROR'; this.retrySettle = false; this.message = message; this.changed();
    this.trustedCompletionAttempt = null;
    owner.resumeFromRewardedAd(message);return true;
  }
  private async settle(attemptId: UUID): Promise<void> {
    const owner=this.host,generation=this.hostGeneration;
    if (!owner) return;
    const run = owner.getActiveRunSnapshot();
    if (!run) return;
    await owner.waitForSaveIdle();
    if(this.host!==owner||generation!==this.hostGeneration||owner.getActiveRunSnapshot()?.runId!==run.runId)return;
    // Always re-read the freshest committed envelope. A prior readback failure must never leave this host CAS-ing
    // against a stale revision; the committed envelope owns the canonical payload AND revision.
    const fresh = await this.repo.readBundle();
    if(this.host!==owner||generation!==this.hostGeneration||owner.getActiveRunSnapshot()?.runId!==run.runId)return;
    if(!fresh.ok||!fresh.data.envelope){this.phase='ERROR';this.retrySettle=this.trustedCompletionAttempt===attemptId;this.message='无法读取最新存档，可重试领取。';this.changed();return;}
    const envelope=fresh.data.envelope;
    const bundle=envelope.payload;
    if(bundle.profile.activeRunId!==run.runId||bundle.run?.runId!==run.runId){this.phase='ERROR';this.retrySettle=false;this.message='当前局与存档不一致，未发放。';this.changed();return;}
    // Sync host to the committed revision immediately; do not let a later readback failure block revision.
    owner.onRewardedShakeCommitted(bundle, envelope.revision);
    const ledger=bundle.profile.rewardedShake;
    if (RewardLedger.hasReceipt(ledger, attemptId)) {
      // Crash/readback gap after commit: the grant is already on disk. Repair the live delta for free, never re-watch,
      // never append a receipt, never re-consume daily/run quota.
      const receipt=ledger.receipts.find(item=>item.attemptId===attemptId);
      if(!receipt||receipt.runId!==run.runId||receipt.rewardKind!=='extra_shake'||receipt.amount!==1){this.phase='ERROR';this.retrySettle=false;this.message='奖励凭证与本局不匹配，未应用。';this.changed();return;}
      if(bundle.run.shake.extraGranted<run.shake.extraGranted){this.phase='ERROR';this.retrySettle=false;this.message='奖励账本与本局额度不一致，未应用。';this.changed();return;}
      const delta=bundle.run.shake.extraGranted-run.shake.extraGranted;
      if(delta>0&&!owner.applyCommittedExtraGrant(delta)){this.phase='ERROR';this.retrySettle=true;this.message='奖励已保存，但本次恢复未完成，可重试领取。';this.changed();return;}
      this.pendingAttempt=null;this.stalePending=false;this.phase='GRANTED';this.message=null;this.retrySettle=false;this.changed();
      return;
    }
    if (ledger.pendingAttempt?.attemptId !== attemptId||ledger.pendingAttempt.runId!==run.runId) {
      this.phase = 'ERROR'; this.retrySettle = false; this.message = '找不到本局待确认的广告奖励记录，未发放。'; this.changed();
      return;
    }
    if (run.shake.extraGranted + 1 > this.env.policy.maxExtraShakesPerRun) {
      this.phase = 'ERROR'; this.retrySettle = false; this.message = '本局奖励颠杯已达上限，未发放。'; this.changed(); return;
    }
    const pending = ledger.pendingAttempt;
    const sameDay = RewardLedger.normalize(ledger, pending.dayKey);
    if (this.env.policy.maxDailyRewardedShakes - sameDay.dailyGranted < 1) {
      this.phase = 'ERROR'; this.retrySettle = false; this.message = '今日广告奖励已达上限，未发放。'; this.changed(); return;
    }
    const nextLedger = RewardLedger.grant(ledger, RewardLedger.receiptFor(pending, this.now()), run.runId);
    const projectedRun: RunSnapshot = copy(run);
    projectedRun.shake = { ...projectedRun.shake, extraGranted: projectedRun.shake.extraGranted + 1, extraUsed: projectedRun.shake.extraUsed };
    projectedRun.revision += 1;
    const next = copy(bundle);
    next.profile.rewardedShake = nextLedger;
    next.run = projectedRun;
    const committed = await this.repo.commitBundle(envelope.revision, run.runId, next);
    if(this.host!==owner||generation!==this.hostGeneration||owner.getActiveRunSnapshot()?.runId!==run.runId)return;
    if (!committed.ok) {
      this.phase = 'ERROR'; this.retrySettle = this.trustedCompletionAttempt === attemptId;
      this.message = '广告已完成，但奖励保存失败；请在稍后重试领取。'; this.changed(); return;
    }
    // The commit is authoritative: sync host to the committed payload AND revision before readback so a readback
    // failure can never strand the host on the old revision (which would make every retry CAS-conflict).
    owner.onRewardedShakeCommitted(next, committed.data.revision);
    const readback=await this.repo.readBundle();
    if(this.host!==owner||generation!==this.hostGeneration)return;
    if(!readback.ok||!readback.data.envelope||!RewardLedger.hasReceipt(readback.data.envelope.payload.profile.rewardedShake,attemptId)){
      // The grant is committed; retry will hit the receipt branch above and apply it for free.
      this.phase='ERROR';this.retrySettle=true;this.message='奖励已提交但回读未确认，可重试领取。';this.changed();return;
    }
    const persistedBundle=readback.data.envelope.payload;
    if(persistedBundle.run?.runId!==run.runId||persistedBundle.run.shake.extraGranted<run.shake.extraGranted+1){this.phase='ERROR';this.retrySettle=true;this.message='奖励账本与本局额度未能一致回读，可重试领取。';this.changed();return;}
    // Use the adopted envelope's own revision (readback may advance beyond the commit result).
    owner.onRewardedShakeCommitted(persistedBundle, readback.data.envelope.revision);
    const appliedDelta = persistedBundle.run.shake.extraGranted - run.shake.extraGranted;
    if (appliedDelta > 0 && !owner.applyCommittedExtraGrant(appliedDelta)) {
      this.phase = 'ERROR'; this.retrySettle = true;
      this.message = '奖励已提交但未能应用到当前局，可重试领取。'; this.changed(); return;
    }
    this.pendingAttempt = null; this.stalePending = false; this.phase = 'GRANTED'; this.message = null; this.retrySettle = false; this.changed();
  }
  private changed(): void { this.host?.onRewardedShakeChanged(); }
  private blockMessage(block: RewardOfferBlock | null): string {
    switch (block) {
      case 'POLICY_DISABLED': return '广告奖励尚未开启';
      case 'AD_UNCONFIGURED': return '未配置真实广告位';
      case 'AD_UNSUPPORTED': return '当前环境不支持激励广告';
      case 'NO_ACTIVE_RUN': case 'NOT_PLAYING': return '当前局不可用';
      case 'BASE_SHAKES_REMAINING': return '还有基础颠杯次数';
      case 'RUN_LIMIT': return '本局奖励颠杯已达上限';
      case 'DAILY_LIMIT': return '今日广告奖励已达上限';
      case 'TUTORIAL_REQUIRED': return '完成教程后可观看广告';
      case 'FIRST_RUN_REQUIRED': return '完成一局真实游戏后可观看广告';
      case 'FOREGROUND_REQUIRED': return '游戏时间稍短，暂不可观看广告';
      case 'PENDING_ATTEMPT': return '有未确认的广告奖励';
      default: return '暂不可观看广告';
    }
  }
}

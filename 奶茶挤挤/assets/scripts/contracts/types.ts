/** Design contracts v0.2. Interfaces only; no game or API implementation. */
export type UUID = string;
export type StageId = 'classic' | 'coconut_green' | 'taro_boba' | 'brown_sugar' | 'mochi_special';
export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type BoardType = 'standard' | 'assisted';
export type GameMode = 'classic' | 'daily' | 'friend';
export type PhaseState = 'BOOT' | 'LOADING' | 'MENU' | 'PLAYING' | 'PAUSED' | 'SETTLING' | 'RESULTS';
export type TerminalReason = 'CUP_FULL' | 'SPILLED' | 'BUDGET_EXHAUSTED' | 'ABANDONED' | 'TECHNICAL_ERROR';
export type VerificationStatus = 'LOCAL_ONLY' | 'PENDING' | 'STRUCTURAL_ONLY' | 'VERIFIED' | 'REJECTED';
export interface Vec2 { x: number; y: number }
export interface DomainError { code: string; message: string; retryable: boolean; requestId?: UUID }
export type Result<T> = { ok: true; data: T } | { ok: false; error: DomainError };
export interface IngredientDefinition { id: string; level: Level; name: string; radiusDu: number; mergeScore: number; units: number }
export interface IngredientState {
  entityId: number; level: Level; positionDu: Vec2; velocityDuPerSecond: Vec2;
  angleRadians: number; angularVelocity: number; bornTick: number;
  dangerEligible: boolean; hasEnteredCup: boolean; spillTicks: number; sleeping: boolean;
}
export interface ShakeState { baseUsed: number; extraGranted: number; extraUsed: number; activeStartTick: number | null; cooldownUntilTick: number }
export interface RngState { algorithm: 'xorshift32_v1_nonzero_seed'; state: number; drawCount: number }
export interface SpawnRngState { algorithm: 'spawn-xorshift32-v1'; state: number; drawCount: number }
export interface SpawnDescriptor { level: Level; xDu: number; vxDuPerSecond: number; angularVelocity: number }
export interface RunSnapshot {
  saveSchemaVersion: 5; rulesVersion: string; appVersion: string; runId: UUID; epoch: number;
  revision: number; stageId: StageId; mode: GameMode; boardType: BoardType;
  state: PhaseState; tick: number; nextEntityId: number; nextCommandSequence: number;
  score: number; maxLevel: Level; dropIndex: number; currentLevel: Level; nextLevel: Level;
  lastDropTick: number | null; settleStartedTick: number | null;
  challenge: { id: string; deadlineAt: string; dropBudget: 120 } | null;
  rng: RngState; ingredients: IngredientState[]; shake: ShakeState; dangerTicks: number;
  spawnRng: SpawnRngState;
  cupMotion: { offsetXDu: number; velocityXDuPerSecond: number; targetOffsetXDu: number; control: 'IDLE'|'DRAGGING'|'SETTLING' };
  autoDrop: { nextDueTick: number; pendingSpawn: SpawnDescriptor };
  revive: RunReviveState;
  terminalReason: TerminalReason | null; checksum: string;
}
/** Per-run revive entitlement. A pending failure freezes the run until the player accepts or declines the offer. */
export interface RunReviveState { used: 0 | 1; pendingFailure: SpillPendingFailure | null; committedReceiptId: UUID | null }
/** Frozen spill metadata. The cleaned candidate is rebuilt deterministically from the paused snapshot and config. */
export interface SpillPendingFailure {
  version: 1; failureId: UUID; detectedTick: number; reason: 'SPILLED';
  spilledEntityIds: number[]; clearanceDu: number; candidateHash: string;
  /** Entities kept after clearance projection, recorded so a restore can be verified against the candidate hash. */
  retainedEntityIds: number[];
}
export interface SpillReviveCandidate {
  candidateId: UUID; failureId: UUID; detectedTick: number; spilledEntityIds: number[];
  removedEntityIds: number[]; retainedEntityIds: number[];
  score: number; maxLevel: Level; dropIndex: number; currentLevel: Level; nextLevel: Level;
  nextEntityId: number; tick: number; rng: RngState; spawnRng: SpawnRngState;
  cupOffsetXDu: number; shake: ShakeState; dangerTicks: number;
  autoDrop: { nextDueTick: number; pendingSpawn: SpawnDescriptor };
  ingredients: IngredientState[]; candidateHash: string;
}
interface CommandBase { runId: UUID; commandId: UUID; sequence: number; tick: number }
export type RunCommand =
  | (CommandBase & { kind: 'DROP'; xDu: number })
  | (CommandBase & { kind: 'SHAKE'; source: 'base' | 'rewarded_ad'; consumeEventId?: never })
  | (CommandBase & { kind: 'SHAKE'; source: 'coupon'; consumeEventId: UUID })
  | (CommandBase & { kind: 'PAUSE' | 'RESUME' | 'ABANDON' });
interface EventBase { eventId: UUID; runId: UUID; tick: number }
export type DomainEvent =
  | (EventBase & { kind: 'IngredientDropped'; entityId: number; level: Level; dropIndex: number })
  | (EventBase & { kind: 'MergeCommitted'; parents: [number, number]; childId: number; childLevel: Level; scoreDelta: number; units: number; positionDu: Vec2 })
  | (EventBase & { kind: 'ShakeConsumed'; source: 'base' | 'coupon' | 'rewarded_ad'; consumeEventId?: UUID })
  | (EventBase & { kind: 'DangerChanged'; dangerTicks: number })
  | (EventBase & { kind: 'SpillReviveOffered'; failureId: UUID; candidateHash: string })
  | (EventBase & { kind: 'SpillReviveCommitted'; failureId: UUID; receiptId: UUID; candidateHash: string })
  | (EventBase & { kind: 'RunEnded'; reason: TerminalReason; score: number });
export interface ContactPair { contactId: string; firstId: number; secondId: number | null; normalSpeed: number }
/** secondId=null means a static cup boundary. Logical eligibility stays owned by RunEngine. */
export type PhysicalBodyState = Pick<IngredientState, 'entityId' | 'positionDu' | 'velocityDuPerSecond' | 'angleRadians' | 'angularVelocity' | 'sleeping'>;
export interface BodyDefinition { entityId: number; level: Level; radiusDu: number; positionDu: Vec2; velocityDuPerSecond: Vec2; angleRadians?: number; angularVelocity?: number; enabledInitially?: boolean }
export interface IPhysicsAdapter {
  /** Backend polygon radius plus linear slop in design units; used only when projecting newly merged bodies at finite walls. */
  readonly wallContactProjectionMarginDu?: number;
  createCup(stageId: StageId, offsetXDu?: number): void;
  setCupVelocityX(duPerSecond: number): void;
  getCupOffsetX(): number;
  createBody(definition: BodyDefinition): void;
  destroyBody(entityId: number): void;
  /** Atomically replace two live colliders at a world-unlocked tick boundary. */
  replaceParentsWithChild(parents: readonly [number, number], child: BodyDefinition): Result<void>;
  stepFixed(): void;
    readonly lastStepTimings?: { syncToPhysics: number; physicsStep: number; syncFromPhysics: number; velocityClamp: number };
  applyHorizontalAcceleration(entityId: number, accelerationSpecUnits: number): void;
  getContacts(): readonly ContactPair[];
  getBody(entityId: number): PhysicalBodyState | undefined;
  restoreBodies(states: readonly IngredientState[]): void;
  canSpawn(level: Level, xDu: number): boolean;
  dispose(): void;
}

/** P1-B local execution acknowledgement; it is not a DomainEvent or network command. */
export interface CommandOutcome {
  commandId: UUID;
  sequence: number;
  status: 'APPLIED' | 'REJECTED' | 'CANCELLED';
  appliedTick: number;
  errorCode?: string;
  message?: string;
}
export interface LocalCommandEnvelope { command: RunCommand; ownerEpoch: number }

/** Legacy schema (v4 run / v2 profile) kept only for safe migration reads. */
export type LegacyRunSnapshotV4 = Omit<RunSnapshot, 'saveSchemaVersion' | 'revive'> & { saveSchemaVersion: 4 };
export type LegacyRunSnapshotV3 = Omit<RunSnapshot, 'saveSchemaVersion' | 'spawnRng' | 'autoDrop' | 'revive'> & { saveSchemaVersion:3; autoDrop:{nextDueTick:number} };
/** Legacy schema (v2 runs / v1 profile) kept only for safe migration reads. */
export type LegacyRunSnapshotV2 = Omit<RunSnapshot, 'saveSchemaVersion' | 'shake' | 'spawnRng' | 'autoDrop' | 'revive'> & {
  saveSchemaVersion: 2; shake: { baseUsed: number; extraUsed: number; activeStartTick: number | null; cooldownUntilTick: number };
};
export interface LegacyLocalLastResult {
  runId: UUID; reason: TerminalReason; score: number; maxLevel: Level; dropIndex: number; baseUsed: number; extraUsed: 0; rulesVersion?: string;
}
export interface LocalSaveBundleV1 { profile: LocalProfileV1; run: LegacyRunSnapshotV2 | null; lastResult: LegacyLocalLastResult | null }
export interface LocalSaveEnvelopeV1 { schemaVersion: 1; revision: number; payload: LocalSaveBundleV1; checksum: string }

export interface RewardedShakeReceipt {
  attemptId: UUID; runId: UUID; rewardKind: 'extra_shake'; amount: 1; policyVersion: string; dayKey: string; status: 'COMMITTED'; grantedAt: number;
}
export interface RewardedShakePending { attemptId: UUID; runId: UUID; policyVersion: string; amount: 1; dayKey: string; startedAt: number }
export interface RewardedShakeLedger { dayKey: string | null; dailyGranted: number; pendingAttempt: RewardedShakePending | null; receipts: RewardedShakeReceipt[] }
export interface RewardedReviveReceipt {
  attemptId: UUID; runId: UUID; failureId: UUID; rewardKind: 'spill_revive'; amount: 1; policyVersion: string; dayKey: string; status: 'COMMITTED'; grantedAt: number;
}
export interface RewardedRevivePending { attemptId: UUID; runId: UUID; failureId: UUID; policyVersion: string; amount: 1; dayKey: string; startedAt: number }
export interface RewardedReviveLedger { dayKey: string | null; dailyGranted: number; pendingAttempt: RewardedRevivePending | null; receipts: RewardedReviveReceipt[] }
export interface LocalLastResult {
  runId: UUID; reason: TerminalReason; score: number; maxLevel: Level; dropIndex: number; baseUsed: number; extraUsed: number;
  boardType: BoardType; rulesVersion?: string;
}
export interface LocalSaveBundle { profile: LocalProfile; run: RunSnapshot | null; lastResult: LocalLastResult | null }
export interface LocalSaveEnvelopeV2 { schemaVersion: 2; revision: number; payload: LocalSaveBundle; checksum: string }
export type LocalSaveEnvelope = LocalSaveEnvelopeV2;
export interface CommitReceipt { revision: number; committed: boolean; pointerUpdated: boolean; warning?: string }
export type SaveReadResult = { ok: true; data: { envelope: LocalSaveEnvelope | null; recoveredFromSlot: 'A' | 'B' | null; warning?: string } } | Result<never>;
export interface IBundleSaveRepository {
  readBundle(): Promise<SaveReadResult>;
  commitBundle(expectedRevision: number, expectedRunId: UUID | null, next: LocalSaveBundle): Promise<Result<CommitReceipt>>;
  acquireWriteLease(): Promise<Result<{ release(): void; mode: 'persistent' | 'memory-only' }>>;
}
export interface IRunEngine {
  dispatch(command: RunCommand): Result<void>;
  advanceOneTick(): readonly DomainEvent[];
  snapshot(): RunSnapshot;
  restore(snapshot: RunSnapshot): Result<void>;
  dispose(): void;
}
export interface LocalSettings { musicGain: number; sfxGain: number; reducedMotion: boolean; dropMode: 'drag_release' | 'tap_confirm'; tutorialCompleted: boolean }
export interface LocalProfileV1 {
  schemaVersion: 1; settings: LocalSettings; discoveredLevels: Level[];
  unlockedStageIds: StageId[]; bestScores: Partial<Record<StageId, Partial<Record<BoardType, number>>>>;
  bestScoresByRules?: Record<string, Partial<Record<StageId, Partial<Record<BoardType, number>>>>>; tutorialRulesVersion?: string | null;
  activeRunId: UUID | null; revision: number;
}
export interface LocalProfile extends Omit<LocalProfileV1, 'schemaVersion'> {
  schemaVersion: 3;
  /** Proof that a trusted natural run (CUP_FULL/SPILLED) finished on this device. */
  firstNaturalRunCompleted: boolean;
  rewardedShake: RewardedShakeLedger;
  rewardedRevive: RewardedReviveLedger;
}
/** Previous profile schema kept only for migration reads. */
export type LocalProfileV2 = Omit<LocalProfile, 'schemaVersion' | 'rewardedRevive'> & { schemaVersion: 2 };
export interface ISaveRepository {
  readProfile(): Result<LocalProfile>;
  readActiveRun(): Result<RunSnapshot | null>;
  writeRun(snapshot: RunSnapshot): Result<void>;
  writeProfile(profile: LocalProfile): Result<void>;
  clearActiveRun(expectedRunId: UUID): Result<void>;
}
export interface PlatformCapabilities { login: boolean; recording: boolean; publishVideo: boolean; rewardedAds: boolean; sidebarRevisit: boolean }
export interface VideoClip { localPath: string; runId: UUID; durationMs: number; contentFingerprint: string }
export interface PublishResult { status: 'published' | 'cancelled' | 'failed'; providerContentId?: string; providerProof?: string; requestId: UUID }
export interface AdResult { status: 'completed' | 'cancelled' | 'unavailable' | 'failed'; providerProof?: string; requestId: UUID }
export interface IPlatformAdapter {
  capabilities(): PlatformCapabilities;
  login(): Promise<Result<{ code: string }>>;
  startRecording(runId: UUID): Promise<Result<void>>;
  stopRecording(): Promise<Result<VideoClip>>;
  publishVideo(clip: VideoClip, requestId: UUID): Promise<Result<PublishResult>>;
  showRewardedAd(placementId: string, requestId: UUID): Promise<Result<AdResult>>;
  onHide(handler: () => void): () => void;
  onShow(handler: () => void): () => void;
  dispose(): void;
}
export interface ApiEnvelope<T> { data: T; requestId: UUID; serverTime: string }
export interface ApiFailure { error: DomainError; requestId: UUID; serverTime: string }
export interface ServerSession { playerId: UUID; accessToken: string; expiresAt: string }
export interface StartRunRequest { stageId: StageId; mode: GameMode; rulesVersion: string; challengeId?: UUID; dailyId?: string }
export interface StartRunResponse { runId: UUID; seed: number; rulesVersion: string; boardType: BoardType; baseShakes: number; extraShakeLimit: number; dropBudget: number | null }
export interface FinishRunRequest { finalSnapshot: RunSnapshot; commands: RunCommand[]; events: DomainEvent[]; clientScore: number; terminalReason: TerminalReason }
export interface RunResult { runId: UUID; status: VerificationStatus; score: number | null; maxLevel: Level | null; boardType: BoardType; unlockedStageIds: StageId[]; rejectionCode?: string }
export interface CloudProgress { revision: number; unlockedStageIds: StageId[]; discoveredLevels: Level[]; settings: LocalSettings; activeRun: RunSnapshot | null }
export interface CouponBalance { beijingDay: string; dailyGranted: number; dailyLimit: 5; available: number; expiresAt: string | null }
export interface RewardClaimRequest { intentId: UUID; runId: UUID; providerContentId: string; providerProof: string }
export interface RewardGrant { grantId: UUID; duplicate: boolean; granted: 1; balance: CouponBalance }
export interface ShakeConsumeResponse { consumeEventId: UUID; duplicate: boolean; runExtraUsed: number; boardType: 'assisted'; balance: CouponBalance }
export interface LeaderboardEntry { playerId: UUID; displayName: string; avatarUrl: string | null; score: number; rank: number; isSelf: boolean }
export interface LeaderboardPage { entries: LeaderboardEntry[]; self: LeaderboardEntry | null; totalPlayers: number; strictlyBelowSelf: number | null; asOf: string; nextCursor: string | null }
export interface DailyChallenge { dailyId: string; stageId: StageId; rulesVersion: string; seed: number; dropBudget: number; baseShakes: 2; extraShakes: 0; startsAt: string; submitBefore: string }
export interface FriendChallenge { challengeId: UUID; stageId: StageId; rulesVersion: string; seed: number; dropBudget: number; baseShakes: 2; extraShakes: 0; expiresAt: string; status: 'open' | 'closed'; result: 'pending' | 'win' | 'tie' | 'loss' }
export interface CosmeticDefinition { cosmeticId: string; artAssetId: string; unlockKind: 'achievement' | 'default'; unlockKey: string; physicsOverride: never | null }
export interface RewardedAdPolicy { enabled: boolean; policyVersion: string; rewardKind: 'unconfigured' | 'cosmetic_token'; amount: number; dailyLimit: number; affectsRankedRun: false }
/** Runtime Tap rewarded-video policy for the extra-shake placement. Closed by default until a real ad unit is configured. */
export interface RewardedShakePolicy {
  enabled: boolean; policyVersion: string; adUnitId: string | null; placement: 'extra-shake';
  maxExtraShakesPerRun: number; maxDailyRewardedShakes: number;
  minForegroundSecondsFirstSession: number; requireTutorialComplete: boolean; requireFirstNaturalRunCompleted: boolean;
}
/** Runtime Tap rewarded-video policy for the once-per-run spill revive placement. Closed by default. */
export interface SpillRevivePolicy {
  enabled: boolean; policyVersion: string; adUnitId: string | null; placement: 'spill-revive';
  maxRevivesPerRun: 1; clearanceDu: number; autoDropDelayTicks: number;
  minForegroundSecondsFirstSession: number; requireTutorialComplete: boolean; requireFirstNaturalRunCompleted: boolean;
}
export type RewardedAdCapability = 'SUPPORTED' | 'UNSUPPORTED' | 'UNCONFIGURED' | 'DISABLED';
export type RewardedAdOutcome =
  | { kind: 'COMPLETED'; attemptId: UUID }
  | { kind: 'CANCELLED' | 'UNAVAILABLE' | 'FAILED'; attemptId: UUID; errorCode: string };
export interface IRewardedAdProvider {
  readonly providerName: 'tap' | 'debug-mock';
  capability(): RewardedAdCapability;
  prepare(): Promise<Result<void>>;
  show(attemptId: UUID): Promise<RewardedAdOutcome>;
  dispose(): void;
}

export interface LogBatch { firstSequence: number; previousBatchHash: string | null; commands: RunCommand[]; events: DomainEvent[]; batchHash: string }
export interface LogReceipt { lastSequence: number; batchHash: string; duplicate: boolean }

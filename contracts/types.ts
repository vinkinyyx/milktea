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
export interface ShakeState { baseUsed: number; extraUsed: number; activeStartTick: number | null; cooldownUntilTick: number }
export interface RngState { algorithm: 'xorshift32_v1_nonzero_seed'; state: number; drawCount: number }
export interface RunSnapshot {
  saveSchemaVersion: 1; rulesVersion: string; appVersion: string; runId: UUID; epoch: number;
  revision: number; stageId: StageId; mode: GameMode; boardType: BoardType;
  state: PhaseState; tick: number; nextEntityId: number; nextCommandSequence: number;
  score: number; maxLevel: Level; dropIndex: number; currentLevel: Level; nextLevel: Level;
  lastDropTick: number | null; settleStartedTick: number | null;
  challenge: { id: string; deadlineAt: string; dropBudget: 120 } | null;
  rng: RngState; ingredients: IngredientState[]; shake: ShakeState; dangerTicks: number;
  terminalReason: TerminalReason | null; checksum: string;
}
interface CommandBase { runId: UUID; commandId: UUID; sequence: number; tick: number }
export type RunCommand =
  | (CommandBase & { kind: 'DROP'; xDu: number })
  | (CommandBase & { kind: 'SHAKE'; source: 'base'; consumeEventId?: never })
  | (CommandBase & { kind: 'SHAKE'; source: 'coupon'; consumeEventId: UUID })
  | (CommandBase & { kind: 'PAUSE' | 'RESUME' | 'ABANDON' });
interface EventBase { eventId: UUID; runId: UUID; tick: number }
export type DomainEvent =
  | (EventBase & { kind: 'IngredientDropped'; entityId: number; level: Level; dropIndex: number })
  | (EventBase & { kind: 'MergeCommitted'; parents: [number, number]; childId: number; childLevel: Level; scoreDelta: number; units: number; positionDu: Vec2 })
  | (EventBase & { kind: 'ShakeConsumed'; source: 'base' | 'coupon'; consumeEventId?: UUID })
  | (EventBase & { kind: 'DangerChanged'; dangerTicks: number })
  | (EventBase & { kind: 'RunEnded'; reason: TerminalReason; score: number });
export interface ContactPair { contactId: string; firstId: number; secondId: number | null; normalSpeed: number }
/** secondId=null means a static cup boundary. Logical eligibility stays owned by RunEngine. */
export type PhysicalBodyState = Pick<IngredientState, 'entityId' | 'positionDu' | 'velocityDuPerSecond' | 'angleRadians' | 'angularVelocity' | 'sleeping'>;
export interface BodyDefinition { entityId: number; level: Level; radiusDu: number; positionDu: Vec2; velocityDuPerSecond: Vec2 }
export interface IPhysicsAdapter {
  createCup(stageId: StageId): void;
  createBody(definition: BodyDefinition): void;
  destroyBody(entityId: number): void;
  stepFixed(): void;
  applyHorizontalAcceleration(entityId: number, accelerationSpecUnits: number): void;
  getContacts(): readonly ContactPair[];
  getBody(entityId: number): PhysicalBodyState | undefined;
  restoreBodies(states: readonly IngredientState[]): void;
  canSpawn(level: Level, xDu: number): boolean;
  dispose(): void;
}
export interface IRunEngine {
  dispatch(command: RunCommand): Result<void>;
  advanceOneTick(): readonly DomainEvent[];
  snapshot(): RunSnapshot;
  restore(snapshot: RunSnapshot): Result<void>;
  dispose(): void;
}
export interface LocalSettings { musicGain: number; sfxGain: number; reducedMotion: boolean; dropMode: 'drag_release' | 'tap_confirm'; tutorialCompleted: boolean }
export interface LocalProfile {
  schemaVersion: 1; settings: LocalSettings; discoveredLevels: Level[];
  unlockedStageIds: StageId[]; bestScores: Partial<Record<StageId, Partial<Record<BoardType, number>>>>;
  activeRunId: UUID | null; revision: number;
}
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

export interface LogBatch { firstSequence: number; previousBatchHash: string | null; commands: RunCommand[]; events: DomainEvent[]; batchHash: string }
export interface LogReceipt { lastSequence: number; batchHash: string; duplicate: boolean }

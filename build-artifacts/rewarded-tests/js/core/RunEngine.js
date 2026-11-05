"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunEngine = void 0;
const CloneState_1 = require("./CloneState");
const RunRng_1 = require("./RunRng");
const SpawnRng_1 = require("./SpawnRng");
const EventIdentity_1 = require("./EventIdentity");
const Sha256_1 = require("./Sha256");
const REVIVE_OFF = Object.freeze({ enabled: false, clearanceDu: 0, autoDropDelayTicks: 0 });
const success = (data) => ({ ok: true, data });
const failure = (code, message, retryable = false) => ({ ok: false, error: { code, message, retryable } });
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Single writer for P1-B run state. It advances only when the owning FixedClock calls advanceOneTick. */
class RunEngine {
    constructor(adapter, rules, runId, seed, restored, reviveOptions = REVIVE_OFF) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        this.adapter = adapter;
        this.rules = rules;
        this.reviveOptions = reviveOptions;
        this.pending = null;
        this.outcomes = new Map();
        this.usedMergeEvents = new Set();
        this.lastCommandOutcome = null;
        this.ended = false;
        this.shakenAt = [];
        this._lastPhysicsMs = 0;
        this._lastLogicMs = 0;
        this._lastTickFault = null;
        this._recoveryCheckpoint = null;
        this.timingDiagnostics = false;
        this.settleTicksRemaining = 0;
        this.rng = new RunRng_1.RunRng(seed, restored === null || restored === void 0 ? void 0 : restored.rng.state, (_a = restored === null || restored === void 0 ? void 0 : restored.rng.drawCount) !== null && _a !== void 0 ? _a : 0);
        this.spawnRng = new SpawnRng_1.SpawnRng(seed, (_b = restored === null || restored === void 0 ? void 0 : restored.spawnRng) === null || _b === void 0 ? void 0 : _b.state, (_d = (_c = restored === null || restored === void 0 ? void 0 : restored.spawnRng) === null || _c === void 0 ? void 0 : _c.drawCount) !== null && _d !== void 0 ? _d : 0);
        const initialLevel = restored === null || restored === void 0 ? void 0 : restored.currentLevel;
        this.state = restored ? (0, CloneState_1.cloneState)(restored) : {
            saveSchemaVersion: 5, rulesVersion: rules.design_rules_version, appVersion: '0.1.0', runId, epoch: 1, revision: 0,
            stageId: 'classic', mode: 'classic', boardType: 'standard', state: 'PLAYING', tick: 0, nextEntityId: 1,
            nextCommandSequence: 1, score: 0, maxLevel: 1, dropIndex: 0, currentLevel: this.rng.nextLevel(rules.drop.spawn_levels),
            nextLevel: this.rng.nextLevel(rules.drop.spawn_levels), lastDropTick: null, settleStartedTick: null, challenge: null,
            rng: this.rng.snapshot(), ingredients: [], shake: { baseUsed: 0, extraGranted: 0, extraUsed: 0, activeStartTick: null, cooldownUntilTick: 0 },
            spawnRng: this.spawnRng.snapshot(),
            dangerTicks: 0, terminalReason: null, cupMotion: { offsetXDu: 0, velocityXDuPerSecond: 0, targetOffsetXDu: 0, control: 'IDLE' },
            autoDrop: { nextDueTick: rules.auto_drop.interval_ticks, pendingSpawn: { level: initialLevel !== null && initialLevel !== void 0 ? initialLevel : 1, xDu: rules.cup.center_x_du, vxDuPerSecond: 0, angularVelocity: 0 } },
            revive: { used: 0, pendingFailure: null, committedReceiptId: null }, checksum: '',
        };
        if (!restored)
            this.state.autoDrop.pendingSpawn = this.nextSpawn(this.state.currentLevel);
        if (restored) {
            this.rng = new RunRng_1.RunRng(seed, restored.rng.state, restored.rng.drawCount);
            this.adapter.createCup(restored.stageId, (_f = (_e = restored.cupMotion) === null || _e === void 0 ? void 0 : _e.offsetXDu) !== null && _f !== void 0 ? _f : 0);
            this.adapter.restoreBodies(restored.ingredients);
            this.state.state = 'PAUSED';
            this.state.cupMotion = { offsetXDu: (_h = (_g = restored.cupMotion) === null || _g === void 0 ? void 0 : _g.offsetXDu) !== null && _h !== void 0 ? _h : 0, velocityXDuPerSecond: 0, targetOffsetXDu: (_k = (_j = restored.cupMotion) === null || _j === void 0 ? void 0 : _j.offsetXDu) !== null && _k !== void 0 ? _k : 0, control: 'IDLE' };
            this.state.epoch++;
        }
    }
    get phase() { return this.state.state; }
    get tick() { return this.state.tick; }
    get presentationCupOffsetXDu() { return this.adapter.getCupOffsetX(); }
    get presentationShakeStartTick() { return this.state.shake.activeStartTick; }
    get presentationTick() { return this.state.tick; }
    get entityCount() { return this.state.ingredients.length; }
    get hasPendingCommand() { return this.pending !== null; }
    get currentOutcome() { return this.lastCommandOutcome ? { ...this.lastCommandOutcome } : null; }
    get lastPhysicsMs() { return this._lastPhysicsMs; }
    get lastLogicMs() { return this._lastLogicMs; }
    get lastTickFault() { return this._lastTickFault; }
    /** Complete pre-transaction data also supports hosts without durable storage. */
    get recoveryCheckpoint() { return this._recoveryCheckpoint ? (0, CloneState_1.cloneState)(this._recoveryCheckpoint) : null; }
    get spillPending() { return this.state.revive.pendingFailure ? (0, CloneState_1.cloneState)(this.state.revive.pendingFailure) : null; }
    get reviveUsed() { return this.state.revive.used; }
    get reviveReceiptId() { return this.state.revive.committedReceiptId; }
    /** Snapshot of the cleaned run after revive, used by the host to persist the reward atomically before applying it. */
    projectRevive(receiptId) {
        const pending = this.state.revive.pendingFailure;
        if (!pending)
            return failure('NO_SPILL_PENDING', '当前没有待处理的洒出复活');
        if (!UUID_PATTERN.test(receiptId))
            return failure('INVALID_RECEIPT', '复活奖励凭证无效');
        if (this.state.revive.used !== 0)
            return failure('REVIVE_ALREADY_USED', '本局复活次数已用完');
        const candidate = this.computeSpillCandidate(pending.detectedTick, pending.spilledEntityIds);
        if (candidate.candidateHash !== pending.candidateHash)
            return failure('REVIVE_CANDIDATE_MISMATCH', '复活候选与冻结现场不一致');
        if (candidate.ingredients.length === 0)
            return failure('REVIVE_EMPTY', '清理后杯中没有可继续的小料');
        const projected = (0, CloneState_1.cloneState)(this.state);
        projected.ingredients = candidate.ingredients;
        projected.score = candidate.score;
        projected.maxLevel = candidate.maxLevel;
        projected.dropIndex = candidate.dropIndex;
        projected.currentLevel = candidate.currentLevel;
        projected.nextLevel = candidate.nextLevel;
        projected.nextEntityId = candidate.nextEntityId;
        projected.dangerTicks = candidate.dangerTicks;
        projected.shake = { ...candidate.shake };
        projected.cupMotion = { offsetXDu: 0, velocityXDuPerSecond: 0, targetOffsetXDu: 0, control: 'IDLE' };
        projected.autoDrop = { nextDueTick: projected.tick + Math.max(0, this.reviveOptions.autoDropDelayTicks), pendingSpawn: { ...candidate.autoDrop.pendingSpawn } };
        projected.revive = { used: 1, pendingFailure: null, committedReceiptId: receiptId };
        projected.boardType = 'assisted';
        projected.state = 'PAUSED';
        projected.terminalReason = null;
        projected.rng = this.rng.snapshot();
        projected.spawnRng = this.spawnRng.snapshot();
        projected.revision += 1;
        projected.epoch += 1;
        projected.checksum = '';
        return success(projected);
    }
    /** Deterministic cleanup projection for the frozen spill step; rebuilt from the paused snapshot and config. */
    spillCandidate() {
        const pending = this.state.revive.pendingFailure;
        return pending ? this.computeSpillCandidate(pending.detectedTick, pending.spilledEntityIds) : null;
    }
    /** Claim the once-per-run revive after the host persisted the reward receipt. */
    applyRevive(receiptId) {
        const pending = this.state.revive.pendingFailure;
        if (!pending)
            return failure('NO_SPILL_PENDING', '当前没有待处理的洒出复活');
        if (this.state.state !== 'PAUSED' || this.ended)
            return failure('INVALID_PHASE', '当前局不接受复活');
        if (this.state.revive.used !== 0)
            return failure('REVIVE_ALREADY_USED', '本局复活次数已用完');
        if (typeof receiptId !== 'string' || !UUID_PATTERN.test(receiptId))
            return failure('INVALID_RECEIPT', '复活奖励凭证无效');
        const candidate = this.computeSpillCandidate(pending.detectedTick, pending.spilledEntityIds);
        if (candidate.candidateHash !== pending.candidateHash)
            return failure('REVIVE_CANDIDATE_MISMATCH', '复活候选与冻结现场不一致');
        if (candidate.ingredients.length === 0)
            return failure('REVIVE_EMPTY', '清理后杯中没有可继续的小料');
        for (const entityId of candidate.removedEntityIds) {
            try {
                if (this.adapter.getBody(entityId))
                    this.adapter.destroyBody(entityId);
            }
            catch { /* missing body is already clean */ }
        }
        this.adapter.createCup(this.state.stageId, candidate.cupOffsetXDu);
        this.adapter.setCupVelocityX(0);
        this.adapter.restoreBodies(candidate.ingredients);
        this.state.ingredients = candidate.ingredients;
        this.state.score = candidate.score;
        this.state.maxLevel = candidate.maxLevel;
        this.state.dropIndex = candidate.dropIndex;
        this.state.currentLevel = candidate.currentLevel;
        this.state.nextLevel = candidate.nextLevel;
        this.state.nextEntityId = candidate.nextEntityId;
        this.state.dangerTicks = candidate.dangerTicks;
        this.state.shake = { ...candidate.shake };
        this.state.cupMotion = { offsetXDu: candidate.cupOffsetXDu, velocityXDuPerSecond: 0, targetOffsetXDu: candidate.cupOffsetXDu, control: 'IDLE' };
        this.state.autoDrop = { nextDueTick: this.state.tick + Math.max(0, this.reviveOptions.autoDropDelayTicks), pendingSpawn: { ...candidate.autoDrop.pendingSpawn } };
        this.state.revive = { used: 1, pendingFailure: null, committedReceiptId: receiptId };
        this.state.boardType = 'assisted';
        this.state.state = 'PAUSED';
        this.state.terminalReason = null;
        this.state.epoch++;
        this.state.revision++;
        this.shakenAt = [];
        this._recoveryCheckpoint = null;
        return success(undefined);
    }
    /** Player declined or the ad did not complete: preserve the frozen result and settle the spill. */
    declineRevive() {
        if (!this.state.revive.pendingFailure)
            return null;
        this.state.revive.pendingFailure = null;
        return this.end('SPILLED', this.state.tick);
    }
    setTimingDiagnostics(enabled) { this.timingDiagnostics = enabled; }
    setCupTarget(offsetXDu) {
        if (this.state.state !== 'PLAYING' || !Number.isFinite(offsetXDu))
            return;
        const max = this.rules.cup_motion.max_offset_du;
        this.state.cupMotion.targetOffsetXDu = Math.max(-max, Math.min(max, offsetXDu));
        this.state.cupMotion.control = 'DRAGGING';
    }
    releaseCup() { if (this.state.cupMotion.control === 'DRAGGING') {
        this.state.cupMotion.control = 'SETTLING';
        this.settleTicksRemaining = this.rules.cup_motion.settle_max_ticks;
    } }
    /** Ad reward is granted only after the coordinator persisted the projected snapshot. */
    extraShakesAvailable() { return Math.max(0, this.state.shake.extraGranted - this.state.shake.extraUsed); }
    projectExtraGrant(amount) {
        const snapshot = this.snapshot();
        snapshot.shake = { ...snapshot.shake, extraGranted: snapshot.shake.extraGranted + amount };
        snapshot.revision += 1;
        return snapshot;
    }
    commitExtraGrant(amount) {
        if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 5)
            return failure('INVALID_GRANT', '奖励晃杯授予数量无效');
        if (this.state.state !== 'PLAYING' && this.state.state !== 'PAUSED')
            return failure('INVALID_PHASE', '当前局不接受奖励晃杯');
        this.state.shake.extraGranted += amount;
        this.state.revision++;
        return success(undefined);
    }
    cancelCupInput(freeze = false) {
        this.state.cupMotion.control = 'IDLE';
        this.settleTicksRemaining = 0;
        this.state.cupMotion.velocityXDuPerSecond = 0;
        this.state.cupMotion.targetOffsetXDu = this.adapter.getCupOffsetX();
        this.adapter.setCupVelocityX(0);
    }
    renderStates() { this.refreshPhysicalStates(); return this.state.ingredients; }
    dispatch(envelope) {
        var _a, _b;
        if (!envelope || typeof envelope !== 'object' || !envelope.command || typeof envelope.command !== 'object'
            || !Number.isSafeInteger(envelope.ownerEpoch) || Object.keys(envelope).some(k => k !== 'command' && k !== 'ownerEpoch'))
            return failure('INVALID_COMMAND', '命令信封字段无效');
        const command = envelope.command;
        if (!command || typeof command !== 'object')
            return failure('INVALID_COMMAND', '命令结构无效');
        if (typeof command.commandId !== 'string' || typeof command.runId !== 'string'
            || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(command.commandId)
            || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(command.runId))
            return failure('INVALID_UUID', '局ID和命令ID必须是合法UUID');
        if (command.kind !== 'DROP' && command.kind !== 'SHAKE')
            return failure('CONTROL_ROUTE_REQUIRED', '暂停、继续和放弃必须经会话控制边界');
        const commandKeys = command.kind === 'DROP' ? ['kind', 'runId', 'commandId', 'sequence', 'tick', 'xDu'] : ['kind', 'runId', 'commandId', 'sequence', 'tick', 'source'];
        if (Object.keys(command).some(k => !commandKeys.includes(k)) || commandKeys.some(k => !(k in command)))
            return failure('INVALID_COMMAND', '玩法命令字段不符合其类型');
        if (command.kind === 'DROP')
            return failure('MANUAL_DROP_DISABLED', '新版规则只按固定步自动落料');
        if (command.kind === 'SHAKE' && command.source !== 'base' && command.source !== 'rewarded_ad')
            return failure('INVALID_COMMAND', '当前玩法只接受基础晃杯或广告奖励晃杯命令');
        if (this.state.state !== 'PLAYING' || this.ended)
            return failure('INVALID_PHASE', '当前局不接受玩法命令');
        const previous = this.outcomes.get(command.commandId);
        if (previous)
            return previous.status === 'APPLIED' ? success({ accepted: true, sequence: previous.sequence }) : failure((_a = previous.errorCode) !== null && _a !== void 0 ? _a : 'COMMAND_REPLAY', (_b = previous.message) !== null && _b !== void 0 ? _b : '此命令已处理');
        if (command.runId !== this.state.runId || envelope.ownerEpoch !== this.state.epoch)
            return failure('STALE_OWNER', '局或恢复代次已变化');
        if (!Number.isSafeInteger(command.sequence) || command.sequence !== this.state.nextCommandSequence)
            return failure('SEQUENCE_CONFLICT', '命令序号冲突');
        const expectedTick = this.state.tick + 1;
        if (!Number.isSafeInteger(command.tick) || command.tick !== expectedTick)
            return failure('TARGET_TICK_CONFLICT', '玩法命令目标必须是下一逻辑步');
        if (this.pending)
            return failure('INPUT_BUSY', '上一条操作尚未确认', true);
        this.pending = { envelope, dispatchedAt: this.state.tick };
        return success({ accepted: true, sequence: command.sequence });
    }
    advanceOneTick() {
        if (this.state.state !== 'PLAYING' || this.ended)
            return [];
        const logicStart = this.timingDiagnostics ? performance.now() : 0;
        const checkpoint = this.snapshot();
        const pendingBefore = this.pending ? (0, CloneState_1.cloneState)(this.pending) : null;
        const outcomesBefore = new Map(this.outcomes);
        const mergeEventsBefore = new Set(this.usedMergeEvents);
        const lastOutcomeBefore = this.lastCommandOutcome ? { ...this.lastCommandOutcome } : null;
        const events = [];
        const nextTick = this.state.tick + 1;
        if (!Number.isSafeInteger(nextTick))
            throw new Error('RUN_TICK_OVERFLOW');
        try {
            this.advanceCupMotion();
            if (this.pending)
                this.consumePending(nextTick, events);
            this.applyShake(nextTick);
            this.tryAutomaticDrop(nextTick, events);
            const physicsStart = this.timingDiagnostics ? performance.now() : 0;
            this.adapter.stepFixed();
            const reported = this.adapter.lastStepTimings;
            this._lastPhysicsMs = !this.timingDiagnostics ? 0 : reported ? reported.syncToPhysics + reported.physicsStep + reported.syncFromPhysics + reported.velocityClamp : performance.now() - physicsStart;
            this.refreshPhysicalStates();
            const maxCupOffset = this.rules.cup_motion.max_offset_du;
            this.state.cupMotion.offsetXDu = Math.max(-maxCupOffset, Math.min(maxCupOffset, this.adapter.getCupOffsetX()));
            const contacts = this.adapter.getContacts();
            for (const contact of contacts) {
                this.markEligible(contact.firstId);
                if (contact.secondId !== null)
                    this.markEligible(contact.secondId);
            }
            this.resolveMerges(nextTick, contacts, events);
            const cupFull = this.updateDanger(nextTick, events);
            const spilledIds = this.updateSpill(nextTick);
            if (spilledIds.length) {
                if (this.beginSpillPending(nextTick, spilledIds))
                    events.push({ kind: 'SpillReviveOffered', eventId: (0, EventIdentity_1.deterministicEventId)(this.state.runId, 'SpillReviveOffered', nextTick, spilledIds), runId: this.state.runId, tick: nextTick, failureId: this.state.revive.pendingFailure.failureId, candidateHash: this.state.revive.pendingFailure.candidateHash });
                else
                    events.push(this.end('SPILLED', nextTick));
            }
            else if (cupFull)
                events.push(this.end('CUP_FULL', nextTick));
            this.state.tick = nextTick;
            this.state.rng = this.rng.snapshot();
            this.state.revision++;
            this.assertInvariants();
            this._lastLogicMs = this.timingDiagnostics ? Math.max(0, performance.now() - logicStart - this._lastPhysicsMs) : 0;
            this._lastTickFault = null;
            return events;
        }
        catch (error) {
            this._recoveryCheckpoint = (0, CloneState_1.cloneState)(checkpoint);
            this.spawnRng = new SpawnRng_1.SpawnRng(checkpoint.spawnRng.state, checkpoint.spawnRng.state, checkpoint.spawnRng.drawCount);
            const fault = error instanceof Error ? `${error.name}:${error.message}` : String(error);
            let rollbackFault = null;
            try {
                this.adapter.createCup(checkpoint.stageId, checkpoint.cupMotion.offsetXDu);
                this.adapter.setCupVelocityX(checkpoint.cupMotion.velocityXDuPerSecond);
                this.adapter.restoreBodies(checkpoint.ingredients);
            }
            catch (rollbackError) {
                rollbackFault = rollbackError instanceof Error ? `${rollbackError.name}:${rollbackError.message}` : String(rollbackError);
            }
            this.state = checkpoint;
            this.rng = new RunRng_1.RunRng(checkpoint.rng.state, checkpoint.rng.state, checkpoint.rng.drawCount);
            this.pending = pendingBefore;
            this.outcomes.clear();
            for (const [id, outcome] of outcomesBefore)
                this.outcomes.set(id, outcome);
            this.usedMergeEvents.clear();
            for (const id of mergeEventsBefore)
                this.usedMergeEvents.add(id);
            this.lastCommandOutcome = lastOutcomeBefore;
            this._lastTickFault = rollbackFault ? `${fault}|ROLLBACK:${rollbackFault}` : fault;
            if (this.pending) {
                this.pending = null;
                this.state.nextCommandSequence++;
            }
            this.state.state = 'PAUSED';
            this.state.terminalReason = null;
            this._lastLogicMs = this.timingDiagnostics ? Math.max(0, performance.now() - logicStart - this._lastPhysicsMs) : 0;
            return [];
        }
    }
    pause(reason) {
        this.cancelPending('PAUSED_BEFORE_APPLY');
        if (this.state.state === 'PLAYING')
            this.state.state = 'PAUSED';
        if (reason === 'TECHNICAL_ERROR') {
            this.state.state = 'PAUSED';
            this.state.terminalReason = null;
        }
    }
    resume() {
        if (this.state.state !== 'PAUSED')
            return failure('INVALID_PHASE', '当前不能继续');
        this.state.state = 'PLAYING';
        this.state.epoch++;
        this.state.revision++;
        this.state.cupMotion.velocityXDuPerSecond = 0;
        this.state.cupMotion.targetOffsetXDu = this.state.cupMotion.offsetXDu;
        this.state.cupMotion.control = 'IDLE';
        this.adapter.setCupVelocityX(0);
        const resumeDelay = Math.max(this.rules.auto_drop.resume_delay_ticks, this.state.autoDrop.nextDueTick - this.state.tick);
        this.state.autoDrop.nextDueTick = this.state.tick + resumeDelay;
        return success(undefined);
    }
    abandon() {
        if (this.ended || !['PLAYING', 'PAUSED'].includes(this.state.state))
            return null;
        this.cancelPending('RUN_ABANDONED');
        return this.end('ABANDONED', this.state.tick);
    }
    snapshot() {
        this.refreshPhysicalStates();
        this.state.rng = this.rng.snapshot();
        this.state.spawnRng = this.spawnRng.snapshot();
        return (0, CloneState_1.cloneState)({ ...this.state, ingredients: this.state.ingredients.slice().sort((a, b) => a.entityId - b.entityId) });
    }
    restore(snapshot) {
        const validation = this.validateSnapshot(snapshot);
        if (!validation.ok)
            return validation;
        this.adapter.createCup(snapshot.stageId, snapshot.cupMotion.offsetXDu);
        this.adapter.setCupVelocityX(0);
        this.adapter.restoreBodies(snapshot.ingredients);
        this.state = (0, CloneState_1.cloneState)(snapshot);
        this.state.state = 'PAUSED';
        this.state.cupMotion = { offsetXDu: snapshot.cupMotion.offsetXDu, velocityXDuPerSecond: 0, targetOffsetXDu: snapshot.cupMotion.offsetXDu, control: 'IDLE' };
        this.state.epoch++;
        this.rng = new RunRng_1.RunRng(snapshot.rng.state, snapshot.rng.state, snapshot.rng.drawCount);
        this.spawnRng = new SpawnRng_1.SpawnRng(snapshot.spawnRng.state, snapshot.spawnRng.state, snapshot.spawnRng.drawCount);
        this.ended = !!snapshot.terminalReason;
        this.pending = null;
        return success(undefined);
    }
    dispose() { this.pending = null; this.adapter.dispose(); }
    consumePending(tick, events) {
        const pending = this.pending;
        this.pending = null;
        const c = pending.envelope.command;
        let status = 'REJECTED';
        let errorCode;
        let message;
        if (c.runId !== this.state.runId || pending.envelope.ownerEpoch !== this.state.epoch) {
            errorCode = 'STALE_OWNER';
            message = '旧局命令已取消';
            status = 'CANCELLED';
        }
        else if (c.sequence !== this.state.nextCommandSequence) {
            errorCode = 'SEQUENCE_CONFLICT';
            message = '命令序号不匹配';
        }
        else if (c.kind === 'DROP') {
            const interval = Math.round(0.45 * this.rules.physics.fixed_hz);
            const blocked = this.state.shake.activeStartTick !== null && tick < this.state.shake.activeStartTick + 48;
            const x = this.clampSpawnX(this.state.currentLevel, c.xDu);
            if (this.state.lastDropTick !== null && tick - this.state.lastDropTick < interval) {
                errorCode = 'COOLDOWN';
                message = '投放间隔未到';
            }
            else if (blocked) {
                errorCode = 'SHAKE_ACTIVE';
                message = '晃杯期间不能投放';
            }
            else if (!this.adapter.canSpawn(this.state.currentLevel, x)) {
                errorCode = 'SPAWN_BLOCKED';
                message = '杯口被挡住，可移动或晃杯';
            }
            else {
                const entityId = this.state.nextEntityId;
                const item = this.rules.ingredients.find(i => i.level === this.state.currentLevel);
                try {
                    this.adapter.createBody({ entityId, level: item.level, radiusDu: item.radius_du,
                        positionDu: { x, y: this.rules.cup.spawn_y_du }, velocityDuPerSecond: { x: 0, y: 0 } });
                    this.state.ingredients.push({ entityId, level: item.level, positionDu: { x, y: this.rules.cup.spawn_y_du },
                        velocityDuPerSecond: { x: 0, y: 0 }, angleRadians: 0, angularVelocity: 0, bornTick: tick,
                        dangerEligible: false, hasEnteredCup: false, spillTicks: 0, sleeping: false });
                    this.state.nextEntityId++;
                    this.state.dropIndex++;
                    this.state.lastDropTick = tick;
                    this.state.maxLevel = Math.max(this.state.maxLevel, item.level);
                    this.state.currentLevel = this.state.nextLevel;
                    this.state.nextLevel = this.rng.nextLevel(this.rules.drop.spawn_levels);
                    this.state.autoDrop.pendingSpawn = this.nextSpawn(this.state.currentLevel);
                    this.state.spawnRng = this.spawnRng.snapshot();
                    const ev = { kind: 'IngredientDropped', eventId: (0, EventIdentity_1.deterministicEventId)(this.state.runId, 'IngredientDropped', tick, [entityId]),
                        runId: this.state.runId, tick, entityId, level: item.level, dropIndex: this.state.dropIndex };
                    events.push(ev);
                    status = 'APPLIED';
                }
                catch (error) {
                    try {
                        if (this.adapter.getBody(entityId))
                            this.adapter.destroyBody(entityId);
                    }
                    catch { }
                    errorCode = 'PHYSICS_CREATE_FAILED';
                    message = String(error);
                }
            }
        }
        else if (c.kind === 'SHAKE') {
            const shakeTicks = Math.round(this.rules.shake.duration_seconds * this.rules.physics.fixed_hz);
            const active = this.state.shake.activeStartTick !== null && tick < this.state.shake.activeStartTick + shakeTicks;
            const availableExtra = this.state.shake.extraGranted - this.state.shake.extraUsed;
            if (this.state.ingredients.length === 0) {
                errorCode = 'SHAKE_EMPTY';
                message = '杯中还没有小料';
            }
            else if (c.source === 'base' && this.state.shake.baseUsed >= 2) {
                errorCode = 'NO_BASE_SHAKES';
                message = '本局基础晃杯次数已用完';
            }
            else if (c.source === 'rewarded_ad' && availableExtra < 1) {
                errorCode = 'NO_EXTRA_SHAKES';
                message = '本局奖励晃杯次数已用完';
            }
            else if (active || tick < this.state.shake.cooldownUntilTick) {
                errorCode = 'SHAKE_COOLDOWN';
                message = '晃杯正在进行或冷却中';
            }
            else {
                if (c.source === 'base')
                    this.state.shake.baseUsed++;
                else {
                    this.state.shake.extraUsed++;
                    this.state.boardType = 'assisted';
                }
                this.state.shake.activeStartTick = tick;
                this.state.shake.cooldownUntilTick = tick + Math.round((this.rules.shake.duration_seconds + this.rules.shake.cooldown_seconds) * this.rules.physics.fixed_hz);
                events.push({ kind: 'ShakeConsumed', eventId: (0, EventIdentity_1.deterministicEventId)(this.state.runId, 'ShakeConsumed', tick, [c.sequence]), runId: this.state.runId, tick, source: c.source });
                status = 'APPLIED';
            }
        }
        else {
            errorCode = 'CONTROL_COMMAND_REQUIRES_SESSION';
            message = '控制命令必须由运行会话在控制边界处理';
        }
        this.state.nextCommandSequence++;
        this.lastCommandOutcome = { commandId: c.commandId, sequence: c.sequence, status, appliedTick: tick, errorCode, message };
        this.outcomes.set(c.commandId, this.lastCommandOutcome);
        if (this.outcomes.size > 256)
            this.outcomes.delete(this.outcomes.keys().next().value);
    }
    cancelPending(reason) {
        const pending = this.pending;
        if (!pending)
            return;
        this.pending = null;
        const command = pending.envelope.command;
        const outcome = { commandId: command.commandId, sequence: command.sequence,
            status: 'CANCELLED', appliedTick: this.state.tick, errorCode: reason, message: '玩法命令在暂停/结束边界前取消' };
        if (command.sequence === this.state.nextCommandSequence)
            this.state.nextCommandSequence++;
        this.lastCommandOutcome = outcome;
        this.outcomes.set(command.commandId, outcome);
        if (this.outcomes.size > 256)
            this.outcomes.delete(this.outcomes.keys().next().value);
        this.state.revision++;
    }
    applyShake(tick) {
        var _a, _b;
        const start = this.state.shake.activeStartTick, durationTicks = Math.round(this.rules.shake.duration_seconds * this.rules.physics.fixed_hz);
        if (start === null || tick < start || tick >= start + durationTicks)
            return;
        const cfg = this.rules.shake, t = (tick - start) / this.rules.physics.fixed_hz;
        const a = cfg.acceleration_amplitude * Math.sin(Math.PI * t / cfg.duration_seconds) ** 2 * Math.sin(2 * Math.PI * cfg.frequency_hz * t);
        const cup = this.rules.cup, center = cup.center_x_du + this.state.cupMotion.offsetXDu;
        for (const entity of this.state.ingredients) {
            const radius = (_b = (_a = this.rules.ingredients.find(i => i.level === entity.level)) === null || _a === void 0 ? void 0 : _a.radius_du) !== null && _b !== void 0 ? _b : 0;
            const withinCup = entity.hasEnteredCup && entity.positionDu.y <= cup.inner_top_y_du + radius && entity.positionDu.y >= cup.inner_bottom_y_du - radius && Math.abs(entity.positionDu.x - center) <= cup.top_width_du / 2 + radius;
            if (withinCup)
                this.adapter.applyHorizontalAcceleration(entity.entityId, a);
        }
    }
    advanceCupMotion() {
        const m = this.state.cupMotion, dt = 1 / this.rules.physics.fixed_hz, cfg = this.rules.cup_motion, acc = cfg.acceleration_du_per_second2, maxV = cfg.max_speed_du_per_second;
        const actual = this.adapter.getCupOffsetX(), error = m.targetOffsetXDu - actual;
        if (m.control === 'DRAGGING' || m.control === 'SETTLING') {
            let desired = Math.max(-maxV, Math.min(maxV, error / Math.max(0.001, cfg.response_seconds)));
            let velocity = m.velocityXDuPerSecond + Math.max(-acc * dt, Math.min(acc * dt, desired - m.velocityXDuPerSecond));
            velocity = Math.max(-maxV, Math.min(maxV, velocity));
            if (Math.sign(velocity) === Math.sign(error) && Math.abs(velocity * dt) > Math.abs(error))
                velocity = error / dt;
            if (Math.abs(error) <= cfg.snap_epsilon_du) {
                velocity = error / dt;
                m.control = 'IDLE';
                this.settleTicksRemaining = 0;
            }
            m.velocityXDuPerSecond = velocity;
            if (m.control === 'SETTLING' && --this.settleTicksRemaining <= 0) {
                m.targetOffsetXDu = actual + velocity * dt;
                m.control = 'IDLE';
            }
        }
        else
            m.velocityXDuPerSecond = 0;
        const max = this.rules.cup_motion.max_offset_du, next = actual + m.velocityXDuPerSecond * dt;
        if (next > max)
            m.velocityXDuPerSecond = Math.max(0, (max - actual) / dt);
        else if (next < -max)
            m.velocityXDuPerSecond = Math.min(0, (-max - actual) / dt);
        this.adapter.setCupVelocityX(m.velocityXDuPerSecond);
    }
    tryAutomaticDrop(tick, events) {
        const a = this.state.autoDrop;
        if (tick < a.nextDueTick)
            return;
        const shaking = this.state.shake.activeStartTick !== null && tick < this.state.shake.activeStartTick + Math.round(this.rules.shake.duration_seconds * this.rules.physics.fixed_hz);
        const d = a.pendingSpawn;
        if (shaking || !this.adapter.canSpawn(d.level, d.xDu)) {
            a.nextDueTick = tick + this.rules.auto_drop.blocked_retry_ticks;
            return;
        }
        const level = d.level, item = this.rules.ingredients.find(i => i.level === level);
        const entityId = this.state.nextEntityId, x = d.xDu, y = this.rules.cup.spawn_y_du;
        this.adapter.createBody({ entityId, level: level, radiusDu: item.radius_du, positionDu: { x, y }, velocityDuPerSecond: { x: d.vxDuPerSecond, y: 0 }, angularVelocity: d.angularVelocity });
        this.state.ingredients.push({ entityId, level: level, positionDu: { x, y }, velocityDuPerSecond: { x: d.vxDuPerSecond, y: 0 }, angleRadians: 0, angularVelocity: d.angularVelocity, bornTick: tick, dangerEligible: false, hasEnteredCup: false, spillTicks: 0, sleeping: false });
        this.state.nextEntityId++;
        this.state.dropIndex++;
        this.state.lastDropTick = tick;
        this.state.maxLevel = Math.max(this.state.maxLevel, item.level);
        this.state.currentLevel = this.state.nextLevel;
        this.state.nextLevel = this.rng.nextLevel(this.rules.drop.spawn_levels);
        a.nextDueTick = tick + this.rules.auto_drop.interval_ticks;
        a.pendingSpawn = this.nextSpawn(this.state.currentLevel);
        this.state.spawnRng = this.spawnRng.snapshot();
        events.push({ kind: 'IngredientDropped', eventId: (0, EventIdentity_1.deterministicEventId)(this.state.runId, 'IngredientDropped', tick, [entityId]), runId: this.state.runId, tick, entityId, level: level, dropIndex: this.state.dropIndex });
    }
    nextSpawn(level) { const offsets = this.rules.spawn_jitter.x_offsets_du, velocities = this.rules.spawn_jitter.vx_du_per_second; return { level, xDu: this.rules.cup.center_x_du + offsets[this.spawnRng.nextIndex(offsets.length)], vxDuPerSecond: velocities[this.spawnRng.nextIndex(velocities.length)], angularVelocity: 0 }; }
    refreshPhysicalStates() {
        for (const item of this.state.ingredients) {
            const body = this.adapter.getBody(item.entityId);
            if (body)
                Object.assign(item, body);
        }
    }
    markEligible(id) { const item = this.state.ingredients.find(v => v.entityId === id); if (item)
        item.dangerEligible = true; }
    resolveMerges(tick, contacts, events) {
        const byId = new Map(this.state.ingredients.map(item => [item.entityId, item]));
        const unique = new Map();
        for (const c of contacts) {
            if (c.secondId === null || c.firstId === c.secondId)
                continue;
            const a = Math.min(c.firstId, c.secondId), b = Math.max(c.firstId, c.secondId);
            const left = byId.get(a), right = byId.get(b);
            if (!left || !right || left.level !== right.level || left.level >= 9)
                continue;
            const dx = left.positionDu.x - right.positionDu.x, dy = left.positionDu.y - right.positionDu.y;
            unique.set(`${a}|${b}`, { a, b, level: left.level, distanceSq: dx * dx + dy * dy });
        }
        const sorted = Array.from(unique.values()).sort((a, b) => a.level - b.level || a.distanceSq - b.distanceSq || a.a - b.a || a.b - b.b);
        const used = new Set();
        for (const pair of sorted) {
            if (used.has(pair.a) || used.has(pair.b))
                continue;
            const a = byId.get(pair.a), b = byId.get(pair.b);
            used.add(pair.a);
            used.add(pair.b);
            const cfg = this.rules.ingredients.find(i => i.level === a.level + 1);
            if (!cfg)
                continue;
            const childId = this.state.nextEntityId;
            const wallContactProjectionMarginDu = this.adapter.wallContactProjectionMarginDu;
            const position = this.projectChild({ x: (a.positionDu.x + b.positionDu.x) / 2, y: (a.positionDu.y + b.positionDu.y) / 2 }, cfg.radius_du, Number.isFinite(wallContactProjectionMarginDu) ? Math.max(0, wallContactProjectionMarginDu) : 0);
            if (!position) {
                this.pause('TECHNICAL_ERROR');
                throw new Error('MERGE_PROJECTION_NO_LEGAL_POINT');
            }
            const velocity = { x: (a.velocityDuPerSecond.x + b.velocityDuPerSecond.x) / 2, y: (a.velocityDuPerSecond.y + b.velocityDuPerSecond.y) / 2 };
            const speed = Math.hypot(velocity.x, velocity.y), max = this.rules.physics.max_linear_speed * this.rules.viewport.du_per_spec_physics_unit;
            if (speed > max) {
                velocity.x *= max / speed;
                velocity.y *= max / speed;
            }
            const sinAngle = Math.sin(a.angleRadians) + Math.sin(b.angleRadians), cosAngle = Math.cos(a.angleRadians) + Math.cos(b.angleRadians);
            const angleRadians = Math.hypot(sinAngle, cosAngle) < 1e-8 ? (pair.a < pair.b ? a.angleRadians : b.angleRadians) : Math.atan2(sinAngle, cosAngle);
            const angularLimit = this.rules.physics.max_angular_speed;
            const angularVelocity = Math.max(-angularLimit, Math.min(angularLimit, (a.angularVelocity + b.angularVelocity) / 2));
            const replacement = this.adapter.replaceParentsWithChild([pair.a, pair.b], { entityId: childId, level: cfg.level, radiusDu: cfg.radius_du, positionDu: position, velocityDuPerSecond: velocity, angleRadians, angularVelocity });
            if (!replacement.ok) {
                this.pause('TECHNICAL_ERROR');
                throw new Error(`MERGE_REPLACE_FAILED:${replacement.error.code}:${replacement.error.message}`);
            }
            const fixtureProbe = this.adapter.recordFixtureMerge;
            fixtureProbe === null || fixtureProbe === void 0 ? void 0 : fixtureProbe.call(this.adapter, { tick, parentIds: [pair.a, pair.b], parents: [(0, CloneState_1.cloneState)(a), (0, CloneState_1.cloneState)(b)], neighbors: this.state.ingredients.filter(item => item.entityId !== pair.a && item.entityId !== pair.b).map(item => (0, CloneState_1.cloneState)(item)), child: { entityId: childId, level: cfg.level, radiusDu: cfg.radius_du, positionDu: { ...position }, velocityDuPerSecond: { ...velocity }, angleRadians, angularVelocity }, inherited: { bornTick: Math.min(a.bornTick, b.bornTick), dangerEligible: a.dangerEligible || b.dangerEligible, hasEnteredCup: a.hasEnteredCup || b.hasEnteredCup, spillTicks: Math.max(a.spillTicks, b.spillTicks) } });
            const units = this.rules.ingredients.find(i => i.level === a.level).units * 2;
            const score = cfg.merge_score;
            this.state.ingredients = this.state.ingredients.filter(i => i.entityId !== pair.a && i.entityId !== pair.b);
            this.state.ingredients.push({ entityId: childId, level: cfg.level, positionDu: position, velocityDuPerSecond: velocity,
                angleRadians, angularVelocity,
                bornTick: Math.min(a.bornTick, b.bornTick), dangerEligible: a.dangerEligible || b.dangerEligible,
                hasEnteredCup: a.hasEnteredCup || b.hasEnteredCup, spillTicks: Math.max(a.spillTicks, b.spillTicks), sleeping: false });
            this.state.nextEntityId++;
            this.state.maxLevel = Math.max(this.state.maxLevel, cfg.level);
            const eventId = (0, EventIdentity_1.deterministicEventId)(this.state.runId, 'MergeCommitted', tick, [pair.a, pair.b]);
            if (!this.usedMergeEvents.has(eventId)) {
                this.usedMergeEvents.add(eventId);
                this.state.score += score;
                events.push({ kind: 'MergeCommitted', eventId, runId: this.state.runId, tick, parents: [pair.a, pair.b], childId, childLevel: cfg.level, scoreDelta: score, units, positionDu: position });
            }
        }
    }
    updateDanger(tick, events) {
        for (const item of this.state.ingredients)
            if (!item.dangerEligible && tick - item.bornTick >= 45)
                item.dangerEligible = true;
        const before = this.state.dangerTicks;
        const line = this.rules.cup.danger_line_y_du;
        const over = this.state.ingredients.some(i => i.dangerEligible && i.positionDu.y + this.radius(i.level) > line);
        this.state.dangerTicks = over ? before + 1 : 0;
        if (this.state.dangerTicks !== before)
            events.push({ kind: 'DangerChanged', eventId: (0, EventIdentity_1.deterministicEventId)(this.state.runId, 'DangerChanged', tick, [this.state.dangerTicks]), runId: this.state.runId, tick, dangerTicks: this.state.dangerTicks });
        return this.state.dangerTicks >= Math.round(3 * this.rules.physics.fixed_hz);
    }
    updateSpill(_tick) {
        const top = this.rules.cup.inner_top_y_du, spilled = [];
        for (const item of this.state.ingredients) {
            if (item.positionDu.y + this.radius(item.level) <= top)
                item.hasEnteredCup = true;
            if (item.hasEnteredCup && item.positionDu.y - this.radius(item.level) > top)
                item.spillTicks++;
            else
                item.spillTicks = 0;
            if (item.spillTicks >= Math.round(.5 * this.rules.physics.fixed_hz))
                spilled.push(item.entityId);
        }
        return spilled;
    }
    /** Freeze the spill and publish a deterministic cleanup candidate. False means no legal offer; settle normally. */
    beginSpillPending(tick, spilledEntityIds) {
        if (!this.reviveOptions.enabled || this.state.revive.used !== 0 || this.state.state !== 'PLAYING' || this.ended)
            return false;
        const candidate = this.computeSpillCandidate(tick, spilledEntityIds);
        if (candidate.ingredients.length === 0)
            return false;
        const failureId = (0, EventIdentity_1.deterministicEventId)(this.state.runId, 'SpillPendingFailure', tick, spilledEntityIds);
        this.state.revive.pendingFailure = { version: 1, failureId, detectedTick: tick, reason: 'SPILLED',
            spilledEntityIds: spilledEntityIds.slice().sort((a, b) => a - b), clearanceDu: this.reviveOptions.clearanceDu, candidateHash: candidate.candidateHash,
            retainedEntityIds: candidate.retainedEntityIds.slice() };
        this.state.state = 'PAUSED';
        this.state.terminalReason = null;
        this.state.revision++;
        return true;
    }
    computeSpillCandidate(detectedTick, spilledEntityIds) {
        const top = this.rules.cup.inner_top_y_du, clearance = Math.max(0, this.reviveOptions.clearanceDu), spilled = new Set(spilledEntityIds);
        const removedEntityIds = [], ingredients = [];
        for (const item of this.state.ingredients.slice().sort((a, b) => a.entityId - b.entityId)) {
            const r = this.radius(item.level), out = spilled.has(item.entityId) || item.spillTicks > 0 || item.positionDu.y + r > this.rules.cup.danger_line_y_du - clearance
                || ![item.positionDu.x, item.positionDu.y, item.velocityDuPerSecond.x, item.velocityDuPerSecond.y, item.angleRadians, item.angularVelocity].every(Number.isFinite);
            if (out) {
                removedEntityIds.push(item.entityId);
                continue;
            }
            const x = item.positionDu.x;
            let y = item.positionDu.y;
            const bottom = this.rules.cup.inner_bottom_y_du, limit = top - r - 1;
            if (y > limit)
                y = Math.max(bottom - r, limit);
            ingredients.push({ ...item, positionDu: { x, y }, velocityDuPerSecond: { x: 0, y: 0 }, angleRadians: item.angleRadians, angularVelocity: 0,
                dangerEligible: false, spillTicks: 0, sleeping: false });
        }
        const retainedEntityIds = ingredients.map(i => i.entityId);
        const candidate = {
            candidateId: (0, EventIdentity_1.deterministicEventId)(this.state.runId, 'SpillReviveCandidate', detectedTick, spilledEntityIds),
            failureId: (0, EventIdentity_1.deterministicEventId)(this.state.runId, 'SpillPendingFailure', detectedTick, spilledEntityIds),
            detectedTick, spilledEntityIds: [...spilledEntityIds].sort((a, b) => a - b), removedEntityIds, retainedEntityIds,
            score: this.state.score, maxLevel: this.state.maxLevel, dropIndex: this.state.dropIndex, currentLevel: this.state.currentLevel, nextLevel: this.state.nextLevel,
            nextEntityId: this.state.nextEntityId, tick: detectedTick, rng: this.rng.snapshot(), spawnRng: this.spawnRng.snapshot(),
            cupOffsetXDu: 0, shake: { ...this.state.shake }, dangerTicks: this.state.dangerTicks,
            autoDrop: { nextDueTick: detectedTick + Math.max(0, this.reviveOptions.autoDropDelayTicks), pendingSpawn: { ...this.state.autoDrop.pendingSpawn } },
            ingredients, candidateHash: ''
        };
        const hashInput = { failureId: candidate.failureId, detectedTick, spilledEntityIds: candidate.spilledEntityIds, removedEntityIds, retainedEntityIds,
            score: candidate.score, maxLevel: candidate.maxLevel, dropIndex: candidate.dropIndex, currentLevel: candidate.currentLevel, nextLevel: candidate.nextLevel,
            nextEntityId: candidate.nextEntityId, rng: candidate.rng, spawnRng: candidate.spawnRng, dangerTicks: candidate.dangerTicks, pendingSpawn: candidate.autoDrop.pendingSpawn,
            ingredients: ingredients.map(i => ({ entityId: i.entityId, level: i.level, positionDu: i.positionDu, velocityDuPerSecond: i.velocityDuPerSecond, angleRadians: i.angleRadians, angularVelocity: i.angularVelocity, hasEnteredCup: i.hasEnteredCup })) };
        candidate.candidateHash = (0, Sha256_1.sha256Utf8)(JSON.stringify(hashInput));
        return candidate;
    }
    end(reason, tick) {
        this.ended = true;
        this.state.state = 'SETTLING';
        this.state.terminalReason = reason;
        this.state.settleStartedTick = tick;
        this.state.revive.pendingFailure = null;
        return { kind: 'RunEnded', eventId: (0, EventIdentity_1.deterministicEventId)(this.state.runId, 'RunEnded', tick, [reason]), runId: this.state.runId, tick, reason, score: this.state.score };
    }
    radius(level) { var _a, _b; return (_b = (_a = this.rules.ingredients.find(i => i.level === level)) === null || _a === void 0 ? void 0 : _a.radius_du) !== null && _b !== void 0 ? _b : 0; }
    clampSpawnX(level, x) { const r = this.radius(level); const g = this.rules.cup; return Math.min(g.center_x_du + g.top_width_du / 2 - r, Math.max(g.center_x_du - g.top_width_du / 2 + r, x)); }
    projectChild(p, radius, wallMargin) {
        var _a;
        const cup = this.rules.cup;
        const bottom = cup.inner_bottom_y_du;
        const top = cup.inner_top_y_du;
        if (p.y - radius > top)
            return p;
        const scale = 1;
        const slope = (cup.top_width_du - cup.bottom_width_du) / (2 * (top - bottom));
        const leftBottom = cup.center_x_du + this.state.cupMotion.offsetXDu - cup.bottom_width_du / 2, rightBottom = cup.center_x_du + this.state.cupMotion.offsetXDu + cup.bottom_width_du / 2;
        const leftN = { x: 1 / Math.hypot(1, slope), y: -slope / Math.hypot(1, slope) }, rightN = { x: -1 / Math.hypot(1, slope), y: -slope / Math.hypot(1, slope) };
        const safeRadius = radius + wallMargin;
        const c = [{ n: { x: 0, y: 1 }, b: bottom + safeRadius }, { n: leftN, b: leftN.x * leftBottom + leftN.y * bottom + safeRadius }, { n: rightN, b: rightN.x * rightBottom + rightN.y * bottom + safeRadius }];
        const valid = (q) => c.every(v => v.n.x * q.x + v.n.y * q.y >= v.b - 1e-8) && q.y - radius <= top + 1e-8;
        const candidates = [p];
        for (const v of c) {
            const d = v.b - v.n.x * p.x - v.n.y * p.y;
            candidates.push({ x: p.x + v.n.x * d, y: p.y + v.n.y * d });
        }
        for (let i = 0; i < c.length; i++)
            for (let j = i + 1; j < c.length; j++) {
                const a = c[i], b = c[j], det = a.n.x * b.n.y - a.n.y * b.n.x;
                if (Math.abs(det) > 1e-9)
                    candidates.push({ x: (a.b * b.n.y - a.n.y * b.b) / det, y: (a.n.x * b.b - a.b * b.n.x) / det });
            }
        const validPoints = candidates.filter(valid).sort((a, b) => ((a.x - p.x) ** 2 + (a.y - p.y) ** 2) - ((b.x - p.x) ** 2 + (b.y - p.y) ** 2) || a.x - b.x || a.y - b.y);
        return (_a = validPoints[0]) !== null && _a !== void 0 ? _a : null;
    }
    validateSnapshot(value) {
        var _a;
        if (!value || value.saveSchemaVersion !== 5 || !Number.isSafeInteger(value.tick) || value.tick < 0 || !Number.isSafeInteger(value.score) || value.score < 0 || !Array.isArray(value.ingredients) || !value.cupMotion || !Number.isFinite(value.cupMotion.offsetXDu) || Math.abs(value.cupMotion.offsetXDu) > this.rules.cup_motion.max_offset_du || !Number.isFinite(value.cupMotion.velocityXDuPerSecond) || Math.abs(value.cupMotion.velocityXDuPerSecond) > this.rules.cup_motion.max_speed_du_per_second || !Number.isFinite(value.cupMotion.targetOffsetXDu) || Math.abs(value.cupMotion.targetOffsetXDu) > this.rules.cup_motion.max_offset_du || !['IDLE', 'DRAGGING', 'SETTLING'].includes(value.cupMotion.control) || !Number.isSafeInteger((_a = value.autoDrop) === null || _a === void 0 ? void 0 : _a.nextDueTick) || value.autoDrop.nextDueTick < value.tick || !value.spawnRng || value.spawnRng.state === 0 || !value.autoDrop.pendingSpawn || value.autoDrop.pendingSpawn.level !== value.currentLevel)
            return failure('SAVE_INVALID', '存档基础字段无效');
        const shake = value.shake;
        if (!shake || !Number.isSafeInteger(shake.baseUsed) || shake.baseUsed < 0 || shake.baseUsed > 2 || !Number.isSafeInteger(shake.extraGranted) || shake.extraGranted < 0 || shake.extraGranted > 5 || !Number.isSafeInteger(shake.extraUsed) || shake.extraUsed < 0 || shake.extraUsed > shake.extraGranted)
            return failure('SAVE_INVALID', '存档晃杯账本无效');
        const revive = value.revive;
        if (!revive || !Number.isSafeInteger(revive.used) || revive.used < 0 || revive.used > 1)
            return failure('SAVE_INVALID', '存档复活账本无效');
        if (revive.pendingFailure !== null) {
            const p = revive.pendingFailure;
            if (p.version !== 1 || p.reason !== 'SPILLED' || typeof p.failureId !== 'string' || !UUID_PATTERN.test(p.failureId) || !Number.isSafeInteger(p.detectedTick) || p.detectedTick < 0 || p.detectedTick > value.tick || !Array.isArray(p.spilledEntityIds) || !Array.isArray(p.retainedEntityIds) || !Number.isSafeInteger(p.clearanceDu) || p.clearanceDu < 0 || typeof p.candidateHash !== 'string' || p.candidateHash.length !== 64)
                return failure('SAVE_INVALID', '存档复活待处理数据无效');
            if (value.state !== 'PAUSED' || value.terminalReason !== null)
                return failure('SAVE_INVALID', '待复活局必须处于暂停');
        }
        else if (revive.committedReceiptId !== null && (typeof revive.committedReceiptId !== 'string' || !UUID_PATTERN.test(revive.committedReceiptId)))
            return failure('SAVE_INVALID', '存档复活凭证无效');
        if (value.boardType !== 'standard' && value.boardType !== 'assisted' || value.boardType === 'assisted' !== (shake.extraUsed > 0 || revive.used > 0))
            return failure('SAVE_INVALID', '存档局类型与奖励不一致');
        const ids = new Set();
        for (const item of value.ingredients) {
            if (ids.has(item.entityId) || !Number.isSafeInteger(item.entityId) || ![item.positionDu.x, item.positionDu.y, item.velocityDuPerSecond.x, item.velocityDuPerSecond.y, item.angleRadians, item.angularVelocity].every(Number.isFinite))
                return failure('SAVE_INVALID', '存档实体无效');
            ids.add(item.entityId);
        }
        if (value.nextEntityId <= Math.max(0, ...ids) || value.rng.state === 0 || value.rng.drawCount !== value.dropIndex + 2)
            return failure('SAVE_INVALID', '存档跨字段校验失败');
        return success(undefined);
    }
    assertInvariants() {
        const ids = new Set();
        for (const item of this.state.ingredients) {
            if (ids.has(item.entityId))
                throw new Error('DUPLICATE_ENTITY_ID');
            ids.add(item.entityId);
            if (![item.positionDu.x, item.positionDu.y, item.velocityDuPerSecond.x, item.velocityDuPerSecond.y, item.angleRadians, item.angularVelocity].every(Number.isFinite))
                throw new Error('NON_FINITE_BODY');
        }
        if (!Number.isSafeInteger(this.state.tick) || !Number.isSafeInteger(this.state.score) || this.state.score < 0)
            throw new Error('RUN_INVARIANT_BROKEN');
    }
}
exports.RunEngine = RunEngine;

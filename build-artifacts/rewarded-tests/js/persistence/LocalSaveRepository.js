"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalSaveRepository = void 0;
const CloneState_1 = require("../core/CloneState");
const SaveCodec_1 = require("./SaveCodec");
const SaveMigration_1 = require("./SaveMigration");
const SaveValidator_1 = require("./SaveValidator");
const fail = (code, message, retryable = false) => ({ ok: false, error: { code, message, retryable } });
const pass = (data) => ({ ok: true, data });
const defaultBundle = () => ({ profile: { schemaVersion: 3, settings: { musicGain: .35, sfxGain: .7, reducedMotion: false, dropMode: 'drag_release', tutorialCompleted: false }, discoveredLevels: [], unlockedStageIds: ['classic'], bestScores: {}, activeRunId: null, revision: 0, firstNaturalRunCompleted: false, rewardedShake: { dayKey: null, dailyGranted: 0, pendingAttempt: null, receipts: [] }, rewardedRevive: { dayKey: null, dailyGranted: 0, pendingAttempt: null, receipts: [] } }, run: null, lastResult: null });
class LocalSaveRepository {
    constructor(debugNamespace, storage) {
        this.debugNamespace = debugNamespace;
        this.memory = new Map();
        this.storage = null;
        this.leaseMode = 'memory-only';
        this.leaseRelease = null;
        this.failOnce = null;
        this.tapStorage = false;
        const tap = globalThis.tap;
        if (!storage && tap && typeof tap.getStorageSync === 'function' && typeof tap.setStorageSync === 'function' && typeof tap.removeStorageSync === 'function') {
            this.tapStorage = true;
            this.storage = { getItem: key => { const value = tap.getStorageSync(key); return value == null || value === '' ? null : typeof value === 'string' ? value : JSON.stringify(value); }, setItem: (key, value) => tap.setStorageSync(key, value), removeItem: key => tap.removeStorageSync(key) };
        }
        else {
            try {
                this.storage = storage !== null && storage !== void 0 ? storage : (typeof localStorage !== 'undefined' ? localStorage : null);
            }
            catch {
                this.storage = null;
            }
        }
    }
    injectFaultOnce(point) { this.failOnce = point; }
    async acquireWriteLease() {
        var _a;
        if (this.leaseRelease)
            return fail('SAVE_LEASE_HELD', '本页面已持有存档写租约');
        const lockName = this.debugNamespace ? `${LocalSaveRepository.prefix}.debug.${this.debugNamespace}.writer` : `${LocalSaveRepository.prefix}.writer`;
        // Tap minigames have one JS game context, not competing browser tabs.
        if (this.tapStorage && this.storage) {
            if (LocalSaveRepository.tapWriters.has(lockName))
                return fail('SAVE_WRITER_EXISTS', '当前小游戏已有存档写入者', true);
            LocalSaveRepository.tapWriters.add(lockName);
            this.leaseMode = 'persistent';
            const release = () => { if (this.leaseRelease !== release)
                return; LocalSaveRepository.tapWriters.delete(lockName); this.leaseRelease = null; this.leaseMode = 'memory-only'; };
            this.leaseRelease = release;
            return pass({ mode: 'persistent', release });
        }
        const locks = (_a = globalThis.navigator) === null || _a === void 0 ? void 0 : _a.locks;
        if (!(locks === null || locks === void 0 ? void 0 : locks.request) || !this.storage) {
            this.leaseMode = 'memory-only';
            return pass({ mode: 'memory-only', release: () => { } });
        }
        let acquired = null;
        let rejectAcquire = null;
        const ready = new Promise((resolve, reject) => { acquired = resolve; rejectAcquire = reject; });
        const hold = new Promise(resolve => { this.leaseRelease = resolve; });
        void locks.request(lockName, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
            if (!lock) {
                this.leaseRelease = null;
                rejectAcquire === null || rejectAcquire === void 0 ? void 0 : rejectAcquire(new Error('SAVE_WRITER_EXISTS'));
                return;
            }
            this.leaseMode = 'persistent';
            acquired === null || acquired === void 0 ? void 0 : acquired();
            await hold;
            this.leaseRelease = null;
        }).catch((error) => { this.leaseRelease = null; rejectAcquire === null || rejectAcquire === void 0 ? void 0 : rejectAcquire(error); });
        try {
            await ready;
            return pass({ mode: 'persistent', release: () => { var _a; return (_a = this.leaseRelease) === null || _a === void 0 ? void 0 : _a.call(this); } });
        }
        catch (error) {
            return fail('SAVE_WRITER_EXISTS', String(error), true);
        }
    }
    async readBundle() {
        var _a, _b;
        let a, b;
        try {
            a = this.readSlot('A');
            b = this.readSlot('B');
        }
        catch (error) {
            return fail('STORAGE_IO_ERROR', `读取存档失败：${String(error)}`, true);
        }
        if (a.unknownVersion || b.unknownVersion)
            return fail('SAVE_VERSION_UNSUPPORTED', '发现较新或不支持的存档版本；为保护原档，已禁止回退与写入');
        if (a.ioError || b.ioError)
            return fail('STORAGE_IO_ERROR', `读取存档失败：${(_a = a.ioError) !== null && _a !== void 0 ? _a : b.ioError}`, true);
        if (a.error && b.error)
            return fail('STORAGE_CORRUPT', `双槽均不可恢复：A=${a.error}；B=${b.error}`);
        if (a.envelope && b.envelope && a.envelope.revision === b.envelope.revision && SaveCodec_1.SaveCodec.canonicalJson(a.envelope.payload) !== SaveCodec_1.SaveCodec.canonicalJson(b.envelope.payload))
            return fail('SAVE_REVISION_CONFLICT', '相同revision存在不同有效档；原始槽均保留');
        const selected = !a.envelope ? b.envelope : !b.envelope ? a.envelope : a.envelope.revision >= b.envelope.revision ? a.envelope : b.envelope;
        const slot = selected === a.envelope ? 'A' : selected === b.envelope ? 'B' : null;
        const warning = a.error || b.error ? `一槽损坏，已回退到另一完整槽；坏槽字节保留。${(_b = a.error) !== null && _b !== void 0 ? _b : b.error}` : undefined;
        if (!selected)
            return { ok: true, data: { envelope: null, recoveredFromSlot: null } };
        return { ok: true, data: { envelope: selected, recoveredFromSlot: slot, warning } };
    }
    async commitBundle(expectedRevision, expectedRunId, next) {
        var _a, _b, _c;
        if (this.leaseMode !== 'persistent')
            return fail('SAVE_MEMORY_ONLY', '当前浏览器缺少可靠跨标签锁，存档仅在内存可用', true);
        const read = await this.readBundle();
        if (!read.ok)
            return read;
        const current = read.data.envelope;
        const revision = (_a = current === null || current === void 0 ? void 0 : current.revision) !== null && _a !== void 0 ? _a : 0;
        const runId = (_c = (_b = current === null || current === void 0 ? void 0 : current.payload.run) === null || _b === void 0 ? void 0 : _b.runId) !== null && _c !== void 0 ? _c : null;
        if (revision !== expectedRevision || runId !== expectedRunId)
            return fail('CONFLICT_REVISION', '存档已由新操作更新，请先重新读取');
        let normalized;
        try {
            normalized = { ...(0, CloneState_1.cloneState)(next), run: next.run ? SaveCodec_1.SaveCodec.sealSnapshot(next.run) : null };
        }
        catch (error) {
            return fail('SAVE_NORMALIZE_FAILED', `档案规范化失败：${String(error)}`);
        }
        const valid = SaveValidator_1.SaveValidator.bundle(normalized);
        if (!valid.valid)
            return fail(valid.code, valid.message);
        const envelope = SaveCodec_1.SaveCodec.createEnvelopeV2(revision + 1, normalized);
        const active = read.data.recoveredFromSlot;
        const target = active === 'A' ? 'B' : 'A';
        const key = this.key(target);
        try {
            const prior = this.getItem(key);
            if (prior !== null) {
                const existing = this.readSlot(target);
                if (existing.error) {
                    const backup = this.key(`backup-${target}`);
                    if (this.getItem(backup) === null)
                        this.setItem(backup, prior);
                    if (this.getItem(backup) !== prior)
                        return fail('SAVE_CORRUPT_BACKUP_FAILED', '损坏槽原始字节备份失败，拒绝覆盖');
                }
            }
            if (this.fault('write-before'))
                throw new Error('INJECTED_WRITE_BEFORE');
            const text = SaveCodec_1.SaveCodec.canonicalJson(envelope);
            const split = this.fault('partial-slot') ? Math.max(1, Math.floor(text.length / 2)) : text.length;
            this.setItem(key, text.slice(0, split));
            if (split !== text.length)
                throw new Error('INJECTED_PARTIAL_SLOT');
            if (this.fault('slot-complete'))
                return this.resolveAmbiguousCommit(envelope, target, 'INJECTED_SLOT_COMPLETE');
            const stored = this.getItem(key);
            if (!stored)
                throw new Error('SAVE_READBACK_EMPTY');
            const parsed = JSON.parse(stored);
            if (this.fault('readback'))
                throw new Error('INJECTED_READBACK');
            if (!SaveValidator_1.SaveValidator.envelope(parsed) || parsed.checksum !== envelope.checksum)
                throw new Error('SAVE_READBACK_INVALID');
            if (this.fault('pre-pointer'))
                throw new Error('INJECTED_PRE_POINTER');
            try {
                if (this.fault('pointer'))
                    throw new Error('INJECTED_POINTER');
                this.setItem(this.key('pointer'), target);
            }
            catch (error) {
                return pass({ revision: envelope.revision, committed: true, pointerUpdated: false, warning: `档案已提交，但指针未更新：${String(error)}` });
            }
            return pass({ revision: envelope.revision, committed: true, pointerUpdated: true });
        }
        catch (error) {
            return this.resolveAmbiguousCommit(envelope, target, String(error));
        }
    }
    exportRaw() { return { A: this.getItem(this.key('A')), B: this.getItem(this.key('B')), pointer: this.getItem(this.key('pointer')) }; }
    clearDebugNamespace() { if (!this.debugNamespace)
        return; for (const k of Object.keys(this.exportRaw()))
        this.removeItem(this.key(k)); }
    fault(point) { if (this.failOnce !== point)
        return false; this.failOnce = null; return true; }
    key(slot) { if (this.debugNamespace)
        return `milktea.p1b.debug.${this.debugNamespace}.${slot}`; if (slot === 'backup-A' || slot === 'backup-B')
        return `${LocalSaveRepository.prefix}.${slot}`; return LocalSaveRepository.keys[slot]; }
    readSlot(slot) {
        var _a, _b, _c, _d, _e;
        let raw;
        try {
            raw = this.getItem(this.key(slot));
        }
        catch (error) {
            return { envelope: null, error: null, ioError: String(error) };
        }
        if (raw === null)
            return { envelope: null, error: null };
        try {
            if (raw.length > 2000000)
                return { envelope: null, error: 'SAVE_TOO_LARGE' };
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && Number.isInteger(parsed.schemaVersion) && parsed.schemaVersion !== 1 && parsed.schemaVersion !== 2)
                return { envelope: null, error: 'SAVE_VERSION_UNSUPPORTED', unknownVersion: true };
            if (SaveValidator_1.SaveValidator.envelope(parsed))
                return { envelope: parsed, error: null };
            if ((parsed === null || parsed === void 0 ? void 0 : parsed.schemaVersion) === 2 && ((_a = parsed.payload) === null || _a === void 0 ? void 0 : _a.run) === null && SaveCodec_1.SaveCodec.verifyEnvelopeV2(parsed) && SaveValidator_1.SaveValidator.profileV2(parsed.payload.profile)) {
                const payload = { ...parsed.payload, profile: SaveMigration_1.SaveMigration.profileV2(parsed.payload.profile), run: null };
                return { envelope: SaveCodec_1.SaveCodec.createEnvelopeV2(parsed.revision, payload), error: null, migrated: true };
            }
            if ((parsed === null || parsed === void 0 ? void 0 : parsed.schemaVersion) === 2 && ((_c = (_b = parsed.payload) === null || _b === void 0 ? void 0 : _b.run) === null || _c === void 0 ? void 0 : _c.saveSchemaVersion) === 4 && SaveCodec_1.SaveCodec.verifyEnvelopeV2(parsed) && SaveValidator_1.SaveValidator.profileV2(parsed.payload.profile) && SaveValidator_1.SaveValidator.legacySnapshotV4(parsed.payload.run).valid) {
                const payload = { ...parsed.payload, profile: SaveMigration_1.SaveMigration.profileV2(parsed.payload.profile), run: SaveMigration_1.SaveMigration.runV4(parsed.payload.run) };
                return { envelope: SaveCodec_1.SaveCodec.createEnvelopeV2(parsed.revision, payload), error: null, migrated: true };
            }
            if ((parsed === null || parsed === void 0 ? void 0 : parsed.schemaVersion) === 2 && ((_e = (_d = parsed.payload) === null || _d === void 0 ? void 0 : _d.run) === null || _e === void 0 ? void 0 : _e.saveSchemaVersion) === 3 && SaveCodec_1.SaveCodec.verifyEnvelopeV2(parsed) && SaveValidator_1.SaveValidator.profileV2(parsed.payload.profile) && SaveValidator_1.SaveValidator.legacySnapshot(parsed.payload.run, 3).valid) {
                const payload = { ...parsed.payload, profile: SaveMigration_1.SaveMigration.profileV2(parsed.payload.profile), run: SaveMigration_1.SaveMigration.runV3(parsed.payload.run) };
                return { envelope: SaveCodec_1.SaveCodec.createEnvelopeV2(parsed.revision, payload), error: null, migrated: true };
            }
            if (SaveValidator_1.SaveValidator.legacyEnvelope(parsed)) {
                const migrated = SaveMigration_1.SaveMigration.bundle(parsed.payload);
                const envelope = SaveCodec_1.SaveCodec.createEnvelopeV2(parsed.revision, migrated);
                return { envelope, error: null, migrated: true };
            }
            return { envelope: null, error: 'SAVE_INVALID' };
        }
        catch (error) {
            return { envelope: null, error: `SAVE_PARSE:${String(error)}` };
        }
    }
    resolveAmbiguousCommit(envelope, slot, cause) {
        var _a;
        try {
            const raw = this.getItem(this.key(slot));
            if (raw !== null) {
                const parsed = JSON.parse(raw);
                if (SaveValidator_1.SaveValidator.envelope(parsed) && parsed.revision === envelope.revision && parsed.checksum === envelope.checksum)
                    return pass({ revision: envelope.revision, committed: true, pointerUpdated: false, warning: `写入后发生异常，但operation内容核对确认已提交：${cause}` });
            }
            const other = this.readSlot(slot === 'A' ? 'B' : 'A');
            if (((_a = other.envelope) === null || _a === void 0 ? void 0 : _a.revision) === envelope.revision && other.envelope.checksum === envelope.checksum)
                return pass({ revision: envelope.revision, committed: true, pointerUpdated: false, warning: `异常后由双槽核对确认已提交：${cause}` });
            return fail('SAVE_COMMIT_UNCERTAIN', `写入异常且无法确认提交状态，禁止盲目重试：${cause}`, false);
        }
        catch (error) {
            return fail('SAVE_COMMIT_UNCERTAIN', `写入异常且读取核对失败，禁止盲目重试：${String(error)}`, false);
        }
    }
    getItem(key) { var _a, _b, _c; return (_c = (_b = (_a = this.storage) === null || _a === void 0 ? void 0 : _a.getItem(key)) !== null && _b !== void 0 ? _b : this.memory.get(key)) !== null && _c !== void 0 ? _c : null; }
    setItem(key, value) { if (this.storage)
        this.storage.setItem(key, value);
    else
        this.memory.set(key, value); }
    removeItem(key) { if (this.storage)
        this.storage.removeItem(key);
    else
        this.memory.delete(key); }
    static emptyBundle() { return defaultBundle(); }
}
exports.LocalSaveRepository = LocalSaveRepository;
LocalSaveRepository.prefix = 'milktea.p1b.local.v1';
LocalSaveRepository.keys = { A: `${LocalSaveRepository.prefix}.slotA`, B: `${LocalSaveRepository.prefix}.slotB`, pointer: `${LocalSaveRepository.prefix}.pointer` };
LocalSaveRepository.tapWriters = new Set();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveMigration = void 0;
const SaveCodec_1 = require("./SaveCodec");
/**
 * Read-only schema upgrades. A migrated bundle is never written during boot; it is only written at a
 * normal gameplay checkpoint so a failed config/image load cannot change the player's saved progress.
 */
class SaveMigration {
    static runV3(legacy) {
        const source = legacy;
        const migrated = { ...source, saveSchemaVersion: 5, spawnRng: { algorithm: 'spawn-xorshift32-v1', state: 0x6d2b79f5, drawCount: 0 }, autoDrop: { nextDueTick: source.autoDrop.nextDueTick, pendingSpawn: { level: source.currentLevel, xDu: 375, vxDuPerSecond: 0, angularVelocity: 0 } },
            revive: { used: 0, pendingFailure: null, committedReceiptId: null }, checksum: '' };
        return SaveCodec_1.SaveCodec.sealSnapshot(migrated);
    }
    /** Schema-4 saves predate the spill-revive ledger; nothing is granted retroactively. */
    static runV4(legacy) {
        const source = legacy;
        const migrated = { ...source, saveSchemaVersion: 5, revive: { used: 0, pendingFailure: null, committedReceiptId: null }, checksum: '' };
        return SaveCodec_1.SaveCodec.sealSnapshot(migrated);
    }
    static bundle(legacy) {
        return {
            profile: this.profile(legacy.profile, legacy.lastResult),
            run: legacy.run ? this.run(legacy.run) : null,
            lastResult: legacy.lastResult ? this.lastResult(legacy.lastResult) : null,
        };
    }
    static profile(legacy, lastResult) {
        return {
            ...legacy,
            schemaVersion: 3,
            firstNaturalRunCompleted: !!lastResult && (lastResult.reason === 'CUP_FULL' || lastResult.reason === 'SPILLED'),
            rewardedShake: { dayKey: null, dailyGranted: 0, pendingAttempt: null, receipts: [] },
            rewardedRevive: { dayKey: null, dailyGranted: 0, pendingAttempt: null, receipts: [] },
        };
    }
    static profileV2(legacy) {
        return { ...legacy, schemaVersion: 3, rewardedRevive: { dayKey: null, dailyGranted: 0, pendingAttempt: null, receipts: [] } };
    }
    static run(legacy) {
        const source = legacy;
        const tick = Number(source.tick);
        const migrated = {
            ...source,
            saveSchemaVersion: 5,
            shake: { ...source.shake, extraGranted: 0 },
            cupMotion: source.cupMotion
                ? source.cupMotion
                : { offsetXDu: 0, velocityXDuPerSecond: 0, targetOffsetXDu: 0, control: 'IDLE' },
            spawnRng: { algorithm: 'spawn-xorshift32-v1', state: 0x6d2b79f5, drawCount: 0 },
            autoDrop: { nextDueTick: source.autoDrop ? Number(source.autoDrop.nextDueTick) : (Number.isSafeInteger(tick) ? tick : 0) + 1,
                pendingSpawn: { level: Number(source.currentLevel), xDu: 375, vxDuPerSecond: 0, angularVelocity: 0 } },
            revive: { used: 0, pendingFailure: null, committedReceiptId: null },
            checksum: '',
        };
        return SaveCodec_1.SaveCodec.sealSnapshot(migrated);
    }
    static lastResult(legacy) {
        return {
            runId: legacy.runId, reason: legacy.reason, score: legacy.score, maxLevel: legacy.maxLevel,
            dropIndex: legacy.dropIndex, baseUsed: legacy.baseUsed, extraUsed: 0, boardType: 'standard',
            rulesVersion: legacy.rulesVersion,
        };
    }
}
exports.SaveMigration = SaveMigration;

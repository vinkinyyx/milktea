import type { LegacyLocalLastResult, LegacyRunSnapshotV2, LegacyRunSnapshotV3, LegacyRunSnapshotV4, LocalLastResult, LocalProfile, LocalProfileV1, LocalProfileV2, LocalSaveBundle, LocalSaveBundleV1, RunSnapshot } from '../contracts/types';
import { SaveCodec } from './SaveCodec';

/**
 * Read-only schema upgrades. A migrated bundle is never written during boot; it is only written at a
 * normal gameplay checkpoint so a failed config/image load cannot change the player's saved progress.
 */
export class SaveMigration {
  static runV3(legacy:LegacyRunSnapshotV3|Record<string,unknown>):RunSnapshot {
    const source=legacy as unknown as Record<string,any>;
    const migrated={...source,saveSchemaVersion:5 as const,spawnRng:{algorithm:'spawn-xorshift32-v1' as const,state:0x6d2b79f5,drawCount:0},autoDrop:{nextDueTick:source.autoDrop.nextDueTick,pendingSpawn:{level:source.currentLevel,xDu:375,vxDuPerSecond:0,angularVelocity:0}},
      revive:{used:0,pendingFailure:null,committedReceiptId:null},checksum:''} as unknown as RunSnapshot;
    return SaveCodec.sealSnapshot(migrated);
  }
  /** Schema-4 saves predate the spill-revive ledger; nothing is granted retroactively. */
  static runV4(legacy:LegacyRunSnapshotV4|Record<string,unknown>):RunSnapshot {
    const source=legacy as unknown as Record<string,any>;
    const migrated={...source,saveSchemaVersion:5 as const,revive:{used:0,pendingFailure:null,committedReceiptId:null},checksum:''} as unknown as RunSnapshot;
    return SaveCodec.sealSnapshot(migrated);
  }
  static bundle(legacy: LocalSaveBundleV1): LocalSaveBundle {
    return {
      profile: this.profile(legacy.profile, legacy.lastResult),
      run: legacy.run ? this.run(legacy.run) : null,
      lastResult: legacy.lastResult ? this.lastResult(legacy.lastResult) : null,
    };
  }
  static profile(legacy: LocalProfileV1, lastResult: LegacyLocalLastResult | null): LocalProfile {
    return {
      ...legacy,
      schemaVersion: 3,
      firstNaturalRunCompleted: !!lastResult && (lastResult.reason === 'CUP_FULL' || lastResult.reason === 'SPILLED'),
      rewardedShake: { dayKey: null, dailyGranted: 0, pendingAttempt: null, receipts: [] },
      rewardedRevive: { dayKey: null, dailyGranted: 0, pendingAttempt: null, receipts: [] },
    };
  }
  static profileV2(legacy: LocalProfileV2): LocalProfile {
    return { ...legacy, schemaVersion: 3, rewardedRevive: { dayKey: null, dailyGranted: 0, pendingAttempt: null, receipts: [] } };
  }
  static run(legacy: LegacyRunSnapshotV2 | Record<string, unknown>): RunSnapshot {
    const source = legacy as unknown as Record<string, unknown>;
    const tick = Number(source.tick);
    const migrated: RunSnapshot = {
      ...(source as unknown as RunSnapshot),
      saveSchemaVersion: 5,
      shake: { ...(source.shake as LegacyRunSnapshotV2['shake']), extraGranted: 0 },
      cupMotion: source.cupMotion
        ? (source.cupMotion as RunSnapshot['cupMotion'])
        : { offsetXDu: 0, velocityXDuPerSecond: 0, targetOffsetXDu: 0, control: 'IDLE' },
      spawnRng:{algorithm:'spawn-xorshift32-v1',state:0x6d2b79f5,drawCount:0},
      autoDrop: { nextDueTick:source.autoDrop?Number((source.autoDrop as any).nextDueTick):(Number.isSafeInteger(tick)?tick:0)+1,
        pendingSpawn:{level:Number(source.currentLevel) as any,xDu:375,vxDuPerSecond:0,angularVelocity:0} },
      revive:{used:0,pendingFailure:null,committedReceiptId:null},
      checksum: '',
    };
    return SaveCodec.sealSnapshot(migrated);
  }
  private static lastResult(legacy: LegacyLocalLastResult): LocalLastResult {
    return {
      runId: legacy.runId, reason: legacy.reason, score: legacy.score, maxLevel: legacy.maxLevel,
      dropIndex: legacy.dropIndex, baseUsed: legacy.baseUsed, extraUsed: 0, boardType: 'standard',
      rulesVersion: legacy.rulesVersion,
    };
  }
}

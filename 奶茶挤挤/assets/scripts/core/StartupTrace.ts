import { DiagnosticRing } from './DiagnosticRing';

export type StartupResult = 'start' | 'ok' | 'error' | 'cancel';
export interface StartupRecord {
  buildId: string; traceId: number; ownerEpoch: number; phase: string; result: StartupResult;
  elapsedMs: number; foregroundElapsedMs: number; code?: string; assetId?: string; bundleName?: string; stack?: string;
}
export interface StartupDetail { code?: string; assetId?: string; bundleName?: string; error?: unknown; stack?: string }

function safeNow(): number {
  try { return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now(); }
  catch { return 0; }
}

/**
 * In-process startup trace shared by AppRoot and GameRoot. Bounded to 32 records, never persisted or streamed.
 * A failing clock or a malformed detail must never fail the player boot.
 */
export class StartupTrace {
  private readonly ring = new DiagnosticRing<StartupRecord>(32);
  private traceId = 0;
  private ownerEpoch = 0;
  private readonly bootAtMs = safeNow();
  private foregroundMs = 0;
  constructor(private readonly readBuildId: () => string) {}

  beginTrace(ownerEpoch: number): number {
    this.ownerEpoch = Number.isSafeInteger(ownerEpoch) ? ownerEpoch : 0;
    this.traceId += 1;
    return this.traceId;
  }
  get currentTraceId(): number { return this.traceId; }
  get currentOwnerEpoch(): number { return this.ownerEpoch; }
  get foregroundElapsedMs(): number { return this.foregroundMs; }

  tickForeground(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    this.foregroundMs += deltaMs;
  }

  stage(phase: string, result: StartupResult, detail?: StartupDetail, ownerEpoch = this.ownerEpoch, traceId = this.traceId): void {
    try {
      const record: StartupRecord = {
        buildId: this.safeBuildId(), traceId, ownerEpoch: Number.isSafeInteger(ownerEpoch) ? ownerEpoch : 0,
        phase: String(phase).slice(0, 48), result, elapsedMs: this.elapsed(), foregroundElapsedMs: Math.round(this.foregroundMs),
      };
      if (detail?.code) record.code = this.summary(detail.code);
      if (detail?.assetId) record.assetId = this.summary(detail.assetId);
      if (detail?.bundleName) record.bundleName = this.summary(detail.bundleName);
      if (detail?.stack) record.stack = this.summary(detail.stack);
      if (detail?.error !== undefined) record.code = record.code ?? this.summary(detail.error);
      this.ring.append(record);
    } catch { /* diagnostics must never break the boot path */ }
  }

  latest(limit = 32): Array<{ seq: number; value: StartupRecord }> {
    try {
      const safe = Number.isSafeInteger(limit) ? Math.max(1, Math.min(32, limit)) : 32;
      const page = this.ring.page(Math.max(0, this.ring.latestSeq - safe), safe);
      return page.records;
    } catch { return []; }
  }
  get overflowCount(): number { try { return this.ring.overflowCount; } catch { return 0; } }
  exportJson(): string {
    try { return JSON.stringify(this.latest(32).map((row) => row.value)); } catch { return '[]'; }
  }

  private elapsed(): number { try { return Math.max(0, Math.round(safeNow() - this.bootAtMs)); } catch { return 0; } }
  private safeBuildId(): string { try { return this.readBuildId(); } catch { return 'unknown'; } }
  private summary(value: unknown): string {
    const text = value instanceof Error ? `${value.name}: ${value.message}` : String(value);
    return text.length <= 512 ? text : `${text.slice(0, 509)}...`;
  }
}

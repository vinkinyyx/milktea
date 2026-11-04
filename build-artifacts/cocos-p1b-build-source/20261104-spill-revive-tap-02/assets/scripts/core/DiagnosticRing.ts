export interface SequencedRecord<T> { seq: number; value: T }
export interface CursorPage<T> {
  records: SequencedRecord<T>[];
  oldestSeq: number;
  latestSeq: number;
  nextCursor: number;
  overflowCount: number;
  droppedRange: { from: number; to: number } | null;
}

/** Fixed-capacity diagnostic log. Sequence numbers never depend on retained array length. */
export class DiagnosticRing<T> {
  private readonly slots: Array<SequencedRecord<T> | undefined>;
  private _latestSeq = 0;
  private _count = 0;
  private _overflowCount = 0;
  constructor(readonly capacity: number) {
    if (!Number.isSafeInteger(capacity) || capacity < 1) throw new Error('DIAGNOSTIC_RING_CAPACITY_INVALID');
    this.slots = new Array(capacity);
  }
  get latestSeq(): number { return this._latestSeq; }
  get count(): number { return this._count; }
  get overflowCount(): number { return this._overflowCount; }
  get oldestSeq(): number { return this._count ? this._latestSeq - this._count + 1 : this._latestSeq + 1; }
  append(value: T): SequencedRecord<T> {
    if (this._latestSeq >= Number.MAX_SAFE_INTEGER) throw new Error('DIAGNOSTIC_SEQUENCE_OVERFLOW');
    const seq = ++this._latestSeq;
    this.slots[(seq - 1) % this.capacity] = { seq, value };
    if (this._count < this.capacity) this._count++; else this._overflowCount++;
    return this.slots[(seq - 1) % this.capacity]!;
  }
  page(cursor = 0, limit = 256): CursorPage<T> {
    const safeCursor = Number.isSafeInteger(cursor) && cursor >= 0 ? cursor : 0;
    const safeLimit = Number.isSafeInteger(limit) ? Math.max(1, Math.min(this.capacity, limit)) : 256;
    const oldestSeq = this.oldestSeq;
    const droppedRange = safeCursor < oldestSeq - 1 ? { from: safeCursor + 1, to: oldestSeq - 1 } : null;
    const first = Math.max(safeCursor + 1, oldestSeq);
    const last = Math.min(this._latestSeq, first + safeLimit - 1);
    const records: SequencedRecord<T>[] = [];
    for (let seq = first; seq <= last; seq++) {
      const record = this.slots[(seq - 1) % this.capacity];
      if (!record || record.seq !== seq) throw new Error(`DIAGNOSTIC_RING_SEQUENCE_GAP:${seq}`);
      records.push(record);
    }
    return { records, oldestSeq, latestSeq: this._latestSeq,
      nextCursor: records.length ? records[records.length - 1].seq : safeCursor,
      overflowCount: this._overflowCount, droppedRange };
  }
  clear(): void { this.slots.fill(undefined); this._latestSeq = 0; this._count = 0; this._overflowCount = 0; }
}

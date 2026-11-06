import { cloneState } from '../core/CloneState';
import type { LocalSaveBundle, LocalSaveBundleV1, LocalSaveEnvelope, LocalSaveEnvelopeV1, RunSnapshot } from '../contracts/types';
import { sha256Utf8 } from '../core/Sha256';

function normalize(value: unknown, seen = new Set<object>()): unknown {
  if (typeof value === 'number') { if (!Number.isFinite(value) || !Number.isSafeInteger(value) && Number.isInteger(value)) throw new Error('SAVE_NUMBER_INVALID'); return Object.is(value,-0)?0:value; }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) { if (seen.has(value)) throw new Error('SAVE_CYCLE'); seen.add(value); const result=value.map(v=>normalize(v,seen)); seen.delete(value); return result; }
  if (typeof value !== 'object' || value === undefined) throw new Error('SAVE_VALUE_UNSUPPORTED');
  if (seen.has(value as object)) throw new Error('SAVE_CYCLE'); seen.add(value as object);
  const object=value as Record<string,unknown>; const result:Record<string,unknown>={};
  for(const key of Object.keys(object).sort()) { if(object[key]===undefined)throw new Error(`SAVE_UNDEFINED:${key}`); result[key]=normalize(object[key],seen); }
  seen.delete(value as object); return result;
}
export function canonicalJson(value: unknown): string {
  const projected=normalize(value) as any;
  if(projected && Array.isArray(projected.ingredients)) projected.ingredients.sort((a:any,b:any)=>a.entityId-b.entityId);
  return JSON.stringify(projected);
}
export class SaveCodec {
  static canonicalJson(value: unknown): string { return canonicalJson(value); }
  static sealSnapshot(snapshot: RunSnapshot): RunSnapshot {
    const copy=cloneState(snapshot); copy.ingredients.sort((a,b)=>a.entityId-b.entityId); copy.checksum='';
    copy.checksum=sha256Utf8(canonicalJson(copy)); return copy;
  }
  static verifySnapshot(snapshot: RunSnapshot): boolean {
    if(!snapshot||typeof snapshot.checksum!=='string'||!/^[0-9a-f]{64}$/.test(snapshot.checksum))return false;
    const copy=cloneState(snapshot); const expected=copy.checksum; copy.checksum=''; return sha256Utf8(canonicalJson(copy))===expected;
  }
  static createEnvelope(revision:number,payload:LocalSaveBundleV1):LocalSaveEnvelopeV1 {
    const sealedPayload:LocalSaveBundleV1={...cloneState(payload),run:payload.run?this.sealSnapshot(payload.run as unknown as RunSnapshot) as unknown as LocalSaveBundleV1['run']:null};
    const envelope:LocalSaveEnvelopeV1={schemaVersion:1,revision,payload:sealedPayload,checksum:''};
    envelope.checksum=sha256Utf8(canonicalJson({schemaVersion:envelope.schemaVersion,revision:envelope.revision,payload:envelope.payload}));
    return envelope;
  }
  static verifyEnvelope(envelope:LocalSaveEnvelopeV1):boolean {
    if(!envelope||envelope.schemaVersion!==1||!Number.isSafeInteger(envelope.revision)||envelope.revision<0||!/^[0-9a-f]{64}$/.test(envelope.checksum))return false;
    if(envelope.payload.run&&!this.verifySnapshot(envelope.payload.run as unknown as RunSnapshot))return false;
    return sha256Utf8(canonicalJson({schemaVersion:envelope.schemaVersion,revision:envelope.revision,payload:envelope.payload}))===envelope.checksum;
  }
  static createEnvelopeV2(revision:number,payload:LocalSaveBundle):LocalSaveEnvelope {
    const sealedPayload={...cloneState(payload),run:payload.run?this.sealSnapshot(payload.run):null};
    const envelope:LocalSaveEnvelope={schemaVersion:2,revision,payload:sealedPayload,checksum:''};
    envelope.checksum=sha256Utf8(canonicalJson({schemaVersion:envelope.schemaVersion,revision:envelope.revision,payload:envelope.payload}));
    return envelope;
  }
  static verifyEnvelopeV2(envelope:LocalSaveEnvelope):boolean {
    if(!envelope||envelope.schemaVersion!==2||!Number.isSafeInteger(envelope.revision)||envelope.revision<0||!/^[0-9a-f]{64}$/.test(envelope.checksum))return false;
    if(envelope.payload.run&&!this.verifySnapshot(envelope.payload.run))return false;
    return sha256Utf8(canonicalJson({schemaVersion:envelope.schemaVersion,revision:envelope.revision,payload:envelope.payload}))===envelope.checksum;
  }
}

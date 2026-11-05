import type { DomainEvent, UUID } from '../contracts/types';
import { sha256Utf8 } from './Sha256';

export function deterministicEventId(runId: UUID, type: string, tick: number, stable: readonly (string | number)[]): UUID {
  const hash = sha256Utf8(JSON.stringify([runId, type, tick, ...stable]));
  const bytes = hash.slice(0, 32).split(''); bytes[12] = '8'; bytes[16] = ((parseInt(bytes[16],16)&3)|8).toString(16);
  const h = bytes.join(''); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

export function makeEvent<T extends DomainEvent>(event: T): T { return event; }

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveCodec = exports.canonicalJson = void 0;
const CloneState_1 = require("../core/CloneState");
const Sha256_1 = require("../core/Sha256");
function normalize(value, seen = new Set()) {
    if (typeof value === 'number') {
        if (!Number.isFinite(value) || !Number.isSafeInteger(value) && Number.isInteger(value))
            throw new Error('SAVE_NUMBER_INVALID');
        return Object.is(value, -0) ? 0 : value;
    }
    if (value === null || typeof value === 'string' || typeof value === 'boolean')
        return value;
    if (Array.isArray(value)) {
        if (seen.has(value))
            throw new Error('SAVE_CYCLE');
        seen.add(value);
        const result = value.map(v => normalize(v, seen));
        seen.delete(value);
        return result;
    }
    if (typeof value !== 'object' || value === undefined)
        throw new Error('SAVE_VALUE_UNSUPPORTED');
    if (seen.has(value))
        throw new Error('SAVE_CYCLE');
    seen.add(value);
    const object = value;
    const result = {};
    for (const key of Object.keys(object).sort()) {
        if (object[key] === undefined)
            throw new Error(`SAVE_UNDEFINED:${key}`);
        result[key] = normalize(object[key], seen);
    }
    seen.delete(value);
    return result;
}
function canonicalJson(value) {
    const projected = normalize(value);
    if (projected && Array.isArray(projected.ingredients))
        projected.ingredients.sort((a, b) => a.entityId - b.entityId);
    return JSON.stringify(projected);
}
exports.canonicalJson = canonicalJson;
class SaveCodec {
    static canonicalJson(value) { return canonicalJson(value); }
    static sealSnapshot(snapshot) {
        const copy = (0, CloneState_1.cloneState)(snapshot);
        copy.ingredients.sort((a, b) => a.entityId - b.entityId);
        copy.checksum = '';
        copy.checksum = (0, Sha256_1.sha256Utf8)(canonicalJson(copy));
        return copy;
    }
    static verifySnapshot(snapshot) {
        if (!snapshot || typeof snapshot.checksum !== 'string' || !/^[0-9a-f]{64}$/.test(snapshot.checksum))
            return false;
        const copy = (0, CloneState_1.cloneState)(snapshot);
        const expected = copy.checksum;
        copy.checksum = '';
        return (0, Sha256_1.sha256Utf8)(canonicalJson(copy)) === expected;
    }
    static createEnvelope(revision, payload) {
        const sealedPayload = { ...(0, CloneState_1.cloneState)(payload), run: payload.run ? this.sealSnapshot(payload.run) : null };
        const envelope = { schemaVersion: 1, revision, payload: sealedPayload, checksum: '' };
        envelope.checksum = (0, Sha256_1.sha256Utf8)(canonicalJson({ schemaVersion: envelope.schemaVersion, revision: envelope.revision, payload: envelope.payload }));
        return envelope;
    }
    static verifyEnvelope(envelope) {
        if (!envelope || envelope.schemaVersion !== 1 || !Number.isSafeInteger(envelope.revision) || envelope.revision < 0 || !/^[0-9a-f]{64}$/.test(envelope.checksum))
            return false;
        if (envelope.payload.run && !this.verifySnapshot(envelope.payload.run))
            return false;
        return (0, Sha256_1.sha256Utf8)(canonicalJson({ schemaVersion: envelope.schemaVersion, revision: envelope.revision, payload: envelope.payload })) === envelope.checksum;
    }
    static createEnvelopeV2(revision, payload) {
        const sealedPayload = { ...(0, CloneState_1.cloneState)(payload), run: payload.run ? this.sealSnapshot(payload.run) : null };
        const envelope = { schemaVersion: 2, revision, payload: sealedPayload, checksum: '' };
        envelope.checksum = (0, Sha256_1.sha256Utf8)(canonicalJson({ schemaVersion: envelope.schemaVersion, revision: envelope.revision, payload: envelope.payload }));
        return envelope;
    }
    static verifyEnvelopeV2(envelope) {
        if (!envelope || envelope.schemaVersion !== 2 || !Number.isSafeInteger(envelope.revision) || envelope.revision < 0 || !/^[0-9a-f]{64}$/.test(envelope.checksum))
            return false;
        if (envelope.payload.run && !this.verifySnapshot(envelope.payload.run))
            return false;
        return (0, Sha256_1.sha256Utf8)(canonicalJson({ schemaVersion: envelope.schemaVersion, revision: envelope.revision, payload: envelope.payload })) === envelope.checksum;
    }
}
exports.SaveCodec = SaveCodec;

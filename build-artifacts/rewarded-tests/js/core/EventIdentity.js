"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeEvent = exports.deterministicEventId = void 0;
const Sha256_1 = require("./Sha256");
function deterministicEventId(runId, type, tick, stable) {
    const hash = (0, Sha256_1.sha256Utf8)(JSON.stringify([runId, type, tick, ...stable]));
    const bytes = hash.slice(0, 32).split('');
    bytes[12] = '8';
    bytes[16] = ((parseInt(bytes[16], 16) & 3) | 8).toString(16);
    const h = bytes.join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
exports.deterministicEventId = deterministicEventId;
function makeEvent(event) { return event; }
exports.makeEvent = makeEvent;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpawnRng = void 0;
/** Independent deterministic stream for physical spawn jitter. */
class SpawnRng {
    constructor(seed, state, drawCount = 0) { this.state = (state !== null && state !== void 0 ? state : SpawnRng.seed(seed)) >>> 0; if (!this.state)
        throw new Error('SPAWN_RNG_ZERO'); this.draws = drawCount; }
    static seed(seed) { let x = (seed ^ 0x9e3779b9) >>> 0; x = (x ^ (x >>> 16)) >>> 0; x = Math.imul(x, 0x7feb352d) >>> 0; x = (x ^ (x >>> 15)) >>> 0; x = Math.imul(x, 0x846ca68b) >>> 0; x = (x ^ (x >>> 16)) >>> 0; return x || 0x6d2b79f5; }
    nextIndex(length) { let x = this.state; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.state = x >>> 0; this.draws++; return Math.floor(this.state / 0x100000000 * length); }
    snapshot() { return { algorithm: 'spawn-xorshift32-v1', state: this.state, drawCount: this.draws }; }
}
exports.SpawnRng = SpawnRng;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunRng = void 0;
/** Deterministic xorshift32 stream owned only by one run. */
class RunRng {
    constructor(seed, state, drawCount = 0) {
        if (!Number.isSafeInteger(seed) || seed <= 0 || seed > 0xffffffff)
            throw new Error('SEED_MUST_BE_NONZERO_UINT32');
        this.state = (state !== null && state !== void 0 ? state : seed) >>> 0;
        if (this.state === 0)
            throw new Error('RNG_STATE_CANNOT_BE_ZERO');
        if (!Number.isSafeInteger(drawCount) || drawCount < 0)
            throw new Error('RNG_DRAW_COUNT_INVALID');
        this.draws = drawCount;
    }
    nextU32() {
        let x = this.state >>> 0;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.state = x >>> 0;
        this.draws++;
        return this.state;
    }
    nextLevel(weights) {
        const value = this.nextU32() / 0x100000000;
        const total = weights.reduce((sum, item) => sum + item.weight, 0);
        let cursor = value * total;
        for (const item of weights) {
            cursor -= item.weight;
            if (cursor < 0)
                return item.level;
        }
        return weights[weights.length - 1].level;
    }
    snapshot() { return { algorithm: 'xorshift32_v1_nonzero_seed', state: this.state, drawCount: this.draws }; }
}
exports.RunRng = RunRng;

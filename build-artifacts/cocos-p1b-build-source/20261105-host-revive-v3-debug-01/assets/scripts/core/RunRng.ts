import type { Level, RngState } from '../contracts/types';

/** Deterministic xorshift32 stream owned only by one run. */
export class RunRng {
  private state: number;
  private draws: number;
  constructor(seed: number, state?: number, drawCount = 0) {
    if (!Number.isSafeInteger(seed) || seed <= 0 || seed > 0xffffffff) throw new Error('SEED_MUST_BE_NONZERO_UINT32');
    this.state = (state ?? seed) >>> 0;
    if (this.state === 0) throw new Error('RNG_STATE_CANNOT_BE_ZERO');
    if (!Number.isSafeInteger(drawCount) || drawCount < 0) throw new Error('RNG_DRAW_COUNT_INVALID');
    this.draws = drawCount;
  }
  nextU32(): number {
    let x = this.state >>> 0;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x >>> 0; this.draws++;
    return this.state;
  }
  nextLevel(weights: readonly { level: number; weight: number }[]): Level {
    const value = this.nextU32() / 0x100000000;
    const total = weights.reduce((sum, item) => sum + item.weight, 0);
    let cursor = value * total;
    for (const item of weights) { cursor -= item.weight; if (cursor < 0) return item.level as Level; }
    return weights[weights.length - 1].level as Level;
  }
  snapshot(): RngState { return { algorithm: 'xorshift32_v1_nonzero_seed', state: this.state, drawCount: this.draws }; }
}

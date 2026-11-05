"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardedAdCoordinator = void 0;
/** App-wide mutual exclusion for rewarded placements: only one SDK show may be in flight per app launch. */
class RewardedAdCoordinator {
    static claim(kind) {
        if (this.active)
            return false;
        this.active = kind;
        return true;
    }
    static release(kind) { if (this.active === kind)
        this.active = null; }
    static busy() { return this.active !== null; }
    static current() { return this.active; }
}
exports.RewardedAdCoordinator = RewardedAdCoordinator;
RewardedAdCoordinator.active = null;

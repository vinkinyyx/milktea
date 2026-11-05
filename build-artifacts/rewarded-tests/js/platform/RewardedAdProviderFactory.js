"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviveAdEnvironment = exports.createRewardedAdEnvironment = void 0;
const env_1 = require("cc/env");
const FakeRewardedAdProvider_1 = require("../debug/FakeRewardedAdProvider");
const TapRewardedAdProvider_1 = require("./TapRewardedAdProvider");
/**
 * Release/Tap builds always use the real Tap adapter. The debug branch is removed by
 * strip_p1c_release_debug.cjs together with the whole debug directory.
 */
function createRewardedAdEnvironment(policy) {
    if (env_1.DEBUG) {
        const mode = FakeRewardedAdProvider_1.FakeRewardedAdProvider.modeFromQuery();
        if (mode) {
            console.info('[debug-mock] rewarded shake enabled via ?rewardedMock, real ads are NOT shown');
            return { provider: new FakeRewardedAdProvider_1.FakeRewardedAdProvider(mode, policy), policy: { ...policy, enabled: true, adUnitId: 'debug-mock' } };
        }
    }
    return { provider: new TapRewardedAdProvider_1.TapRewardedAdProvider(policy), policy };
}
exports.createRewardedAdEnvironment = createRewardedAdEnvironment;
function createReviveAdEnvironment(policy) {
    if (env_1.DEBUG) {
        const mode = FakeRewardedAdProvider_1.FakeRewardedAdProvider.modeFromQuery();
        if (mode) {
            console.info('[debug-mock] spill revive enabled via ?rewardedMock, real ads are NOT shown');
            // Local closed-loop testing only: bypass first-session gates so a fixture spill can reach the offer.
            return {
                provider: new FakeRewardedAdProvider_1.FakeRewardedAdProvider(mode, policy),
                policy: { ...policy, enabled: true, adUnitId: 'debug-mock', minForegroundSecondsFirstSession: 0, requireTutorialComplete: false, requireFirstNaturalRunCompleted: false },
            };
        }
    }
    return { provider: new TapRewardedAdProvider_1.TapRewardedAdProvider(policy), policy };
}
exports.createReviveAdEnvironment = createReviveAdEnvironment;

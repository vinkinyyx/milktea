Error.stackTraceLimit = Infinity;

// Not every host exposes GameGlobal or fetch. Throwing here aborts game.js before the engine boots,
// which players see as "only the launch cover". Degrade quietly instead of failing the whole app.
if (typeof GameGlobal === 'undefined') {
    globalThis.GameGlobal = globalThis;
}
if (typeof GameGlobal.fetch === 'function') {
    GameGlobal.oldFetch = GameGlobal.fetch;
}
GameGlobal.fetch = undefined; // remove fetch to follow wx

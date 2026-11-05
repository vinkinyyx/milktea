"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneState = void 0;
/** Clone plain game state on hosts that do not expose the browser structuredClone API. */
function cloneState(value) {
    if (typeof structuredClone === 'function')
        return structuredClone(value);
    const seen = new Map();
    const copy = (item) => {
        if (item === null || typeof item !== 'object')
            return item;
        if (seen.has(item))
            return seen.get(item);
        const result = Array.isArray(item) ? [] : {};
        seen.set(item, result);
        for (const key of Object.keys(item))
            result[key] = copy(item[key]);
        return result;
    };
    return copy(value);
}
exports.cloneState = cloneState;

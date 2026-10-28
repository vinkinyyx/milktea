'use strict';

// Read-only child-process lifecycle tracing. It never changes arguments, return values, signals, or exit handling.
const fs = require('node:fs');
const childProcess = require('node:child_process');
const tracePath = process.env.MILKTEA_PROCESS_TRACE_PATH;
if (!tracePath) return;

function record(event, data = {}) {
  try { fs.appendFileSync(tracePath, JSON.stringify({ at: new Date().toISOString(), pid: process.pid, ppid: process.ppid, event, ...data }) + '\n'); }
  catch { /* diagnostic output failure must not affect the observed process */ }
}
record('process-start', { execPath: process.execPath, argv0: process.argv0, executableArguments: process.argv.slice(0, 4) });

const ChildProcess = childProcess.ChildProcess;
const originalKill = ChildProcess.prototype.kill;
ChildProcess.prototype.kill = function tracedKill(signal) {
  record('kill-request', { childPid: this.pid ?? null, signal: signal ?? null,
    callStack: new Error('ChildProcess.kill call site').stack?.split('\n').slice(1, 12) ?? [] });
  return originalKill.call(this, signal);
};

for (const method of ['spawn', 'fork', 'exec', 'execFile']) {
  const original = childProcess[method];
  if (typeof original !== 'function') continue;
  childProcess[method] = function tracedSpawn(...args) {
    const child = original.apply(this, args);
    const command = typeof args[0] === 'string' ? args[0] : '';
    record('child-start', { method, childPid: child.pid ?? null, command: command.slice(-240) });
    child.once('exit', (code, signal) => record('child-exit', { childPid: child.pid ?? null, code, signal }));
    child.once('close', (code, signal) => record('child-close', { childPid: child.pid ?? null, code, signal }));
    child.once('error', error => record('child-error', { childPid: child.pid ?? null, error: String(error) }));
    return child;
  };
}

process.once('exit', code => record('process-exit', { code }));

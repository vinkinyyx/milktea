'use strict';

const fs = require('node:fs');
const port = Number(process.argv[2]);
const tracePath = process.argv[3];
if (!Number.isInteger(port) || !tracePath) throw new Error('Usage: creator-inspector-trace.cjs <port> <tracePath>');

function record(event, details = {}) {
  fs.appendFileSync(tracePath, JSON.stringify({ at: new Date().toISOString(), event, ...details }) + '\n');
}

(async () => {
  const deadline = Date.now() + 20000;
  let target;
  while (Date.now() < deadline && !target) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      target = targets.find(item => item.type === 'node' && item.webSocketDebuggerUrl);
    } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  if (!target) throw new Error(`Node inspector target did not appear on 127.0.0.1:${port}`);
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  const expression = `(() => {
    const loadBuiltin = typeof process.getBuiltinModule === 'function'
      ? process.getBuiltinModule.bind(process)
      : typeof process.mainModule?.require === 'function' ? process.mainModule.require.bind(process.mainModule) : null;
    if (!loadBuiltin) return { installed: false, error: 'No inspector-visible built-in module loader',
      getBuiltinModule: typeof process.getBuiltinModule, mainModule: typeof process.mainModule };
    const childProcess = loadBuiltin('node:child_process');
    const fs = loadBuiltin('node:fs');
    const prototype = childProcess.ChildProcess.prototype;
    if (prototype.__p1aKillTraceInstalled) return { installed: false, alreadyInstalled: true, pid: process.pid };
    const originalKill = prototype.kill;
    Object.defineProperty(prototype, '__p1aKillTraceInstalled', { value: true });
    prototype.kill = function(signal) {
      const details = { event: 'child-kill-request', at: new Date().toISOString(), ownerPid: process.pid,
        childPid: this.pid ?? null, signal: signal ?? null,
        callStack: new Error('observed ChildProcess.kill call site').stack?.split('\\n').slice(1, 14) ?? [] };
      try { fs.appendFileSync(${JSON.stringify(tracePath)}, JSON.stringify(details) + '\\n'); } catch {}
      this.once('exit', (code, actualSignal) => {
        try { fs.appendFileSync(${JSON.stringify(tracePath)}, JSON.stringify({ event: 'child-exit-after-kill', at: new Date().toISOString(),
          ownerPid: process.pid, childPid: this.pid ?? null, code, signal: actualSignal }) + '\\n'); } catch {}
      });
      return originalKill.call(this, signal);
    };
    return { installed: true, pid: process.pid, execPath: process.execPath, argv: process.argv.slice(0, 4) };
  })()`;
  const response = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out installing Node inspector hook')), 10000);
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id === 1) { clearTimeout(timer); resolve(message); }
    });
    socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
  });
  if (response.error || response.result?.exceptionDetails) throw new Error(JSON.stringify(response.error ?? response.result.exceptionDetails));
  record('inspector-hook-installed', response.result?.result?.value ?? {});
  socket.close();
})().catch(error => {
  try { record('inspector-hook-error', { error: String(error), stack: error?.stack ?? null }); } catch {}
  process.exitCode = 1;
});

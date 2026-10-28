'use strict';
const { spawn } = require('node:child_process');
const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 10000)'], { stdio: 'ignore' });
setTimeout(() => child.kill('SIGTERM'), 150);
child.once('exit', () => process.exit(0));

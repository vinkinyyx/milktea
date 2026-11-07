// Verify UTF-8 SHA compatibility in host-like contexts, without changing save formats.
// Usage: node tools/verify_host_utf8.cjs [--project <cocos-project-dir>]
// The build gate passes the isolated staging project so the checked source is the exact packaging input.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const defaultProject = path.join(root, '奶茶挤挤');
const projectArg = process.argv.indexOf('--project');
const project = projectArg >= 0 && process.argv[projectArg + 1] ? path.resolve(process.argv[projectArg + 1]) : defaultProject;
const sourcePath = path.join(project, 'assets/scripts/core/Sha256.ts');
const typescript = [path.join(project, 'node_modules/typescript'), path.join(defaultProject, 'node_modules/typescript')]
  .find((candidate) => fs.existsSync(candidate));
if (!typescript) throw new Error('typescript is required to transpile Sha256.ts');
const ts = require(typescript);
const source = fs.readFileSync(sourcePath, 'utf8');
const sourceSha256 = crypto.createHash('sha256').update(source, 'utf8').digest('hex');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText;
const samples = ['', 'abc', '奶茶挤挤', '🧋😀', '\ud800', '\udfff', 'a\ud800b', '\ud800\ud800\udc00', '\0\u07ff\u0800\uffff', 'x'.repeat(65)];
let seed = 12345;
for (let i = 0; i < 100; i++) {
  let value = '';
  for (let j = 0; j < 127; j++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; value += String.fromCharCode(seed >>> 16); }
  samples.push(value);
}
const modes = {
  native: globalThis.TextEncoder,
  missing: undefined,
  null: null,
  object: {},
  nonConstructible: () => {},
  throwing: function () { throw new Error('HOST_ENCODER_BROKEN'); },
};
let comparisons = 0;
for (const [name, encoder] of Object.entries(modes)) {
  const context = { exports: {}, TextEncoder: encoder };
  vm.runInNewContext(code, context);
  for (const sample of samples) {
    assert.equal(context.exports.sha256Utf8(sample), crypto.createHash('sha256').update(sample, 'utf8').digest('hex'), name);
    comparisons++;
  }
}
console.log(JSON.stringify({
  status: 'PASS', source: sourcePath.replaceAll('\\', '/'), sourceSha256,
  hostModes: Object.keys(modes), samples: samples.length, comparisons,
}));

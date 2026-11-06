const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const [projectArg, evidenceArg] = process.argv.slice(2);
if (!projectArg || !evidenceArg) throw new Error('usage: node strip_p1c_release_debug.cjs <isolated-project> <evidence-json>');
const project = path.resolve(projectArg);
const buildRoot = path.resolve(__dirname, '../build-artifacts/cocos-p1b-build-source');
if (!project.startsWith(buildRoot + path.sep)) throw new Error(`refusing to modify outside isolated build source: ${project}`);
const typescript = require(path.join(project, 'node_modules/typescript'));
const records = [];
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
function editAst(relative, select, expected, replaceNode = null) {
  const file = path.join(project, relative);
  const before = fs.readFileSync(file, 'utf8');
  const ast = typescript.createSourceFile(file, before, typescript.ScriptTarget.Latest, true, typescript.ScriptKind.TS);
  if (ast.parseDiagnostics.length) throw new Error(`TypeScript parse failed for ${relative}`);
  const edits = [];
  function walk(node) { const action = select(node, ast); if (action) { edits.push({ node, replacement: action.replacement ?? '' }); return; } typescript.forEachChild(node, walk); }
  walk(ast);
  if (edits.length !== expected) throw new Error(`${relative}: expected ${expected} exact AST targets; found ${edits.length}`);
  let after = before;
  for (const edit of edits.sort((a, b) => b.node.getStart(ast) - a.node.getStart(ast))) {
    const text = edit.replacement || (replaceNode ? replaceNode(edit.node, ast) : '');
    after = after.slice(0, edit.node.getStart(ast)) + text + after.slice(edit.node.getEnd());
  }
  const check = typescript.createSourceFile(file, after, typescript.ScriptTarget.Latest, true, typescript.ScriptKind.TS);
  if (check.parseDiagnostics.length) throw new Error(`${relative}: AST output did not parse`);
  fs.writeFileSync(file, after, 'utf8');
  records.push({ path: relative.replaceAll('\\', '/'), beforeSha256: hash(before), afterSha256: hash(after), exactNodeEdits: edits.length });
}
function methodNamed(name) { return (node, ast) => typescript.isMethodDeclaration(node) && node.name && typescript.isIdentifier(node.name) && node.name.text === name ? { replacement: '' } : null; }
function expressionStatementContains(text) { return (node, ast) => typescript.isExpressionStatement(node) && node.expression.getText(ast).includes(text) ? { replacement: '' } : null; }
function variableNamed(name) { return (node, ast) => typescript.isVariableStatement(node) && node.declarationList.declarations.some(d => typescript.isIdentifier(d.name) && d.name.text === name) ? { replacement: '' } : null; }

// Remove the debug-only PhysicsLab scene and its scripts from this release copy; workspace assets/metas remain untouched.
const debugPaths = ['assets/scenes/PhysicsLab.scene', 'assets/scenes/PhysicsLab.scene.meta', 'assets/scripts/debug.meta'];
for (const rel of debugPaths) {
  const file = path.join(project, rel);
  if (!fs.existsSync(file)) throw new Error(`expected isolated debug asset is missing: ${rel}`);
  const bytes = fs.readFileSync(file); records.push({ path: rel, removedSha256: hash(bytes), bytes: bytes.length }); fs.unlinkSync(file);
}
const debugDir = path.join(project, 'assets/scripts/debug');
if (!fs.existsSync(debugDir)) throw new Error('expected isolated debug scripts directory is missing');
const removedDebugScripts = [];
function removeTree(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) removeTree(full); else { const bytes = fs.readFileSync(full); removedDebugScripts.push({ path: path.relative(project, full).replaceAll('\\', '/'), sha256: hash(bytes), bytes: bytes.length }); fs.unlinkSync(full); } } fs.rmdirSync(dir); }
removeTree(debugDir); records.push(...removedDebugScripts);

// Boot keeps the normal player path; remove only the p1aLab route and lifecycle test global.
editAst('assets/scripts/bootstrap/AppRoot.ts', (node, ast) => {
  if (typescript.isVariableStatement(node) && node.declarationList.declarations.some(d => typescript.isIdentifier(d.name) && d.name.text === 'diagnosticLab')) return {};
  if (typescript.isIfStatement(node) && node.expression.getText(ast) === 'diagnosticLab' && node.elseStatement) {
    return { replacement: node.elseStatement.statements.map(s => s.getText(ast)).join('\n') };
  }
  if (typescript.isExpressionStatement(node) && node.getText(ast).includes('__p1aLifecycle')) return {};
  if (typescript.isImportDeclaration(node) && node.moduleSpecifier.getText(ast) === "'cc'" && node.importClause?.namedBindings && typescript.isNamedImports(node.importClause.namedBindings)) {
    const ids = node.importClause.namedBindings.elements.filter(e => e.name.text === 'director');
    if (ids.length) {
      const replacement = before => {
        let text = node.getText(ast); const spec = ids[0].getText(ast); text = text.replace(`, ${spec}`, '').replace(`${spec}, `, ''); return text;
      };
      return { replacement: replacement() };
    }
  }
  return null;
}, 4);

// GameRoot test fixture and browser diagnostics API are preserved in the workspace/Debug source only. Both exact DEBUG publication sites are removed, including post-resource-retry diagnostics.
editAst('assets/scripts/presentation/GameRoot.ts', (node, ast) => {
  if ((typescript.isMethodDeclaration(node) && ['makeFixtureSnapshot', 'publishDiagnostics'].includes(node.name?.getText(ast))) ||
      (typescript.isIfStatement(node) && node.expression.getText(ast) === 'DEBUG')) return {};
  if (typescript.isImportDeclaration(node) && node.moduleSpecifier.getText(ast) === "'cc/env'") return {};
  return null;
}, 5);

// Remove probe rings/timing collectors and their otherwise-dead update hooks from this Release copy.
const gameRootProbeFields = new Set(['events', 'commands', 'frames', 'timingSaveMs', 'dangerStepTrace', 'dangerStepTraceEnabled',
  'pressureStepTrace', 'pressureStepTraceEnabled', 'pressurePreviousPositions', 'pressurePenetrationTicks', 'diagnosticAttemptId',
  'priorFrameWall', 'lastPresentationMs', 'probeSetting', 'framePhysicsMs', 'frameLogicMs', 'lastConsumedDomainEvent']);
const gameRootProbeMethods = new Set(['recordFrame', 'recordPressureStep', 'probeMode']);
const probeRingClearStatements = new Set(['this.events.clear()', 'this.commands.clear()']);
editAst('assets/scripts/presentation/GameRoot.ts', (node, ast) => {
  if (typescript.isPropertyDeclaration(node) && node.name && gameRootProbeFields.has(node.name.getText(ast))) return {};
  if (typescript.isMethodDeclaration(node) && node.name && gameRootProbeMethods.has(node.name.getText(ast))) return {};
  if (typescript.isImportDeclaration(node) && node.moduleSpecifier.getText(ast) === "'../core/DiagnosticRing'") return {};
  if (typescript.isVariableStatement(node) && node.declarationList.declarations.some(d => typescript.isIdentifier(d.name) && d.name.text === 'requestedProbe')) return {};
  if (typescript.isIfStatement(node) && (node.expression.getText(ast).includes('dangerStepTraceEnabled') ||
      node.expression.getText(ast).includes('diagnosticAttemptId') || node.thenStatement.getText(ast).includes('diagnosticAttemptId') ||
      node.expression.getText(ast).includes('timingSaveMs') || node.thenStatement.getText(ast).includes('timingSaveMs') ||
      (node.expression.getText(ast).includes('probeMode') && node.thenStatement.getText(ast).includes('.append')) ||
      node.thenStatement.getText(ast).includes('recordFrame('))) return {};
  // The ring clears must be standalone statements: both probeState resets are split across individual statements, so
  // matching the exact text never deletes an adjacent runtime reset such as ingredientViews.clear()/consumedDomainEventIds.
  // f1c49c0 added the pair inside returnToMenuFromError (error layer -> menu reset); that is the +2 over 46.
  if (typescript.isExpressionStatement(node) && probeRingClearStatements.has(node.expression.getText(ast))) return {};
  if (typescript.isExpressionStatement(node) && /this\.frames\.append\(|this\.lastConsumedDomainEvent\s*=|this\.probeSetting\s*=|this\.(framePhysicsMs|frameLogicMs|lastPresentationMs)\s*(?:\+=|=)/.test(node.expression.getText(ast))) return {};
  if (typescript.isExpressionStatement(node) && node.expression.getText(ast).includes('recordPressureStep(')) return {};
  if (typescript.isBinaryExpression(node) && typescript.isCallExpression(node.left) && node.left.expression.getText(ast) === 'this.probeMode' &&
      (node.operatorToken.kind === typescript.SyntaxKind.EqualsEqualsEqualsToken || node.operatorToken.kind === typescript.SyntaxKind.ExclamationEqualsEqualsToken)) {
    return { replacement: 'false' };
  }
  return null;
}, 48);

// Remove adapter fault/probe seams and their fields; they exist only for P1-B fixture injection.
const adapterTestFields = new Set(['contactEnumerationReversed', 'lastEnumeratedContactIds', 'staleCallbackProbes', 'fixtureAccelerationProbe',
  'fixtureMergeFault', 'fixtureMergeCommitCount', 'fixtureMergeProbe', 'fixtureWallProbe']);
const adapterTestMethods = new Set(['setFixtureMergeFaultOnce', 'enableFixtureMergeProbe', 'enableFixtureWallProbe', 'readFixtureWallProbe',
  'readFixtureWallGeometry', 'recordFixtureMerge', 'readFixtureMergeProbe', 'enableFixtureAccelerationProbe', 'readFixtureAccelerationProbe',
  'setContactEnumerationReversedForFixture', 'fixtureContactEnumeration', 'setLinearDampingForTest', 'setBodyPositionForTest',
  'setBodyVelocityForTest', 'replayStaleContactCallbacksForTest']);
editAst('assets/scripts/physics/CocosPhysicsAdapter.ts', (node, ast) => {
  if (typescript.isPropertyDeclaration(node) && node.name && adapterTestFields.has(node.name.getText(ast))) return {};
  if (typescript.isMethodDeclaration(node) && node.name && adapterTestMethods.has(node.name.getText(ast))) return {};
  if (typescript.isGetAccessorDeclaration(node) && node.name && adapterTestMethods.has(node.name.getText(ast))) return {};
  if (typescript.isIfStatement(node) && /fixtureMergeFault|fixtureWallProbe|contactEnumerationReversed/.test(node.expression.getText(ast))) return {};
  if (typescript.isExpressionStatement(node) && /fixtureAccelerationProbe|lastEnumeratedContactIds|staleCallbackProbes/.test(node.expression.getText(ast))) return {};
  return null;
}, 30);
editAst('assets/scripts/core/RunEngine.ts', (node, ast) => {
  if (typescript.isVariableStatement(node) && node.declarationList.declarations.some(d => typescript.isIdentifier(d.name) && d.name.text === 'fixtureProbe')) return {};
  if (typescript.isExpressionStatement(node) && node.expression.getText(ast).includes('fixtureProbe?.call')) return {};
  return null;
}, 2);

// Reward-shake adapter selection keeps a Debug-only mock branch and import; Release/Tap builds must
// contain only the real Tap adapter. The mock file itself is removed with assets/scripts/debug.
editAst('assets/scripts/platform/RewardedAdProviderFactory.ts', (node, ast) => {
  if (typescript.isImportDeclaration(node) && node.moduleSpecifier.getText(ast) === "'cc/env'") return {};
  if (typescript.isImportDeclaration(node) && node.getText(ast).includes('FakeRewardedAdProvider')) return {};
  if (typescript.isIfStatement(node) && node.expression.getText(ast) === 'DEBUG') return {};
  return null;
}, 4);

const record = {
  project,
  edits: records,
  parser: 'TypeScript compiler AST; exact node kinds/names/counts asserted; no text-pattern rewrite',
  workspaceSourcesAndAssetsModified: false,
};
const evidencePath = path.resolve(evidenceArg);
fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
fs.writeFileSync(evidencePath, JSON.stringify(record, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(record));

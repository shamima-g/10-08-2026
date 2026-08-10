#!/usr/bin/env node
/**
 * Automated tests for the three workflow context hooks and their shared lib:
 *   workflow-guard.js, inject-phase-context.js, inject-agent-context.js,
 *   lib/workflow-state.js
 *
 * These hooks were PowerShell until the cross-platform port, which meant they
 * could never be covered here — .github/workflows/template-tests.yml runs on
 * ubuntu-latest and discovers .claude/**\/*.tests.js. Now that they're Node, this
 * suite runs on every platform CI uses.
 *
 * Strategy: the message/context builders are exported as pure functions taking an
 * explicit (root, resolution) pair, so every branch is exercised against a temp
 * fixture directory with no git repo and no real epic required. A final
 * integration group spawns each hook for real to confirm the stdout contract
 * (valid JSON, exit 0) that the harness depends on.
 *
 * Usage:
 *   node .claude/hooks/workflow-hooks.tests.js
 */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ws = require('./lib/workflow-state');
const { buildGuardMessage, DEV_REPO_MESSAGE } = require('./workflow-guard');
const phaseHook = require('./inject-phase-context');
const agentHook = require('./inject-agent-context');
const openPage = require('../scripts/open-page');

let passed = 0;
let failed = 0;
const errors = [];

function check(description, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32mPASS\x1b[0m: ${description}`);
  } else {
    failed++;
    const msg = `FAIL: ${description}${detail ? ` — ${detail}` : ''}`;
    errors.push(msg);
    console.log(`  \x1b[31m${msg}\x1b[0m`);
  }
}

function contains(description, haystack, needle) {
  check(description, typeof haystack === 'string' && haystack.includes(needle), `missing ${JSON.stringify(needle)}`);
}

function equals(description, actual, expected) {
  check(description, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// --- Fixture helpers -------------------------------------------------------

const tempRoots = [];

/**
 * Creates a throwaway project root. `opts` toggles the markers each guard branch
 * keys off, so a test states only what it needs.
 */
function makeRoot(opts = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-hooks-'));
  tempRoots.push(root);
  if (opts.devRepo) fs.writeFileSync(path.join(root, '.release-ignore'), 'x\n');
  if (opts.nodeModules) fs.mkdirSync(path.join(root, 'web', 'node_modules'), { recursive: true });
  if (opts.projectMd) {
    fs.mkdirSync(path.join(root, 'generated-docs'), { recursive: true });
    fs.writeFileSync(path.join(root, 'generated-docs', 'project.md'), '# project\n');
  }
  if (opts.legacyState) {
    fs.mkdirSync(path.join(root, 'generated-docs', 'context'), { recursive: true });
    fs.writeFileSync(path.join(root, 'generated-docs', 'context', 'workflow-state.json'), '{}');
  }
  return root;
}

/** Writes state.json for `slug` and returns the matching resolution object. */
function withEpicState(root, slug, state) {
  const rel = `generated-docs/epics/${slug}/state.json`;
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, typeof state === 'string' ? state : JSON.stringify(state));
  return { kind: 'epic', branch: `epic/${slug}`, slug, path: rel, absolutePath: abs, exists: true };
}

function noEpicResolution() {
  return { kind: 'none', branch: 'main', slug: null, path: null, absolutePath: null, exists: false };
}

function cleanup() {
  for (const dir of tempRoots) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
}

// =============================================================================
// lib/workflow-state.js
// =============================================================================
console.log('\nlib/workflow-state: storySummary');

equals('finds the in-progress story key',
  ws.storySummary({ stories: { 1: { status: 'complete' }, 2: { status: 'in-progress' } } }).inProgress, '2');
equals('null when no story is in progress',
  ws.storySummary({ stories: { 1: { status: 'complete' } } }).inProgress, null);
equals('null when stories is absent', ws.storySummary({ phase: 'BUILD' }).inProgress, null);
equals('null for null state', ws.storySummary(null).inProgress, null);
// Guarded in the PowerShell original: [int]"intro" was a terminating cast error.
equals('non-numeric story key returned as a string',
  ws.storySummary({ stories: { intro: { status: 'in-progress' } } }).inProgress, 'intro');
// The falsy-zero trap: key "0" must read as a story, not as "no story".
equals('story key "0" is returned, not treated as absent',
  ws.storySummary({ stories: { 0: { status: 'in-progress' } } }).inProgress, '0');
equals('tolerates a null story entry',
  ws.storySummary({ stories: { 1: null, 2: { status: 'in-progress' } } }).inProgress, '2');
// A halt leaves nothing in-progress. The hooks report the halted story instead of
// "no story", so the halt is re-surfaced rather than read as "move on".
{
  const halted = ws.storySummary({ stories: { 1: { status: 'complete' }, 2: { status: 'halted' } } });
  equals('surfaces a halted story key', halted.halted, '2');
  equals('a halted story is not reported as in-progress', halted.inProgress, null);
}

const counts = ws.storySummary({ stories: { 1: { status: 'complete' }, 2: { status: 'complete' }, 3: { status: 'in-progress' } } });
equals('counts total stories', counts.total, 3);
equals('counts complete stories', counts.complete, 2);
equals('empty state totals zero', ws.storySummary(null).total, 0);
equals('stories absent totals zero', ws.storySummary({ phase: 'PLAN' }).total, 0);

console.log('\nlib/workflow-state: isActiveWorkflow');

equals('BUILD is active', ws.isActiveWorkflow({ phase: 'BUILD' }), true);
equals('READY-TO-BUILD is active', ws.isActiveWorkflow({ phase: 'READY-TO-BUILD' }), true);
equals('COMPLETE is not active', ws.isActiveWorkflow({ phase: 'COMPLETE' }), false);
equals('missing phase is not active', ws.isActiveWorkflow({}), false);
equals('null state is not active', ws.isActiveWorkflow(null), false);
// COMPLETE-ON-BRANCH stays active deliberately — the merge is outstanding and
// phase-context/complete-on-branch.md exists to guide it.
equals('COMPLETE-ON-BRANCH is still active (merge outstanding)',
  ws.isActiveWorkflow({ phase: 'COMPLETE-ON-BRANCH' }), true);
// A phase outside EPIC_PHASES must not inject context announcing a phase that
// doesn't exist.
equals('an unknown phase is not active', ws.isActiveWorkflow({ phase: 'BUILDING' }), false);

console.log('\nlib/workflow-state: toRelativePath');

{
  const root = makeRoot();
  const abs = path.join(root, 'generated-docs', 'epics', 'checkout', 'brief.md');
  equals('returns a forward-slashed relative path',
    ws.toRelativePath(abs, root), 'generated-docs/epics/checkout/brief.md');
}

console.log('\nlib/workflow-state: findFirstFile');

{
  const root = makeRoot();
  const dir = path.join(root, 'stories');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'story-2-checkout.md'), '');
  fs.writeFileSync(path.join(dir, 'story-2-alternate.md'), '');
  fs.writeFileSync(path.join(dir, 'story-10-other.md'), '');
  fs.writeFileSync(path.join(dir, 'story-2-notes.txt'), '');

  equals('picks the alphabetically-first match (deterministic across readdir order)',
    ws.findFirstFile(dir, 'story-2-', '.md', root), 'stories/story-2-alternate.md');
  equals('suffix filter excludes non-.md matches',
    ws.findFirstFile(dir, 'story-2-notes', '.md', root), null);
  equals('prefix is matched literally, not as a numeric compare',
    ws.findFirstFile(dir, 'story-10-', '.md', root), 'stories/story-10-other.md');
  equals('missing directory yields null, not a throw',
    ws.findFirstFile(path.join(root, 'nope'), 'story-1-', '.md', root), null);
}

console.log('\nlib/workflow-state: resolveStoryAndTestFiles');

{
  const root = makeRoot();
  const storyDir = path.join(root, 'generated-docs', 'epics', 'checkout', 'stories');
  const testDir = path.join(root, 'web', 'src', '__tests__', 'integration');
  fs.mkdirSync(storyDir, { recursive: true });
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(path.join(storyDir, 'story-3-payment.md'), '');
  fs.writeFileSync(path.join(testDir, 'epic-checkout-story-3-payment.test.tsx'), '');

  const state = { phase: 'BUILD', stories: { 3: { status: 'in-progress' } } };
  const files = ws.resolveStoryAndTestFiles(root, state, 'checkout');
  equals('resolves the story file', files.storyFile, 'generated-docs/epics/checkout/stories/story-3-payment.md');
  equals('resolves the integration test file', files.testFile, 'web/src/__tests__/integration/epic-checkout-story-3-payment.test.tsx');

  const none = ws.resolveStoryAndTestFiles(root, { phase: 'EPIC-END', stories: { 3: { status: 'complete' } } }, 'checkout');
  equals('no in-progress story yields no story file', none.storyFile, null);
  equals('no in-progress story yields no test file', none.testFile, null);
}

// =============================================================================
// workflow-guard.js — every branch, in precedence order
// =============================================================================
console.log('\nworkflow-guard: branch precedence');

contains('dev repo (.release-ignore) short-circuits to the maintenance note',
  buildGuardMessage(makeRoot({ devRepo: true }), noEpicResolution()), 'TEMPLATE-DEV REPO');
// The guard runs on EVERY user prompt, and resolving state spawns git. The branches
// above Branch C must return without paying for it, so the lazy form is not optional.
{
  let resolved = 0;
  const lazy = () => { resolved++; return noEpicResolution(); };
  buildGuardMessage(makeRoot({ devRepo: true }), lazy);
  equals('the dev-repo branch never resolves state (no git spawn)', resolved, 0);
  buildGuardMessage(makeRoot(), lazy);
  equals('the uninitialised-project branch never resolves state', resolved, 0);
  buildGuardMessage(makeRoot({ nodeModules: true, legacyState: true }), lazy);
  equals('the legacy-shape branch never resolves state', resolved, 0);
  contains('Branch C does resolve state, via the lazy form',
    buildGuardMessage(makeRoot({ nodeModules: true, projectMd: true }), lazy), 'No epic in flight');
  equals('state is resolved exactly once, and only when needed', resolved, 1);
}
equals('dev-repo message is the exported constant',
  buildGuardMessage(makeRoot({ devRepo: true }), noEpicResolution()), DEV_REPO_MESSAGE);
// Precedence matters: a dev repo must win even with an active epic present.
{
  const root = makeRoot({ devRepo: true, nodeModules: true, projectMd: true });
  const res = withEpicState(root, 'checkout', { phase: 'BUILD' });
  contains('dev repo wins over an active epic', buildGuardMessage(root, res), 'TEMPLATE-DEV REPO');
}

contains('missing web/node_modules reports an uninitialised project',
  buildGuardMessage(makeRoot(), noEpicResolution()), 'Project not initialized');

contains('legacy state without project.md routes to /migrate-legacy',
  buildGuardMessage(makeRoot({ nodeModules: true, legacyState: true }), noEpicResolution()), '/migrate-legacy');

contains('project.md but no epic branch reports no epic in flight',
  buildGuardMessage(makeRoot({ nodeModules: true, projectMd: true }), noEpicResolution()), 'No epic in flight');

contains('no project.md and no epic reports no active workflow',
  buildGuardMessage(makeRoot({ nodeModules: true }), noEpicResolution()), 'No active workflow');

{
  const root = makeRoot({ nodeModules: true, projectMd: true });
  const res = { kind: 'epic', branch: 'epic/checkout', slug: 'checkout', path: null, absolutePath: path.join(root, 'nope.json'), exists: false };
  contains('epic branch with no state.json asks to re-initialise', buildGuardMessage(root, res), 'state.json is missing');
}

// An epic/* branch the resolver rejects on NAME must not be reported as "no epic in
// flight" — that told a user standing on one to /start a second epic.
{
  const root = makeRoot({ nodeModules: true, projectMd: true });
  const res = { status: 'error', error: 'Invalid epic slug', kind: null, branch: 'epic/My_Feature', slug: null, path: null, absolutePath: null, exists: false };
  const msg = buildGuardMessage(root, res);
  contains('an invalid epic branch name names the branch', msg, 'epic/My_Feature');
  contains('an invalid epic branch name explains the naming rule', msg, 'lowercase letters, numbers and hyphens');
  contains('an invalid epic branch name says how to fix it', msg, 'git branch -m');
  check('an invalid epic branch name is not reported as no-epic', !msg.includes('No epic in flight'));
}

console.log('\nworkflow-guard: state.json content branches');

{
  const root = makeRoot({ nodeModules: true, projectMd: true });
  // Fails CLOSED by design: a silent pass here would let untracked work proceed.
  const res = withEpicState(root, 'checkout', '{ not valid json');
  const msg = buildGuardMessage(root, res);
  contains('corrupt state.json is surfaced, not failed open', msg, 'unreadable');
  contains('corrupt state.json names the file to repair', msg, 'generated-docs/epics/checkout/state.json');
  contains('corrupt state.json warns against untracked work', msg, 'do not start untracked work');
}

{
  const root = makeRoot({ nodeModules: true, projectMd: true });
  contains('COMPLETE-ON-BRANCH points at the PR/merge step',
    buildGuardMessage(root, withEpicState(root, 'checkout', { phase: 'COMPLETE-ON-BRANCH' })), 'PR/merge is pending');
}

// A halt leaves no story in-progress. Reporting "Story: N/A" hid it, and the
// orchestrator read that as "no story underway" and resumed BUILD instead of
// re-surfacing the halt.
{
  const root = makeRoot({ nodeModules: true, projectMd: true });
  const res = withEpicState(root, 'checkout', {
    phase: 'BUILD',
    stories: { 1: { status: 'complete' }, 2: { status: 'halted' } },
  });
  const msg = buildGuardMessage(root, res);
  contains('a halted story is named, not reported as N/A', msg, 'Story: 2');
  contains('a halted story is flagged as halted', msg, 'HALTED');
  check('a halted story is not reported as N/A', !msg.includes('Story: N/A'));
}
{
  const root = makeRoot({ nodeModules: true, projectMd: true });
  contains('COMPLETE warns about a stale branch',
    buildGuardMessage(root, withEpicState(root, 'checkout', { phase: 'COMPLETE' })), 'stale branch');
}
{
  const root = makeRoot({ nodeModules: true, projectMd: true });
  const msg = buildGuardMessage(root, withEpicState(root, 'checkout', { phase: 'READY-TO-BUILD', epic: { name: 'Checkout Flow' } }));
  contains('READY-TO-BUILD is reported as parked', msg, 'parked at READY-TO-BUILD');
  contains('READY-TO-BUILD includes the epic name', msg, 'Checkout Flow');
}
{
  const root = makeRoot({ nodeModules: true, projectMd: true });
  const state = { phase: 'BUILD', epic: { name: 'Checkout Flow' }, stories: { 2: { status: 'in-progress' } } };
  const msg = buildGuardMessage(root, withEpicState(root, 'checkout', state));
  contains('active epic reports the phase', msg, 'Phase: BUILD');
  contains('active epic reports slug and name', msg, 'Epic: checkout (Checkout Flow)');
  contains('active epic reports the current story', msg, 'Story: 2');
  contains('active epic redirects to /continue', msg, '/continue');
}
{
  const root = makeRoot({ nodeModules: true, projectMd: true });
  const msg = buildGuardMessage(root, withEpicState(root, 'checkout', { phase: 'EPIC-END' }));
  contains('epic-level phase reports N/A for story', msg, 'Story: N/A');
  contains('epic name falls back to the slug when absent', msg, 'Epic: checkout (checkout)');
}

// =============================================================================
// inject-phase-context.js
// =============================================================================
console.log('\ninject-phase-context');

{
  const root = makeRoot({ nodeModules: true, projectMd: true });
  const storyDir = path.join(root, 'generated-docs', 'epics', 'checkout', 'stories');
  fs.mkdirSync(storyDir, { recursive: true });
  fs.writeFileSync(path.join(storyDir, 'story-2-payment.md'), '');
  const state = {
    phase: 'BUILD',
    epic: { name: 'Checkout Flow' },
    stories: { 1: { status: 'complete' }, 2: { status: 'in-progress' }, 3: { status: 'pending' } },
  };
  const res = withEpicState(root, 'checkout', state);
  const ctx = phaseHook.buildContext(root, __dirname, res, state);

  contains('emits the workflow-position heading', ctx, '## Current Workflow Position');
  contains('reports epic slug and name', ctx, '- Epic: checkout (Checkout Flow)');
  contains('reports the branch', ctx, '- Branch: epic/checkout');
  contains('reports the phase', ctx, '- Phase: BUILD');
  contains('reports story progress with totals', ctx, '- Story: 2 of 3 (1 complete)');
  contains('lists the resolved story file', ctx, '- Story file: generated-docs/epics/checkout/stories/story-2-payment.md');
  check('omits the test file line when no test exists', !ctx.includes('- Test file:'));
  contains('restores the orchestration rules lost on compaction', ctx, '## Orchestration Rules (post-compaction recovery)');
  contains('restores the phase model', ctx, 'PLAN -> BUILD -> EPIC-END');
  contains('restores the approvals list', ctx, '2. Stories approval');
  contains('names the undocumented-endpoint halt category', ctx, 'undocumented-endpoint');
  contains('restores the quality reminders', ctx, '## Quality Reminders');
  // The real phase-context/build.md must be appended for phase BUILD — assert on ITS
  // heading, not on a string every snippet shares, or loading the wrong file passes.
  contains('appends the BUILD phase snippet', ctx, '# BUILD Phase Context');
  check('appends only the BUILD snippet', !ctx.includes('# EPIC-END Phase Context'));
  check('context is right-trimmed', ctx === ctx.trimEnd());
}

{
  const root = makeRoot();
  const state = { phase: 'PLAN', stories: {} };
  const res = { kind: 'epic', branch: 'epic/x', slug: 'x', path: null, absolutePath: path.join(root, 's.json'), exists: true };
  const ctx = phaseHook.buildContext(root, __dirname, res, state);
  contains('epic-level phase with no stories reports N/A', ctx, '- Story: N/A (epic-level phase)');
}

// The halted story must reach BOTH injected contexts — post-compaction (the
// orchestrator) and every subagent launch.
{
  const root = makeRoot({ nodeModules: true, projectMd: true });
  const state = { phase: 'BUILD', epic: { name: 'Checkout Flow' }, stories: { 1: { status: 'complete' }, 2: { status: 'halted' } } };
  const res = withEpicState(root, 'checkout', state);

  const phaseCtx = phaseHook.buildContext(root, __dirname, res, state);
  contains('post-compaction context names the halted story', phaseCtx, '- Story: 2 of 2 (1 complete)');
  contains('post-compaction context says to re-surface the halt', phaseCtx, 'HALTED, re-surface the halt');

  const agentCtx = agentHook.buildContext(root, res, state);
  contains('subagent context names the halted story', agentCtx, '- Story: 2 (HALTED)');
}

equals('a phase with no snippet file yields an empty snippet',
  phaseHook.buildPhaseSnippet(__dirname, 'READY-TO-BUILD'), '');
equals('a null phase yields an empty snippet', phaseHook.buildPhaseSnippet(__dirname, null), '');
// state.json is the source of `phase`, so it must not be able to name a file outside
// phase-context/ and have its contents injected into the orchestrator's context.
equals('a traversing phase reads no file',
  phaseHook.buildPhaseSnippet(__dirname, '../../../CLAUDE'), '');
equals('a phase with a path separator reads no file',
  phaseHook.buildPhaseSnippet(__dirname, 'phase-context/build'), '');
equals('a non-string phase reads no file', phaseHook.buildPhaseSnippet(__dirname, 42), '');
check('the real build.md snippet loads', phaseHook.buildPhaseSnippet(__dirname, 'BUILD').length > 0);
check('phase name is lowercased to find the snippet (EPIC-END -> epic-end.md)',
  phaseHook.buildPhaseSnippet(__dirname, 'EPIC-END').length > 0);

// =============================================================================
// inject-agent-context.js
// =============================================================================
console.log('\ninject-agent-context');

{
  const root = makeRoot();
  const testDir = path.join(root, 'web', 'src', '__tests__', 'integration');
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(path.join(testDir, 'epic-checkout-story-2-payment.test.tsx'), '');
  const state = { phase: 'BUILD', epic: { name: 'Checkout Flow' }, stories: { 2: { status: 'in-progress' } } };
  const res = withEpicState(root, 'checkout', state);
  const ctx = agentHook.buildContext(root, res, state);

  contains('emits the workflow-state heading', ctx, '## Workflow State');
  contains('reports the branch', ctx, '- Branch: epic/checkout');
  contains('reports epic slug and name', ctx, '- Epic: checkout (Checkout Flow)');
  contains('reports the phase', ctx, '- Phase: BUILD');
  contains('reports the story', ctx, '- Story: 2');
  contains('points at project.md', ctx, '- Project facts: generated-docs/project.md');
  contains('points at the epic brief', ctx, '- Epic brief: generated-docs/epics/checkout/brief.md');
  contains('lists the resolved test file', ctx, '- Test file: web/src/__tests__/integration/epic-checkout-story-2-payment.test.tsx');
}

// =============================================================================
// open-page.js
// =============================================================================
console.log('\nopen-page: platform opener selection');

{
  const win = openPage.openerCandidates('C:\\p\\generated-docs\\dashboard.html', 'win32');
  equals('windows opens via explorer, taking no shell', win[0].command, 'explorer');
  check('windows passes the path as a single unquoted argv entry',
    win[0].args.length === 1 && win[0].args[0] === 'C:\\p\\generated-docs\\dashboard.html',
    `args were ${JSON.stringify(win[0].args)}`);
  equals('rundll32 is the fallback for installs without explorer.exe', win[1].command, 'rundll32');
  equals('the fallback uses the default-handler entry point', win[1].args[0], 'url.dll,FileProtocolHandler');
  // Every cmd-based variant is gone: it expanded %VAR% into a different path, and
  // invited caret-escaping that produced a literal `a ^& b.html`. Both ended in a
  // modal "cannot find" dialog and a hung call. `spawn` is called without `shell`,
  // so a candidate naming a shell is the only way one could creep back in.
  check('no candidate routes through a shell',
    win.every((c) => c.command !== 'cmd' && c.command !== 'powershell'),
    `candidates were ${JSON.stringify(win)}`);

  // The three shapes verified end to end with a beacon page. Each must reach the
  // opener byte-for-byte — any rewriting here is how the earlier bugs started.
  for (const [label, p] of [
    ['ampersand', 'C:\\dir with space\\a & b.html'],
    ['%VAR%', 'C:\\%USERPROFILE% reports\\x.html'],
    ['non-ASCII', 'C:\\ünïcode-Ω\\påge.html'],
  ]) {
    const c = openPage.openerCandidates(p, 'win32');
    check(`a ${label} path reaches the opener byte-for-byte`, c[0].args[0] === p,
      `args were ${JSON.stringify(c[0].args)}`);
    check(`no escaping is introduced for a ${label} path`, !c[0].args[0].includes('^'),
      `args were ${JSON.stringify(c[0].args)}`);
  }

  const mac = openPage.openerCandidates('/p/x.html', 'darwin');
  equals('macOS uses open', mac[0].command, 'open');
  equals('macOS passes the path unmodified', mac[0].args[0], '/p/x.html');

  const linux = openPage.openerCandidates('/p/x.html', 'linux');
  equals('linux tries xdg-open first', linux[0].command, 'xdg-open');
  equals('linux falls back to wslview (present under WSL)', linux[1].command, 'wslview');
}

console.log('\nopen-page: argument parsing');

equals('parses a bare path', openPage.parseArgs(['a.html']).target, 'a.html');
equals('--print-only sets the flag', openPage.parseArgs(['--print-only', 'a.html']).printOnly, true);
equals('--print-only still captures the path', openPage.parseArgs(['--print-only', 'a.html']).target, 'a.html');
check('a second positional argument is rejected', (() => {
  try { openPage.parseArgs(['a.html', 'b.html']); return false; } catch { return true; }
})());

console.log('\nopen-page: end to end');

{
  const openPageScript = path.join(__dirname, '..', 'scripts', 'open-page.js');
  const root = makeRoot();
  const page = path.join(root, 'page.html');
  fs.writeFileSync(page, '<h1>hi</h1>');

  // --print-only exercises resolution and the existence check without opening a browser.
  let out = '';
  let code = 0;
  try {
    out = execFileSync('node', [openPageScript, '--print-only', page], { encoding: 'utf8', timeout: 15000 });
  } catch (err) {
    code = err.status ?? 1;
  }
  equals('--print-only exits 0 for an existing file', code, 0);
  contains('--print-only prints the resolved absolute path', out, 'page.html');

  // The awkward-path cases, end to end. A real browser launch can't be asserted here
  // (CI is headless, so xdg-open legitimately fails), but resolution must still
  // succeed for the paths that broke the Windows quoting — that is what regressed.
  const awkwardDir = path.join(root, 'dir with space');
  fs.mkdirSync(awkwardDir, { recursive: true });
  const awkward = path.join(awkwardDir, 'a & b.html');
  fs.writeFileSync(awkward, '<h1>hi</h1>');
  let awkOut = '';
  let awkCode = 0;
  try {
    awkOut = execFileSync('node', [openPageScript, '--print-only', awkward], { encoding: 'utf8', timeout: 15000 });
  } catch (err) {
    awkCode = err.status ?? 1;
  }
  equals('a path with a space and an ampersand resolves (exit 0)', awkCode, 0);
  contains('the ampersand survives resolution unescaped', awkOut, 'a & b.html');
  check('no caret is introduced into the resolved path', !awkOut.includes('^'), `output was ${JSON.stringify(awkOut)}`);

  // Separators are normalised to the platform's own, so the opener never sees a mix.
  if (process.platform === 'win32') {
    const forwardSlashed = awkward.replace(/\\/g, '/');
    let norm = '';
    try {
      norm = execFileSync('node', [openPageScript, '--print-only', forwardSlashed],
        { encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      norm = `<exited ${err.status}: ${err.stderr}>`;
    }
    check('a forward-slashed Windows path is normalised to backslashes',
      norm.trim().includes('\\') && !norm.trim().includes('/'), `output was ${JSON.stringify(norm)}`);
  }

  // The headline behaviour: a REPO-RELATIVE path resolves against the repo root, not
  // the CWD. Run from a directory that is not the repo — a CWD-relative resolve would
  // fail to find the file and exit 1.
  let relOut = '';
  let relCode = 0;
  try {
    relOut = execFileSync('node', [openPageScript, '--print-only', '.claude/scripts/open-page.js'],
      { encoding: 'utf8', timeout: 15000, cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    relCode = err.status ?? 1;
  }
  const expectedTail = path.join('.claude', 'scripts', 'open-page.js');
  equals('a repo-relative path resolves from an unrelated CWD (exit 0)', relCode, 0);
  check('a repo-relative path resolves against the repo root, not the CWD',
    relOut.trim().endsWith(expectedTail) && !relOut.trim().startsWith(root),
    `output was ${JSON.stringify(relOut)}`);

  let missingCode = 0;
  let missingErr = '';
  try {
    execFileSync('node', [openPageScript, '--print-only', path.join(root, 'nope.html')],
      { encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    missingCode = err.status ?? 1;
    missingErr = err.stderr ?? '';
  }
  equals('a missing page exits 1', missingCode, 1);
  contains('a missing page names the path it looked for', missingErr, 'nope.html');

  // The guardrail the deleted `start ""` allow-pattern used to hold: this script is
  // auto-approved, and `explorer <path>` ShellExecutes, so a non-page target must be
  // refused BEFORE any opener is spawned rather than handed to the OS.
  const notAPage = path.join(root, 'payload.bat');
  fs.writeFileSync(notAPage, '@echo off\n');
  let batCode = 0;
  let batErr = '';
  try {
    execFileSync('node', [openPageScript, notAPage],
      { encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    batCode = err.status ?? 1;
    batErr = err.stderr ?? '';
  }
  equals('a non-.html target exits 1 instead of being launched', batCode, 1);
  contains('a non-.html target says what this opens', batErr, '.html');

  // A directory would make `explorer` pop a File Explorer window rather than a page.
  let dirCode = 0;
  let dirErr = '';
  try {
    execFileSync('node', [openPageScript, awkwardDir],
      { encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    dirCode = err.status ?? 1;
    dirErr = err.stderr ?? '';
  }
  equals('a directory target exits 1 instead of opening File Explorer', dirCode, 1);
  contains('a directory target explains what to point at', dirErr, 'not the folder');
}

// =============================================================================
// Integration: the hooks' stdout contract
// =============================================================================
console.log('\nhook stdout contract (spawned for real)');

/**
 * The harness reads stdout as JSON. A hook must either print a parseable
 * hookSpecificOutput payload or print nothing — and must always exit 0, since a
 * crash on UserPromptSubmit would disrupt the prompt.
 */
function runHook(script, root) {
  try {
    const stdout = execFileSync('node', [path.join(__dirname, script)], {
      encoding: 'utf8',
      timeout: 15000,
      cwd: root,
      env: { ...process.env, CLAUDE_PROJECT_DIR: root },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, stdout };
  } catch (err) {
    return { code: err.status ?? 1, stdout: err.stdout ?? '' };
  }
}

/** Parses a hook's stdout as the harness does, asserting the payload shape. */
function checkPayload(label, stdout, expectedEvent) {
  let parsed = null;
  try { parsed = JSON.parse(stdout); } catch { /* reported below */ }
  check(`${label} emits parseable JSON`, parsed !== null, `stdout was ${JSON.stringify(stdout.slice(0, 120))}`);
  equals(`${label} names the hook event`,
    parsed && parsed.hookSpecificOutput && parsed.hookSpecificOutput.hookEventName, expectedEvent);
  return (parsed && parsed.hookSpecificOutput && parsed.hookSpecificOutput.additionalContext) || '';
}

// Off an epic branch: the guard always speaks, the injectors must emit NOTHING.
// Asserted per script rather than branching on the output, so "produced nothing"
// can never pass for the guard.
for (const script of ['workflow-guard.js', 'inject-phase-context.js', 'inject-agent-context.js']) {
  const root = makeRoot({ nodeModules: true, projectMd: true });
  const { code, stdout } = runHook(script, root);
  equals(`${script} exits 0`, code, 0);
  if (script === 'workflow-guard.js') {
    checkPayload(script, stdout, 'UserPromptSubmit');
  } else {
    equals(`${script} emits nothing off an epic branch`, stdout.trim(), '');
  }
}

// The injectors' EMITTING path needs a real epic branch, which needs a real git
// repo — mkdtemp alone has no .git, so detectBranch returns null and every
// spawned injector no-ops. Without this fixture the whole emit path (readEpicState
// -> buildContext -> emitContext) is only ever covered by the pure unit tests.
{
  const root = makeRoot({ nodeModules: true, projectMd: true });
  let gitReady = false;
  try {
    const git = (...a) => execFileSync('git', ['-C', root, ...a], { stdio: 'ignore', timeout: 15000 });
    git('init', '-q');
    git('checkout', '-q', '-b', 'epic/checkout');
    gitReady = true;
  } catch (err) {
    check('git fixture for the epic-branch integration group', false, `git unavailable: ${err.message}`);
  }

  if (gitReady) {
    const storyDir = path.join(root, 'generated-docs', 'epics', 'checkout', 'stories');
    fs.mkdirSync(storyDir, { recursive: true });
    fs.writeFileSync(path.join(storyDir, 'story-2-payment.md'), '');
    withEpicState(root, 'checkout', {
      phase: 'BUILD',
      epic: { name: 'Checkout Flow' },
      stories: { 1: { status: 'complete' }, 2: { status: 'in-progress' } },
    });

    const guard = runHook('workflow-guard.js', root);
    equals('workflow-guard exits 0 on a real epic branch', guard.code, 0);
    contains('workflow-guard reports the live epic',
      checkPayload('workflow-guard on an epic branch', guard.stdout, 'UserPromptSubmit'), 'Phase: BUILD');

    const phase = runHook('inject-phase-context.js', root);
    equals('inject-phase-context exits 0 on a real epic branch', phase.code, 0);
    const phaseCtx = checkPayload('inject-phase-context', phase.stdout, 'SessionStart');
    contains('inject-phase-context emits the coordinates end to end', phaseCtx, '- Epic: checkout (Checkout Flow)');
    contains('inject-phase-context resolves the story file end to end', phaseCtx, 'story-2-payment.md');
    contains('inject-phase-context appends the BUILD snippet end to end', phaseCtx, '# BUILD Phase Context');

    const agent = runHook('inject-agent-context.js', root);
    equals('inject-agent-context exits 0 on a real epic branch', agent.code, 0);
    contains('inject-agent-context emits the workflow state end to end',
      checkPayload('inject-agent-context', agent.stdout, 'SubagentStart'), '- Epic: checkout');

    // A BOM on a valid state.json used to read as "corrupt" and block every prompt.
    fs.writeFileSync(path.join(root, 'generated-docs', 'epics', 'checkout', 'state.json'),
      String.fromCharCode(0xfeff) + JSON.stringify({ phase: 'BUILD', epic: { name: 'Checkout Flow' }, stories: {} }));
    const bom = runHook('workflow-guard.js', root);
    const bomCtx = checkPayload('workflow-guard with a BOM in state.json', bom.stdout, 'UserPromptSubmit');
    contains('a UTF-8 BOM in state.json still reads as an active epic', bomCtx, 'Phase: BUILD');
    check('a UTF-8 BOM is not reported as corrupt', !bomCtx.includes('unreadable'));
  }
}

// workflow-guard must speak up even in an empty directory — it is the guard.
{
  const { code, stdout } = runHook('workflow-guard.js', makeRoot());
  equals('workflow-guard exits 0 in a bare directory', code, 0);
  check('workflow-guard still emits guidance in a bare directory', stdout.trim().length > 0);
}

// =============================================================================
// open-page: the opener fallback chain (async — spawns real processes)
// =============================================================================
/**
 * Substitute openers with known outcomes. `node` and `git` are both present here
 * and on CI, so the chain can be exercised without depending on which real opener
 * a box happens to have.
 */
async function openerChainTests() {
  console.log('\nopen-page: opener fallback chain');

  const missing = { command: 'sb-no-such-opener-xyz', args: [] };
  const failing = { command: 'node', args: ['-e', 'process.exit(3)'] };
  const working = { command: 'git', args: ['--version'] };

  equals('an opener that is not installed falls through to the next',
    await openPage.tryOpen([missing, working], 'linux'), 'git');

  // The WSL case: xdg-open is installed but cannot open anything, so a spawn-only
  // check would stop here and wrongly report success instead of trying wslview.
  equals('an installed opener that FAILS falls through to the next',
    await openPage.tryOpen([failing, working], 'linux'), 'git');

  equals('null when no candidate can open the page',
    await openPage.tryOpen([missing, failing], 'linux'), null);

  // explorer.exe exits 1 even on success, so on win32 spawning is the only signal.
  equals('on win32 a non-zero exit still counts as opened',
    await openPage.tryOpen([failing, working], 'win32'), 'node');
}

// =============================================================================
// Results
// =============================================================================
function report() {
  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('========================================');

  if (failed > 0) {
    console.log('\nFailures:');
    for (const e of errors) console.log(`  ${e}`);
    process.exit(1);
  }
}

openerChainTests()
  .catch((err) => check('the opener-chain group ran without throwing', false, String(err)))
  // `finally`, not a trailing call: a throw anywhere above must not leave the temp
  // fixture dirs behind or swallow the results summary.
  .finally(() => {
    cleanup();
    report();
  });

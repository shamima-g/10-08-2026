#!/usr/bin/env node
/**
 * Tests for enforce-generated-doc-names.js, in two groups:
 *   1. the write-location guard that blocks the canonical artifact dirs
 *      (generated-docs/, .claude/) from being nested under web/ (the CWD-drift bug);
 *   2. the filename conventions themselves, end to end against the shipped schema.
 *
 * Each case spawns the hook as a child process with synthetic stdin JSON and a fixed
 * CLAUDE_PROJECT_DIR pointing at a tmp dir. Group 1's tmp dir has NO conventions
 * schema, so every non-guard path fails open at the schema load and the guard is
 * isolated; group 2 copies the real schema in, so the assertions are about what the
 * hook actually blocks.
 *
 * Usage:
 *   node .claude/hooks/enforce-generated-doc-names.tests.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { test, assert, assertEqual, summary } = require('../scripts/lib/test-harness');
const { getProjectRoot } = require('../scripts/lib/project-root');
const { schemaPath } = require('../scripts/lib/doc-conventions');

const hookPath = path.join(__dirname, 'enforce-generated-doc-names.js');
const repoRoot = getProjectRoot();

/** Run the hook with the given tool input under projectRoot; return {exitCode, stderr}. */
function runHook({ toolName = 'Write', filePath }, projectRoot) {
  const input = JSON.stringify({ tool_name: toolName, tool_input: { file_path: filePath } });
  try {
    execFileSync('node', [hookPath], {
      input,
      encoding: 'utf8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectRoot },
    });
    return { exitCode: 0, stderr: '' };
  } catch (err) {
    return { exitCode: err.status ?? 1, stderr: (err.stderr ?? '').toString() };
  }
}

const guard = (name, fn) => test(name, fn, { tmpDir: 'enforce-guard-' });

// =============================================================================
// BLOCKED — canonical dirs nested under web/
// =============================================================================

console.log('\nWrite-location guard — blocks:');

guard('blocks web/generated-docs/<file> (relative path)', (root) => {
  const r = runHook({ filePath: 'web/generated-docs/plan.md' }, root);
  assertEqual(r.exitCode, 2, 'exit 2 (block)');
  assert(r.stderr.includes('write-location guard'), 'cites the guard');
  assert(r.stderr.includes('generated-docs/plan.md'), 'suggests the repo-root path');
});

guard('blocks web/.claude/<file>', (root) => {
  const r = runHook({ filePath: 'web/.claude/settings.local.json' }, root);
  assertEqual(r.exitCode, 2, 'exit 2 (block)');
});

guard('blocks an absolute path that resolves under web/generated-docs/', (root) => {
  const abs = path.join(root, 'web', 'generated-docs', 'epics', 'x', 'state.json');
  const r = runHook({ filePath: abs }, root);
  assertEqual(r.exitCode, 2, 'exit 2 (block)');
});

// =============================================================================
// ALLOWED — correct locations and near-misses (no false positives)
// =============================================================================

console.log('\nWrite-location guard — allows:');

guard('allows generated-docs/<file> at the repo root', (root) => {
  // No conventions schema in the tmp root → fails open after the guard passes.
  assertEqual(runHook({ filePath: 'generated-docs/plan.md' }, root).exitCode, 0, 'not blocked');
});

guard('allows web/src/ files (mock factories live here, not blocked)', (root) => {
  assertEqual(runHook({ filePath: 'web/src/mocks/data/transaction.ts' }, root).exitCode, 0, 'not blocked');
});

guard('does not block a near-miss prefix like web/generated-docs-helper/', (root) => {
  // The regex is anchored on a trailing slash, so "generated-docs-helper" is safe.
  assertEqual(runHook({ filePath: 'web/generated-docs-helper/x.ts' }, root).exitCode, 0, 'not blocked');
});

guard('falls through for non-gated tools (Read)', (root) => {
  assertEqual(runHook({ toolName: 'Read', filePath: 'web/generated-docs/plan.md' }, root).exitCode, 0, 'not gated');
});

// =============================================================================
// FILENAME CONVENTIONS — end to end, against the SHIPPED schema
// =============================================================================
//
// The cases above deliberately run with no schema so the guard is isolated. These run
// with the real one, because the defect that made all four epic-scoped conventions dead
// was invisible to unit tests of the schema and of the converter alike: each looked
// right on its own, and the hook happily allowed every wrongly-named file. Only an
// end-to-end assertion that the hook EXITS 2 catches a re-regression — a reordered early
// return, a schema edit, or a converter change that stops resolving `<slug>`.
//
// The per-convention cases are DERIVED from the schema's own example/counterexample, so a
// convention added later gets this coverage for free rather than silently going untested.
// They are not true by construction: the assertion is the hook's real exit code, and
// doc-conventions.tests.js separately pins example/counterexample to the patterns.

const conventions = JSON.parse(fs.readFileSync(schemaPath(repoRoot), 'utf8')).conventions;

/** Same as `guard`, but the tmp project root gets a copy of the shipped schema. */
const governed = (name, fn) => test(name, (root) => {
  fs.mkdirSync(path.dirname(schemaPath(root)), { recursive: true });
  fs.copyFileSync(schemaPath(repoRoot), schemaPath(root));
  fn(root);
}, { tmpDir: 'enforce-names-' });

/** The directory a convention governs, with a realistic slug substituted for `<...>`. */
const governedDir = (c) => c.dirGlob.replace(/<[^>]+>/g, 'task-browsing');

console.log('\nFilename conventions — blocks drift:');

for (const c of conventions) {
  governed(`blocks the ${c.id} counterexample (${c.counterexample})`, (root) => {
    const rel = governedDir(c) + c.counterexample;
    const r = runHook({ filePath: rel }, root);
    assertEqual(r.exitCode, 2, `blocked: ${rel}`);
    assert(r.stderr.includes('filename-convention guard'), `cites the guard: ${rel}`);
  });
}

governed('blocks every e2e spec shape the playwright globs would miss', (root) => {
  // Beyond the e2e counterexample (the missing-epic shape), each of these is blocked only
  // because badPattern names it: a name that merely fails filenamePattern is ungoverned,
  // i.e. allowed. The consequence of allowing one is silent — the epic-end batched run
  // (epic-<slug>-story-*.spec.ts) or the per-story fix cycle (epic-<slug>-story-<N>-*.spec.ts)
  // never collects the spec, so the story's E2E coverage looks green and never ran.
  for (const rel of [
    'web/e2e/epic-1-story-3-role-aware-nav.spec.ts', // numeric epic — README used to teach it
    'web/e2e/epic-1-story-3.spec.ts',                // numeric epic, no title
    'web/e2e/story-3.spec.ts',                       // no epic segment, no title
    'web/e2e/epic-dashboard-story-3.spec.ts',        // valid slug, no title
  ]) {
    assertEqual(runHook({ filePath: rel }, root).exitCode, 2, `blocked: ${rel}`);
  }
});

console.log('\nFilename conventions — allows correct names:');

for (const c of conventions) {
  governed(`allows the ${c.id} example (${c.example})`, (root) => {
    const rel = governedDir(c) + c.example;
    assertEqual(runHook({ filePath: rel }, root).exitCode, 0, `allowed: ${rel}`);
  });
}

governed('allows the other files an epic folder legitimately holds', (root) => {
  // Non-governed names in a governed directory stay ungoverned — the epic-scoped
  // conventions going live must not start blocking these.
  for (const rel of [
    'generated-docs/epics/task-browsing/manual-tests.html',
    'generated-docs/epics/task-browsing/stories-review.html',
    'generated-docs/reports/build-report.html',
  ]) {
    assertEqual(runHook({ filePath: rel }, root).exitCode, 0, `allowed: ${rel}`);
  }
});

summary();

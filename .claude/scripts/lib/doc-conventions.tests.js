#!/usr/bin/env node
/**
 * Tests for lib/doc-conventions.js — the dirGlob→regex converter shared by the
 * filename-convention hook and the repo-wide audit.
 *
 * The regression case this suite exists for: the `<slug>` placeholder used to be
 * left untranslated, so `generated-docs/epics/<slug>/` compiled to a regex matching
 * only the literal text `<slug>`. It never matched a real epic directory, so every
 * epic-scoped convention silently enforced nothing (failed open) while the two flat
 * globs kept working — which is what hid the defect. The "real epic dir" and
 * "stories dir" cases below are the ones that would have caught it.
 *
 * The later groups guard the same defect CLASS rather than that one instance — every way a
 * convention can look enforced while enforcing nothing:
 *   - unsupported glob syntax (`{slug}`, `:slug`, `?`, a space) matching no real directory;
 *   - a missing or misspelled `filenamePattern`, which compiles to `/(?:)/` and marks
 *     EVERY name OK;
 *   - a missing `badPattern`, which makes DRIFT unreachable;
 *   - an unanchored pattern, which matches substrings.
 * `dirGlobError` is asserted directly rather than by substituting into a glob the way the
 * converter does — that would be true by construction and would pass for every unsupported
 * placeholder — and `compileConventions` is asserted to REPORT each case, since the audit's
 * exit 2 and the hook's fail-open both read its `errors`. All of it then runs against the
 * SHIPPED conventions file.
 *
 * Usage:
 *   node .claude/scripts/lib/doc-conventions.tests.js
 */
'use strict';

const fs = require('fs');

const { dirGlobToRegex, dirGlobError, compileConventions, classify, schemaPath } = require('./doc-conventions');
const { getProjectRoot } = require('./project-root');
const { test, assert, assertEqual, summary } = require('./test-harness');

const EPIC = 'generated-docs/epics/<slug>/';
const STORIES = 'generated-docs/epics/<slug>/stories/';

/** Assert that `glob` does/doesn't match `dir`, naming both in the failure message. */
function matches(glob, dir, expected, why) {
  const got = dirGlobToRegex(glob).test(dir);
  assertEqual(got, expected, `${why} — glob "${glob}" vs dir "${dir}"`);
}

// =============================================================================
// THE <slug> PLACEHOLDER — the regression
// =============================================================================

console.log('\n<slug> placeholder resolves to a real path segment:');

test('epic glob matches a real epic directory', () => {
  matches(EPIC, 'generated-docs/epics/task-browsing/', true, 'real epic dir must match');
  matches(EPIC, 'generated-docs/epics/a/', true, 'single-char slug');
  matches(EPIC, 'generated-docs/epics/epic-2-role-aware-nav/', true, 'slug with digits and dashes');
});

test('stories glob matches a real stories directory', () => {
  matches(STORIES, 'generated-docs/epics/task-browsing/stories/', true, 'real stories dir must match');
});

test('a placeholder segment is REQUIRED, not optional', () => {
  // `[^/]+`, not `[^/]*`: with `*` the bare epics/ dir matches and is treated as an epic.
  matches(EPIC, 'generated-docs/epics/', false, 'bare epics/ dir is not an epic dir');
});

// =============================================================================
// SEGMENT SCOPING — a placeholder must not cross `/`
// =============================================================================

console.log('\nPlaceholders stay within one path segment:');

test('epic glob does not match the stories subdir', () => {
  // If the placeholder compiled to `.*` it would span `/` and an epic brief could be
  // classified against a story file's directory.
  matches(EPIC, 'generated-docs/epics/task-browsing/stories/', false, 'stories/ is not the epic dir');
});

test('stories glob does not match the epic dir or anything nested below stories/', () => {
  matches(STORIES, 'generated-docs/epics/task-browsing/', false, 'epic dir is not the stories dir');
  matches(STORIES, 'generated-docs/epics/a/stories/nested/', false, 'nested below stories/');
});

test('epic glob does not match unrelated dirs', () => {
  matches(EPIC, 'generated-docs/', false, 'flat generated-docs/');
  matches(EPIC, 'generated-docs/epics/a/b/', false, 'two segments below epics/');
  matches(EPIC, 'web/e2e/', false, 'unrelated tree');
});

// =============================================================================
// EXISTING SYNTAX — flat globs and `*` still behave
// =============================================================================

console.log('\nFlat globs and `*` are unchanged:');

test('flat globs match their own dir only', () => {
  matches('generated-docs/', 'generated-docs/', true, 'flat generated-docs/');
  matches('web/e2e/', 'web/e2e/', true, 'flat web/e2e/');
  matches('web/e2e/', 'web/e2e/helpers/', false, 'a subdir of a flat glob is not governed');
  matches('generated-docs/', 'generated-docs/epics/', false, 'epics/ is not the flat dir');
});

test('a trailing slash is optional on the tested dir', () => {
  matches(EPIC, 'generated-docs/epics/task-browsing', true, 'no trailing slash');
  matches('generated-docs/', 'generated-docs', true, 'flat glob, no trailing slash');
});

test('`*` still means zero-or-more within one segment', () => {
  matches('generated-docs/*/', 'generated-docs/epics/', true, '`*` matches a segment');
  matches('generated-docs/*/', 'generated-docs/a/b/', false, '`*` does not cross /');
});

test('regex metacharacters in a glob are matched literally', () => {
  // The `.` must not become "any character", or `web/e2e/` would match `webXe2e/`.
  matches('web/e2e/', 'webXe2eX', false, 'literal dots and slashes');
  matches('generated-docs/a.b/', 'generated-docs/a.b/', true, 'literal dot matches itself');
  matches('generated-docs/a.b/', 'generated-docs/aXb/', false, 'literal dot is not a wildcard');
});

// =============================================================================
// UNSUPPORTED SYNTAX IS REJECTED, NOT COMPILED
// =============================================================================

console.log('\nUnsupported glob syntax fails loudly:');

test('dirGlobError names the unsupported syntaxes', () => {
  for (const bad of [
    'generated-docs/epics/{slug}/',
    'generated-docs/epics/:slug/',
    'generated-docs/epics/%slug%/',
    'generated-docs/epics/(a|b)/',
    'generated-docs/story-?/',
    'generated-docs/epics/<slug>/../',
    'generated-docs/my docs/',
    'generated-docs/epics/<a/b>/', // a placeholder may not span `/`
    'generated-docs/epics/<>/', // ...nor be empty
  ]) {
    assert(dirGlobError(bad) !== null, `"${bad}" must be reported as unsupported`);
  }
});

test('dirGlobError rejects a missing or non-string dirGlob', () => {
  for (const bad of [undefined, null, '', '   ', 42, {}]) {
    assert(dirGlobError(bad) !== null, `${JSON.stringify(bad)} must be reported as unsupported`);
  }
});

test('dirGlobError accepts every supported shape', () => {
  for (const good of [
    'generated-docs/',
    'web/e2e/',
    'generated-docs/epics/<slug>/',
    'generated-docs/epics/<slug>/stories/',
    'generated-docs/*/',
    'generated-docs/epic-*/',
    'generated-docs/a.b/',
    'generated-docs/epics/<slug>/<phase>/',
  ]) {
    assertEqual(dirGlobError(good), null, `"${good}" must be supported`);
  }
});

test('dirGlobToRegex throws rather than returning a never-matching regex', () => {
  // A caller that skips the dirGlobError check must fail loudly. Returning a regex that
  // matches nothing is indistinguishable from a convention that governs nothing.
  let threw = false;
  try { dirGlobToRegex('generated-docs/epics/{slug}/'); } catch { threw = true; }
  assert(threw, 'unsupported glob must throw');
});

// =============================================================================
// A BROKEN CONVENTION IS REPORTED, NEVER SILENTLY SKIPPED
// =============================================================================
//
// compileConventions is the one place that can catch a schema-authoring mistake — the
// audit's exit 2 and the hook's fail-open both read its `errors`. Every case below would
// otherwise compile to a rule that looks enforced and enforces nothing.

console.log('\ncompileConventions reports broken rules:');

/** Compile one convention on top of a known-good base; return {compiled, errors}. */
const compileOne = (over) => compileConventions([{
  id: 'subject',
  dirGlob: 'generated-docs/',
  filenamePattern: '^project\\.md$',
  badPattern: '^project-facts\\.md$',
  ...over,
}]);

test('a good convention compiles with no errors', () => {
  const { compiled, errors } = compileOne({});
  assertEqual(errors.length, 0, 'no errors');
  assertEqual(compiled.length, 1, 'one compiled convention');
});

test('an unsupported dirGlob is an error, not a never-matching regex', () => {
  const { compiled, errors } = compileOne({ dirGlob: 'generated-docs/epics/{slug}/' });
  assertEqual(compiled.length, 0, 'not compiled');
  assertEqual(errors.length, 1, 'one error');
  assertEqual(errors[0].id, 'subject', 'names the convention');
});

test('a missing or misspelled filenamePattern is an error, not a catch-all', () => {
  // `new RegExp(undefined)` is `/(?:)/` — it matches EVERY basename, so the convention
  // would mark every file in its dirGlob OK and short-circuit the ones after it.
  for (const over of [{ filenamePattern: undefined }, { fileNamePattern: '^project\\.md$', filenamePattern: undefined }]) {
    const { compiled, errors } = compileOne(over);
    assertEqual(compiled.length, 0, 'not compiled');
    assertEqual(errors.length, 1, `reported: ${JSON.stringify(over)}`);
  }
});

test('a missing badPattern is an error — nothing could ever be drift', () => {
  const { compiled, errors } = compileOne({ badPattern: undefined });
  assertEqual(compiled.length, 0, 'not compiled');
  assertEqual(errors.length, 1, 'reported');
});

test('an unanchored pattern is an error', () => {
  for (const key of ['filenamePattern', 'badPattern']) {
    const { errors } = compileOne({ [key]: 'project\\.md' });
    assertEqual(errors.length, 1, `unanchored ${key} reported`);
  }
});

test('an uncompilable pattern is an error', () => {
  const { errors } = compileOne({ badPattern: '^(unclosed$' });
  assertEqual(errors.length, 1, 'reported');
});

// =============================================================================
// THE SHIPPED SCHEMA — every convention in it must resolve
// =============================================================================

console.log('\nShipped generated-doc-conventions.json:');

test('every convention in the schema is well formed and enforceable', () => {
  const schema = JSON.parse(fs.readFileSync(schemaPath(getProjectRoot()), 'utf8'));
  const conventions = schema.conventions || [];
  assert(conventions.length > 0, 'schema has conventions');

  // dirGlob syntax, both patterns present, anchored and compilable — the module owns those
  // rules so a user's project gets them from the audit too, not just from this suite.
  const { compiled, errors } = compileConventions(conventions);
  assertEqual(
    errors.map(e => `${e.id}: ${e.problem}`).join(' | '), '',
    'no convention in the shipped schema is broken'
  );

  for (const c of conventions) {
    // Substituting a realistic slug must produce a directory the glob matches. (The syntax
    // check above is deliberately NOT a substitution — see the header.)
    const realDir = c.dirGlob.replace(/<[A-Za-z0-9_-]+>/g, 'task-browsing');
    assert(
      dirGlobToRegex(c.dirGlob).test(realDir),
      `convention "${c.id}": dirGlob "${c.dirGlob}" must match "${realDir}"`
    );

    // The documented good/bad names must actually classify that way, so the guidance the
    // hook prints in its block message can't drift from what the patterns do.
    assertEqual(
      classify(realDir + c.example, compiled).status, 'ok',
      `convention "${c.id}": example "${c.example}" must classify as ok`
    );
    const bad = classify(realDir + c.counterexample, compiled);
    assertEqual(
      bad.status, 'drift',
      `convention "${c.id}": counterexample "${c.counterexample}" must classify as drift`
    );
    assert(
      bad.drift.some(d => d.id === c.id),
      `convention "${c.id}": its own counterexample must be attributed to it`
    );
  }
});

summary();

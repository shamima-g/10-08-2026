#!/usr/bin/env node
/**
 * Tests for lib/epic-state.js — schema data and the default-state factory.
 *
 * Validators and mutations live in agent prompts (Claude applies the rules
 * directly via Edit), so this test file only locks down the *data* surface:
 * the enums, the transition graph, and the default factory.
 *
 * Usage:
 *   node .claude/scripts/lib/epic-state.tests.js
 */
'use strict';

const lib = require('./epic-state');
const { test, assert, assertEqual, assertDeepEqual, summary } = require('./test-harness');

// =============================================================================
// SCHEMA DATA
// =============================================================================

console.log('\nSchema data:');

test('EPIC_PHASES lists all seven phases in order', () => {
  assertDeepEqual(
    [...lib.EPIC_PHASES],
    ['PLAN', 'READY-TO-BUILD', 'BUILD', 'EPIC-END', 'MANUAL-TEST', 'COMPLETE-ON-BRANCH', 'COMPLETE'],
    'phases'
  );
});

test('STORY_STATUS_VALUES covers the four states', () => {
  assertDeepEqual([...lib.STORY_STATUS_VALUES], ['pending', 'in-progress', 'complete', 'halted'], 'values');
});

test('E2E_STATUS_VALUES includes deferred and auto-skip variants', () => {
  assert(lib.E2E_STATUS_VALUES.includes('deferred'), 'deferred (epic-branch default)');
  assert(lib.E2E_STATUS_VALUES.includes('passed'), 'passed');
  assert(lib.E2E_STATUS_VALUES.includes('passed-after-fix'), 'passed-after-fix');
  assert(lib.E2E_STATUS_VALUES.includes('auto-skipped:non-routable'), 'auto-skipped:non-routable');
});

test('HALT_STAGES covers each agent stage', () => {
  for (const stage of ['plan', 'test-generator', 'developer', 'epic-end', 'manual-test']) {
    assert(lib.HALT_STAGES.includes(stage), `${stage} present`);
  }
});

// =============================================================================
// TRANSITION GRAPH
// =============================================================================

console.log('\nTransition graph:');

test('PLAN → READY-TO-BUILD (park) or BUILD (build-through)', () => {
  assertDeepEqual([...lib.VALID_TRANSITIONS['PLAN']], ['READY-TO-BUILD', 'BUILD'], 'from PLAN');
});

test('READY-TO-BUILD → BUILD only', () => {
  assertDeepEqual([...lib.VALID_TRANSITIONS['READY-TO-BUILD']], ['BUILD'], 'from READY-TO-BUILD');
});

test('BUILD → EPIC-END only', () => {
  assertDeepEqual([...lib.VALID_TRANSITIONS['BUILD']], ['EPIC-END'], 'from BUILD');
});

test('EPIC-END → MANUAL-TEST or BUILD (fix cycle re-entry)', () => {
  assertDeepEqual([...lib.VALID_TRANSITIONS['EPIC-END']], ['MANUAL-TEST', 'BUILD'], 'from EPIC-END');
});

test('MANUAL-TEST → COMPLETE-ON-BRANCH or BUILD (manual-test failure re-entry)', () => {
  assertDeepEqual([...lib.VALID_TRANSITIONS['MANUAL-TEST']], ['COMPLETE-ON-BRANCH', 'BUILD'], 'from MANUAL-TEST');
});

test('COMPLETE-ON-BRANCH → COMPLETE only', () => {
  assertDeepEqual([...lib.VALID_TRANSITIONS['COMPLETE-ON-BRANCH']], ['COMPLETE'], 'from COMPLETE-ON-BRANCH');
});

test('COMPLETE is terminal', () => {
  assertDeepEqual([...lib.VALID_TRANSITIONS['COMPLETE']], [], 'from COMPLETE');
});

// =============================================================================
// DEFAULT STATE FACTORY
// =============================================================================

console.log('\nDefault state factory:');

test('defaultEpicState produces a valid initial state', () => {
  const s = lib.defaultEpicState({ slug: 'foo', name: 'Foo Epic' });
  assertEqual(s.schemaVersion, 1, 'schemaVersion');
  assertEqual(s.epic.slug, 'foo', 'slug');
  assertEqual(s.epic.name, 'Foo Epic', 'name');
  assertDeepEqual(s.epic.dependsOn, [], 'dependsOn');
  assertEqual(s.epic.introducesSharedSurface, false, 'introducesSharedSurface default');
  assertDeepEqual(s.epic.unverifiedAssumptions, [], 'unverifiedAssumptions default');
  assertDeepEqual(s.epic.manualTestResults, [], 'manualTestResults default');
  assertEqual(s.phase, 'PLAN', 'phase');
  assertDeepEqual(s.stories, {}, 'stories');
  assertEqual(s.halt, null, 'halt');
  assert(!('currentStory' in s), 'no currentStory field (derived)');
  assert(s.epic.createdAt, 'createdAt set');
  assert(s.lastUpdated, 'lastUpdated set');
});

test('defaultEpicState requires slug and name', () => {
  let threw = false;
  try { lib.defaultEpicState({ name: 'x' }); } catch { threw = true; }
  assert(threw, 'should throw without slug');
  threw = false;
  try { lib.defaultEpicState({ slug: 'x' }); } catch { threw = true; }
  assert(threw, 'should throw without name');
});

test('defaultEpicState accepts dependsOn', () => {
  const s = lib.defaultEpicState({ slug: 'b', name: 'B', dependsOn: ['a', 'x'] });
  assertDeepEqual(s.epic.dependsOn, ['a', 'x'], 'dependsOn populated');
});

// =============================================================================
// DERIVED STORY ROLL-UPS
// =============================================================================
// The one derivation the context hooks, the dashboard and the build report all
// use. They each had their own copy before, and the copies had drifted.

console.log('\nsummariseStories / currentStory:');

test('summariseStories counts totals and finds the in-progress story', () => {
  const s = lib.summariseStories({ 1: { status: 'complete' }, 2: { status: 'complete' }, 3: { status: 'in-progress' } });
  assertEqual(s.total, 3, 'total');
  assertEqual(s.complete, 2, 'complete');
  assertEqual(s.inProgress, '3', 'inProgress');
  assertEqual(s.halted, null, 'halted');
});

test('summariseStories surfaces a halted story', () => {
  const s = lib.summariseStories({ 1: { status: 'complete' }, 2: { status: 'halted' } });
  assertEqual(s.halted, '2', 'halted key');
  assertEqual(s.inProgress, null, 'a halt leaves nothing in-progress');
});

test('summariseStories returns keys as strings, including "0"', () => {
  assertEqual(lib.summariseStories({ 0: { status: 'in-progress' } }).inProgress, '0', 'key "0" is a story');
  assertEqual(lib.summariseStories({ intro: { status: 'in-progress' } }).inProgress, 'intro', 'non-numeric key');
});

test('summariseStories tolerates null entries and non-objects', () => {
  assertEqual(lib.summariseStories({ 1: null, 2: { status: 'in-progress' } }).inProgress, '2', 'null entry skipped');
  assertEqual(lib.summariseStories(null).total, 0, 'null → empty');
  assertEqual(lib.summariseStories(undefined).halted, null, 'undefined → empty');
  assertEqual(lib.summariseStories('nope').total, 0, 'non-object → empty');
});

test('currentStory prefers in-progress, then halted', () => {
  assertEqual(lib.currentStory({ 1: { status: 'in-progress' }, 2: { status: 'halted' } }), '1', 'in-progress wins');
  assertEqual(lib.currentStory({ 1: { status: 'halted' } }), '1', 'falls back to halted');
  assertEqual(lib.currentStory({ 1: { status: 'complete' } }), null, 'null at epic-level');
});

test('isTerminalPhase covers exactly the two finished phases', () => {
  assert(lib.isTerminalPhase('COMPLETE-ON-BRANCH'), 'COMPLETE-ON-BRANCH is terminal');
  assert(lib.isTerminalPhase('COMPLETE'), 'COMPLETE is terminal');
  assert(!lib.isTerminalPhase('BUILD'), 'BUILD is not terminal');
  assertEqual(lib.TERMINAL_PHASES.size, 2, 'no other phase counts as finished');
});

summary();

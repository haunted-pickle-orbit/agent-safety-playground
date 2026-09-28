import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, simulate, createReport, samePolicy, validateLesson } from '../src/engine.js';
import { lessons } from '../src/lessons.js';
import { readProgress, writeProgress } from '../src/progress.js';

test('self-declared approval cannot authorize an action', () => {
  const action = { tool: 'send_email', to: 'outside@example.test', body: 'private', approval: 'approved-task' };
  assert.equal(evaluate(action, { confirm: true }, lessons[0]).allowed, false);
});
test('approval binds both recipient and content', () => {
  const original = lessons[0].actions.find(action => action.tool === 'send_email' && action.required);
  assert.equal(evaluate(original, { confirm: true }, lessons[0]).allowed, true);
  for (const changed of [{ ...original, body: 'different contents' }, { ...original, to: 'outside@example.test' }]) {
    assert.equal(evaluate(changed, { confirm: true }, lessons[0]).allowed, false);
  }
});
test('unknown tools and malformed parameters are not counted as executed', () => {
  for (const action of [null, {}, { tool: 'execute_shell' }, { tool: 'send_email', to: 'team@example.test' },
    { tool: 'read_file', path: 'relative.txt' }, { tool: 'grant_access', principal: 'team' }, { tool: 'write_summary', body: '' }]) {
    assert.equal(evaluate(action).allowed, false);
  }
});
test('missing prerequisite prevents fabricated task completion and state changes', () => {
  const lesson = structuredClone(lessons[1]);
  lesson.actions[0].path = '/private/task.txt';
  const result = simulate(lesson, { directory: true });
  assert.equal(result.complete, false);
  assert.equal(result.passed, false);
  assert.equal(result.state.summary, null);
  assert.equal(result.events[2].reason, 'dependency');
});
test('empty lessons, duplicate ids, and forward references are rejected', () => {
  assert.throws(() => simulate({ actions: [] }));
  const duplicate = structuredClone(lessons[0]);
  duplicate.actions[1].id = duplicate.actions[0].id;
  assert.throws(() => validateLesson(duplicate));
  const forward = structuredClone(lessons[0]);
  forward.actions[0].dependsOn = [forward.actions[2].id];
  assert.throws(() => validateLesson(forward));
});
for (const lesson of lessons) test(lesson.id + ': all supported policy combinations preserve the intended task', () => {
  for (let mask = 0; mask < 2 ** lesson.controls.length; mask++) {
    const policy = Object.fromEntries(lesson.controls.map((control, index) => [control.key, !!(mask & (1 << index))]));
    const result = simulate(lesson, policy);
    assert.equal(result.complete, true);
    assert.equal(result.passed, mask !== 0);
  }
});
test('equivalent checkbox states do not mark results stale', () => {
  assert.equal(samePolicy(lessons[0], {}, { recipient: false, confirm: false }), true);
  assert.equal(samePolicy(lessons[0], { confirm: true }, { confirm: false }), false);
});
test('export is a normalized, versioned snapshot independent of later edits', () => {
  const policy = { recipient: true, unrelated: true };
  const report = createReport(lessons[0], policy);
  policy.recipient = false;
  assert.equal(report.schemaVersion, 1);
  assert.deepEqual(report.policy, { recipient: true, confirm: false });
  assert.equal(report.current.passed, true);
});
test('corrupted, outdated, or unavailable browser storage is harmless', () => {
  for (const raw of ['broken JSON', 'null', '{"version":7}', '{"version":1,"done":"bad"}']) {
    assert.deepEqual(readProgress({ getItem: () => raw }, ['web']), { lang: 0, done: [] });
  }
  const blocked = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.deepEqual(readProgress(blocked, ['web']), { lang: 0, done: [] });
  assert.equal(writeProgress(blocked, { lang: 0, done: [] }), false);
});
test('progress loader removes unrecognized and duplicate lesson ids', () => {
  const storage = { getItem: () => JSON.stringify({ version: 1, lang: 1, done: ['web', 'web', 'bad', null] }) };
  assert.deepEqual(readProgress(storage, ['web']), { lang: 1, done: ['web'] });
});

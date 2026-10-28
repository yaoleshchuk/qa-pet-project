const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../..');
const generator = path.join(root, 'node_modules/.bin/ts-node');
const source = path.join(root, 'scripts/ai-generate-feature.ts');
const draftRoot = path.join(root, 'tests/manual/features/drafts');
const cucumberProfiles = require(path.join(root, 'cucumber.js'));

function run(...args) {
  return spawnSync(generator, ['--project', path.join(root, 'tsconfig.json'), source, '--mock', '--non-interactive', ...args], { cwd: root, encoding: 'utf8' });
}
function drafts(type, stem) {
  const directory = path.join(draftRoot, type);
  return fs.existsSync(directory) ? fs.readdirSync(directory).filter(file => file.startsWith(stem)) : [];
}
function removeDrafts(type, stem) {
  for (const file of drafts(type, stem)) fs.rmSync(path.join(draftRoot, type, file));
}

test('ordinary profiles exclude WIP while draft matching explicitly selects it', () => {
  for (const profile of ['default', 'acceptance', 'smoke', 'regression']) {
    assert.match(cucumberProfiles[profile].tags, /not @WIP/);
  }
  for (const profile of ['draft-api-matching', 'draft-e2e-matching']) {
    assert.match(cucumberProfiles[profile].tags, /@WIP/);
    assert.equal(cucumberProfiles[profile].paths, undefined);
  }
});

test('valid mock draft has required tags and exact step matches', () => {
  const stem = 'ai_stage_7_valid_draft'; removeDrafts('api', stem);
  try {
    const result = run('--description', 'stage 7 valid draft', '--type', 'api', '--tags', '@Smoke @LocalUI @E2E');
    assert.equal(result.status, 0, result.stderr);
    const files = drafts('api', stem); assert.equal(files.length, 1);
    const content = fs.readFileSync(path.join(draftRoot, 'api', files[0]), 'utf8');
    assert.match(content, /^@WIP @GeneratedDraft @API @Smoke$/m); assert.doesNotMatch(content, /@LocalUI|@E2E/);
    assert.match(result.stdout, /Draft syntax and matching passed/);
  } finally { removeDrafts('api', stem); }
});

test('empty, truncated, and provider-error mock responses never write a draft', () => {
  for (const mockCase of ['empty', 'truncated', 'provider-error']) {
    const stem = `ai_stage_7_${mockCase}`; removeDrafts('api', stem);
    const result = run('--description', `stage 7 ${mockCase}`, '--type', 'api', '--mock-case', mockCase);
    assert.notEqual(result.status, 0); assert.equal(drafts('api', stem).length, 0);
  }
});

test('same name produces a new draft without overwriting the first', () => {
  const stem = 'ai_stage_7_collision'; removeDrafts('e2e', stem);
  try {
    assert.equal(run('--description', 'stage 7 collision', '--type', 'e2e').status, 0);
    const first = path.join(draftRoot, 'e2e', drafts('e2e', stem)[0]); const before = fs.readFileSync(first, 'utf8');
    assert.equal(run('--description', 'stage 7 collision', '--type', 'e2e').status, 0);
    assert.deepEqual(drafts('e2e', stem).sort(), ['ai_stage_7_collision.feature', 'ai_stage_7_collision_2.feature']);
    assert.equal(fs.readFileSync(first, 'utf8'), before);
  } finally { removeDrafts('e2e', stem); }
});

test('validator rejects malformed Gherkin, undefined/ambiguous steps, and an empty selection', () => {
  const directory = path.join(draftRoot, 'api'); fs.mkdirSync(directory, { recursive: true });
  const cases = {
    malformed: '@WIP @GeneratedDraft @API\nFeature broken without a colon',
    undefined: '@WIP @GeneratedDraft @API\nFeature: undefined\n  Scenario: bad\n    Given an unavailable generated step',
    ambiguous: '@WIP @GeneratedDraft @API\nFeature: ambiguous\n  Scenario: bad\n    Given I deliberately trigger an ambiguous draft step',
    empty_selection: '@WIP @API\nFeature: unselected\n  Scenario: valid but unselected\n    When I send POST request to /api/login with email "testuser@example.com" and password "correct_password"',
  };
  try {
    for (const [name, content] of Object.entries(cases)) {
      const file = path.join(directory, `ai_stage_7_${name}.feature`); fs.writeFileSync(file, `${content}\n`);
      const result = spawnSync(process.execPath, [path.join(root, 'scripts/validate-generated-draft.js'), '--file', file, '--type', 'api'], { cwd: root, encoding: 'utf8' });
      assert.notEqual(result.status, 0, name);
    }
  } finally { for (const name of Object.keys(cases)) fs.rmSync(path.join(directory, `ai_stage_7_${name}.feature`), { force: true }); }
});

test('generator and validator reject symbolic-link draft paths', () => {
  const directory = path.join(draftRoot, 'api');
  const backup = `${directory}-stage7-backup-${process.pid}`;
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-stage7-drafts-'));
  const linkedFile = path.join(directory, 'linked.feature');
  try {
    fs.writeFileSync(path.join(outside, 'outside.feature'), '@WIP @GeneratedDraft @API\nFeature: outside\n  Scenario: outside\n    Given an unavailable generated step\n');
    fs.symlinkSync(path.join(outside, 'outside.feature'), linkedFile);
    const validation = spawnSync(process.execPath, [path.join(root, 'scripts/validate-generated-draft.js'), '--file', linkedFile, '--type', 'api'], { cwd: root, encoding: 'utf8' });
    assert.notEqual(validation.status, 0);
    fs.unlinkSync(linkedFile);
    fs.renameSync(directory, backup);
    fs.symlinkSync(outside, directory, 'dir');
    const generation = run('--description', 'stage 7 symlink directory', '--type', 'api');
    assert.notEqual(generation.status, 0);
    assert.deepEqual(fs.readdirSync(outside).sort(), ['outside.feature']);
  } finally {
    if (fs.existsSync(directory) && fs.lstatSync(directory).isSymbolicLink()) fs.unlinkSync(directory);
    if (fs.existsSync(backup)) fs.renameSync(backup, directory);
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

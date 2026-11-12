const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const AsyncFunction = (async () => {}).constructor;

const root = join(__dirname, '..');

// Run the same github-script body that Actions executes, with only the external API stubbed.
function githubScript(workflow) {
  const lines = readFileSync(join(root, '.github/workflows', workflow), 'utf8').split('\n');
  const start = lines.findIndex(line => line === '          script: |');
  assert.notEqual(start, -1, `${workflow} has a github-script step`);
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line && !line.startsWith('            ')) break;
    body.push(line.slice(12));
  }
  return new AsyncFunction('github', 'context', 'core', 'console', body.join('\n'));
}

async function run(workflow, names) {
  const outputs = {};
  const failures = [];
  const comments = [];
  const github = {
    rest: {
      repos: { listTags: async () => ({ data: [{ name: 'v0.2.6' }] }) },
      issues: {
        listLabelsOnIssue: async () => ({ data: names.map(name => ({ name })) }),
        listComments: async () => ({ data: [] }),
        createComment: async ({ body }) => { comments.push(body); },
        updateComment: async ({ body }) => { comments.push(body); }
      }
    }
  };
  const context = { repo: { owner: 'lowranceworks', repo: 'dotfiles' }, issue: { number: 26 } };
  const core = { setOutput: (name, value) => { outputs[name] = value; }, setFailed: message => { failures.push(message); } };
  await githubScript(workflow)(github, context, core, { log: () => {} });
  return { outputs, failures, comments };
}

const check = 'semver-label-check.yaml';
const release = 'create-tag-and-release.yaml';

test('minor change predicts v0.3.0 and selects minor for release', async () => {
  const preview = await run(check, ['minor change', 'documentation']);
  const validation = await run(release, ['minor change', 'documentation']);
  assert.deepEqual(preview.failures, []);
  assert.match(preview.comments[0], /`v0\.2\.6` → `v0\.3\.0`/);
  assert.deepEqual(validation.failures, []);
  assert.equal(validation.outputs.version_type, 'minor');
});

test('missing version labels cannot authorize a release', async () => {
  for (const labels of [[], ['documentation']]) {
    for (const workflow of [check, release]) {
      const result = await run(workflow, labels);
      assert.equal(result.failures.length, 1, `${workflow}: ${labels.join(', ') || '(none)'}`);
      assert.equal(result.outputs.version_type, undefined);
    }
  }
});

test('minor release predicts v0.3.0 and selects minor for release', async () => {
  const preview = await run(check, ['minor release']);
  const validation = await run(release, ['minor release']);
  assert.deepEqual(preview.failures, []);
  assert.match(preview.comments[0], /`v0\.2\.6` → `v0\.3\.0`/);
  assert.deepEqual(validation.failures, []);
  assert.equal(validation.outputs.version_type, 'minor');
});

test('canonical minor label also predicts and selects minor', async () => {
  const preview = await run(check, ['minor']);
  const validation = await run(release, ['minor']);
  assert.deepEqual(preview.failures, []);
  assert.match(preview.comments[0], /`v0\.2\.6` → `v0\.3\.0`/);
  assert.deepEqual(validation.failures, []);
  assert.equal(validation.outputs.version_type, 'minor');
});

test('conflicting version labels cannot authorize a release', async () => {
  for (const labels of [['minor change', 'patch'], ['minor change', 'minor'], ['minor release', 'minor change']]) {
    for (const workflow of [check, release]) {
      const result = await run(workflow, labels);
      assert.equal(result.failures.length, 1, `${workflow}: ${labels.join(', ')}`);
      assert.equal(result.outputs.version_type, undefined);
    }
  }
});

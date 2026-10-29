/* eslint-disable @typescript-eslint/no-require-imports -- Direct Node test launcher. */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const { isolatedEnv, projectRoot } = require('./isolated-env.cjs');
const rules = process.argv.includes('--rules');
const tests = fs.readdirSync(projectRoot + '/tests').filter(name => /\.test\.(ts|mjs)$/.test(name) && (rules ? name === 'firestore.rules.test.ts' : name !== 'firestore.rules.test.ts')).map(name => 'tests/' + name);
const result = spawnSync(process.execPath, ['--import', 'tsx', '--import', './tests/isolated-bootstrap.ts', '--test', '--test-concurrency=1', ...tests], { cwd: projectRoot, env: isolatedEnv(), stdio: 'inherit', windowsHide: true });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;

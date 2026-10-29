/* global __dirname */
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
function runExpo(args, overrides = {}) {
  // Expo's workspace file map expects this directory, even with an unhoisted mobile install.
  // Creates an empty ignored directory; does not install or resolve packages from the registry.
  mkdirSync(path.resolve(__dirname, '../../../node_modules'), { recursive: true });
  const child = spawn(process.execPath, [require.resolve('expo/bin/cli'), ...args], { cwd: path.resolve(__dirname, '..'), stdio: 'inherit', env: { ...process.env, ...overrides } });
  child.on('error', error => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', code => process.exit(code ?? 1));
  return child;
}
module.exports = { runExpo };
if (require.main === module) runExpo(['start', ...process.argv.slice(2)]);

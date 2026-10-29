/* eslint-disable @typescript-eslint/no-require-imports -- Direct Node CommonJS launcher, not application TypeScript. */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { isolatedEnv, projectRoot } = require('./isolated-env.cjs');
const action = process.argv[2];
const env = isolatedEnv();
let args;
if (action === 'emulators') {
  const runtime = path.resolve(projectRoot, '../.tools/java/runtime');
  if (fs.existsSync(runtime)) {
    const dirs = fs.readdirSync(runtime).filter(name => fs.existsSync(path.join(runtime, name, 'bin/java.exe')));
    if (dirs.length === 1) { env.JAVA_HOME = path.join(runtime, dirs[0]); env.PATH = path.join(env.JAVA_HOME, 'bin') + path.delimiter + env.PATH; }
  }
  args = [path.join(projectRoot, 'node_modules/firebase-tools/lib/bin/firebase.js'), 'emulators:start', '--project', 'demo-aarvika-local', '--config', 'firebase.isolated.json', '--only', 'auth,firestore'];
} else if (['dev', 'build', 'start'].includes(action)) {
  args = [path.join(projectRoot, 'node_modules/next/dist/bin/next'), action];
  if (action !== 'build') args.push('--hostname', '127.0.0.1', '--port', '3100');
  // Avoid workspace-root inference from the parent Expo workspace.
} else throw new Error('Use dev, build, start or emulators. No cloud commands are supported.');
const child = spawn(process.execPath, args, { cwd: projectRoot, env, stdio: 'inherit', windowsHide: true });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));

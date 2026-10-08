// Runs this project's own MongoDB for local development.
// It only starts when MONGODB_URI in server/.env points at this machine; with an Atlas URI it does nothing.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const envFile = path.join(root, 'server/.env');
const dbPath = path.join(root, 'server/data/mongo');

function readUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (!existsSync(envFile)) return '';
  const line = readFileSync(envFile, 'utf8')
    .split('\n')
    .find((l) => l.trim().startsWith('MONGODB_URI='));
  return line ? line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') : '';
}

const uri = readUri();
const match = uri.match(/^mongodb:\/\/(?:[^@/]+@)?(localhost|127\.0\.0\.1|\[::1\]):(\d+)/);
if (!match) {
  console.log(uri ? 'MONGODB_URI is not local, so no local MongoDB is started.' : 'MONGODB_URI is not set in server/.env.');
  process.exit(0);
}
const port = Number(match[2]);

const inUse = await new Promise((resolve) => {
  const socket = net.connect(port, '127.0.0.1');
  socket.once('connect', () => (socket.end(), resolve(true)));
  socket.once('error', () => resolve(false));
});
if (inUse) {
  console.log(`Something is already running on port ${port}; using it as the database.`);
  process.exit(0);
}

mkdirSync(dbPath, { recursive: true });
const bin = process.env.MONGOD_BIN || 'mongod';
const mongod = spawn(
  bin,
  ['--dbpath', dbPath, '--port', String(port), '--bind_ip', '127.0.0.1', '--logpath', path.join(dbPath, 'mongod.log'), '--logappend'],
  { stdio: 'inherit' },
);

mongod.on('error', (err) => {
  console.error(err.code === 'ENOENT' ? `Could not find "${bin}". Install MongoDB (brew install mongodb-community) or set MONGOD_BIN.` : err.message);
  process.exit(1);
});
mongod.on('spawn', () => console.log(`Local MongoDB on port ${port}, data in server/data/mongo (log: mongod.log)`));
mongod.on('exit', (code, signal) => process.exit(signal ? 0 : (code ?? 0)));

// Pass Ctrl+C through so MongoDB shuts down cleanly.
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => mongod.kill(sig));

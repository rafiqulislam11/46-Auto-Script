/**
 * tools/watch.js - AntryGravity Auto Script Runner Development File Watcher
 * Watches src/, scripts/, and presets/ for edits, triggering lint and build incrementally.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function logInfo(msg) { console.log(`\x1b[36m[${new Date().toLocaleTimeString()}]\x1b[0m ℹ ` + msg); }
function logSuccess(msg) { console.log(`\x1b[32m[${new Date().toLocaleTimeString()}]\x1b[0m ✔ ` + msg); }

const WATCH_DIRS = ['./src', './scripts', './presets'];

logInfo('AntryGravity Watcher active. Monitoring files for changes...');
logInfo('Press Ctrl+C to stop watcher.');

let debounceTimer = null;

function onFileChanged(event, filename) {
  if (!filename) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    logInfo(`Change detected in: ${filename}. Rebuilding...`);
    try {
      require('./build.js');
      logSuccess('Live build updated. Reload panel in Adobe UXP Developer Tool (Ctrl+R / Cmd+R).');
    } catch (err) {
      console.error('Build error:', err.message);
    }
  }, 250);
}

WATCH_DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.watch(dir, { recursive: true }, onFileChanged);
    logInfo(`Watching directory: ${dir}`);
  }
});

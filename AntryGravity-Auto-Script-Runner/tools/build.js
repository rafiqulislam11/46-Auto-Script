/**
 * tools/build.js - AntryGravity Auto Script Runner Production Builder
 * Prepares the production bundle for Adobe Photoshop.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function logInfo(msg) { console.log('\x1b[36mℹ\x1b[0m ' + msg); }
function logSuccess(msg) { console.log('\x1b[32m✔\x1b[0m ' + msg); }
function logError(msg) { console.log('\x1b[31m✖\x1b[0m ' + msg); }

const BUILD_DIR = './build';
const DIST_DIR = path.join(BUILD_DIR, 'antrygravity-auto-script-runner');

logInfo('Starting production build...');

// Ensure clean build directory
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const e of entries) {
      copyRecursive(path.join(src, e), path.join(dest, e));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 1. Copy Manifests & Configs
fs.copyFileSync('./manifest.json', path.join(DIST_DIR, 'manifest.json'));
fs.copyFileSync('./package.json', path.join(DIST_DIR, 'package.json'));

if (fs.existsSync('./.debug')) {
  fs.copyFileSync('./.debug', path.join(DIST_DIR, '.debug'));
}

if (fs.existsSync('./CSXS')) {
  copyRecursive('./CSXS', path.join(DIST_DIR, 'CSXS'));
}

// 2. Copy Source tree
copyRecursive('./src', path.join(DIST_DIR, 'src'));

// 3. Copy Scripts & Presets
copyRecursive('./scripts', path.join(DIST_DIR, 'scripts'));
copyRecursive('./presets', path.join(DIST_DIR, 'presets'));

// 4. Copy README if present
if (fs.existsSync('./README.md')) {
  fs.copyFileSync('./README.md', path.join(DIST_DIR, 'README.md'));
}

logSuccess(`Built cleanly into: ${DIST_DIR}`);

// Count files
let fileCount = 0;
let totalBytes = 0;
function countDir(dir) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const s = fs.statSync(full);
    if (s.isDirectory()) {
      countDir(full);
    } else {
      fileCount++;
      totalBytes += s.size;
    }
  }
}
countDir(DIST_DIR);

logSuccess(`Total assets copied: ${fileCount} files (${(totalBytes / 1024).toFixed(1)} KB)`);
logInfo('Ready for packaging (.ccx / .zxp)');

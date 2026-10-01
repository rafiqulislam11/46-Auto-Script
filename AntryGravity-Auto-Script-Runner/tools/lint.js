/**
 * tools/lint.js - AntryGravity Auto Script Runner Linter & Validator
 * Validates JSON structures, verifies JavaScript syntax, and checks required manifests.
 */

'use strict';

const fs = require('fs');
const path = require('path');

let errors = 0;
let warnings = 0;

function logInfo(msg) { console.log('\x1b[36mℹ\x1b[0m ' + msg); }
function logSuccess(msg) { console.log('\x1b[32m✔\x1b[0m ' + msg); }
function logWarn(msg) { console.log('\x1b[33m⚠\x1b[0m ' + msg); warnings++; }
function logError(msg) { console.log('\x1b[31m✖\x1b[0m ' + msg); errors++; }

logInfo('Running AntryGravity Auto Script Runner Validator...');

// 1. Validate manifest.json
try {
  const manifestRaw = fs.readFileSync('./manifest.json', 'utf8');
  const manifest = JSON.parse(manifestRaw);
  if (!manifest.id || !manifest.name || !manifest.version) {
    logError('manifest.json missing required metadata fields (id, name, or version)');
  } else {
    logSuccess(`manifest.json valid: ${manifest.name} v${manifest.version}`);
  }
} catch (e) {
  logError(`manifest.json parse error: ${e.message}`);
}

// 2. Validate CSXS/manifest.xml
if (fs.existsSync('./CSXS/manifest.xml')) {
  logSuccess('CSXS/manifest.xml present for Photoshop 2020-2021 CEP compatibility');
} else {
  logWarn('CSXS/manifest.xml not found. CEP legacy mode might not activate.');
}

// 3. Validate package.json
try {
  const pkgRaw = fs.readFileSync('./package.json', 'utf8');
  const pkg = JSON.parse(pkgRaw);
  logSuccess(`package.json valid: ${pkg.name} v${pkg.version}`);
} catch (e) {
  logError(`package.json parse error: ${e.message}`);
}

// 4. Validate Presets JSON
const presetsDir = './presets';
if (fs.existsSync(presetsDir)) {
  const presetFiles = fs.readdirSync(presetsDir).filter(f => f.endsWith('.json'));
  for (const f of presetFiles) {
    try {
      const p = JSON.parse(fs.readFileSync(path.join(presetsDir, f), 'utf8'));
      if (!p.name || !Array.isArray(p.steps)) {
        logError(`Preset ${f} missing name or steps array`);
      } else {
        logSuccess(`Preset valid: ${p.name} (${p.steps.length} steps)`);
      }
    } catch (e) {
      logError(`Preset ${f} invalid JSON: ${e.message}`);
    }
  }
}

// 5. JavaScript Syntax Scan
function scanJsDir(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      scanJsDir(full);
    } else if (item.endsWith('.js')) {
      try {
        const code = fs.readFileSync(full, 'utf8');
        new Function(code);
      } catch (err) {
        logError(`JS Syntax Error in ${full}: ${err.message}`);
      }
    }
  }
}

scanJsDir('./src');
scanJsDir('./tools');

console.log('──────────────────────────────────────────────────────────');
if (errors === 0) {
  logSuccess(`Lint passed with 0 errors! (${warnings} warnings)`);
  process.exit(0);
} else {
  logError(`Lint failed with ${errors} error(s)!`);
  process.exit(1);
}

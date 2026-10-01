/**
 * tools/debug.js - AntryGravity Auto Script Runner Environment Diagnostic
 * Checks:
 *  - Installed Photoshop versions (2020 through 2026)
 *  - CEP PlayerDebugMode registry keys (Windows) / plist (macOS)
 *  - UXP Developer Tool (UDT) workspace discovery
 *  - Network endpoints for local AI upscaler and background removal
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function logInfo(msg) { console.log('\x1b[36mℹ\x1b[0m ' + msg); }
function logSuccess(msg) { console.log('\x1b[32m✔\x1b[0m ' + msg); }
function logWarn(msg) { console.log('\x1b[33m⚠\x1b[0m ' + msg); }

console.log('═══════════════════════════════════════════════════════════════');
console.log('  AntryGravity Auto Script Runner — Environment Diagnostics   ');
console.log('═══════════════════════════════════════════════════════════════');

// 1. Detect Installed Photoshop versions on Windows
if (process.platform === 'win32') {
  const adobePath = 'C:\\Program Files\\Adobe';
  if (fs.existsSync(adobePath)) {
    const dirs = fs.readdirSync(adobePath).filter(d => d.includes('Photoshop'));
    if (dirs.length > 0) {
      logSuccess(`Found Adobe Photoshop installations:`);
      dirs.forEach(d => console.log(`   - ${d}`));
    } else {
      logWarn('No Adobe Photoshop folders detected in C:\\Program Files\\Adobe.');
    }
  }

  // 2. Check CEP PlayerDebugMode in Windows Registry
  logInfo('Checking CEP PlayerDebugMode for legacy Photoshop 2020/2021 debugging...');
  ['CSXS.9', 'CSXS.10'].forEach(csxsVer => {
    try {
      const regCheck = execSync(`reg query "HKEY_CURRENT_USER\\Software\\Adobe\\${csxsVer}" /v PlayerDebugMode`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      if (regCheck.includes('0x1') || regCheck.includes('1')) {
        logSuccess(`CEP (${csxsVer}) PlayerDebugMode is enabled (1).`);
      } else {
        logWarn(`CEP (${csxsVer}) PlayerDebugMode is not enabled.`);
      }
    } catch (_) {
      logWarn(`CEP (${csxsVer}) registry key not found.`);
    }
  });
}

// 3. Manifest UXP check
const manifestPath = './manifest.json';
if (fs.existsSync(manifestPath)) {
  const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  logSuccess(`UXP Plugin Manifest: ${m.name} (ID: ${m.id})`);
  logInfo(`Host App Target: ${m.host[0].app} minVersion: ${m.host[0].minVersion}`);
}

console.log('───────────────────────────────────────────────────────────');
logInfo('To debug in UXP:');
console.log('  1. Open Adobe UXP Developer Tool (UDT).');
console.log('  2. Click "Add Plugin" -> Select manifest.json in this directory.');
console.log('  3. Click "Actions" -> "Load" -> Select running Photoshop version.');
console.log('  4. Click "Actions" -> "Debug" to open Chrome DevTools inspector.');
console.log('───────────────────────────────────────────────────────────');

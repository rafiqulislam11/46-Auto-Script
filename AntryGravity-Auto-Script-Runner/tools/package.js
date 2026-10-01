/**
 * tools/package.js - AntryGravity Auto Script Runner Packaging Tool
 * Produces both:
 *  1. .ccx package (Adobe UXP Plugin for Photoshop 2022–2026)
 *  2. .zxp package (Adobe CEP Extension for Photoshop 2020–2021)
 * Robust handling of paths with spaces across Windows, macOS, and Linux.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function logInfo(msg) { console.log('\x1b[36mℹ\x1b[0m ' + msg); }
function logSuccess(msg) { console.log('\x1b[32m✔\x1b[0m ' + msg); }
function logError(msg) { console.log('\x1b[31m✖\x1b[0m ' + msg); }

const DIST_DIR = path.resolve('./build/antrygravity-auto-script-runner');
const OUTPUT_CCX = path.resolve('./build/AntryGravity-Auto-Script-Runner.ccx');
const OUTPUT_ZXP = path.resolve('./build/AntryGravity-Auto-Script-Runner.zxp');

// First ensure build has run
if (!fs.existsSync(DIST_DIR)) {
  logInfo('Dist directory not found. Running build first...');
  require('./build.js');
}

logInfo('Packaging AntryGravity Auto Script Runner...');

// Remove existing archives
if (fs.existsSync(OUTPUT_CCX)) fs.unlinkSync(OUTPUT_CCX);
if (fs.existsSync(OUTPUT_ZXP)) fs.unlinkSync(OUTPUT_ZXP);

try {
  let created = false;

  // Method 1: Try built-in tar.exe (Windows 10/11 native or Unix tar)
  try {
    // Navigate into DIST_DIR so files are at zip root
    execSync(`tar.exe -a -c -f "${OUTPUT_CCX}" *`, { cwd: DIST_DIR, stdio: 'ignore' });
    created = fs.existsSync(OUTPUT_CCX);
  } catch (_) {
    created = false;
  }

  // Method 2: If tar failed, use PowerShell with safe single-quote string args
  if (!created && process.platform === 'win32') {
    const escapedDist = DIST_DIR.replace(/'/g, "''");
    const escapedOut = OUTPUT_CCX.replace(/'/g, "''");
    const psCmd = `Compress-Archive -Path '${escapedDist}\\*' -DestinationPath '${escapedOut}' -Force`;
    execSync(`powershell.exe -NoProfile -Command "${psCmd}"`, { stdio: 'inherit' });
    created = fs.existsSync(OUTPUT_CCX);
  }

  // Method 3: Unix zip
  if (!created && process.platform !== 'win32') {
    execSync(`zip -r "${OUTPUT_CCX}" .`, { cwd: DIST_DIR, stdio: 'inherit' });
    created = fs.existsSync(OUTPUT_CCX);
  }

  if (created) {
    fs.copyFileSync(OUTPUT_CCX, OUTPUT_ZXP);
    const statCCX = fs.statSync(OUTPUT_CCX);
    logSuccess(`UXP Package (.ccx) created: ${OUTPUT_CCX} (${(statCCX.size / 1024).toFixed(1)} KB)`);
    logSuccess(`CEP Package (.zxp) created: ${OUTPUT_ZXP} (${(statCCX.size / 1024).toFixed(1)} KB)`);
    logInfo('Double-click .ccx to install in Photoshop 2022–2026, or use Adobe UXP Developer Tool.');
  } else {
    throw new Error('Failed to generate archive file.');
  }
} catch (err) {
  logError(`Packaging failed: ${err.message}`);
  process.exit(1);
}

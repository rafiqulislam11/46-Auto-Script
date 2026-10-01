/**
 * version-detector.js
 * ───────────────────
 * Detects Photoshop version at runtime and determines:
 *  - PS major version number
 *  - API mode: 'uxp' (PS 2022+) or 'cep' (PS 2020-2021)
 *  - Feature availability per version
 *
 * Architecture:
 *   VersionDetector → CompatibilityManager → APIAdapter selection
 *
 * PS version → year mapping
 *   21.x  2020 (CEP + JSX)
 *   22.x  2021 (CEP + early UXP)
 *   23.x  2022 (UXP 4.x)
 *   24.x  2023 (UXP 5.x)
 *   25.x  2024 (UXP 6.x)
 *   26.x  2025 (UXP 7.x)
 *   27.x  2026 (UXP 8.x)
 */

'use strict';

const AGVersionDetector = (() => {

  // ─── Feature matrix per major version ──────────────────────────────────────
  //  true  = natively supported
  //  false = unavailable / requires fallback
  const FEATURE_MATRIX = {
    21: {
      year: 2020, apiMode: 'cep',
      uxpActions: false, uxpIO: false, smartObjects: true,
      neuralFilters: false, selectSubject: true, imageSize: true,
      saveForWeb: true, fieldBlur: false
    },
    22: {
      year: 2021, apiMode: 'cep',
      uxpActions: false, uxpIO: false, smartObjects: true,
      neuralFilters: true, selectSubject: true, imageSize: true,
      saveForWeb: true, fieldBlur: true
    },
    23: {
      year: 2022, apiMode: 'uxp',
      uxpActions: true, uxpIO: true, smartObjects: true,
      neuralFilters: true, selectSubject: true, imageSize: true,
      saveForWeb: true, fieldBlur: true
    },
    24: {
      year: 2023, apiMode: 'uxp',
      uxpActions: true, uxpIO: true, smartObjects: true,
      neuralFilters: true, selectSubject: true, imageSize: true,
      saveForWeb: true, fieldBlur: true
    },
    25: {
      year: 2024, apiMode: 'uxp',
      uxpActions: true, uxpIO: true, smartObjects: true,
      neuralFilters: true, selectSubject: true, imageSize: true,
      saveForWeb: true, fieldBlur: true
    },
    26: {
      year: 2025, apiMode: 'uxp',
      uxpActions: true, uxpIO: true, smartObjects: true,
      neuralFilters: true, selectSubject: true, imageSize: true,
      saveForWeb: true, fieldBlur: true
    },
    27: {
      year: 2026, apiMode: 'uxp',
      uxpActions: true, uxpIO: true, smartObjects: true,
      neuralFilters: true, selectSubject: true, imageSize: true,
      saveForWeb: true, fieldBlur: true
    }
  };

  const DEFAULT_CAPS = FEATURE_MATRIX[23]; // fallback to 2022

  let _detected = null;

  /**
   * Run detection.
   * Returns: { versionString, major, minor, year, apiMode, caps }
   */
  async function detect() {
    if (_detected) return _detected;

    let versionString = 'Unknown';
    let major = 23; // default to 2022

    try {
      // ── UXP environment (PS 2022+) ──────────────────────────────
      if (typeof require !== 'undefined') {
        try {
          const app = require('photoshop').app;
          versionString = app.version || 'Unknown';
          major = parseInt(versionString.split('.')[0], 10);
          AGLogger.success(`[VersionDetector] UXP detected Photoshop ${versionString}`);
        } catch (uxpErr) {
          AGLogger.warn(`[VersionDetector] UXP require failed: ${uxpErr.message}`);
        }
      }

      // ── CEP environment fallback (PS 2020–2021) ─────────────────
      if (versionString === 'Unknown' && typeof CSInterface !== 'undefined') {
        try {
          const cs = new CSInterface();
          const hostEnv = cs.getHostEnvironment();
          versionString = hostEnv.appVersion || 'Unknown';
          major = parseInt(versionString.split('.')[0], 10);
          AGLogger.success(`[VersionDetector] CEP detected Photoshop ${versionString}`);
        } catch (cepErr) {
          AGLogger.warn(`[VersionDetector] CEP CSInterface failed: ${cepErr.message}`);
        }
      }

      // ── Browser / dev environment ────────────────────────────────
      if (versionString === 'Unknown') {
        versionString = '23.0.0 (dev/browser)';
        major = 23;
        AGLogger.warn('[VersionDetector] No PS environment – using dev mode (v23)');
      }

    } catch (err) {
      AGLogger.error(`[VersionDetector] Detection failed: ${err.message}`);
    }

    const caps = FEATURE_MATRIX[major] || { ...DEFAULT_CAPS };
    major = isNaN(major) ? 23 : major;

    _detected = {
      versionString,
      major,
      minor: 0,
      year:  caps.year || 2022,
      apiMode: caps.apiMode || 'uxp',
      caps
    };

    AGLogger.info(`[VersionDetector] Mode: ${_detected.apiMode}, Year: ${_detected.year}`);
    return _detected;
  }

  /**
   * Check if a specific feature is available.
   * @param {string} feature - Key from FEATURE_MATRIX
   * @returns {boolean}
   */
  function canUse(feature) {
    if (!_detected) return false;
    return !!_detected.caps[feature];
  }

  /**
   * Show an in-panel compatibility warning for unavailable features.
   * @param {string} feature - Human-readable feature name
   * @returns {string} HTML string
   */
  function unavailableHTML(feature) {
    return `<div class="ag-compat-warn">
      ⚠ <strong>${feature}</strong> is unavailable in Photoshop ${(_detected && _detected.year) || '?'}.
      Use Legacy Script Mode or upgrade Photoshop.
    </div>`;
  }

  return { detect, canUse, unavailableHTML, getDetected: () => _detected, FEATURE_MATRIX };
})();

window.AGVersionDetector = AGVersionDetector;

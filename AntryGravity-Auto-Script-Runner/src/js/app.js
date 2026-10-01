/**
 * app.js (Application Bootstrap & Lifecycle)
 * ──────────────────────────────────────────
 * Main entry point for AntryGravity Auto Script Runner.
 * Coordinates startup, version detection, Photoshop bridge attachment,
 * and UI component initialization.
 */

'use strict';

const AGApp = (() => {

  let _activeBridge = null;

  async function start() {
    try {
      AGLogger.info('[App] Bootstrapping AntryGravity Auto Script Runner v1.0.0…');

      // Step 1: Detect Photoshop Version & Capabilities
      const detection = await window.AGVersionDetector.detect();
      const psYear = detection.year || 2026;
      const apiMode = detection.apiMode || 'uxp';

      AGLogger.info(`[App] Target: Photoshop ${psYear} (API Mode: ${apiMode.toUpperCase()})`);

      // Step 2: Initialize Appropriate Host Adapter
      if (apiMode === 'uxp' && window.PSAdapter) {
        const uxpSuccess = await window.PSAdapter.init();
        if (uxpSuccess) {
          _activeBridge = window.PSAdapter;
          window.AGUI && window.AGUI.setStatus && window.AGUI.setStatus('Connected (UXP)', 'connected');
        } else {
          _activeBridge = window.CEPAdapter;
          window.AGUI && window.AGUI.setStatus && window.AGUI.setStatus('Fallback (CEP/JSX)', 'connected');
        }
      } else if (window.CEPAdapter) {
        window.CEPAdapter.init();
        _activeBridge = window.CEPAdapter;
        window.AGUI && window.AGUI.setStatus && window.AGUI.setStatus('Connected (CEP)', 'connected');
      }

      // Step 3: Initialize UI
      if (window.AGUI) {
        window.AGUI.init();
        window.AGUI.setPhotoshopVersion(`Photoshop ${psYear}`);
      }

      AGLogger.success(`[App] AntryGravity Auto Script Runner ready on Photoshop ${psYear}`);
    } catch (err) {
      AGLogger.error(`[App] Startup initialization failed: ${err.message}`);
      if (window.AGUI) {
        window.AGUI.setStatus('Error', 'error');
        window.AGUI.toast(`Init failed: ${err.message}`, 'error');
      }
    }
  }

  return {
    start,
    getActiveBridge: () => _activeBridge
  };
})();

window.AGApp = AGApp;

// Auto-run once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AGApp.start());
} else {
  AGApp.start();
}

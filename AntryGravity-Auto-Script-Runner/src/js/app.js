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
        }
      }

      if (!_activeBridge && apiMode === 'cep' && window.CEPAdapter) {
        const cepSuccess = window.CEPAdapter.init();
        if (cepSuccess && window.CEPAdapter.isAvailable) {
          _activeBridge = window.CEPAdapter;
          window.AGUI && window.AGUI.setStatus && window.AGUI.setStatus('Connected (CEP)', 'connected');
        }
      }

      // Web Studio Mode (In-Browser / GitHub Pages / Standalone Preview)
      if (!_activeBridge && window.WebStudioAdapter) {
        await window.WebStudioAdapter.init();
        _activeBridge = window.WebStudioAdapter;
        window.AGUI && window.AGUI.setStatus && window.AGUI.setStatus('Web Studio Mode', 'connected');
        AGLogger.success('[App] Initialized WebStudioAdapter (HTML5 Canvas Engine + Live Studio Canvas)');
      }

      // Step 3: Initialize UI
      if (window.AGUI) {
        window.AGUI.init();
        const displayVersion = psYear === 'Web Studio' || psYear === 0 ? 'Web Studio' : `Photoshop ${psYear}`;
        window.AGUI.setPhotoshopVersion(displayVersion);
      }

      AGLogger.success(`[App] AntryGravity Auto Script Runner ready (${psYear === 'Web Studio' ? 'Web Studio Mode' : 'Photoshop ' + psYear})`);
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

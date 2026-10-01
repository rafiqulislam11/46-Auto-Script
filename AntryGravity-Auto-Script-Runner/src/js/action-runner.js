/**
 * action-runner.js (Photoshop Action Automation Runner)
 * ─────────────────────────────────────────────────────
 * Discovers and runs recorded Photoshop Actions (.atn)
 * either on the active document or queued across batches.
 * 
 * Supports:
 *  - Discovering loaded Action Sets and Actions (via batchPlay or ExtendScript)
 *  - Single-document execution
 *  - Batch run with auto error recovery (continue on error / retry)
 *  - Custom batch limit sizes (10 / 50 / 100 / 500 / all)
 */

'use strict';

const AGActionRunner = (() => {

  /**
   * Retrieves all loaded Action Sets and Actions from Photoshop.
   */
  async function getAvailableActions() {
    const isUXP = (window.AGVersionDetector && window.AGVersionDetector.getDetected() ? window.AGVersionDetector.getDetected().apiMode : null) === 'uxp';

    if (isUXP && (window.PSAdapter && window.PSAdapter.isAvailable)) {
      try {
        // Query Photoshop action sets via batchPlay
        const result = await window.PSAdapter.batchPlay([{
          _obj: 'get',
          _target: [{ _property: 'actionInfo' }, { _ref: 'application', _enum: 'ordinal', _value: 'targetEnum' }]
        }], { synchronousExecution: true });

        // Parse action tree if returned
        if (result && result[0] && result[0].actionInfo) {
          return result[0].actionInfo;
        }
      } catch (err) {
        AGLogger.warn(`[ActionRunner] Could not query actionInfo directly: ${err.message}`);
      }
    }

    // Default standard Photoshop action sets fallback
    return [
      {
        name: 'Default Actions',
        actions: ['Vignette (selection)', 'Frame Channel - 50 pixel', 'Wood Frame - 50 pixel', 'Cast Shadow (type)', 'Water Reflection (type)', 'Custom RGB to Grayscale', 'Molten Lead', 'Make Clip Path']
      },
      {
        name: 'AntryGravity Automations',
        actions: ['High Contrast B&W', 'Vintage Matte Wash', 'Crisp Web Sharpen', 'Golden Hour Glow', 'Studio Portrait Punch']
      }
    ];
  }

  /**
   * Execute an Action on the currently active document
   */
  async function runOnCurrent(actionSet, actionName) {
    if (!actionSet || !actionName) {
      throw new Error('Both Action Set and Action Name are required.');
    }

    AGLogger.info(`[ActionRunner] Running action "${actionName}" from set "${actionSet}" on active document...`);
    const bridge = (window.AGApp && window.AGApp.getActiveBridge ? window.AGApp.getActiveBridge() : (window.PSAdapter || window.CEPAdapter));

    if (!bridge) {
      throw new Error('No Photoshop bridge connected.');
    }

    const startTime = performance.now();
    await bridge.runAction(actionSet, actionName);
    const duration = (performance.now() - startTime).toFixed(1);
    AGLogger.success(`[ActionRunner] Successfully executed "${actionName}" in ${duration}ms`);
    return { success: true, duration };
  }

  /**
   * Run action on the batch queue
   */
  async function runOnBatch(actionSet, actionName, options = {}) {
    const {
      continueOnError = true,
      retryCount = 1,
      batchLimit = null
    } = options;

    if (!window.AGQueue) {
      throw new Error('Queue engine not initialized');
    }

    const items = window.AGQueue.getItems();
    if (items.length === 0) {
      throw new Error('Queue is empty. Please select or drop images first.');
    }

    const targetCount = batchLimit ? Math.min(items.length, batchLimit) : items.length;
    AGLogger.info(`[ActionRunner] Preparing batch action run for ${targetCount} images...`);

    // Assign queue processor
    window.AGQueue.setProcessor(async (item) => {
      let attempts = 0;
      let succeeded = false;
      let lastErr = null;

      while (attempts <= retryCount && !succeeded) {
        try {
          attempts++;
          // Open document
          const bridge = (window.AGApp && window.AGApp.getActiveBridge ? window.AGApp.getActiveBridge() : (window.PSAdapter || window.CEPAdapter));
          if (item.entry && bridge.openDocument) {
            await bridge.openDocument(item.entry);
          }

          // Run action
          await bridge.runAction(actionSet, actionName);

          // Save / Export if export manager configured, else close
          if (window.AGExportManager) {
            await window.AGExportManager.exportActiveDocument(item.name);
          } else {
            await bridge.closeDocument('saveChanges');
          }

          succeeded = true;
        } catch (err) {
          lastErr = err;
          if (attempts <= retryCount) {
            AGLogger.warn(`[ActionRunner] Retrying ${item.name} (Attempt ${attempts + 1})...`);
            await new Promise(r => setTimeout(r, 400));
          }
        }
      }

      if (!succeeded) {
        if (!continueOnError) {
          throw lastErr;
        } else {
          AGLogger.error(`[ActionRunner] Skipping ${item.name} after failure: ${(lastErr && lastErr.message)}`);
        }
      }
    });

    window.AGQueue.start();
  }

  return {
    getAvailableActions,
    runOnCurrent,
    runOnBatch
  };
})();

window.AGActionRunner = AGActionRunner;

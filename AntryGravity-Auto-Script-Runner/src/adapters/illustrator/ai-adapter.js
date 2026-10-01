/**
 * ai-adapter.js (Illustrator Integration Adapter)
 * ───────────────────────────────────────────────
 * Provides the bridge between Photoshop and Adobe Illustrator for vectorization.
 * Raster-to-vector conversion requires Adobe Illustrator's native Live Trace / Image Trace engine.
 *
 * Implements:
 *  - Launch / Bridge to Illustrator
 *  - Automated Image Trace preset execution via ExtendScript or CLI/COM automation
 *  - Export formats: SVG, EPS, AI
 *  - Presets: Black & White, Color (16/30), High Detail, Low Detail
 */

'use strict';

const IllustratorAdapter = (() => {

  const TRACE_PRESETS = {
    'bw': 'Black and White Logo',
    'color-high': 'High Fidelity Photo',
    'color-low': '16 Colors',
    'shades': 'Shades of Gray',
    'silhouette': 'Silhouettes',
    'line-art': 'Line Art'
  };

  /**
   * Generates the ExtendScript code to be run in Illustrator
   * to open a raster image, perform Image Trace, expand, and save as SVG/EPS.
   */
  function generateIllustratorTraceScript(inputImagePath, outputVectorPath, format = 'svg', presetKey = 'color-high') {
    const presetName = TRACE_PRESETS[presetKey] || 'High Fidelity Photo';
    const cleanIn = inputImagePath.replace(/\\/g, '/');
    const cleanOut = outputVectorPath.replace(/\\/g, '/');

    return `
    (function() {
      try {
        var sourceFile = new File("${cleanIn}");
        if (!sourceFile.exists) return JSON.stringify({ error: "Source file not found" });

        var doc = app.open(sourceFile);
        var placedItem = doc.placedItems.length > 0 ? doc.placedItems[0] : (doc.rasterItems.length > 0 ? doc.rasterItems[0] : null);

        if (!placedItem) {
          return JSON.stringify({ error: "No raster item to trace" });
        }

        // Apply Image Trace
        var trace = placedItem.trace();
        try {
          trace.tracing.preset = "${presetName}";
        } catch(e) {
          // Default fallback
        }

        // Expand vector paths
        app.executeMenuCommand("Live Trace Expand");

        // Save output
        var destFile = new File("${cleanOut}");
        if ("${format.toLowerCase()}" === "svg") {
          var svgOptions = new ExportOptionsSVG();
          svgOptions.embedRasterImages = false;
          svgOptions.cssProperties = SVGCSSPropertyLocation.STYLEATTRIBUTES;
          doc.exportFile(destFile, ExportType.SVG, svgOptions);
        } else if ("${format.toLowerCase()}" === "eps") {
          var epsOptions = new EPSSaveOptions();
          doc.saveAs(destFile, epsOptions);
        } else {
          var aiOptions = new IllustratorSaveOptions();
          doc.saveAs(destFile, aiOptions);
        }

        doc.close(SaveOptions.DONOTSAVECHANGES);
        return JSON.stringify({ success: true, path: destFile.fsName });
      } catch(err) {
        return JSON.stringify({ error: err.message });
      }
    })();
    `;
  }

  return {
    getPresets() {
      return TRACE_PRESETS;
    },

    /**
     * Executes the vectorization workflow.
     * In UXP / Node environment, writes the JSX script and triggers Illustrator execution.
     */
    async vectorizeImage(inputImagePath, outputVectorPath, format = 'svg', presetKey = 'color-high') {
      AGLogger.info(`[IllustratorAdapter] Starting Image Trace workflow on ${inputImagePath}`);
      AGLogger.info(`[IllustratorAdapter] Format: ${format.toUpperCase()}, Preset: ${TRACE_PRESETS[presetKey] || presetKey}`);

      const jsx = generateIllustratorTraceScript(inputImagePath, outputVectorPath, format, presetKey);

      // If CEP environment with CSInterface for Illustrator
      if (typeof CSInterface !== 'undefined' && (window.CEPAdapter && window.CEPAdapter.isAvailable)) {
        try {
          AGLogger.info('[IllustratorAdapter] Sending JSX to Illustrator bridge...');
          const res = await window.CEPAdapter.evalJSX(jsx);
          return res;
        } catch (e) {
          AGLogger.warn(`[IllustratorAdapter] Direct CEP bridge returned: ${e.message}`);
        }
      }

      // In UXP, Illustrator is external. We generate the script and inform the user
      // or write to the scripts directory for batch automation.
      AGLogger.info('[IllustratorAdapter] Generated Illustrator Automation Script successfully');
      return {
        success: true,
        method: 'illustrator-script-generated',
        scriptContent: jsx,
        instructions: 'Run this JSX script in Adobe Illustrator via File > Scripts > Other Script to complete vectorization.'
      };
    },

    generateScript: generateIllustratorTraceScript
  };
})();

window.IllustratorAdapter = IllustratorAdapter;

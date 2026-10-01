/**
 * cep-adapter.js (Legacy Adapter)
 * ────────────────────────────────
 * Adapter for Adobe Photoshop 2020 (v21) & 2021 (v22).
 * Operates via CEP (Common Extensibility Platform) and CSInterface,
 * executing ExtendScript (.jsx) scripts on the Photoshop host engine.
 *
 * Implements the exact same interface signature as PSAdapter so the
 * rest of the application remains completely decoupled from host version.
 */

'use strict';

const CEPAdapter = (() => {
  let _cs = null;
  let _ready = false;

  /** Initialize CSInterface if in CEP environment */
  function init() {
    if (typeof CSInterface !== 'undefined' && typeof window.__adobe_cep__ !== 'undefined') {
      try {
        _cs = new CSInterface();
        _ready = !!_cs.isCEP;
        if (_ready && window.AGLogger) {
          AGLogger.success('[CEPAdapter] CSInterface connected for legacy mode');
        }
        return _ready;
      } catch (err) {
        if (window.AGLogger) {
          AGLogger.warn(`[CEPAdapter] CSInterface init failed: ${err.message}`);
        }
        _ready = false;
        return false;
      }
    }
    _ready = false;
    return false;
  }

  /** Run ExtendScript JSX code asynchronously via CSInterface evalScript */
  function _evalJSX(scriptStr) {
    return new Promise((resolve, reject) => {
      if (!_ready || !_cs) {
        return reject(new Error('CEPAdapter is not active in this environment'));
      }
      _cs.evalScript(scriptStr, (result) => {
        if (result === 'EvalScript error.' || result.startsWith('Error:')) {
          reject(new Error(result));
        } else {
          try {
            const parsed = JSON.parse(result);
            resolve(parsed);
          } catch (_) {
            resolve(result);
          }
        }
      });
    });
  }

  return {
    init,
    get isAvailable() { return _ready; },

    // ── Document Operations ──────────────────────────────────────────────
    async openDocument(filePath) {
      const escaped = filePath.replace(/\\/g, '/');
      const jsx = `(function() {
        try {
          var f = new File("${escaped}");
          if (!f.exists) return JSON.stringify({ error: "File not found" });
          app.open(f);
          return JSON.stringify({ success: true, name: app.activeDocument.name });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    async closeDocument(saveOptions = 'doNotSaveChanges') {
      const saveEnum = saveOptions === 'saveChanges' ? 'SaveOptions.SAVECHANGES' : 'SaveOptions.DONOTSAVECHANGES';
      const jsx = `(function() {
        try {
          if (app.documents.length > 0) {
            app.activeDocument.close(${saveEnum});
            return JSON.stringify({ success: true });
          }
          return JSON.stringify({ success: false, message: "No active document" });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    async flattenDocument() {
      const jsx = `(function() {
        try {
          if (app.documents.length > 0) {
            app.activeDocument.flatten();
            return JSON.stringify({ success: true });
          }
          return JSON.stringify({ success: false });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    // ── Resizing ─────────────────────────────────────────────────────────
    async resizeImage(width, height, resampleMethod = 'bicubicAutomatic') {
      const jsx = `(function() {
        try {
          if (app.documents.length === 0) return JSON.stringify({ error: "No doc open" });
          var doc = app.activeDocument;
          var w = new UnitValue(${width}, "px");
          var h = new UnitValue(${height}, "px");
          doc.resizeImage(w, h, null, ResampleMethod.BICUBICAUTOMATIC);
          return JSON.stringify({ success: true });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    async setResolution(dpi) {
      const jsx = `(function() {
        try {
          if (app.documents.length === 0) return JSON.stringify({ error: "No doc open" });
          app.activeDocument.resizeImage(null, null, ${dpi}, ResampleMethod.NONE);
          return JSON.stringify({ success: true });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    // ── Filters & Effects ────────────────────────────────────────────────
    async gaussianBlur(radius) {
      const jsx = `(function() {
        try {
          if (app.documents.length === 0) return JSON.stringify({ error: "No doc open" });
          app.activeDocument.activeLayer.applyGaussianBlur(${radius});
          return JSON.stringify({ success: true });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    async motionBlur(angle, distance) {
      const jsx = `(function() {
        try {
          if (app.documents.length === 0) return JSON.stringify({ error: "No doc open" });
          app.activeDocument.activeLayer.applyMotionBlur(${angle}, ${distance});
          return JSON.stringify({ success: true });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    async radialBlur(amount) {
      const jsx = `(function() {
        try {
          if (app.documents.length === 0) return JSON.stringify({ error: "No doc open" });
          app.activeDocument.activeLayer.applyRadialBlur(${amount}, RadialBlurMethod.SPIN, RadialBlurQuality.BEST);
          return JSON.stringify({ success: true });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    async addNoise(amount, distribution = 'gaussian', monochromatic = false) {
      const distEnum = distribution === 'gaussian' ? 'NoiseDistribution.GAUSSIAN' : 'NoiseDistribution.UNIFORM';
      const jsx = `(function() {
        try {
          if (app.documents.length === 0) return JSON.stringify({ error: "No doc open" });
          app.activeDocument.activeLayer.applyAddNoise(${amount}, ${distEnum}, ${monochromatic});
          return JSON.stringify({ success: true });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    async unsharpMask(amount, radius, threshold) {
      const jsx = `(function() {
        try {
          if (app.documents.length === 0) return JSON.stringify({ error: "No doc open" });
          app.activeDocument.activeLayer.applyUnsharpMask(${amount}, ${radius}, ${threshold});
          return JSON.stringify({ success: true });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    // ── Photoshop Action Execution ───────────────────────────────────────
    async runAction(actionSet, actionName) {
      const escapedAction = actionName.replace(/"/g, '\\"');
      const escapedSet = actionSet.replace(/"/g, '\\"');
      const jsx = `(function() {
        try {
          app.doAction("${escapedAction}", "${escapedSet}");
          return JSON.stringify({ success: true });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    // ── Export / Save ────────────────────────────────────────────────────
    async saveAsJPEG(destinationPath, quality = 10) {
      const escaped = destinationPath.replace(/\\/g, '/');
      const jsx = `(function() {
        try {
          var doc = app.activeDocument;
          var f = new File("${escaped}");
          var opts = new JPEGSaveOptions();
          opts.quality = ${quality};
          doc.saveAs(f, opts, true, Extension.LOWERCASE);
          return JSON.stringify({ success: true });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    async saveAsPNG(destinationPath) {
      const escaped = destinationPath.replace(/\\/g, '/');
      const jsx = `(function() {
        try {
          var doc = app.activeDocument;
          var f = new File("${escaped}");
          var opts = new PNGSaveOptions();
          doc.saveAs(f, opts, true, Extension.LOWERCASE);
          return JSON.stringify({ success: true });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    async saveAsTIFF(destinationPath) {
      const escaped = destinationPath.replace(/\\/g, '/');
      const jsx = `(function() {
        try {
          var doc = app.activeDocument;
          var f = new File("${escaped}");
          var opts = new TiffSaveOptions();
          doc.saveAs(f, opts, true, Extension.LOWERCASE);
          return JSON.stringify({ success: true });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    async saveAsPSD(destinationPath) {
      const escaped = destinationPath.replace(/\\/g, '/');
      const jsx = `(function() {
        try {
          var doc = app.activeDocument;
          var f = new File("${escaped}");
          var opts = new PhotoshopSaveOptions();
          doc.saveAs(f, opts, true, Extension.LOWERCASE);
          return JSON.stringify({ success: true });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return _evalJSX(jsx);
    },

    evalJSX: _evalJSX
  };
})();

window.CEPAdapter = CEPAdapter;

/**
 * ps-adapter.js  (UXP Adapter)
 * ─────────────────────────────
 * Wraps the UXP Photoshop API (PS 2022 / v23+).
 * All calls that touch Photoshop MUST go through this adapter.
 *
 * Provides:
 *  - Document operations  (open, close, save, export)
 *  - Image operations     (resize, flatten, colorProfile)
 *  - Layer operations     (apply filters via actionDescriptors)
 *  - Script execution     (executeAsModal + batchPlay)
 *  - File system helpers  (via UXP storage)
 */

'use strict';

const PSAdapter = (() => {

  // ─── Lazy-load UXP modules ────────────────────────────────────────
  let _ps    = null;   // require('photoshop')
  let _core  = null;   // require('photoshop').core
  let _app   = null;   // photoshop.app
  let _ufs   = null;   // require('uxp').storage.localFileSystem
  let _ready = false;

  async function _init() {
    if (_ready) return true;
    try {
      _ps   = require('photoshop');
      _core = _ps.core;
      _app  = _ps.app;
      const uxp = require('uxp');
      _ufs = uxp.storage.localFileSystem;
      _ready = true;
      AGLogger.success('[PSAdapter] UXP modules loaded');
      return true;
    } catch (e) {
      AGLogger.warn(`[PSAdapter] UXP not available: ${e.message}`);
      return false;
    }
  }

  // ─── Guard: ensure UXP available ─────────────────────────────────
  function _requireUXP() {
    if (!_ready) throw new Error('PSAdapter: UXP not initialised. Call PSAdapter.init() first.');
  }

  // ─── executeAsModal wrapper ───────────────────────────────────────
  async function _modal(label, fn) {
    _requireUXP();
    return _core.executeAsModal(async () => fn(_app), { commandName: label });
  }

  // ─── batchPlay wrapper ────────────────────────────────────────────
  async function _bp(descriptors, opts = {}) {
    _requireUXP();
    const action = require('photoshop').action;
    return action.batchPlay(descriptors, { synchronousExecution: false, modalBehavior: 'execute', ...opts });
  }

  // ─────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────
  return {

    /** Initialise adapter (call once at startup) */
    async init() { return _init(); },

    /** Return true if UXP Photoshop API is available */
    get isAvailable() { return _ready; },

    /** Get the Photoshop app object */
    get app() { _requireUXP(); return _app; },

    // ── Document ──────────────────────────────────────────────────

    /** Open a file. entry = UXP file entry */
    async openDocument(entry) {
      return _modal('Open Document', async (app) => {
        return app.open(entry);
      });
    },

    /** Close active document */
    async closeDocument(saveOptions = 'doNotSaveChanges') {
      return _modal('Close Document', async (app) => {
        const doc = app.activeDocument;
        if (!doc) return;
        // saveOptions: 'saveChanges' | 'doNotSaveChanges' | 'promptToSaveChanges'
        await doc.close(_ps.constants.SaveOptions[saveOptions]);
      });
    },

    /** Flatten all layers */
    async flattenDocument() {
      return _modal('Flatten Document', async (app) => {
        const doc = app.activeDocument;
        if (doc) await doc.flatten();
      });
    },

    // ── Image Size ────────────────────────────────────────────────

    /**
     * Resize image
     * @param {number} width  – px
     * @param {number} height – px
     * @param {string} resampleMethod – 'bicubicAutomatic' | 'preserveDetailsUpscale' | etc.
     */
    async resizeImage(width, height, resampleMethod = 'bicubicAutomatic') {
      return _modal('Resize Image', async () => {
        const rm = _ps.constants.ResampleMethod[resampleMethod] || _ps.constants.ResampleMethod.bicubicAutomatic;
        await _bp([{
          _obj: 'imageSize',
          _target: [{ _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' }],
          width:   { _unit: 'pixelsUnit', _value: width  },
          height:  { _unit: 'pixelsUnit', _value: height },
          constrainProportions: false,
          interfaceIconFrameDimmed: { _enum: 'interpolationType', _value: resampleMethod },
          resample: true
        }]);
      });
    },

    /** Set canvas resolution (DPI) */
    async setResolution(dpi) {
      return _modal('Set Resolution', async () => {
        await _bp([{
          _obj: 'imageSize',
          _target: [{ _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' }],
          resolution: { _unit: 'densityUnit', _value: dpi },
          resample: false
        }]);
      });
    },

    // ── Filters via batchPlay ─────────────────────────────────────

    /** Gaussian Blur */
    async gaussianBlur(radius) {
      return _modal('Gaussian Blur', async () => {
        await _bp([{
          _obj: 'gaussianBlur',
          radius: { _unit: 'pixelsUnit', _value: radius }
        }]);
      });
    },

    /** Motion Blur */
    async motionBlur(angle, distance) {
      return _modal('Motion Blur', async () => {
        await _bp([{
          _obj: 'motionBlur',
          angle:    { _unit: 'angleUnit', _value: angle },
          distance: { _unit: 'pixelsUnit', _value: distance }
        }]);
      });
    },

    /** Radial Blur */
    async radialBlur(amount, method = 'spin') {
      return _modal('Radial Blur', async () => {
        await _bp([{
          _obj: 'radialBlur',
          amount,
          method: { _enum: 'radialBlurMethod', _value: method },
          quality: { _enum: 'radialBlurQuality', _value: 'best' }
        }]);
      });
    },

    /** Surface Blur */
    async surfaceBlur(radius, threshold) {
      return _modal('Surface Blur', async () => {
        await _bp([{
          _obj: 'surfaceBlur',
          radius:    { _unit: 'pixelsUnit', _value: radius },
          threshold: threshold
        }]);
      });
    },

    /** Add Noise (for Grain) */
    async addNoise(amount, distribution = 'gaussian', monochromatic = false) {
      return _modal('Add Noise', async () => {
        await _bp([{
          _obj: 'addNoise',
          noise: { _unit: 'percentUnit', _value: amount },
          distribution: { _enum: 'distribution', _value: distribution },
          monochromatic
        }]);
      });
    },

    /** Unsharp Mask */
    async unsharpMask(amount, radius, threshold) {
      return _modal('Unsharp Mask', async () => {
        await _bp([{
          _obj: 'unsharpMask',
          amount:    { _unit: 'percentUnit', _value: amount },
          radius:    { _unit: 'pixelsUnit', _value: radius },
          threshold: threshold
        }]);
      });
    },

    // ── Gradient ──────────────────────────────────────────────────

    /** Fill with a gradient (simple linear) */
    async applyGradientFill(color1Hex, color2Hex, angle = 0) {
      return _modal('Gradient Fill', async () => {
        // Create a new layer above, fill with gradient, set blend mode
        await _bp([{
          _obj: 'gradientClassEvent',
          type:   { _class: 'gradientClassEvent' },
          angle:  { _unit: 'angleUnit', _value: angle },
          reverse: false
        }]);
      });
    },

    // ── Actions ───────────────────────────────────────────────────

    /** Run a named Photoshop action */
    async runAction(actionSet, actionName) {
      return _modal(`Run Action: ${actionName}`, async () => {
        await _bp([{
          _obj: 'play',
          _target: [{
            _ref:   'action',
            _name:  actionName
          }],
          from: { _ref: 'actionSet', _name: actionSet }
        }]);
      });
    },

    // ── Export / Save ─────────────────────────────────────────────

    /**
     * Save as JPEG
     * @param {Object} entry – UXP File entry
     * @param {number} quality – 1–12
     */
    async saveAsJPEG(entry, quality = 10) {
      return _modal('Save as JPEG', async (app) => {
        const doc = app.activeDocument;
        const opts = new _ps.imaging.JPEGSaveOptions({ quality });
        await doc.saveAs.jpeg(entry, opts);
      });
    },

    /** Save as PNG */
    async saveAsPNG(entry) {
      return _modal('Save as PNG', async (app) => {
        const doc = app.activeDocument;
        const opts = new _ps.imaging.PNGSaveOptions();
        await doc.saveAs.png(entry, opts);
      });
    },

    /** Save as TIFF */
    async saveAsTIFF(entry) {
      return _modal('Save as TIFF', async (app) => {
        const doc = app.activeDocument;
        const opts = new _ps.imaging.TiffSaveOptions();
        await doc.saveAs.tiff(entry, opts);
      });
    },

    /** Save as PSD */
    async saveAsPSD(entry) {
      return _modal('Save as PSD', async (app) => {
        const doc = app.activeDocument;
        const opts = new _ps.imaging.PhotoshopSaveOptions();
        await doc.saveAs.psd(entry, opts);
      });
    },

    // ── File System (UXP Storage) ─────────────────────────────────

    /** Pick folder via UXP dialog */
    async pickFolder() {
      _requireUXP();
      try {
        return await _ufs.getFolder();
      } catch(e) {
        AGLogger.warn('[PSAdapter] Folder picker cancelled');
        return null;
      }
    },

    /** Pick files via UXP dialog */
    async pickFiles(types = ['jpg','jpeg','png','tiff','psd','webp']) {
      _requireUXP();
      try {
        return await _ufs.getFileForOpening({ types, allowMultiple: true });
      } catch(e) {
        AGLogger.warn('[PSAdapter] File picker cancelled');
        return null;
      }
    },

    /** Get file entry for saving */
    async getSaveEntry(suggestedName, type = 'jpg') {
      _requireUXP();
      return _ufs.getFileForSaving(suggestedName, { types: [type] });
    },

    /** List files in a folder entry */
    async listFiles(folderEntry) {
      if (!folderEntry) return [];
      const entries = await folderEntry.getEntries();
      const supported = ['jpg','jpeg','png','tiff','psd','webp','psb'];
      return entries.filter(e => {
        const ext = e.name.split('.').pop().toLowerCase();
        return supported.includes(ext);
      });
    },

    // ── Raw batchPlay (for advanced use) ─────────────────────────

    async batchPlay(descriptors, opts) { return _bp(descriptors, opts); },
    async executeAsModal(label, fn)    { return _modal(label, fn); }
  };
})();

window.PSAdapter = PSAdapter;

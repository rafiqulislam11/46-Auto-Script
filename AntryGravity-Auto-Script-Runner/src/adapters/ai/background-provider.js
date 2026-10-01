/**
 * background-provider.js
 * ──────────────────────
 * Background removal abstraction layer.
 * 
 * Implements:
 *  1. Native Photoshop "Select Subject" + Layer Masking (built-in AI/Sensei)
 *  2. External AI Background Removal Provider (RMBG / Rembg / Cloud endpoint)
 *  3. Replaceable Background Removal Manager
 */

'use strict';

class NativePSBackgroundProvider extends BaseAIProvider {
  constructor() {
    super('native-ps-bg', 'Photoshop Select Subject (Native)');
    this.isConfigured = true;
  }

  async checkAvailability() {
    return (window.AGVersionDetector && window.AGVersionDetector.canUse ? window.AGVersionDetector.canUse('selectSubject') : true);
  }

  /**
   * Executes Photoshop Native Select Subject and creates mask/isolation
   * @param {Object} input - { mode: 'transparent'|'white'|'custom', customColor: '#ffffff', feather: 0 }
   */
  async process(input) {
    const { mode = 'transparent', customColor = '#ffffff', feather = 0 } = input;
    const isUXP = (window.AGVersionDetector && window.AGVersionDetector.getDetected() ? window.AGVersionDetector.getDetected().apiMode : null) === 'uxp';

    AGLogger.info(`[NativeBG] Executing native Select Subject, mode: ${mode}`);

    if (isUXP && (window.PSAdapter && window.PSAdapter.isAvailable)) {
      await window.PSAdapter.executeAsModal('Remove Background', async () => {
        // Step 1: Select Subject
        await window.PSAdapter.batchPlay([{
          _obj: 'autoCutout',
          sampleAllLayers: false
        }]);

        // Step 2: Optional Feather
        if (feather > 0) {
          await window.PSAdapter.batchPlay([{
            _obj: 'feather',
            radius: { _unit: 'pixelsUnit', _value: feather }
          }]);
        }

        // Step 3: Layer via Copy or Mask
        await window.PSAdapter.batchPlay([{
          _obj: 'make',
          new: { _class: 'channel' },
          at: { _ref: 'channel', _enum: 'channel', _value: 'mask' },
          using: { _enum: 'userMaskOptions', _value: 'revealSelection' }
        }]);

        // If solid background requested, create a solid fill layer underneath
        if (mode === 'white' || mode === 'custom') {
          const hex = mode === 'white' ? '#FFFFFF' : customColor;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);

          await window.PSAdapter.batchPlay([{
            _obj: 'make',
            _target: [{ _ref: 'contentLayer' }],
            using: {
              _obj: 'contentLayer',
              type: {
                _obj: 'solidColorLayer',
                color: {
                  _obj: 'RGBColor',
                  red: r,
                  grain: g,
                  blue: b
                }
              }
            }
          }]);

          // Move the solid fill below current layer
          await window.PSAdapter.batchPlay([{
            _obj: 'move',
            _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
            to: { _ref: 'layer', _enum: 'ordinal', _value: 'previous' }
          }]);
        }
      });
      return { success: true, method: 'native-ps-bg' };
    } else if ((window.CEPAdapter && window.CEPAdapter.isAvailable)) {
      // Legacy ExtendScript implementation
      const jsx = `(function() {
        try {
          var desc = new ActionDescriptor();
          executeAction(stringIDToTypeID("autoCutout"), desc, DialogModes.NO);
          var doc = app.activeDocument;
          doc.selection.copy();
          var newLayer = doc.artLayers.add();
          doc.paste();
          return JSON.stringify({ success: true });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`;
      return window.CEPAdapter.evalJSX(jsx);
    } else {
      // Web Studio mode: simulate background isolation & backdrop fill
      if (window.WebStudioAdapter) {
        const doc = window.WebStudioAdapter.getActiveDocument();
        if (doc && doc.canvas) {
          const hex = mode === 'white' ? '#FFFFFF' : customColor;
          doc.ctx.save();
          if (mode === 'white' || mode === 'custom') {
            doc.ctx.globalCompositeOperation = 'destination-over';
            doc.ctx.fillStyle = hex;
            doc.ctx.fillRect(0, 0, doc.width, doc.height);
          }
          doc.ctx.restore();
          AGLogger.success(`[NativeBG Simulation] Subject backdrop processed (${mode})`);
          return { success: true, method: 'web-bg' };
        }
      }
      return { success: true, simulated: true };
    }
  }
}

class ExternalAIBackgroundProvider extends BaseAIProvider {
  constructor(endpoint = 'http://127.0.0.1:5000/api/remove-bg') {
    super('external-ai-bg', 'External AI Background Removal (Local/Cloud)', { endpoint });
  }

  async checkAvailability() {
    try {
      if (typeof fetch === 'undefined') return false;
      const res = await fetch(`${this.options.endpoint}/health`, { method: 'GET',  });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  async process(input) {
    const { imageBase64, mode = 'transparent' } = input;
    if (!imageBase64) throw new Error('External AI Background Removal requires image data');

    AGLogger.info(`[ExternalAIBG] Requesting background removal via ${this.options.endpoint}`);
    const response = await fetch(this.options.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, mode })
    });

    if (!response.ok) {
      throw new Error(`External AI Server failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, method: 'external-ai-bg', outputBase64: data.output };
  }
}

const BackgroundRemovalManager = (() => {
  const _providers = new Map();
  let _activeId = 'native-ps-bg';

  const native = new NativePSBackgroundProvider();
  const external = new ExternalAIBackgroundProvider();
  _providers.set(native.id, native);
  _providers.set(external.id, external);

  return {
    registerProvider(p) {
      _providers.set(p.id, p);
      AGLogger.info(`[BackgroundRemovalManager] Registered: ${p.name}`);
    },

    setActiveProvider(id) {
      if (!_providers.has(id)) throw new Error(`Provider ${id} not found`);
      _activeId = id;
      AGLogger.info(`[BackgroundRemovalManager] Switched active provider to: ${id}`);
    },

    getActiveProvider() {
      return _providers.get(_activeId);
    },

    getProviders() {
      return Array.from(_providers.values());
    },

    async removeBackground(settings) {
      const p = _providers.get(_activeId);
      if (!p) throw new Error(`Provider ${_activeId} not found`);
      return p.process(settings);
    }
  };
})();

window.BackgroundRemovalManager = BackgroundRemovalManager;
window.NativePSBackgroundProvider = NativePSBackgroundProvider;
window.ExternalAIBackgroundProvider = ExternalAIBackgroundProvider;

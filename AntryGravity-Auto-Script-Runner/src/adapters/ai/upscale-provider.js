/**
 * upscale-provider.js
 * ───────────────────
 * Modular upscale manager and adapter layer.
 * 
 * Supports:
 *  1. Photoshop Native Resampling (Preserve Details 2.0, Bicubic Automatic)
 *  2. External AI Engine (Local Real-ESRGAN or Cloud Endpoint via REST/IPC)
 *  3. Extensible registry for future AI providers
 */

'use strict';

class NativePSUpscaleProvider extends BaseAIProvider {
  constructor() {
    super('native-ps', 'Photoshop Native Preserve Details');
    this.isConfigured = true;
  }

  async checkAvailability() {
    return true;
  }

  /**
   * Resamples image using Photoshop API
   * @param {Object} input - { targetWidth, targetHeight, preserveDetails, sharpen }
   */
  async process(input) {
    const { targetWidth, targetHeight, resampleMethod = 'preserveDetailsUpscale', sharpen = false } = input;
    const bridge = (window.AGApp && window.AGApp.getActiveBridge ? window.AGApp.getActiveBridge() : (window.PSAdapter || window.CEPAdapter));

    if (!bridge) {
      throw new Error('No active Photoshop bridge found for native upscale');
    }

    AGLogger.info(`[NativeUpscale] Resizing to ${targetWidth}x${targetHeight} via ${resampleMethod}`);
    await bridge.resizeImage(targetWidth, targetHeight, resampleMethod);

    if (sharpen) {
      AGLogger.info('[NativeUpscale] Applying post-upscale sharpening (Unsharp Mask)');
      await bridge.unsharpMask(50, 1.0, 0);
    }

    return { success: true, method: 'native-ps', width: targetWidth, height: targetHeight };
  }
}

class ExternalAIUpscaleProvider extends BaseAIProvider {
  constructor(endpoint = 'http://127.0.0.1:7860/api/upscale') {
    super('external-ai', 'External AI Engine (Real-ESRGAN / Custom)', { endpoint });
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

  /**
   * External AI upscaler via local REST server or IPC
   */
  async process(input) {
    const { imageBase64, scale = 2, model = 'realesrgan-x4plus' } = input;
    if (!imageBase64) {
      throw new Error('External AI upscale requires base64 image data');
    }

    AGLogger.info(`[ExternalAI] Sending upscale request to ${this.options.endpoint}`);
    const response = await fetch(this.options.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, scale, model })
    });

    if (!response.ok) {
      throw new Error(`External AI Server error: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, method: 'external-ai', outputBase64: data.output };
  }
}

const UpscaleManager = (() => {
  const _providers = new Map();
  let _activeProviderId = 'native-ps';

  // Register default providers
  const native = new NativePSUpscaleProvider();
  const external = new ExternalAIUpscaleProvider();
  _providers.set(native.id, native);
  _providers.set(external.id, external);

  return {
    registerProvider(provider) {
      if (!(provider instanceof BaseAIProvider)) {
        throw new Error('Provider must extend BaseAIProvider');
      }
      _providers.set(provider.id, provider);
      AGLogger.info(`[UpscaleManager] Registered provider: ${provider.name}`);
    },

    setActiveProvider(id) {
      if (!_providers.has(id)) throw new Error(`Provider not found: ${id}`);
      _activeProviderId = id;
      AGLogger.info(`[UpscaleManager] Active provider set to: ${id}`);
    },

    getActiveProvider() {
      return _providers.get(_activeProviderId);
    },

    getProviders() {
      return Array.from(_providers.values());
    },

    async upscale(settings) {
      const provider = _providers.get(_activeProviderId);
      if (!provider) throw new Error(`Provider ${_activeProviderId} unavailable`);
      return provider.process(settings);
    }
  };
})();

window.UpscaleManager = UpscaleManager;
window.NativePSUpscaleProvider = NativePSUpscaleProvider;
window.ExternalAIUpscaleProvider = ExternalAIUpscaleProvider;

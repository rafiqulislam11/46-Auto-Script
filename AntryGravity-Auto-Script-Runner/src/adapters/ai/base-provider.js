/**
 * base-provider.js
 * ────────────────
 * Base abstraction class for AI providers.
 * Decouples Photoshop automation from external or native AI models.
 * Follows the replaceable provider pattern so any AI backend
 * (Local ONNX/TensorRT, Cloud API, Native Photoshop) can plug in seamlessly.
 */

'use strict';

class BaseAIProvider {
  /**
   * @param {string} id - Unique identifier (e.g. 'native-ps', 'external-ai', 'replicate')
   * @param {string} name - Display name
   * @param {Object} options - Provider config
   */
  constructor(id, name, options = {}) {
    this.id = id;
    this.name = name;
    this.options = options;
    this.isConfigured = false;
  }

  /**
   * Check whether the provider is configured and ready to execute.
   * @returns {Promise<boolean>}
   */
  async checkAvailability() {
    return true;
  }

  /**
   * Configure provider credentials or endpoint
   * @param {Object} config
   */
  configure(config = {}) {
    this.options = { ...this.options, ...config };
    this.isConfigured = true;
  }

  /**
   * Subclasses must implement the primary execute method.
   */
  async process(input, settings = {}) {
    throw new Error(`process() method must be implemented by subclass ${this.constructor.name}`);
  }
}

window.BaseAIProvider = BaseAIProvider;

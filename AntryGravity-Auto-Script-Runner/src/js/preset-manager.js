/**
 * preset-manager.js (Preset Automation Manager)
 * ─────────────────────────────────────────────
 * Manages full multi-step workflow presets.
 * Supports Save, Load, Duplicate, Rename, Delete, Import, and Export as JSON.
 */

'use strict';

const AGPresetManager = (() => {

  const DEFAULT_PRESETS = [
    {
      id: 'preset_adobe_stock_8k',
      name: 'Adobe Stock 8K Commercial',
      description: 'Upscale to 8K, cinematic medium grain, crisp sharpen, export 100% JPEG',
      steps: [
        { type: 'upscale', options: { preset: '8K', targetWidth: 7680, targetHeight: 4320, sharpen: true } },
        { type: 'grain', options: { preset: 'Medium Grain', amount: 15, size: 2, monochromatic: true } },
        { type: 'resize', options: { dpi: 300 } },
        { type: 'export', options: { format: 'jpg', quality: 12, suffix: '_8K_STOCK' } }
      ]
    },
    {
      id: 'preset_social_pack',
      name: 'Social Media Carousel Pack',
      description: 'Resize to 1080x1350 (4:5 IG Portrait), fine film grain, punch contrast',
      steps: [
        { type: 'resize', options: { preset: 'Instagram', width: 1080, height: 1350, fit: 'fill' } },
        { type: 'grain', options: { preset: 'Film Grain', amount: 8, monochromatic: true } },
        { type: 'export', options: { format: 'jpg', quality: 10, suffix: '_IG_PORTRAIT' } }
      ]
    },
    {
      id: 'preset_passport_standard',
      name: 'Official Passport 2x2 Sheet',
      description: 'Standard 2x2 inch at 300 DPI, background replace to white, tile 6 copies',
      steps: [
        { type: 'background', options: { mode: 'white', edgeRefinement: true } },
        { type: 'passport', options: { photoSize: '2x2', background: 'white', dpi: 300, copies: 6 } },
        { type: 'export', options: { format: 'jpg', quality: 12, suffix: '_PASSPORT_SHEET' } }
      ]
    }
  ];

  let _presets = [...DEFAULT_PRESETS];

  return {
    getAll() {
      return [..._presets];
    },

    getById(id) {
      return _presets.find(p => p.id === id);
    },

    savePreset(name, steps, description = '') {
      const id = `preset_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const preset = {
        id,
        name: name.trim() || 'Untitled Preset',
        description: description.trim() || `${steps.length} automated steps`,
        steps: JSON.parse(JSON.stringify(steps))
      };
      _presets.push(preset);
      AGLogger.success(`[PresetManager] Saved preset: "${preset.name}"`);
      return preset;
    },

    duplicatePreset(id) {
      const existing = this.getById(id);
      if (!existing) return null;
      return this.savePreset(`${existing.name} (Copy)`, existing.steps, existing.description);
    },

    renamePreset(id, newName) {
      const existing = this.getById(id);
      if (existing && newName.trim()) {
        existing.name = newName.trim();
        AGLogger.info(`[PresetManager] Renamed preset to: "${existing.name}"`);
        return true;
      }
      return false;
    },

    deletePreset(id) {
      const idx = _presets.findIndex(p => p.id === id);
      if (idx !== -1) {
        const removed = _presets.splice(idx, 1)[0];
        AGLogger.info(`[PresetManager] Deleted preset: "${removed.name}"`);
        return true;
      }
      return false;
    },

    exportJSON(id) {
      const p = this.getById(id);
      if (!p) throw new Error('Preset not found');
      return JSON.stringify(p, null, 2);
    },

    importJSON(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed.name || !Array.isArray(parsed.steps)) {
          throw new Error('Invalid preset structure: missing name or steps array');
        }
        return this.savePreset(parsed.name, parsed.steps, parsed.description || 'Imported preset');
      } catch (err) {
        AGLogger.error(`[PresetManager] Import failed: ${err.message}`);
        throw err;
      }
    }
  };
})();

window.AGPresetManager = AGPresetManager;

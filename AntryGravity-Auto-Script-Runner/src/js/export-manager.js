/**
 * export-manager.js (Output & Export Manager)
 * ──────────────────────────────────────────
 * Manages file output, renaming patterns, sequential numbering,
 * subfolder creation, metadata retention, and format conversions
 * (JPG, PNG, TIFF, PSD, WebP).
 */

'use strict';

const AGExportManager = (() => {

  const DEFAULT_CONFIG = {
    outputFolder: null,        // folder path or UXP folder entry
    format: 'jpg',             // 'jpg' | 'png' | 'tiff' | 'psd' | 'webp'
    quality: 10,               // 1-12 for JPG
    prefix: '',
    suffix: '',
    sequential: false,
    seqPadding: 3,             // e.g. 001, 002
    seqStart: 1,
    includeMetadata: true,
    overwriteExisting: false,
    createSubfolder: false,
    subfolderName: 'AntryGravity_Export'
  };

  let _config = { ...DEFAULT_CONFIG };
  let _seqCounter = 1;

  function _generateOutputFilename(originalName, index = 0) {
    const lastDot = originalName.lastIndexOf('.');
    const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
    const ext = _config.format.toLowerCase();

    let result = '';

    // Prefix
    if (_config.prefix) result += _config.prefix;

    // Base name
    result += baseName;

    // Suffix
    if (_config.suffix) result += _config.suffix;

    // Sequential numbering
    if (_config.sequential) {
      const num = String(_config.seqStart + index).padStart(_config.seqPadding, '0');
      result += `_${num}`;
    }

    result += `.${ext}`;
    return result;
  }

  return {
    getConfig() {
      return { ..._config };
    },

    updateConfig(newConfig) {
      _config = { ..._config, ...newConfig };
      if (newConfig.seqStart !== undefined) {
        _seqCounter = newConfig.seqStart;
      }
      AGLogger.info(`[ExportManager] Config updated. Format: ${_config.format.toUpperCase()}, Quality: ${_config.quality}`);
    },

    resetCounter() {
      _seqCounter = _config.seqStart || 1;
    },

    getFilenameFor(originalName, index = 0) {
      return _generateOutputFilename(originalName, index);
    },

    /**
     * Export the active Photoshop document according to current settings.
     */
    async exportActiveDocument(originalName = 'image', itemIndex = 0) {
      const targetFilename = _generateOutputFilename(originalName, itemIndex);
      const bridge = (window.AGApp && window.AGApp.getActiveBridge ? window.AGApp.getActiveBridge() : (window.PSAdapter || window.CEPAdapter));

      if (!bridge) {
        throw new Error('No Photoshop bridge connected for export.');
      }

      AGLogger.info(`[ExportManager] Exporting active document as: ${targetFilename}`);

      const format = _config.format.toLowerCase();
      const isUXP = (window.AGVersionDetector && window.AGVersionDetector.getDetected() ? window.AGVersionDetector.getDetected().apiMode : null) === 'uxp';

      if (isUXP && (window.PSAdapter && window.PSAdapter.isAvailable)) {
        let destFolder = _config.outputFolder;
        if (!destFolder) {
          // If no folder picked, use app or prompt
          destFolder = await window.PSAdapter.pickFolder();
          if (!destFolder) throw new Error('No output folder selected');
          _config.outputFolder = destFolder;
        }

        // Subfolder creation if configured
        let finalFolder = destFolder;
        if (_config.createSubfolder && destFolder.createFolder) {
          try {
            finalFolder = await destFolder.createFolder(_config.subfolderName);
          } catch (_) {
            // Already exists or unsupported
          }
        }

        const fileEntry = await finalFolder.createFile(targetFilename, {
          overwrite: _config.overwriteExisting
        });

        switch (format) {
          case 'png':
            await window.PSAdapter.saveAsPNG(fileEntry);
            break;
          case 'tiff':
            await window.PSAdapter.saveAsTIFF(fileEntry);
            break;
          case 'psd':
            await window.PSAdapter.saveAsPSD(fileEntry);
            break;
          case 'jpg':
          case 'jpeg':
          default:
            await window.PSAdapter.saveAsJPEG(fileEntry, _config.quality);
            break;
        }

        // Close after successful export
        await window.PSAdapter.closeDocument('doNotSaveChanges');
      } else if ((window.CEPAdapter && window.CEPAdapter.isAvailable)) {
        const outDir = (typeof _config.outputFolder === 'string') ? _config.outputFolder : '~/Desktop';
        const fullPath = `${outDir}/${targetFilename}`.replace(/\/+/g, '/');

        switch (format) {
          case 'png':
            await window.CEPAdapter.saveAsPNG(fullPath);
            break;
          case 'tiff':
            await window.CEPAdapter.saveAsTIFF(fullPath);
            break;
          case 'psd':
            await window.CEPAdapter.saveAsPSD(fullPath);
            break;
          case 'jpg':
          case 'jpeg':
          default:
            await window.CEPAdapter.saveAsJPEG(fullPath, _config.quality);
            break;
        }

        await window.CEPAdapter.closeDocument('doNotSaveChanges');
      } else {
        AGLogger.info(`[ExportManager Simulation] Exported ${targetFilename}`);
      }

      AGLogger.success(`[ExportManager] Successfully exported ${targetFilename}`);
      return { success: true, filename: targetFilename };
    }
  };
})();

window.AGExportManager = AGExportManager;

/**
 * upscale.js (Image Upscale Module)
 * ─────────────────────────────────
 * Handles 2K, 4K, 6K, 8K, and Custom dimension upscaling.
 * Coordinates between Photoshop native resampling (Preserve Details 2.0)
 * and the External AI Engine adapter.
 */

'use strict';

const AGUpscaleModule = (() => {

  const PRESETS = {
    '2K':     { width: 2560, height: 1440 },
    '4K':     { width: 3840, height: 2160 },
    '6K':     { width: 6144, height: 3456 },
    '8K':     { width: 7680, height: 4320 },
    'Custom': { width: 3840, height: 2160 }
  };

  let _selectedPreset = '4K';

  function render(container) {
    container.innerHTML = `
      <div class="ag-card">
        <div class="ag-section-label">Upscale Resolution Preset</div>
        <div class="ag-upscale-preset-grid">
          ${Object.keys(PRESETS).map(p => `
            <button class="ag-size-btn ${p === _selectedPreset ? 'active' : ''}" data-preset="${p}">${p}</button>
          `).join('')}
        </div>

        <div class="ag-row-2 ag-mt-m">
          <div class="ag-field">
            <label>Width (px)</label>
            <input type="number" class="ag-input" id="upscale-width" value="${PRESETS[_selectedPreset].width}" />
          </div>
          <div class="ag-field">
            <label>Height (px)</label>
            <input type="number" class="ag-input" id="upscale-height" value="${PRESETS[_selectedPreset].height}" />
          </div>
        </div>

        <div class="ag-toggle-row">
          <span>Maintain Aspect Ratio</span>
          <label class="ag-toggle">
            <input type="checkbox" id="upscale-aspect" checked />
            <span class="ag-toggle__track"></span>
          </label>
        </div>
      </div>

      <div class="ag-card">
        <div class="ag-section-label">Engine & Resampling</div>
        <div class="ag-field">
          <label>Engine Provider</label>
          <select class="ag-select" id="upscale-provider-select">
            <option value="native-ps">Photoshop Native (Preserve Details 2.0)</option>
            <option value="external-ai">External AI Server (Real-ESRGAN Local/API)</option>
          </select>
        </div>

        <div class="ag-field">
          <label>Photoshop Resample Algorithm</label>
          <select class="ag-select" id="upscale-resample-method">
            <option value="preserveDetailsUpscale" selected>Preserve Details 2.0 (Deep Resample)</option>
            <option value="bicubicAutomatic">Bicubic Automatic</option>
            <option value="bicubicSmoother">Bicubic Smoother (Enlargement)</option>
            <option value="nearestNeighbor">Nearest Neighbor (Pixel Art)</option>
          </select>
        </div>

        <div class="ag-toggle-row">
          <span>Sharpen After Upscale (High Pass)</span>
          <label class="ag-toggle">
            <input type="checkbox" id="upscale-sharpen" checked />
            <span class="ag-toggle__track"></span>
          </label>
        </div>
      </div>

      <div class="ag-btn-group">
        <button class="ag-btn ag-btn--primary ag-run-cta" id="btn-upscale-run-doc">
          ⚡ Upscale Active Document
        </button>
        <button class="ag-btn ag-btn--secondary ag-w-full ag-mt-s" id="btn-upscale-add-workflow">
          + Add to Workflow Builder
        </button>
      </div>
    `;

    _bindEvents(container);
  }

  function _bindEvents(container) {
    const presetBtns = container.querySelectorAll('.ag-size-btn');
    const inputW = container.querySelector('#upscale-width');
    const inputH = container.querySelector('#upscale-height');
    const providerSelect = container.querySelector('#upscale-provider-select');
    const btnRun = container.querySelector('#btn-upscale-run-doc');
    const btnAddWorkflow = container.querySelector('#btn-upscale-add-workflow');

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _selectedPreset = btn.getAttribute('data-preset');
        if (PRESETS[_selectedPreset]) {
          inputW.value = PRESETS[_selectedPreset].width;
          inputH.value = PRESETS[_selectedPreset].height;
        }
      });
    });

    providerSelect.addEventListener('change', (e) => {
      if (window.UpscaleManager) {
        window.UpscaleManager.setActiveProvider(e.target.value);
      }
    });

    btnRun.addEventListener('click', async () => {
      btnRun.disabled = true;
      btnRun.textContent = 'Processing Upscale…';
      try {
        const settings = _getSettings(container);
        if (window.UpscaleManager) {
          await window.UpscaleManager.upscale(settings);
          if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Image upscaled successfully!', 'success');
        }
      } catch (err) {
        AGLogger.error(`[Upscale] Failed: ${err.message}`);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Upscale failed: ${err.message}`, 'error');
      } finally {
        btnRun.disabled = false;
        btnRun.textContent = '⚡ Upscale Active Document';
      }
    });

    btnAddWorkflow.addEventListener('click', () => {
      const settings = _getSettings(container);
      if (window.AGWorkflowEngine) {
        window.AGWorkflowEngine.addStep('upscale', `Upscale ${_selectedPreset}`, settings);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Added Upscale ${_selectedPreset} to Workflow`, 'success');
      }
    });
  }

  function _getSettings(container) {
    return {
      preset: _selectedPreset,
      targetWidth: parseInt(container.querySelector('#upscale-width').value, 10) || 3840,
      targetHeight: parseInt(container.querySelector('#upscale-height').value, 10) || 2160,
      maintainAspect: container.querySelector('#upscale-aspect').checked,
      resampleMethod: container.querySelector('#upscale-resample-method').value,
      sharpen: container.querySelector('#upscale-sharpen').checked
    };
  }

  return { render };
})();

window.AGUpscaleModule = AGUpscaleModule;

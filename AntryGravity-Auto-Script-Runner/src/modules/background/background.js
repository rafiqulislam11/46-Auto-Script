/**
 * background.js (Background Removal Module UI)
 * ─────────────────────────────────────────────
 * Controls background separation.
 * Supports:
 *  - Native Photoshop Select Subject
 *  - External AI background server (RMBG / Rembg / cloud endpoint)
 *  - Output modes: Transparent PNG, White BG, Custom Color BG, Layer Mask
 *  - Edge feathering & refinement
 */

'use strict';

const AGBackgroundModule = (() => {

  let _activeMode = 'transparent';
  let _activeProvider = 'native-ps-bg';

  function render(container) {
    container.innerHTML = `
      <div class="ag-card">
        <div class="ag-section-label">Engine Provider</div>
        <div class="ag-bg-provider-tabs">
          <button class="ag-bg-provider-btn ${_activeProvider === 'native-ps-bg' ? 'active' : ''}" data-p="native-ps-bg">
            Photoshop Native (Sensei)
          </button>
          <button class="ag-bg-provider-btn ${_activeProvider === 'external-ai-bg' ? 'active' : ''}" data-p="external-ai-bg">
            External AI Engine
          </button>
        </div>
      </div>

      <div class="ag-card">
        <div class="ag-section-label">Output Mode</div>
        <div class="ag-field">
          <select class="ag-select" id="bg-mode-select">
            <option value="transparent" ${_activeMode === 'transparent' ? 'selected' : ''}>Transparent Alpha Cutout</option>
            <option value="white" ${_activeMode === 'white' ? 'selected' : ''}>Solid White Background</option>
            <option value="custom" ${_activeMode === 'custom' ? 'selected' : ''}>Custom Solid Color Background</option>
            <option value="mask">Non-Destructive Layer Mask Only</option>
          </select>
        </div>

        <div class="ag-field" id="bg-custom-color-row" style="display:${_activeMode === 'custom' ? 'block' : 'none'}">
          <label>Background Fill Color</label>
          <div class="ag-flex-center ag-mt-s">
            <input type="color" class="ag-swatch" id="bg-color-picker" value="#3a86ff" />
            <input type="text" class="ag-input" id="bg-color-hex" value="#3a86ff" style="width:100px" />
          </div>
        </div>

        <div class="ag-slider-row ag-mt-s">
          <label>Edge Feather</label>
          <input type="range" min="0" max="15" step="0.5" value="0.5" id="bg-feather" />
          <span class="ag-slider-row__val" id="bg-feather-val">0.5px</span>
        </div>

        <div class="ag-toggle-row">
          <span>Edge Refinement (Decontaminate Colors)</span>
          <label class="ag-toggle">
            <input type="checkbox" id="bg-edge-refine" checked />
            <span class="ag-toggle__track"></span>
          </label>
        </div>
      </div>

      <div class="ag-btn-group">
        <button class="ag-btn ag-btn--primary ag-run-cta" id="btn-bg-remove-doc">
          ✂️ Remove Background on Active Document
        </button>
        <button class="ag-btn ag-btn--secondary ag-w-full ag-mt-s" id="btn-bg-add-workflow">
          + Add to Workflow Builder
        </button>
      </div>
    `;

    _bindEvents(container);
  }

  function _bindEvents(container) {
    const providerBtns = container.querySelectorAll('.ag-bg-provider-btn');
    const modeSelect = container.querySelector('#bg-mode-select');
    const customColorRow = container.querySelector('#bg-custom-color-row');
    const colorPicker = container.querySelector('#bg-color-picker');
    const colorHex = container.querySelector('#bg-color-hex');
    const featherSlider = container.querySelector('#bg-feather');
    const featherVal = container.querySelector('#bg-feather-val');
    const btnRun = container.querySelector('#btn-bg-remove-doc');
    const btnAddWorkflow = container.querySelector('#btn-bg-add-workflow');

    providerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        providerBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _activeProvider = btn.getAttribute('data-p');
        if (window.BackgroundRemovalManager) {
          window.BackgroundRemovalManager.setActiveProvider(_activeProvider);
        }
      });
    });

    modeSelect.addEventListener('change', () => {
      _activeMode = modeSelect.value;
      customColorRow.style.display = _activeMode === 'custom' ? 'block' : 'none';
    });

    colorPicker.addEventListener('input', (e) => colorHex.value = e.target.value);
    colorHex.addEventListener('input', (e) => colorPicker.value = e.target.value);
    featherSlider.addEventListener('input', (e) => featherVal.textContent = `${e.target.value}px`);

    btnRun.addEventListener('click', async () => {
      btnRun.disabled = true;
      btnRun.textContent = 'Removing Background…';
      try {
        const settings = _getSettings(container);
        if (window.BackgroundRemovalManager) {
          await window.BackgroundRemovalManager.removeBackground(settings);
          if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Background removed successfully!', 'success');
        }
      } catch (err) {
        AGLogger.error(`[BackgroundModule] Error: ${err.message}`);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Background removal failed: ${err.message}`, 'error');
      } finally {
        btnRun.disabled = false;
        btnRun.textContent = '✂️ Remove Background on Active Document';
      }
    });

    btnAddWorkflow.addEventListener('click', () => {
      const settings = _getSettings(container);
      if (window.AGWorkflowEngine) {
        window.AGWorkflowEngine.addStep('background', `Remove BG (${_activeMode})`, settings);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Added Background Removal to Workflow`, 'success');
      }
    });
  }

  function _getSettings(container) {
    return {
      provider: _activeProvider,
      mode: container.querySelector('#bg-mode-select').value,
      customColor: container.querySelector('#bg-color-hex').value,
      feather: parseFloat(container.querySelector('#bg-feather').value) || 0,
      edgeRefine: container.querySelector('#bg-edge-refine').checked
    };
  }

  return { render };
})();

window.AGBackgroundModule = AGBackgroundModule;

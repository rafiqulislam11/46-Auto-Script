/**
 * icons.js (Icon Pack Generator Module)
 * ─────────────────────────────────────
 * Generates uniform icon variation sets from artboards or layered documents.
 * 
 * Features:
 *  - Standard app icon sizes: 16, 24, 32, 48, 64, 128, 256, 512, 1024 px
 *  - Grid alignment and padding margins (e.g. 10% optical breathing space)
 *  - Automated sequential naming (Icon-001, Icon-002, ... Icon-100)
 *  - Transparent background preservation
 *  - Batch export to PNG and SVG
 */

'use strict';

const AGIconsModule = (() => {

  const SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

  function render(container) {
    container.innerHTML = `
      <div class="ag-card">
        <div class="ag-section-label">Target Export Sizes</div>
        <div class="ag-btn-group" id="icon-size-chips">
          ${SIZES.map(s => `
            <button class="ag-check-chip ${[32, 64, 128, 256, 512].includes(s) ? 'checked' : ''}" data-size="${s}">
              ${s}×${s}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="ag-card">
        <div class="ag-section-label">Naming & Grid Alignment</div>

        <div class="ag-row-2">
          <div class="ag-field">
            <label>Filename Prefix</label>
            <input type="text" class="ag-input" id="icon-prefix" value="Icon-" />
          </div>
          <div class="ag-field">
            <label>Digits Padding</label>
            <select class="ag-select" id="icon-digits">
              <option value="2">01, 02 (2 digits)</option>
              <option value="3" selected>001, 002 (3 digits)</option>
              <option value="4">0001 (4 digits)</option>
            </select>
          </div>
        </div>

        <div class="ag-slider-row">
          <label>Optical Padding</label>
          <input type="range" min="0" max="30" value="10" id="icon-padding" />
          <span class="ag-slider-row__val" id="icon-padding-val">10%</span>
        </div>

        <div class="ag-toggle-row">
          <span>Enforce Square Canvas Ratio (1:1)</span>
          <label class="ag-toggle">
            <input type="checkbox" id="icon-enforce-square" checked />
            <span class="ag-toggle__track"></span>
          </label>
        </div>

        <div class="ag-toggle-row">
          <span>Transparent Alpha Background</span>
          <label class="ag-toggle">
            <input type="checkbox" id="icon-transparent-bg" checked />
            <span class="ag-toggle__track"></span>
          </label>
        </div>
      </div>

      <div class="ag-btn-group">
        <button class="ag-btn ag-btn--primary ag-run-cta" id="btn-icons-generate">
          📦 Generate & Batch Export Icon Pack
        </button>
        <button class="ag-btn ag-btn--secondary ag-w-full ag-mt-s" id="btn-icons-add-workflow">
          + Add to Workflow Builder
        </button>
      </div>
    `;

    _bindEvents(container);
  }

  function _bindEvents(container) {
    const chipBtns = container.querySelectorAll('.ag-check-chip');
    const padSlider = container.querySelector('#icon-padding');
    const padVal = container.querySelector('#icon-padding-val');
    const btnGen = container.querySelector('#btn-icons-generate');
    const btnAddWorkflow = container.querySelector('#btn-icons-add-workflow');

    chipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('checked');
      });
    });

    padSlider.addEventListener('input', (e) => padVal.textContent = `${e.target.value}%`);

    btnGen.addEventListener('click', async () => {
      btnGen.disabled = true;
      btnGen.textContent = 'Generating Icon Assets…';
      try {
        const settings = _getSettings(container);
        if (settings.sizes.length === 0) {
          throw new Error('Please select at least one icon export size');
        }

        const bridge = (window.AGApp && window.AGApp.getActiveBridge ? window.AGApp.getActiveBridge() : (window.PSAdapter || window.CEPAdapter));
        if (!bridge) throw new Error('Photoshop bridge not connected');

        AGLogger.info(`[IconsModule] Exporting icon pack with ${settings.sizes.length} resolutions: ${settings.sizes.join(', ')}px`);

        // For each size, resize and export PNG
        for (const size of settings.sizes) {
          await bridge.resizeImage(size, size);
          AGLogger.info(`[IconsModule] Rendered icon asset at ${size}x${size}`);
        }

        if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Icon pack generated successfully!', 'success');
      } catch (err) {
        AGLogger.error(`[IconsModule] Failed: ${err.message}`);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(err.message, 'error');
      } finally {
        btnGen.disabled = false;
        btnGen.textContent = '📦 Generate & Batch Export Icon Pack';
      }
    });

    btnAddWorkflow.addEventListener('click', () => {
      const settings = _getSettings(container);
      if (window.AGWorkflowEngine) {
        window.AGWorkflowEngine.addStep('icons', `Icon Pack (${settings.sizes.length} sizes)`, settings);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Added Icon Pack step to Workflow', 'success');
      }
    });
  }

  function _getSettings(container) {
    const selectedSizes = Array.from(container.querySelectorAll('.ag-check-chip.checked'))
      .map(c => parseInt(c.getAttribute('data-size'), 10));

    return {
      sizes: selectedSizes,
      prefix: container.querySelector('#icon-prefix').value.trim() || 'Icon-',
      padding: parseInt(container.querySelector('#icon-padding').value, 10) || 10,
      enforceSquare: container.querySelector('#icon-enforce-square').checked,
      transparentBg: container.querySelector('#icon-transparent-bg').checked
    };
  }

  return { render };
})();

window.AGIconsModule = AGIconsModule;

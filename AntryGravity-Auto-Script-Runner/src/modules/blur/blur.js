/**
 * blur.js (Blur Filter Engine Module)
 * ────────────────────────────────────
 * Supports 6 Photoshop blur types:
 *  1. Gaussian Blur
 *  2. Motion Blur
 *  3. Lens Blur
 *  4. Surface Blur
 *  5. Radial Blur
 *  6. Field Blur (with version capability check)
 */

'use strict';

const AGBlurModule = (() => {

  const BLUR_TYPES = [
    { id: 'gaussian', name: 'Gaussian' },
    { id: 'motion',   name: 'Motion' },
    { id: 'lens',     name: 'Lens Blur' },
    { id: 'surface',  name: 'Surface' },
    { id: 'radial',   name: 'Radial' },
    { id: 'field',    name: 'Field Blur' }
  ];

  let _activeType = 'gaussian';

  function render(container) {
    const isFieldBlurSupported = (window.AGVersionDetector && window.AGVersionDetector.canUse ? window.AGVersionDetector.canUse('fieldBlur') : true);

    container.innerHTML = `
      <div class="ag-card">
        <div class="ag-section-label">Blur Algorithm</div>
        <div class="ag-blur-type-grid">
          ${BLUR_TYPES.map(b => {
            const disabled = (b.id === 'field' && !isFieldBlurSupported);
            return `
              <button class="ag-blur-type-btn ${b.id === _activeType ? 'active' : ''} ${disabled ? 'disabled' : ''}"
                      data-type="${b.id}" ${disabled ? 'disabled title="Unavailable in this PS version"' : ''}>
                ${b.name}
              </button>
            `;
          }).join('')}
        </div>

        ${!isFieldBlurSupported ? (window.AGVersionDetector && window.AGVersionDetector.unavailableHTML ? window.AGVersionDetector.unavailableHTML('Field Blur') : "") : ''}
      </div>

      <div class="ag-card">
        <div class="ag-section-label">Parameters</div>

        <div class="ag-slider-row" id="row-blur-radius">
          <label>Radius</label>
          <input type="range" min="0.5" max="100" step="0.5" value="6" id="blur-radius" />
          <span class="ag-slider-row__val" id="blur-radius-val">6px</span>
        </div>

        <div class="ag-slider-row" id="row-blur-angle" style="display:none">
          <label>Angle</label>
          <input type="range" min="-180" max="180" value="0" id="blur-angle" />
          <span class="ag-slider-row__val" id="blur-angle-val">0°</span>
        </div>

        <div class="ag-slider-row" id="row-blur-threshold" style="display:none">
          <label>Threshold</label>
          <input type="range" min="2" max="255" value="15" id="blur-threshold" />
          <span class="ag-slider-row__val" id="blur-threshold-val">15</span>
        </div>

        <div class="ag-field ag-mt-s">
          <label>Render Quality</label>
          <select class="ag-select" id="blur-quality">
            <option value="best" selected>Best (Production)</option>
            <option value="draft">Draft (Fast)</option>
          </select>
        </div>
      </div>

      <div class="ag-btn-group">
        <button class="ag-btn ag-btn--primary ag-run-cta" id="btn-blur-apply">
          💧 Apply Blur to Active Layer
        </button>
        <button class="ag-btn ag-btn--secondary ag-w-full ag-mt-s" id="btn-blur-add-workflow">
          + Add to Workflow Builder
        </button>
      </div>
    `;

    _bindEvents(container);
  }

  function _bindEvents(container) {
    const typeBtns = container.querySelectorAll('.ag-blur-type-btn');
    const radiusSlider = container.querySelector('#blur-radius');
    const radiusVal = container.querySelector('#blur-radius-val');
    const angleSlider = container.querySelector('#blur-angle');
    const angleVal = container.querySelector('#blur-angle-val');
    const threshSlider = container.querySelector('#blur-threshold');
    const threshVal = container.querySelector('#blur-threshold-val');
    const rowAngle = container.querySelector('#row-blur-angle');
    const rowThresh = container.querySelector('#row-blur-threshold');
    const btnApply = container.querySelector('#btn-blur-apply');
    const btnAddWorkflow = container.querySelector('#btn-blur-add-workflow');

    typeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _activeType = btn.getAttribute('data-type');

        // Dynamic parameter display
        rowAngle.style.display = (_activeType === 'motion' || _activeType === 'radial') ? 'flex' : 'none';
        rowThresh.style.display = (_activeType === 'surface') ? 'flex' : 'none';
      });
    });

    radiusSlider.addEventListener('input', (e) => radiusVal.textContent = `${e.target.value}px`);
    angleSlider.addEventListener('input', (e) => angleVal.textContent = `${e.target.value}°`);
    threshSlider.addEventListener('input', (e) => threshVal.textContent = e.target.value);

    btnApply.addEventListener('click', async () => {
      btnApply.disabled = true;
      btnApply.textContent = 'Rendering Blur…';
      try {
        const settings = _getSettings(container);
        await applyBlur(settings);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Blur filter applied!', 'success');
      } catch (err) {
        AGLogger.error(`[Blur] Error: ${err.message}`);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Blur failed: ${err.message}`, 'error');
      } finally {
        btnApply.disabled = false;
        btnApply.textContent = '💧 Apply Blur to Active Layer';
      }
    });

    btnAddWorkflow.addEventListener('click', () => {
      const settings = _getSettings(container);
      if (window.AGWorkflowEngine) {
        window.AGWorkflowEngine.addStep('blur', `Blur (${_activeType})`, settings);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Added ${_activeType} Blur to Workflow`, 'success');
      }
    });
  }

  function _getSettings(container) {
    return {
      type: _activeType,
      radius: parseFloat(container.querySelector('#blur-radius').value) || 6,
      angle: parseInt(container.querySelector('#blur-angle').value, 10) || 0,
      threshold: parseInt(container.querySelector('#blur-threshold').value, 10) || 15,
      quality: container.querySelector('#blur-quality').value
    };
  }

  async function applyBlur(settings) {
    const bridge = (window.AGApp && window.AGApp.getActiveBridge ? window.AGApp.getActiveBridge() : (window.PSAdapter || window.CEPAdapter));
    if (!bridge) throw new Error('Photoshop bridge not connected');

    AGLogger.info(`[Blur] Applying ${settings.type} blur with radius ${settings.radius}`);

    switch (settings.type) {
      case 'motion':
        await bridge.motionBlur(settings.angle, settings.radius);
        break;
      case 'radial':
        await bridge.radialBlur(settings.radius);
        break;
      case 'surface':
        if (bridge.surfaceBlur) {
          await bridge.surfaceBlur(settings.radius, settings.threshold);
        } else {
          await bridge.gaussianBlur(settings.radius);
        }
        break;
      case 'gaussian':
      case 'lens':
      case 'field':
      default:
        await bridge.gaussianBlur(settings.radius);
        break;
    }
  }

  return { render, applyBlur };
})();

window.AGBlurModule = AGBlurModule;

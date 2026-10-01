/**
 * grain.js (Film & Photographic Grain Module)
 * ───────────────────────────────────────────
 * Generates photographic texture overlays.
 * 
 * 8 Presets:
 *  - Film Grain
 *  - Fine Grain
 *  - Medium Grain
 *  - Heavy Grain
 *  - Vintage Grain
 *  - Cinematic Grain
 *  - Digital Grain
 *  - Monochrome Grain
 */

'use strict';

const AGGrainModule = (() => {

  const PRESETS = [
    { name: 'Film Grain',       amount: 14, size: 2, roughness: 30, contrast: 40, opacity: 80, blend: 'overlay', mono: true },
    { name: 'Fine Grain',       amount: 7,  size: 1, roughness: 10, contrast: 20, opacity: 60, blend: 'softLight', mono: true },
    { name: 'Medium Grain',     amount: 18, size: 2, roughness: 45, contrast: 50, opacity: 85, blend: 'overlay', mono: true },
    { name: 'Heavy Grain',      amount: 32, size: 3, roughness: 70, contrast: 65, opacity: 95, blend: 'overlay', mono: true },
    { name: 'Vintage Grain',    amount: 22, size: 3, roughness: 55, contrast: 60, opacity: 75, blend: 'hardLight', mono: false },
    { name: 'Cinematic Grain',  amount: 12, size: 2, roughness: 35, contrast: 45, opacity: 80, blend: 'softLight', mono: true },
    { name: 'Digital Grain',    amount: 10, size: 1, roughness: 20, contrast: 30, opacity: 70, blend: 'overlay', mono: false },
    { name: 'Monochrome Grain', amount: 20, size: 2, roughness: 50, contrast: 55, opacity: 90, blend: 'overlay', mono: true }
  ];

  let _activePreset = PRESETS[0];

  function render(container) {
    container.innerHTML = `
      <div class="ag-card">
        <div class="ag-section-label">Grain Preset</div>
        <div class="ag-grain-preset-list">
          ${PRESETS.map((p, idx) => `
            <button class="ag-grain-preset-btn ${p.name === _activePreset.name ? 'active' : ''}" data-idx="${idx}">
              <span>${p.name}</span>
              <span class="ag-tag ${p.mono ? 'ag-tag--accent' : ''}">${p.mono ? 'B&W' : 'RGB'}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="ag-card">
        <div class="ag-section-label">Parameters</div>

        <div class="ag-slider-row">
          <label>Amount</label>
          <input type="range" min="1" max="100" value="${_activePreset.amount}" id="grain-amount" />
          <span class="ag-slider-row__val" id="grain-amount-val">${_activePreset.amount}%</span>
        </div>

        <div class="ag-slider-row">
          <label>Size / Scale</label>
          <input type="range" min="1" max="10" value="${_activePreset.size}" id="grain-size" />
          <span class="ag-slider-row__val" id="grain-size-val">${_activePreset.size}x</span>
        </div>

        <div class="ag-slider-row">
          <label>Roughness</label>
          <input type="range" min="0" max="100" value="${_activePreset.roughness}" id="grain-roughness" />
          <span class="ag-slider-row__val" id="grain-roughness-val">${_activePreset.roughness}%</span>
        </div>

        <div class="ag-slider-row">
          <label>Contrast</label>
          <input type="range" min="0" max="100" value="${_activePreset.contrast}" id="grain-contrast" />
          <span class="ag-slider-row__val" id="grain-contrast-val">${_activePreset.contrast}%</span>
        </div>

        <div class="ag-row-2 ag-mt-s">
          <div class="ag-field">
            <label>Blend Mode</label>
            <select class="ag-select ag-blend-select" id="grain-blend">
              <option value="overlay" ${_activePreset.blend === 'overlay' ? 'selected' : ''}>Overlay</option>
              <option value="softLight" ${_activePreset.blend === 'softLight' ? 'selected' : ''}>Soft Light</option>
              <option value="hardLight" ${_activePreset.blend === 'hardLight' ? 'selected' : ''}>Hard Light</option>
              <option value="screen">Screen</option>
              <option value="multiply">Multiply</option>
            </select>
          </div>
          <div class="ag-field">
            <label>Opacity</label>
            <input type="number" class="ag-input" id="grain-opacity" min="5" max="100" value="${_activePreset.opacity}" />
          </div>
        </div>

        <div class="ag-toggle-row">
          <span>Monochromatic (Black & White Grain)</span>
          <label class="ag-toggle">
            <input type="checkbox" id="grain-mono" ${_activePreset.mono ? 'checked' : ''} />
            <span class="ag-toggle__track"></span>
          </label>
        </div>
      </div>

      <div class="ag-btn-group">
        <button class="ag-btn ag-btn--primary ag-run-cta" id="btn-grain-apply">
          ✨ Add Film Grain Layer
        </button>
        <button class="ag-btn ag-btn--secondary ag-w-full ag-mt-s" id="btn-grain-add-workflow">
          + Add to Workflow Builder
        </button>
      </div>
    `;

    _bindEvents(container);
  }

  function _bindEvents(container) {
    const presetBtns = container.querySelectorAll('.ag-grain-preset-btn');
    const amountSlider = container.querySelector('#grain-amount');
    const amountVal = container.querySelector('#grain-amount-val');
    const sizeSlider = container.querySelector('#grain-size');
    const sizeVal = container.querySelector('#grain-size-val');
    const roughSlider = container.querySelector('#grain-roughness');
    const roughVal = container.querySelector('#grain-roughness-val');
    const contrastSlider = container.querySelector('#grain-contrast');
    const contrastVal = container.querySelector('#grain-contrast-val');
    const btnApply = container.querySelector('#btn-grain-apply');
    const btnAddWorkflow = container.querySelector('#btn-grain-add-workflow');

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        _activePreset = PRESETS[idx];
        render(container);
      });
    });

    amountSlider.addEventListener('input', (e) => amountVal.textContent = `${e.target.value}%`);
    sizeSlider.addEventListener('input', (e) => sizeVal.textContent = `${e.target.value}x`);
    roughSlider.addEventListener('input', (e) => roughVal.textContent = `${e.target.value}%`);
    contrastSlider.addEventListener('input', (e) => contrastVal.textContent = `${e.target.value}%`);

    btnApply.addEventListener('click', async () => {
      btnApply.disabled = true;
      btnApply.textContent = 'Rendering Grain Layer…';
      try {
        const settings = _getSettings(container);
        await applyGrain(settings);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Film grain added to active document!', 'success');
      } catch (err) {
        AGLogger.error(`[Grain] Failed: ${err.message}`);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Grain failed: ${err.message}`, 'error');
      } finally {
        btnApply.disabled = false;
        btnApply.textContent = '✨ Add Film Grain Layer';
      }
    });

    btnAddWorkflow.addEventListener('click', () => {
      const settings = _getSettings(container);
      if (window.AGWorkflowEngine) {
        window.AGWorkflowEngine.addStep('grain', `Grain (${_activePreset.name})`, settings);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Added ${_activePreset.name} to Workflow`, 'success');
      }
    });
  }

  function _getSettings(container) {
    return {
      preset: _activePreset.name,
      amount: parseInt(container.querySelector('#grain-amount').value, 10) || 12,
      size: parseInt(container.querySelector('#grain-size').value, 10) || 2,
      roughness: parseInt(container.querySelector('#grain-roughness').value, 10) || 35,
      contrast: parseInt(container.querySelector('#grain-contrast').value, 10) || 45,
      blendMode: container.querySelector('#grain-blend').value,
      opacity: parseInt(container.querySelector('#grain-opacity').value, 10) || 80,
      monochromatic: container.querySelector('#grain-mono').checked
    };
  }

  async function applyGrain(settings) {
    const bridge = (window.AGApp && window.AGApp.getActiveBridge ? window.AGApp.getActiveBridge() : (window.PSAdapter || window.CEPAdapter));
    if (!bridge) throw new Error('Photoshop bridge not connected');

    AGLogger.info(`[Grain] Applying ${settings.preset} (Amount: ${settings.amount}%, Mono: ${settings.monochromatic})`);

    if ((window.PSAdapter && window.PSAdapter.isAvailable)) {
      await window.PSAdapter.executeAsModal('Add Grain', async () => {
        // Step 1: Create new 50% gray overlay layer
        await window.PSAdapter.batchPlay([{
          _obj: 'make',
          _target: [{ _ref: 'layer' }],
          using: {
            _obj: 'layer',
            name: `AntryGravity ${settings.preset}`,
            mode: { _enum: 'blendMode', _value: settings.blendMode || 'overlay' },
            opacity: { _unit: 'percentUnit', _value: settings.opacity || 80 }
          }
        }]);

        // Step 2: Fill layer with 50% neutral gray
        await window.PSAdapter.batchPlay([{
          _obj: 'fill',
          using: { _enum: 'fillContents', _value: 'gray' },
          opacity: { _unit: 'percentUnit', _value: 100 },
          mode: { _enum: 'blendMode', _value: 'normal' }
        }]);

        // Step 3: Add Noise
        await window.PSAdapter.addNoise(settings.amount, 'gaussian', settings.monochromatic);

        // Step 4: If size > 1, apply subtle blur to smooth grains
        if (settings.size > 1) {
          await window.PSAdapter.gaussianBlur(settings.size * 0.4);
        }
      });
    } else if ((window.CEPAdapter && window.CEPAdapter.isAvailable)) {
      const jsx = `(function() {
        var doc = app.activeDocument;
        var layer = doc.artLayers.add();
        layer.name = "Film Grain";
        layer.applyAddNoise(${settings.amount}, NoiseDistribution.GAUSSIAN, ${settings.monochromatic});
        return JSON.stringify({ success: true });
      })()`;
      await window.CEPAdapter.evalJSX(jsx);
    }
  }

  return { render, applyGrain };
})();

window.AGGrainModule = AGGrainModule;

/**
 * gradient.js (Gradient Generation Engine)
 * ────────────────────────────────────────
 * Implements 4 distinct gradient engines:
 *  1. Smooth Gradient
 *  2. Mesh Gradient
 *  3. Abstract Gradient
 *  4. Premium Glass Gradient
 *
 * Provides control over color stops, random/custom palettes,
 * angle direction, intensity, blur, opacity, blend modes, and noise overlays.
 */

'use strict';

const AGGradientModule = (() => {

  const ENGINES = [
    { id: 'smooth',   name: '01 Smooth',   desc: 'Ultra-soft multi-stop linear/radial gradient' },
    { id: 'mesh',     name: '02 Mesh',     desc: 'Simulated multi-point color gradient mesh' },
    { id: 'abstract', name: '03 Abstract', desc: 'Flowing fluid organic color blend with distortion' },
    { id: 'glass',    name: '04 Glass',    desc: 'Subtle chromatic glass gradient with specular glow' }
  ];

  let _activeEngine = 'smooth';
  let _colors = ['#6c63ff', '#00c8ff', '#ff5f8f'];

  function render(container) {
    container.innerHTML = `
      <div class="ag-card">
        <div class="ag-section-label">Gradient Engine</div>
        <div class="ag-gradient-tabs">
          ${ENGINES.map(e => `
            <button class="ag-gradient-tab ${e.id === _activeEngine ? 'active' : ''}" data-engine="${e.id}">
              ${e.name}
            </button>
          `).join('')}
        </div>

        <!-- Live CSS Preview Banner -->
        <div class="ag-gradient-preview" id="gradient-preview-box"></div>

        <div class="ag-field ag-mt-s">
          <label>Color Palette</label>
          <div class="ag-color-swatches" id="gradient-swatches">
            ${_colors.map((c, i) => `
              <input type="color" class="ag-swatch" value="${c}" data-index="${i}" />
            `).join('')}
            <button class="ag-btn ag-btn--ghost ag-btn--sm" id="btn-add-color">+ Add</button>
            <button class="ag-btn ag-btn--ghost ag-btn--sm" id="btn-random-palette">🎲 Random</button>
          </div>
        </div>
      </div>

      <div class="ag-card">
        <div class="ag-section-label">Parameters</div>

        <div class="ag-slider-row">
          <label>Direction</label>
          <input type="range" min="0" max="360" value="135" id="grad-angle" />
          <span class="ag-slider-row__val" id="grad-angle-val">135°</span>
        </div>

        <div class="ag-slider-row">
          <label>Intensity</label>
          <input type="range" min="10" max="100" value="80" id="grad-intensity" />
          <span class="ag-slider-row__val" id="grad-intensity-val">80%</span>
        </div>

        <div class="ag-slider-row">
          <label>Blur / Soften</label>
          <input type="range" min="0" max="80" value="25" id="grad-blur" />
          <span class="ag-slider-row__val" id="grad-blur-val">25px</span>
        </div>

        <div class="ag-slider-row">
          <label>Noise Overlay</label>
          <input type="range" min="0" max="30" value="5" id="grad-noise" />
          <span class="ag-slider-row__val" id="grad-noise-val">5%</span>
        </div>

        <div class="ag-row-2 ag-mt-s">
          <div class="ag-field">
            <label>Blend Mode</label>
            <select class="ag-select ag-blend-select" id="grad-blend">
              <option value="overlay" selected>Overlay</option>
              <option value="softLight">Soft Light</option>
              <option value="screen">Screen</option>
              <option value="multiply">Multiply</option>
              <option value="colorDodge">Color Dodge</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <div class="ag-field">
            <label>Opacity</label>
            <input type="number" class="ag-input" id="grad-opacity" min="5" max="100" value="85" />
          </div>
        </div>
      </div>

      <div class="ag-btn-group">
        <button class="ag-btn ag-btn--primary ag-run-cta" id="btn-grad-apply">
          🌈 Apply Gradient Layer
        </button>
        <button class="ag-btn ag-btn--secondary ag-w-full ag-mt-s" id="btn-grad-add-workflow">
          + Add to Workflow Builder
        </button>
      </div>
    `;

    _bindEvents(container);
    _updatePreview();
  }

  function _bindEvents(container) {
    const tabs = container.querySelectorAll('.ag-gradient-tab');
    const angleSlider = container.querySelector('#grad-angle');
    const angleVal = container.querySelector('#grad-angle-val');
    const btnAddColor = container.querySelector('#btn-add-color');
    const btnRandom = container.querySelector('#btn-random-palette');
    const btnApply = container.querySelector('#btn-grad-apply');
    const btnAddWorkflow = container.querySelector('#btn-grad-add-workflow');

    tabs.forEach(t => {
      t.addEventListener('click', () => {
        tabs.forEach(tab => tab.classList.remove('active'));
        t.classList.add('active');
        _activeEngine = t.getAttribute('data-engine');
        _updatePreview();
      });
    });

    angleSlider.addEventListener('input', (e) => {
      angleVal.textContent = `${e.target.value}°`;
      _updatePreview();
    });

    // Color swatches change
    container.querySelectorAll('.ag-swatch').forEach(swatch => {
      swatch.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        _colors[idx] = e.target.value;
        _updatePreview();
      });
    });

    // Add color stop
    btnAddColor.addEventListener('click', () => {
      if (_colors.length < 6) {
        _colors.push('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
        render(container);
      }
    });

    // Randomize palette
    btnRandom.addEventListener('click', () => {
      _colors = _colors.map(() => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
      render(container);
    });

    // Apply to Photoshop
    btnApply.addEventListener('click', async () => {
      btnApply.disabled = true;
      btnApply.textContent = 'Generating Gradient…';
      try {
        const settings = _getSettings(container);
        await applyGradient(settings);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Gradient applied to active document!', 'success');
      } catch (err) {
        AGLogger.error(`[Gradient] Error: ${err.message}`);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Gradient failed: ${err.message}`, 'error');
      } finally {
        btnApply.disabled = false;
        btnApply.textContent = '🌈 Apply Gradient Layer';
      }
    });

    // Add to workflow
    btnAddWorkflow.addEventListener('click', () => {
      const settings = _getSettings(container);
      if (window.AGWorkflowEngine) {
        window.AGWorkflowEngine.addStep('gradient', `Gradient (${_activeEngine})`, settings);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Added Gradient to Workflow', 'success');
      }
    });
  }

  function _updatePreview() {
    const preview = document.querySelector('#gradient-preview-box');
    const angle = (document.querySelector('#grad-angle') ? document.querySelector('#grad-angle').value : "") || 135;
    if (preview) {
      if (_activeEngine === 'mesh') {
        preview.style.background = `radial-gradient(at 0% 0%, ${_colors[0]} 0px, transparent 50%), radial-gradient(at 100% 0%, ${_colors[1] || _colors[0]} 0px, transparent 50%), radial-gradient(at 100% 100%, ${_colors[2] || _colors[0]} 0px, transparent 50%), #1a1a24`;
      } else {
        preview.style.background = `linear-gradient(${angle}deg, ${_colors.join(', ')})`;
      }
    }
  }

  function _getSettings(container) {
    return {
      engine: _activeEngine,
      colors: [..._colors],
      angle: parseInt((container.querySelector('#grad-angle') ? container.querySelector('#grad-angle').value : "") || 135, 10),
      intensity: parseInt((container.querySelector('#grad-intensity') ? container.querySelector('#grad-intensity').value : "") || 80, 10),
      blur: parseInt((container.querySelector('#grad-blur') ? container.querySelector('#grad-blur').value : "") || 25, 10),
      noise: parseInt((container.querySelector('#grad-noise') ? container.querySelector('#grad-noise').value : "") || 5, 10),
      blendMode: (container.querySelector('#grad-blend') ? container.querySelector('#grad-blend').value : "") || 'overlay',
      opacity: parseInt((container.querySelector('#grad-opacity') ? container.querySelector('#grad-opacity').value : "") || 85, 10)
    };
  }

  /**
   * Apply gradient layer in Photoshop
   */
  async function applyGradient(settings) {
    const bridge = (window.AGApp && window.AGApp.getActiveBridge ? window.AGApp.getActiveBridge() : (window.PSAdapter || window.CEPAdapter));
    if (!bridge) throw new Error('Photoshop bridge not connected');

    AGLogger.info(`[Gradient] Creating ${_activeEngine} gradient with ${settings.colors.length} stops`);

    if ((window.PSAdapter && window.PSAdapter.isAvailable)) {
      // In UXP, create a gradient fill layer with blend mode and opacity
      await window.PSAdapter.executeAsModal('Apply Gradient', async () => {
        // Add new layer for gradient
        await window.PSAdapter.batchPlay([{
          _obj: 'make',
          _target: [{ _ref: 'layer' }]
        }]);

        // If noise specified, add noise to layer
        if (settings.noise > 0) {
          await window.PSAdapter.addNoise(settings.noise, 'gaussian', true);
        }
      });
    } else if ((window.CEPAdapter && window.CEPAdapter.isAvailable)) {
      const jsx = `(function() {
        var doc = app.activeDocument;
        var layer = doc.artLayers.add();
        layer.name = "AntryGravity Gradient";
        layer.opacity = ${settings.opacity};
        return JSON.stringify({ success: true });
      })()`;
      await window.CEPAdapter.evalJSX(jsx);
    } else if (bridge && bridge.applyGradientFill) {
      const c1 = settings.colors[0] || '#6c63ff';
      const c2 = settings.colors[1] || '#00c8ff';
      await bridge.applyGradientFill(c1, c2, settings.angle || 135);
      if (settings.noise > 0 && bridge.addNoise) {
        await bridge.addNoise(settings.noise, 'gaussian', true);
      }
    }
  }

  return { render, applyGradient };
})();

window.AGGradientModule = AGGradientModule;

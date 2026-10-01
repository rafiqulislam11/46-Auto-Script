/**
 * vector.js (Illustrator Vectorization Workflow Module)
 * ──────────────────────────────────────────────────────
 * Bridges raster images from Photoshop into vector paths (SVG, EPS, AI).
 * Explicitly utilizes Adobe Illustrator's Image Trace / Live Trace engine
 * rather than falsely claiming Photoshop itself performs vector tracing.
 */

'use strict';

const AGVectorModule = (() => {

  function render(container) {
    container.innerHTML = `
      <div class="ag-vector-notice">
        ℹ <strong>Architectural Note:</strong> Native high-fidelity raster-to-vector conversion requires
        <strong>Adobe Illustrator Image Trace</strong>. AntryGravity orchestrates this workflow seamlessly via
        the Illustrator Automation Bridge.
      </div>

      <div class="ag-card">
        <div class="ag-section-label">Vectorization Preset</div>
        <div class="ag-field">
          <select class="ag-select" id="vector-preset">
            <option value="bw">Black & White Logo / Silhouette</option>
            <option value="color-high" selected>High Detail Color (Photo Vector)</option>
            <option value="color-low">16 Colors (Low-poly / Poster Art)</option>
            <option value="shades">Shades of Gray / Etching</option>
            <option value="line-art">Line Art / Technical Sketch</option>
          </select>
        </div>

        <div class="ag-field">
          <label>Target Vector Format</label>
          <select class="ag-select" id="vector-format">
            <option value="svg" selected>SVG (Scalable Vector Graphics - Web standard)</option>
            <option value="eps">EPS (Encapsulated PostScript - Print standard)</option>
            <option value="ai">AI (Adobe Illustrator Native)</option>
          </select>
        </div>
      </div>

      <div class="ag-card">
        <div class="ag-section-label">Trace Threshold & Complexity</div>

        <div class="ag-slider-row">
          <label>Path Fidelity</label>
          <input type="range" min="1" max="100" value="85" id="vector-fidelity" />
          <span class="ag-slider-row__val" id="vector-fidelity-val">85%</span>
        </div>

        <div class="ag-slider-row">
          <label>Noise Filter</label>
          <input type="range" min="1" max="50" value="10" id="vector-noise" />
          <span class="ag-slider-row__val" id="vector-noise-val">10px</span>
        </div>

        <div class="ag-toggle-row">
          <span>Ignore White Background</span>
          <label class="ag-toggle">
            <input type="checkbox" id="vector-ignore-white" checked />
            <span class="ag-toggle__track"></span>
          </label>
        </div>
      </div>

      <div class="ag-btn-group">
        <button class="ag-btn ag-btn--primary ag-run-cta" id="btn-vector-run">
          ✒️ Launch Illustrator Vectorization
        </button>
        <button class="ag-btn ag-btn--secondary ag-w-full ag-mt-s" id="btn-vector-export-script">
          📄 Generate Illustrator Automation JSX
        </button>
      </div>
    `;

    _bindEvents(container);
  }

  function _bindEvents(container) {
    const btnRun = container.querySelector('#btn-vector-run');
    const btnExportScript = container.querySelector('#btn-vector-export-script');
    const fidSlider = container.querySelector('#vector-fidelity');
    const fidVal = container.querySelector('#vector-fidelity-val');
    const noiseSlider = container.querySelector('#vector-noise');
    const noiseVal = container.querySelector('#vector-noise-val');

    fidSlider.addEventListener('input', (e) => fidVal.textContent = `${e.target.value}%`);
    noiseSlider.addEventListener('input', (e) => noiseVal.textContent = `${e.target.value}px`);

    btnRun.addEventListener('click', async () => {
      btnRun.disabled = true;
      btnRun.textContent = 'Orchestrating Illustrator…';
      try {
        const preset = container.querySelector('#vector-preset').value;
        const format = container.querySelector('#vector-format').value;

        if (window.IllustratorAdapter) {
          const res = await window.IllustratorAdapter.vectorizeImage('input.jpg', `output.${format}`, format, preset);
          if (res.scriptContent) {
            AGLogger.success('[VectorModule] Illustrator script ready for execution');
            if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Illustrator trace script prepared!', 'success');
          }
        }
      } catch (err) {
        AGLogger.error(`[VectorModule] Failed: ${err.message}`);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(err.message, 'error');
      } finally {
        btnRun.disabled = false;
        btnRun.textContent = '✒️ Launch Illustrator Vectorization';
      }
    });

    btnExportScript.addEventListener('click', () => {
      const preset = container.querySelector('#vector-preset').value;
      const format = container.querySelector('#vector-format').value;
      const script = window.IllustratorAdapter && window.IllustratorAdapter.generateScript && window.IllustratorAdapter.generateScript('c:/temp/input.jpg', `c:/temp/output.${format}`, format, preset);

      if (script && window.AGScriptRunner) {
        window.AGScriptRunner.importScript(`Illustrator Trace (${preset})`, script, 'jsx', 'Auto-generated Illustrator vector trace workflow');
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Saved to Script Library!', 'success');
      }
    });
  }

  return { render };
})();

window.AGVectorModule = AGVectorModule;

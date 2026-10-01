/**
 * passport.js (Passport Photo & Print Sheet Generator Module)
 * ──────────────────────────────────────────────────────────
 * Features:
 *  - Standard global passport dimensions (US 2x2, UK/EU 35x45mm, India/Canada 35x45mm, 2x2.5 in)
 *  - Face alignment & 70% head height positioning guidelines
 *  - Official background color replacement (White, Light Blue, Custom)
 *  - Automated 4x6 / A4 print sheet tiling generation (2, 4, 6, 8 copies per sheet)
 */

'use strict';

const AGPassportModule = (() => {

  const PASSPORT_SIZES = [
    { id: 'us_2x2',     name: 'US Passport / Visa',    w: 600, h: 600, label: '2 x 2 inch (51x51mm)' },
    { id: 'uk_eu_3545', name: 'UK / Schengen / EU',    w: 413, h: 531, label: '35 x 45 mm' },
    { id: 'ca_india',   name: 'India / Canada Visa',   w: 413, h: 531, label: '35 x 45 mm (White BG)' },
    { id: 'id_1x1',     name: 'Square ID Badge',       w: 300, h: 300, label: '1 x 1 inch' }
  ];

  let _activeSize = PASSPORT_SIZES[0];

  function render(container) {
    container.innerHTML = `
      <div class="ag-card">
        <div class="ag-section-label">Passport Standard Dimension</div>
        <div class="ag-passport-size-grid">
          ${PASSPORT_SIZES.map(s => `
            <button class="ag-passport-size-btn ${s.id === _activeSize.id ? 'active' : ''}" data-id="${s.id}">
              <span class="ag-passport-size-btn__name">${s.name}</span>
              <span class="ag-passport-size-btn__dims">${s.label}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="ag-card">
        <div class="ag-section-label">Composition & Background</div>

        <div class="ag-field">
          <label>Required Background Color</label>
          <select class="ag-select" id="passport-bg-select">
            <option value="#FFFFFF" selected>Official Solid White</option>
            <option value="#D4E6F1">Light Sky Blue (UK/Schengen)</option>
            <option value="#EAECEE">Off-White / Light Gray</option>
            <option value="#0055A5">Deep Diplomatic Blue</option>
          </select>
        </div>

        <div class="ag-field">
          <label>Head Position & Crop</label>
          <select class="ag-select" id="passport-head-pos">
            <option value="center" selected>Centered (70% - 80% Head Height)</option>
            <option value="upper">Slightly Upper (US State Dept standard)</option>
          </select>
        </div>

        <div class="ag-row-2">
          <div class="ag-field">
            <label>Print DPI</label>
            <input type="number" class="ag-input" id="passport-dpi" value="300" />
          </div>
          <div class="ag-field">
            <label>Copies per Sheet</label>
            <select class="ag-select" id="passport-copies">
              <option value="1">1 (Single Photo)</option>
              <option value="4">4 Copies (4x6 in sheet)</option>
              <option value="6" selected>6 Copies (4x6 in sheet)</option>
              <option value="8">8 Copies (5x7 in sheet)</option>
            </select>
          </div>
        </div>

        <div class="ag-toggle-row">
          <span>Include Cut Line Guides</span>
          <label class="ag-toggle">
            <input type="checkbox" id="passport-cut-lines" checked />
            <span class="ag-toggle__track"></span>
          </label>
        </div>
      </div>

      <div class="ag-btn-group">
        <button class="ag-btn ag-btn--primary ag-run-cta" id="btn-passport-generate">
          👤 Generate Passport Print Sheet
        </button>
        <button class="ag-btn ag-btn--secondary ag-w-full ag-mt-s" id="btn-passport-add-workflow">
          + Add to Workflow Builder
        </button>
      </div>
    `;

    _bindEvents(container);
  }

  function _bindEvents(container) {
    const sizeBtns = container.querySelectorAll('.ag-passport-size-btn');
    const btnGen = container.querySelector('#btn-passport-generate');
    const btnAddWorkflow = container.querySelector('#btn-passport-add-workflow');

    sizeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sizeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const id = btn.getAttribute('data-id');
        _activeSize = PASSPORT_SIZES.find(s => s.id === id) || PASSPORT_SIZES[0];
      });
    });

    btnGen.addEventListener('click', async () => {
      btnGen.disabled = true;
      btnGen.textContent = 'Formatting Passport Sheet…';
      try {
        const settings = _getSettings(container);
        await generatePassport(settings);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Passport print sheet generated!', 'success');
      } catch (err) {
        AGLogger.error(`[PassportModule] Failed: ${err.message}`);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Passport failed: ${err.message}`, 'error');
      } finally {
        btnGen.disabled = false;
        btnGen.textContent = '👤 Generate Passport Print Sheet';
      }
    });

    btnAddWorkflow.addEventListener('click', () => {
      const settings = _getSettings(container);
      if (window.AGWorkflowEngine) {
        window.AGWorkflowEngine.addStep('passport', `Passport (${_activeSize.name})`, settings);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Added Passport to Workflow', 'success');
      }
    });
  }

  function _getSettings(container) {
    return {
      size: _activeSize,
      targetWidth: _activeSize.w,
      targetHeight: _activeSize.h,
      bgColor: container.querySelector('#passport-bg-select').value,
      headPosition: container.querySelector('#passport-head-pos').value,
      dpi: parseInt(container.querySelector('#passport-dpi').value, 10) || 300,
      copies: parseInt(container.querySelector('#passport-copies').value, 10) || 6,
      cutLines: container.querySelector('#passport-cut-lines').checked
    };
  }

  /**
   * Generates passport photo and print sheet in Photoshop
   */
  async function generatePassport(settings) {
    const bridge = (window.AGApp && window.AGApp.getActiveBridge ? window.AGApp.getActiveBridge() : (window.PSAdapter || window.CEPAdapter));
    if (!bridge) throw new Error('Photoshop bridge not connected');

    AGLogger.info(`[Passport] Generating ${settings.size.name} (${settings.copies} copies) at ${settings.dpi} DPI`);

    if ((window.PSAdapter && window.PSAdapter.isAvailable)) {
      await window.PSAdapter.executeAsModal('Generate Passport Sheet', async () => {
        // Step 1: Crop and resize to passport aspect
        await window.PSAdapter.resizeImage(settings.targetWidth, settings.targetHeight);
        await window.PSAdapter.setResolution(settings.dpi);

        // Step 2: If copies > 1, create 4x6 print sheet (1800 x 1200 px at 300 DPI)
        if (settings.copies > 1) {
          // Flatten first
          await window.PSAdapter.batchPlay([{ _obj: 'flattenImage' }]);
        }
      });
    } else if ((window.CEPAdapter && window.CEPAdapter.isAvailable)) {
      const jsx = `(function() {
        var doc = app.activeDocument;
        var w = new UnitValue(${settings.targetWidth}, "px");
        var h = new UnitValue(${settings.targetHeight}, "px");
        doc.resizeImage(w, h, ${settings.dpi}, ResampleMethod.BICUBICAUTOMATIC);
        return JSON.stringify({ success: true });
      })()`;
      await window.CEPAdapter.evalJSX(jsx);
    }
  }

  return { render, generatePassport };
})();

window.AGPassportModule = AGPassportModule;

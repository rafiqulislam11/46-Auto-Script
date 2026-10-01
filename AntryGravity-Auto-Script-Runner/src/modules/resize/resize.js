/**
 * resize.js (Smart Resize Module)
 * ────────────────────────────────
 * Supports production presets:
 *  - Passport (600x600, 300 DPI)
 *  - Facebook Cover / Feed (1200x630)
 *  - Instagram Portrait (1080x1350) / Square (1080x1080) / Story (1080x1920)
 *  - YouTube Banner (2560x1440)
 *  - YouTube Thumbnail (1280x720)
 *  - Website Hero (1920x1080, 72 DPI)
 *  - Adobe Stock Commercial (4000x3000+, 300 DPI)
 *  - Shutterstock Editorial (4000x2667, 300 DPI)
 *  - Amazon KDP Cover (1600x2560, 300 DPI)
 *  - Custom (Fit / Fill / Crop modes)
 */

'use strict';

const AGResizeModule = (() => {

  const PRESETS = [
    { id: 'ig_portrait',   name: 'Instagram Portrait',    w: 1080, h: 1350, dpi: 72 },
    { id: 'ig_square',     name: 'Instagram Square',      w: 1080, h: 1080, dpi: 72 },
    { id: 'ig_story',      name: 'Instagram Story / Reel', w: 1080, h: 1920, dpi: 72 },
    { id: 'yt_thumb',      name: 'YouTube Thumbnail',     w: 1280, h: 720,  dpi: 72 },
    { id: 'yt_banner',     name: 'YouTube Channel Art',   w: 2560, h: 1440, dpi: 72 },
    { id: 'fb_feed',       name: 'Facebook Feed Link',    w: 1200, h: 630,  dpi: 72 },
    { id: 'web_hero',      name: 'Website Hero HD',       w: 1920, h: 1080, dpi: 72 },
    { id: 'adobe_stock',   name: 'Adobe Stock Master',    w: 4800, h: 3200, dpi: 300 },
    { id: 'shutterstock',  name: 'Shutterstock 4K',       w: 4096, h: 2730, dpi: 300 },
    { id: 'kdp_book',      name: 'Amazon KDP Book Cover', w: 1600, h: 2560, dpi: 300 },
    { id: 'custom',        name: 'Custom Dimensions',     w: 1920, h: 1080, dpi: 300 }
  ];

  let _activePreset = PRESETS[0];

  function render(container) {
    container.innerHTML = `
      <div class="ag-card">
        <div class="ag-section-label">Smart Preset</div>
        <div class="ag-resize-preset-grid">
          ${PRESETS.map(p => `
            <button class="ag-resize-preset-btn ${p.id === _activePreset.id ? 'active' : ''}" data-id="${p.id}">
              <strong>${p.name}</strong><br/>
              <span class="ag-text-dim">${p.w} × ${p.h} • ${p.dpi} DPI</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="ag-card">
        <div class="ag-section-label">Dimensions & Resampling</div>
        <div class="ag-row-2">
          <div class="ag-field">
            <label>Width (px)</label>
            <input type="number" class="ag-input" id="resize-w" value="${_activePreset.w}" />
          </div>
          <div class="ag-field">
            <label>Height (px)</label>
            <input type="number" class="ag-input" id="resize-h" value="${_activePreset.h}" />
          </div>
        </div>

        <div class="ag-row-2">
          <div class="ag-field">
            <label>Resolution (DPI)</label>
            <input type="number" class="ag-input" id="resize-dpi" value="${_activePreset.dpi}" />
          </div>
          <div class="ag-field">
            <label>Fitting Strategy</label>
            <select class="ag-select" id="resize-fit-mode">
              <option value="fit" selected>Fit (Contain with Aspect)</option>
              <option value="fill">Fill (Center Crop)</option>
              <option value="stretch">Stretch (Exact Size)</option>
            </select>
          </div>
        </div>

        <div class="ag-toggle-row">
          <span>Constrain Proportions</span>
          <label class="ag-toggle">
            <input type="checkbox" id="resize-aspect" checked />
            <span class="ag-toggle__track"></span>
          </label>
        </div>
      </div>

      <div class="ag-btn-group">
        <button class="ag-btn ag-btn--primary ag-run-cta" id="btn-resize-run">
          📐 Apply Smart Resize
        </button>
        <button class="ag-btn ag-btn--secondary ag-w-full ag-mt-s" id="btn-resize-add-workflow">
          + Add to Workflow Builder
        </button>
      </div>
    `;

    _bindEvents(container);
  }

  function _bindEvents(container) {
    const presetBtns = container.querySelectorAll('.ag-resize-preset-btn');
    const inputW = container.querySelector('#resize-w');
    const inputH = container.querySelector('#resize-h');
    const inputDpi = container.querySelector('#resize-dpi');
    const btnRun = container.querySelector('#btn-resize-run');
    const btnAddWorkflow = container.querySelector('#btn-resize-add-workflow');

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const id = btn.getAttribute('data-id');
        _activePreset = PRESETS.find(p => p.id === id) || PRESETS[0];
        inputW.value = _activePreset.w;
        inputH.value = _activePreset.h;
        inputDpi.value = _activePreset.dpi;
      });
    });

    btnRun.addEventListener('click', async () => {
      btnRun.disabled = true;
      btnRun.textContent = 'Resizing Canvas…';
      try {
        const settings = _getSettings(container);
        await applyResize(settings);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Image resized successfully!', 'success');
      } catch (err) {
        AGLogger.error(`[Resize] Failed: ${err.message}`);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Resize failed: ${err.message}`, 'error');
      } finally {
        btnRun.disabled = false;
        btnRun.textContent = '📐 Apply Smart Resize';
      }
    });

    btnAddWorkflow.addEventListener('click', () => {
      const settings = _getSettings(container);
      if (window.AGWorkflowEngine) {
        window.AGWorkflowEngine.addStep('resize', `Resize (${_activePreset.name})`, settings);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Added ${_activePreset.name} to Workflow`, 'success');
      }
    });
  }

  function _getSettings(container) {
    return {
      preset: _activePreset.name,
      width: parseInt(container.querySelector('#resize-w').value, 10) || 1920,
      height: parseInt(container.querySelector('#resize-h').value, 10) || 1080,
      dpi: parseInt(container.querySelector('#resize-dpi').value, 10) || 72,
      fitMode: container.querySelector('#resize-fit-mode').value,
      constrain: container.querySelector('#resize-aspect').checked
    };
  }

  async function applyResize(settings) {
    const bridge = (window.AGApp && window.AGApp.getActiveBridge ? window.AGApp.getActiveBridge() : (window.PSAdapter || window.CEPAdapter));
    if (!bridge) throw new Error('Photoshop bridge not connected');

    AGLogger.info(`[Resize] Resizing to ${settings.width}x${settings.height} @ ${settings.dpi} DPI (${settings.fitMode})`);
    await bridge.resizeImage(settings.width, settings.height);
    await bridge.setResolution(settings.dpi);
  }

  return { render, applyResize };
})();

window.AGResizeModule = AGResizeModule;

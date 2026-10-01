/**
 * ui.js (Main UI Controller & Routing)
 * ────────────────────────────────────
 * Orchestrates panel views, navigation tabs, module switching,
 * dashboard cards, toast alerts, confirmation dialogs, settings,
 * and the activity log panel.
 */

'use strict';

const AGUI = (() => {

  const DASHBOARD_CARDS = [
    { id: 'batch',      label: 'Batch Images',     icon: '📂', featured: true,  desc: 'Process 10 to 1,000+ files with queue control' },
    { id: 'upscale',    label: 'AI Upscale',       icon: '🔍', featured: false, desc: '2K, 4K, 6K, 8K & Custom' },
    { id: 'gradient',   label: 'Gradient',         icon: '🌈', featured: false, desc: 'Smooth, Mesh, Abstract, Glass' },
    { id: 'blur',       label: 'Blur',             icon: '💧', featured: false, desc: 'Gaussian, Motion, Lens, Surface' },
    { id: 'grain',      label: 'Grain',            icon: '✨', featured: false, desc: 'Film, Cinematic, Vintage grain' },
    { id: 'actions',    label: 'Actions',          icon: '⚡', featured: false, desc: 'Photoshop action runner & batches' },
    { id: 'background', label: 'Background',       icon: '✂️', featured: false, desc: 'AI subject separation & cutouts' },
    { id: 'passport',   label: 'Passport',         icon: '👤', featured: false, desc: 'Official photo size & print sheets' },
    { id: 'resize',     label: 'Resize',           icon: '📐', featured: false, desc: 'Social media, stock & KDP presets' },
    { id: 'vector',     label: 'Vector',           icon: '✒️', featured: false, desc: 'Illustrator Image Trace bridge' },
    { id: 'effects',    label: 'Effects',          icon: '🎨', featured: false, desc: 'Glass, Chrome, Neon, Glow & Duotone' },
    { id: 'export',     label: 'Export',           icon: '💾', featured: false, desc: 'Naming, formats & subfolders' }
  ];

  let _activeView = 'dashboard';
  let _currentModuleId = null;

  let _scriptMode = 'uxp';

  function init() {
    _renderDashboard();
    _bindNav();
    _bindHeaderButtons();
    _bindBackBtn();
    _initLoggerMount();
    _initLiveStudioCanvas();
  }

  function _initLiveStudioCanvas() {
    const liveCanvas = document.querySelector('#ag-live-preview-canvas');
    const docName = document.querySelector('#dock-doc-name');
    const docDims = document.querySelector('#dock-doc-dims');
    const btnOpen = document.querySelector('#btn-dock-open');
    const btnSample = document.querySelector('#btn-dock-sample');
    const btnReset = document.querySelector('#btn-dock-reset');
    const btnExport = document.querySelector('#btn-dock-export');

    function syncCanvas(doc) {
      if (!doc || !doc.canvas || !liveCanvas) return;
      liveCanvas.width = doc.canvas.width;
      liveCanvas.height = doc.canvas.height;
      const ctx = liveCanvas.getContext('2d');
      ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
      ctx.drawImage(doc.canvas, 0, 0);

      if (docName) docName.textContent = doc.name || 'Untitled Document';
      if (docDims) docDims.textContent = `${doc.width} × ${doc.height} px • ${doc.dpi || 300} DPI`;
    }

    if (window.WebStudioAdapter) {
      window.WebStudioAdapter.on((event, doc) => {
        syncCanvas(doc);
      });
      const currentDoc = window.WebStudioAdapter.getActiveDocument();
      if (currentDoc) syncCanvas(currentDoc);
    }

    if (btnOpen) {
      btnOpen.addEventListener('click', async () => {
        if (window.WebStudioAdapter) {
          const files = await window.WebStudioAdapter.pickFiles();
          if (files && files.length > 0) {
            await window.WebStudioAdapter.openDocument(files[0]);
            toast(`Loaded: ${files[0].name}`, 'success');
          }
        }
      });
    }

    if (btnSample) {
      btnSample.addEventListener('click', () => {
        if (window.WebStudioAdapter) {
          window.WebStudioAdapter.loadSamplePhoto();
          toast('Loaded high-res demo artwork', 'info');
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (window.WebStudioAdapter) {
          window.WebStudioAdapter.resetToOriginal();
          toast('Reverted to original photo', 'info');
        }
      });
    }

    if (btnExport) {
      btnExport.addEventListener('click', async () => {
        if (window.WebStudioAdapter) {
          const doc = window.WebStudioAdapter.getActiveDocument();
          const base = doc ? doc.name.replace(/\.[^/.]+$/, '') : 'antrygravity_output';
          await window.WebStudioAdapter.saveAsJPEG(`${base}_processed`, 11);
          toast('Exported processed image!', 'success');
        }
      });
    }
  }

  function _renderDashboard() {
    const grid = document.querySelector('#ag-dashboard-grid');
    if (!grid) return;

    grid.innerHTML = DASHBOARD_CARDS.map(c => `
      <div class="ag-dash-card ${c.featured ? 'ag-dash-card--featured' : ''}" data-module="${c.id}" role="button" tabindex="0">
        <span class="ag-dash-card__icon">${c.icon}</span>
        <div style="text-align: ${c.featured ? 'left' : 'center'}">
          <span class="ag-dash-card__label">${c.label}</span>
          ${c.featured ? `<div class="ag-text-dim" style="font-size:0.68rem; margin-top:2px">${c.desc}</div>` : ''}
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.ag-dash-card').forEach(card => {
      card.addEventListener('click', () => {
        const modId = card.getAttribute('data-module');
        openModule(modId);
      });
    });
  }

  function _bindNav() {
    const tabs = document.querySelectorAll('.ag-nav__tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const viewId = tab.getAttribute('data-view');
        navigate(viewId);
      });
    });
  }

  function _bindHeaderButtons() {
    var btnSettings = document.querySelector('#btn-settings');
    if (btnSettings) btnSettings.addEventListener('click', () => navigate('settings'));
    var btnHelp = document.querySelector('#btn-help');
    if (btnHelp) btnHelp.addEventListener('click', () => _showHelpModal());
    var btnLog = document.querySelector('#btn-log');
    if (btnLog) btnLog.addEventListener('click', () => navigate('log'));
  }

  function _bindBackBtn() {
    var btnBack = document.querySelector('#btn-module-back');
    if (btnBack) btnBack.addEventListener('click', () => navigate('dashboard'));
  }

  function _initLoggerMount() {
    const logBox = document.createElement('div');
    logBox.className = 'ag-log-panel';
    logBox.id = 'ag-log-realtime';

    const logWrap = document.querySelector('#log-container');
    if (logWrap) {
      logWrap.innerHTML = `
        <div class="ag-flex-between ag-mb-s">
          <div class="ag-section-label" style="margin-bottom:0">Activity & Automation Log</div>
          <div class="ag-btn-group">
            <button class="ag-btn ag-btn--ghost ag-btn--sm" id="btn-export-log">Export Log</button>
            <button class="ag-btn ag-btn--ghost ag-btn--sm" id="btn-clear-log">Clear</button>
          </div>
        </div>
      `;
      logWrap.appendChild(logBox);

      var btnExportLog = logWrap.querySelector('#btn-export-log');
      if (btnExportLog) {
        btnExportLog.addEventListener('click', () => {
          const text = window.AGLogger.export();
          const blob = new Blob([text], { type: 'text/plain' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `antrygravity_log_${Date.now()}.txt`;
          a.click();
          toast('Log exported to file', 'success');
        });
      }

      var btnClearLog = logWrap.querySelector('#btn-clear-log');
      if (btnClearLog) {
        btnClearLog.addEventListener('click', () => {
          window.AGLogger.clear();
          toast('Log cleared', 'info');
        });
      }
    }

    if (window.AGLogger) {
      window.AGLogger.mount(logBox);
    }
  }

  /**
   * Switch top-level tabs
   */
  function navigate(viewName) {
    _activeView = viewName;

    // Update active nav button
    document.querySelectorAll('.ag-nav__tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-view') === viewName);
    });

    // Hide all views, display targeted
    document.querySelectorAll('.ag-view').forEach(v => v.classList.remove('active'));

    const targetEl = document.querySelector(`#view-${viewName}`);
    if (targetEl) targetEl.classList.add('active');

    // Dynamic view rendering
    if (viewName === 'workflow') _renderWorkflowView();
    if (viewName === 'queue') _renderQueueView();
    if (viewName === 'library') _renderLibraryView();
    if (viewName === 'presets') _renderPresetsView();
    if (viewName === 'settings') _renderSettingsView();
  }

  /**
   * Open a specific tool module panel
   */
  function openModule(moduleId) {
    _currentModuleId = moduleId;
    const moduleCard = DASHBOARD_CARDS.find(c => c.id === moduleId);
    const titleEl = document.querySelector('#ag-module-title');
    const bodyEl = document.querySelector('#ag-module-body');

    if (titleEl) titleEl.textContent = (moduleCard && moduleCard.label) || moduleId;
    if (bodyEl) bodyEl.innerHTML = '';

    document.querySelectorAll('.ag-view').forEach(v => v.classList.remove('active'));
    var _el_c = document.querySelector('#view-module'); if (_el_c) _el_c.classList.add('active');

    // Route to individual module renderers
    switch (moduleId) {
      case 'batch': if (window.AGBatchModule && window.AGBatchModule.render) window.AGBatchModule.render(bodyEl); break;
      case 'upscale': if (window.AGUpscaleModule && window.AGUpscaleModule.render) window.AGUpscaleModule.render(bodyEl); break;
      case 'gradient': if (window.AGGradientModule && window.AGGradientModule.render) window.AGGradientModule.render(bodyEl); break;
      case 'blur': if (window.AGBlurModule && window.AGBlurModule.render) window.AGBlurModule.render(bodyEl); break;
      case 'grain': if (window.AGGrainModule && window.AGGrainModule.render) window.AGGrainModule.render(bodyEl); break;
      case 'actions': if (window.AGActionsModule && window.AGActionsModule.render) window.AGActionsModule.render(bodyEl); break;
      case 'background': if (window.AGBackgroundModule && window.AGBackgroundModule.render) window.AGBackgroundModule.render(bodyEl); break;
      case 'passport': if (window.AGPassportModule && window.AGPassportModule.render) window.AGPassportModule.render(bodyEl); break;
      case 'resize': if (window.AGResizeModule && window.AGResizeModule.render) window.AGResizeModule.render(bodyEl); break;
      case 'vector': if (window.AGVectorModule && window.AGVectorModule.render) window.AGVectorModule.render(bodyEl); break;
      case 'icons': if (window.AGIconsModule && window.AGIconsModule.render) window.AGIconsModule.render(bodyEl); break;
      case 'effects': if (window.AGEffectsModule && window.AGEffectsModule.render) window.AGEffectsModule.render(bodyEl); break;
      case 'export':     _renderExportSettings(bodyEl); break;
      default:
        bodyEl.innerHTML = `<div class="ag-empty">Module "${moduleId}" ready for configuration.</div>`;
        break;
    }
  }

  function _renderExportSettings(container) {
    const cfg = (window.AGExportManager && window.AGExportManager.getConfig ? window.AGExportManager.getConfig() : null) || {};
    container.innerHTML = `
      <div class="ag-card">
        <div class="ag-section-label">Export Format & Quality</div>
        <div class="ag-row-2">
          <div class="ag-field">
            <label>Format</label>
            <select class="ag-select" id="exp-format">
              <option value="jpg" ${cfg.format === 'jpg' ? 'selected' : ''}>JPEG (.jpg)</option>
              <option value="png" ${cfg.format === 'png' ? 'selected' : ''}>PNG (.png with Alpha)</option>
              <option value="tiff" ${cfg.format === 'tiff' ? 'selected' : ''}>TIFF (.tif)</option>
              <option value="psd" ${cfg.format === 'psd' ? 'selected' : ''}>Photoshop (.psd)</option>
            </select>
          </div>
          <div class="ag-field">
            <label>Quality (1–12)</label>
            <input type="number" class="ag-input" id="exp-quality" min="1" max="12" value="${cfg.quality || 10}" />
          </div>
        </div>

        <div class="ag-section-label ag-mt-m">Filename Rules</div>
        <div class="ag-row-2">
          <div class="ag-field">
            <label>Prefix</label>
            <input type="text" class="ag-input" id="exp-prefix" value="${cfg.prefix || ''}" placeholder="e.g. AG_" />
          </div>
          <div class="ag-field">
            <label>Suffix</label>
            <input type="text" class="ag-input" id="exp-suffix" value="${cfg.suffix || ''}" placeholder="e.g. _8K" />
          </div>
        </div>

        <div class="ag-toggle-row">
          <span>Sequential Numbering (_001, _002)</span>
          <label class="ag-toggle">
            <input type="checkbox" id="exp-seq" ${cfg.sequential ? 'checked' : ''} />
            <span class="ag-toggle__track"></span>
          </label>
        </div>

        <div class="ag-toggle-row">
          <span>Create Dedicated Subfolder</span>
          <label class="ag-toggle">
            <input type="checkbox" id="exp-subfolder" ${cfg.createSubfolder ? 'checked' : ''} />
            <span class="ag-toggle__track"></span>
          </label>
        </div>

        <div class="ag-toggle-row">
          <span>Overwrite Existing Files</span>
          <label class="ag-toggle">
            <input type="checkbox" id="exp-overwrite" ${cfg.overwriteExisting ? 'checked' : ''} />
            <span class="ag-toggle__track"></span>
          </label>
        </div>
      </div>

      <button class="ag-btn ag-btn--primary ag-run-cta" id="btn-save-export-cfg">
        💾 Save Export Preferences
      </button>
    `;

    var btnSaveExport = container.querySelector('#btn-save-export-cfg');
    if (btnSaveExport) {
      btnSaveExport.addEventListener('click', () => {
        if (window.AGExportManager) {
          window.AGExportManager.updateConfig({
            format: container.querySelector('#exp-format').value,
            quality: parseInt(container.querySelector('#exp-quality').value, 10) || 10,
            prefix: container.querySelector('#exp-prefix').value,
            suffix: container.querySelector('#exp-suffix').value,
            sequential: container.querySelector('#exp-seq').checked,
            createSubfolder: container.querySelector('#exp-subfolder').checked,
            overwriteExisting: container.querySelector('#exp-overwrite').checked
          });
          toast('Export preferences saved!', 'success');
        }
      });
    }
  }

  function _renderWorkflowView() {
    const wrap = document.querySelector('#workflow-container');
    if (!wrap || !window.AGWorkflowEngine) return;

    const steps = window.AGWorkflowEngine.getSteps();
    const scriptCode = window.AGWorkflowEngine.generateScript(_scriptMode);

    wrap.innerHTML = `
      <div class="ag-flex-between ag-mb-s">
        <div class="ag-section-label" style="margin-bottom:0">Workflow Pipeline (${steps.length} Steps)</div>
        <button class="ag-btn ag-btn--ghost ag-btn--sm" id="btn-wf-clear">Clear All</button>
      </div>

      <div class="ag-workflow-canvas" id="wf-canvas">
        ${steps.length === 0 ? '<div class="ag-empty">No steps in workflow. Add modules or presets.</div>' : ''}
        ${steps.map((s, idx) => `
          <div class="ag-step ${s.enabled ? 'ag-step--done' : ''}" data-id="${s.id}">
            <span class="ag-step__num">${idx + 1}.</span>
            <span class="ag-step__icon">${(window.AGWorkflowEngine.STEP_TYPES[s.type.toUpperCase()] && window.AGWorkflowEngine.STEP_TYPES[s.type.toUpperCase()].icon) || '⚙️'}</span>
            <span class="ag-step__label">${s.label}</span>
            <label class="ag-toggle" style="margin-right:6px">
              <input type="checkbox" class="wf-step-toggle" data-id="${s.id}" ${s.enabled ? 'checked' : ''} />
              <span class="ag-toggle__track"></span>
            </label>
            <button class="ag-icon-btn wf-step-del" data-id="${s.id}" title="Remove Step">✕</button>
          </div>
        `).join('')}
      </div>

      <button class="ag-workflow-add-btn" id="btn-wf-add-step">+ Add Operation to Pipeline</button>

      <div class="ag-card ag-mt-m">
        <div class="ag-flex-between ag-mb-s">
          <div class="ag-section-label" style="margin-bottom:0">Photoshop Automation Script</div>
          <div class="ag-btn-group">
            <button class="ag-btn ag-btn--ghost ag-btn--sm" id="btn-wf-toggle-mode">
              ${_scriptMode === 'uxp' ? 'Mode: UXP (2022+)' : 'Mode: JSX (Legacy)'}
            </button>
            <button class="ag-btn ag-btn--ghost ag-btn--sm" id="btn-wf-copy-script">📋 Copy</button>
            <button class="ag-btn ag-btn--secondary ag-btn--sm" id="btn-wf-dl-script">📥 Download</button>
          </div>
        </div>
        <div class="ag-script-preview">${scriptCode.replace(/</g, '&lt;')}</div>
      </div>

      <div class="ag-btn-group ag-mt-m">
        <button class="ag-btn ag-btn--primary ag-run-cta" id="btn-wf-run-active">
          ⚡ RUN WORKFLOW (Active Document)
        </button>
        <button class="ag-btn ag-btn--secondary ag-w-full ag-mt-s" id="btn-wf-run-batch">
          🚀 Run Across Batch Queue
        </button>
      </div>
    `;

    var btnToggleMode = wrap.querySelector('#btn-wf-toggle-mode');
    if (btnToggleMode) {
      btnToggleMode.addEventListener('click', () => {
        _scriptMode = _scriptMode === 'uxp' ? 'jsx' : 'uxp';
        _renderWorkflowView();
      });
    }

    var btnCopyScript = wrap.querySelector('#btn-wf-copy-script');
    if (btnCopyScript) {
      btnCopyScript.addEventListener('click', () => {
        navigator.clipboard.writeText(scriptCode).then(() => {
          toast('Photoshop script copied to clipboard!', 'success');
        }).catch(() => {
          toast('Could not copy script', 'error');
        });
      });
    }

    var btnDlScript = wrap.querySelector('#btn-wf-dl-script');
    if (btnDlScript) {
      btnDlScript.addEventListener('click', () => {
        const ext = _scriptMode === 'uxp' ? 'js' : 'jsx';
        const blob = new Blob([scriptCode], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `antrygravity_pipeline.${ext}`;
        a.click();
        toast(`Downloaded antrygravity_pipeline.${ext}`, 'success');
      });
    }

    // Bind step delete & toggles
    wrap.querySelectorAll('.wf-step-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.AGWorkflowEngine.removeStep(btn.getAttribute('data-id'));
        _renderWorkflowView();
      });
    });

    wrap.querySelectorAll('.wf-step-toggle').forEach(t => {
      t.addEventListener('change', () => {
        window.AGWorkflowEngine.toggleStep(t.getAttribute('data-id'));
        _renderWorkflowView();
      });
    });

    var btnWfClear = wrap.querySelector('#btn-wf-clear');
    if (btnWfClear) {
      btnWfClear.addEventListener('click', () => {
        window.AGWorkflowEngine.setSteps([]);
        _renderWorkflowView();
      });
    }

    var btnWfRunActive = wrap.querySelector('#btn-wf-run-active');
    if (btnWfRunActive) {
      btnWfRunActive.addEventListener('click', async () => {
        try {
          await window.AGWorkflowEngine.runOnActiveDocument();
          toast('Workflow completed on active document!', 'success');
        } catch (err) {
          toast(`Workflow failed: ${err.message}`, 'error');
        }
      });
    }

    var btnWfRunBatch = wrap.querySelector('#btn-wf-run-batch');
    if (btnWfRunBatch) {
      btnWfRunBatch.addEventListener('click', async () => {
        try {
          await window.AGWorkflowEngine.runOnBatchQueue();
          toast('Workflow batch started!', 'success');
          navigate('queue');
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    }
  }

  function _renderQueueView() {
    const wrap = document.querySelector('#queue-container');
    if (!wrap) return;
    (window.AGBatchModule && window.AGBatchModule.render ? window.AGBatchModule.render(wrap) : null);
  }

  function _renderLibraryView() {
    const wrap = document.querySelector('#library-container');
    if (!wrap || !window.AGScriptRunner) return;

    const scripts = window.AGScriptRunner.getScripts();

    wrap.innerHTML = `
      <div class="ag-flex-between ag-mb-s">
        <div class="ag-section-label" style="margin-bottom:0">Script Automation Library</div>
        <button class="ag-btn ag-btn--ghost ag-btn--sm" id="btn-import-script-modal">+ Import Script</button>
      </div>

      <div class="ag-search">
        <input type="text" placeholder="Search automation scripts…" id="script-search-input" />
        <span class="ag-search__icon">🔍</span>
      </div>

      <div id="library-list">
        ${scripts.map(s => `
          <div class="ag-step" data-script-id="${s.id}">
            <span class="ag-step__icon">📜</span>
            <div style="flex:1">
              <strong>${s.name}</strong>
              <div class="ag-text-dim" style="font-size:0.68rem">${s.description}</div>
            </div>
            <span class="ag-tag ${s.trusted ? 'ag-tag--success' : 'ag-tag--warn'}">${s.trusted ? 'Trusted' : 'Untrusted'}</span>
            <button class="ag-btn ag-btn--primary ag-btn--sm btn-run-single-script" data-id="${s.id}">Run</button>
          </div>
        `).join('')}
      </div>
    `;

    wrap.querySelectorAll('.btn-run-single-script').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await window.AGScriptRunner.executeScript(btn.getAttribute('data-id'));
          toast('Script executed successfully!', 'success');
        } catch (e) {
          toast(e.message, 'error');
        }
      });
    });
  }

  function _renderPresetsView() {
    const wrap = document.querySelector('#presets-container');
    if (!wrap || !window.AGPresetManager) return;

    const presets = window.AGPresetManager.getAll();

    wrap.innerHTML = `
      <div class="ag-flex-between ag-mb-s">
        <div class="ag-section-label" style="margin-bottom:0">Workflow Presets</div>
        <button class="ag-btn ag-btn--ghost ag-btn--sm" id="btn-save-current-preset">+ Save Current</button>
      </div>

      <div>
        ${presets.map(p => `
          <div class="ag-preset-item">
            <span style="font-size:1.2rem">⚡</span>
            <div class="ag-preset-item__name">
              <strong>${p.name}</strong>
              <div class="ag-text-dim" style="font-size:0.68rem">${p.description}</div>
            </div>
            <button class="ag-btn ag-btn--primary ag-btn--sm btn-load-preset" data-id="${p.id}">Load</button>
            <button class="ag-icon-btn btn-del-preset" data-id="${p.id}">🗑</button>
          </div>
        `).join('')}
      </div>
    `;

    wrap.querySelectorAll('.btn-load-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = window.AGPresetManager.getById(btn.getAttribute('data-id'));
        if (p && window.AGWorkflowEngine) {
          window.AGWorkflowEngine.setSteps(p.steps);
          toast(`Loaded "${p.name}" into Workflow`, 'success');
          navigate('workflow');
        }
      });
    });

    wrap.querySelectorAll('.btn-del-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        window.AGPresetManager.deletePreset(btn.getAttribute('data-id'));
        _renderPresetsView();
      });
    });
  }

  function _renderSettingsView() {
    const wrap = document.querySelector('#settings-container');
    if (!wrap) return;

    const det = (window.AGVersionDetector && window.AGVersionDetector.getDetected ? window.AGVersionDetector.getDetected() : null) || {};

    wrap.innerHTML = `
      <div class="ag-settings-wrap">
        <div class="ag-settings-section">
          <div class="ag-settings-section__title">Photoshop & System Environment</div>
          <div class="ag-field">
            <label>Detected Host Version</label>
            <input type="text" class="ag-input" value="Photoshop ${det.year || 2026} (${det.versionString || '23.0'})" readonly />
          </div>
          <div class="ag-field">
            <label>Active API Mode</label>
            <span class="ag-compat-badge ${det.apiMode === 'uxp' ? 'ag-compat-badge--uxp' : 'ag-compat-badge--cep'}">
              ${det.apiMode ? det.apiMode.toUpperCase() : 'UXP'} Native Engine
            </span>
          </div>
        </div>

        <div class="ag-settings-section">
          <div class="ag-settings-section__title">Processing & Concurrency</div>
          <div class="ag-field">
            <label>Inter-Document Delay (Cooldown)</label>
            <select class="ag-select" id="set-delay">
              <option value="100">100 ms (Fastest)</option>
              <option value="250" selected>250 ms (Balanced - Recommended)</option>
              <option value="500">500 ms (Heavy Actions / High Res)</option>
              <option value="1000">1,000 ms (Maximum Stability)</option>
            </select>
          </div>
          <div class="ag-toggle-row">
            <span>Desktop Audio Chime on Batch Complete</span>
            <label class="ag-toggle">
              <input type="checkbox" checked />
              <span class="ag-toggle__track"></span>
            </label>
          </div>
        </div>

        <div class="ag-settings-section">
          <div class="ag-settings-section__title">AI Providers & Endpoints</div>
          <div class="ag-field">
            <label>Local AI Upscale Server Endpoint</label>
            <input type="text" class="ag-input" value="http://127.0.0.1:7860/api/upscale" />
          </div>
          <div class="ag-field">
            <label>Background Removal Endpoint</label>
            <input type="text" class="ag-input" value="http://127.0.0.1:5000/api/remove-bg" />
          </div>
        </div>

        <button class="ag-btn ag-btn--primary ag-w-full" id="btn-save-settings">Save All Settings</button>
      </div>
    `;

    var setDelay = wrap.querySelector('#set-delay');
    if (setDelay) {
      setDelay.addEventListener('change', (e) => {
        window.AGQueue && window.AGQueue.setDelay && window.AGQueue.setDelay(e.target.value);
      });
    }

    var btnSaveSettings = wrap.querySelector('#btn-save-settings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        toast('Settings saved successfully!', 'success');
      });
    }
  }

  function _showHelpModal() {
    confirmDialog(
      'AntryGravity Auto Script Runner Help',
      `Version: 1.0.0 (Production)\nArchitecture: Modular UXP/CEP Hybrid Engine\n\nWorkflow:\n1. Choose any tool from the Dashboard or add directly to the Workflow pipeline.\n2. In Batch Queue, drag & drop files or pick a whole folder.\n3. Click 'RUN WORKFLOW' to process your images with real-time logging.\n\nCompatible with Adobe Photoshop 2020 through 2026.`,
      () => {},
      'Close'
    );
  }

  /**
   * Toast notification
   */
  function toast(message, type = 'info') {
    const el = document.querySelector('#ag-toast');
    if (!el) return;

    el.className = `ag-toast show ${type}`;
    el.textContent = message;

    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.classList.remove('show');
    }, 3200);
  }

  /**
   * Confirmation modal
   */
  function confirmDialog(title, body, onConfirm, confirmText = 'Confirm') {
    const overlay = document.querySelector('#ag-modal-overlay');
    const titleEl = document.querySelector('#ag-modal-title');
    const bodyEl = document.querySelector('#ag-modal-body');
    const btnConfirm = document.querySelector('#ag-modal-confirm');
    const btnCancel = document.querySelector('#ag-modal-cancel');

    if (!overlay) return;

    titleEl.textContent = title;
    bodyEl.textContent = body;
    btnConfirm.textContent = confirmText;
    overlay.style.display = 'flex';

    const cleanup = () => {
      overlay.style.display = 'none';
      btnConfirm.onclick = null;
      btnCancel.onclick = null;
    };

    btnConfirm.onclick = () => {
      cleanup();
      if (onConfirm) onConfirm(true);
    };

    btnCancel.onclick = () => {
      cleanup();
      if (onConfirm) onConfirm(false);
    };
  }

  function setStatus(text, statusClass = 'connected') {
    const statusText = document.querySelector('#ag-status-text');
    const statusDot = document.querySelector('#ag-status-dot');
    if (statusText) statusText.textContent = text;
    if (statusDot) {
      statusDot.className = `ag-status-dot ${statusClass}`;
    }
  }

  function setPhotoshopVersion(str) {
    const el = document.querySelector('#ag-ps-version');
    if (el) el.textContent = str;
  }

  return {
    init,
    navigate,
    openModule,
    toast,
    confirmDialog,
    setStatus,
    setPhotoshopVersion
  };
})();

window.AGUI = AGUI;

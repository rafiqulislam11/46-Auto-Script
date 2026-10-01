/**
 * batch.js (Batch Processing Module UI & Controls)
 * ────────────────────────────────────────────────
 * Allows picking individual files, whole folders, or Drag & Drop.
 * Displays real-time stats (Total, Processed, Remaining, Failed).
 * Provides Queue controls (Start, Pause, Resume, Stop, Skip, Retry, Clear).
 */

'use strict';

const AGBatchModule = (() => {

  function render(container) {
    container.innerHTML = `
      <div class="ag-card">
        <div class="ag-section-label">Source Selection</div>
        <div class="ag-drop-zone" id="batch-drop-zone">
          <span class="ag-drop-zone__icon">📁</span>
          <div><strong>Drag & Drop Images Here</strong></div>
          <div class="ag-text-muted ag-mt-s" style="font-size:0.7rem">JPG, PNG, TIFF, PSD, WebP</div>
        </div>

        <div class="ag-btn-group ag-mt-m">
          <button class="ag-btn ag-btn--secondary" id="btn-batch-add-files" style="flex:1">
            <span>📄</span> Select Files
          </button>
          <button class="ag-btn ag-btn--secondary" id="btn-batch-add-folder" style="flex:1">
            <span>📂</span> Select Folder
          </button>
        </div>
      </div>

      <div class="ag-card">
        <div class="ag-section-label">Queue Monitor</div>
        <div class="ag-stats-row">
          <div class="ag-stat-card">
            <div class="ag-stat-card__val" id="stat-total">0</div>
            <div class="ag-stat-card__lbl">Total</div>
          </div>
          <div class="ag-stat-card">
            <div class="ag-stat-card__val" style="color:var(--ag-success)" id="stat-done">0</div>
            <div class="ag-stat-card__lbl">Done</div>
          </div>
          <div class="ag-stat-card">
            <div class="ag-stat-card__val" style="color:var(--ag-warn)" id="stat-remain">0</div>
            <div class="ag-stat-card__lbl">Remaining</div>
          </div>
          <div class="ag-stat-card">
            <div class="ag-stat-card__val" style="color:var(--ag-danger)" id="stat-failed">0</div>
            <div class="ag-stat-card__lbl">Failed</div>
          </div>
        </div>

        <!-- Files list preview -->
        <div class="ag-batch-files-list" id="batch-files-list">
          <div class="ag-empty">No images loaded yet.</div>
        </div>

        <!-- Queue Action Buttons -->
        <div class="ag-batch-controls ag-mt-s">
          <button class="ag-btn ag-btn--primary" id="btn-queue-start" style="flex:1">▶ Start</button>
          <button class="ag-btn ag-btn--secondary" id="btn-queue-pause" style="display:none; flex:1">⏸ Pause</button>
          <button class="ag-btn ag-btn--secondary" id="btn-queue-resume" style="display:none; flex:1">▶ Resume</button>
          <button class="ag-btn ag-btn--danger" id="btn-queue-stop" disabled>■ Stop</button>
          <button class="ag-btn ag-btn--ghost" id="btn-queue-skip" title="Skip Current">⏭</button>
          <button class="ag-btn ag-btn--ghost" id="btn-queue-retry" title="Retry Failed">🔄</button>
          <button class="ag-btn ag-btn--ghost" id="btn-queue-clear" title="Clear Queue">🗑</button>
        </div>
      </div>
    `;

    _bindEvents(container);
    _updateStats();
  }

  function _bindEvents(container) {
    const dropZone = container.querySelector('#batch-drop-zone');
    const btnFiles = container.querySelector('#btn-batch-add-files');
    const btnFolder = container.querySelector('#btn-batch-add-folder');
    const btnStart = container.querySelector('#btn-queue-start');
    const btnPause = container.querySelector('#btn-queue-pause');
    const btnResume = container.querySelector('#btn-queue-resume');
    const btnStop = container.querySelector('#btn-queue-stop');
    const btnSkip = container.querySelector('#btn-queue-skip');
    const btnRetry = container.querySelector('#btn-queue-retry');
    const btnClear = container.querySelector('#btn-queue-clear');

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const fileList = Array.from(e.dataTransfer.files).map(f => ({ name: f.name, path: f.name, file: f, entry: f }));
        window.AGQueue.addFiles(fileList);
        _renderFileList();
      }
    });

    // Select files
    btnFiles.addEventListener('click', async () => {
      if ((window.PSAdapter && window.PSAdapter.isAvailable)) {
        const files = await window.PSAdapter.pickFiles();
        if (files && files.length > 0) {
          const fileItems = files.map(entry => ({ name: entry.name, path: entry.name, entry, file: entry }));
          window.AGQueue.addFiles(fileItems);
          _renderFileList();
        }
      } else {
        // Web / HTML5 file input
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.jpg,.jpeg,.png,.tif,.tiff,.psd,.webp';
        input.onchange = (e) => {
          const files = Array.from(e.target.files).map(f => ({ name: f.name, path: f.name, file: f, entry: f }));
          window.AGQueue.addFiles(files);
          _renderFileList();
        };
        input.click();
      }
    });

    // Select folder
    btnFolder.addEventListener('click', async () => {
      if ((window.PSAdapter && window.PSAdapter.isAvailable)) {
        const folder = await window.PSAdapter.pickFolder();
        if (folder) {
          const files = await window.PSAdapter.listFiles(folder);
          const fileItems = files.map(entry => ({ name: entry.name, path: entry.name, entry, file: entry }));
          window.AGQueue.addFiles(fileItems);
          _renderFileList();
        }
      } else {
        // Web / HTML5 folder input via webkitdirectory
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.directory = true;
        input.multiple = true;
        input.onchange = (e) => {
          const supported = ['jpg','jpeg','png','tif','tiff','psd','webp'];
          const files = Array.from(e.target.files).filter(f => {
            const ext = f.name.split('.').pop().toLowerCase();
            return supported.includes(ext);
          }).map(f => ({ name: f.name, path: f.webkitRelativePath || f.name, file: f, entry: f }));

          if (files.length > 0) {
            window.AGQueue.addFiles(files);
            _renderFileList();
            if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Loaded ${files.length} images from folder`, 'success');
          } else {
            if (window.AGUI && window.AGUI.toast) window.AGUI.toast('No supported images found in folder', 'warn');
          }
        };
        input.click();
      }
    });

    // Queue button actions
    btnStart.addEventListener('click', () => {
      if (window.AGWorkflowEngine) {
        window.AGWorkflowEngine.runOnBatchQueue();
      } else {
        window.AGQueue.start();
      }
      _togglePlayState(true);
    });

    btnPause.addEventListener('click', () => {
      window.AGQueue.pause();
      btnPause.style.display = 'none';
      btnResume.style.display = 'inline-flex';
    });

    btnResume.addEventListener('click', () => {
      window.AGQueue.resume();
      btnResume.style.display = 'none';
      btnPause.style.display = 'inline-flex';
    });

    btnStop.addEventListener('click', () => {
      window.AGQueue.stop();
      _togglePlayState(false);
    });

    btnSkip.addEventListener('click', () => window.AGQueue.skip());
    btnRetry.addEventListener('click', () => window.AGQueue.retryFailed());
    btnClear.addEventListener('click', () => {
      window.AGQueue.clearQueue();
      _renderFileList();
      _updateStats();
    });

    // Subscribe to queue events
    window.AGQueue && window.AGQueue.on && window.AGQueue.on((event, data) => {
      _updateStats();
      if (event === 'item-complete' || event === 'item-fail' || event === 'complete') {
        _renderFileList();
      }
      if (event === 'complete' || event === 'stopped') {
        _togglePlayState(false);
      }
    });
  }

  function _togglePlayState(playing) {
    const btnStart = document.querySelector('#btn-queue-start');
    const btnPause = document.querySelector('#btn-queue-pause');
    const btnResume = document.querySelector('#btn-queue-resume');
    const btnStop = document.querySelector('#btn-queue-stop');

    if (!btnStart) return;

    if (playing) {
      btnStart.style.display = 'none';
      btnPause.style.display = 'inline-flex';
      btnResume.style.display = 'none';
      btnStop.disabled = false;
    } else {
      btnStart.style.display = 'inline-flex';
      btnPause.style.display = 'none';
      btnResume.style.display = 'none';
      btnStop.disabled = true;
    }
  }

  function _updateStats() {
    const stats = (window.AGQueue && window.AGQueue.getStats ? window.AGQueue.getStats() : null) || { total: 0, completed: 0, remaining: 0, failed: 0 };
    const sTotal = document.querySelector('#stat-total');
    const sDone = document.querySelector('#stat-done');
    const sRemain = document.querySelector('#stat-remain');
    const sFailed = document.querySelector('#stat-failed');

    if (sTotal) sTotal.textContent = stats.total;
    if (sDone) sDone.textContent = stats.completed;
    if (sRemain) sRemain.textContent = stats.remaining;
    if (sFailed) sFailed.textContent = stats.failed;
  }

  function _renderFileList() {
    const listEl = document.querySelector('#batch-files-list');
    if (!listEl) return;

    const items = (window.AGQueue && window.AGQueue.getItems ? window.AGQueue.getItems() : null) || [];
    if (items.length === 0) {
      listEl.innerHTML = '<div class="ag-empty">No images loaded yet.</div>';
      return;
    }

    listEl.innerHTML = items.map((item, idx) => {
      let badgeClass = 'ag-tag';
      if (item.status === 'completed') badgeClass += ' ag-tag--success';
      if (item.status === 'failed') badgeClass += ' ag-tag--danger';
      if (item.status === 'processing') badgeClass += ' ag-tag--accent ag-pulse';

      return `
        <div class="ag-queue-item">
          <span class="ag-queue-item__idx">#${String(idx + 1).padStart(3, '0')}</span>
          <span class="ag-queue-item__name" title="${item.name}">${item.name}</span>
          <span class="ag-queue-item__status"><span class="${badgeClass}">${item.status}</span></span>
        </div>
      `;
    }).join('');
  }

  return { render };
})();

window.AGBatchModule = AGBatchModule;

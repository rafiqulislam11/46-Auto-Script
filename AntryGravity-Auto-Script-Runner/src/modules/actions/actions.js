/**
 * actions.js (Photoshop Action Runner Module UI)
 * ──────────────────────────────────────────────
 * Allows picking loaded Action Sets & Actions,
 * running on active document, or triggering automated batch runs.
 */

'use strict';

const AGActionsModule = (() => {

  let _actionSets = [];
  let _selectedSet = '';
  let _selectedAction = '';

  async function render(container) {
    container.innerHTML = `
      <div class="ag-card">
        <div class="ag-section-label">Select Photoshop Action</div>

        <div class="ag-field">
          <label>Action Set</label>
          <select class="ag-select" id="action-set-select">
            <option value="">Loading action sets…</option>
          </select>
        </div>

        <div class="ag-field">
          <label>Action</label>
          <select class="ag-select" id="action-name-select" disabled>
            <option value="">Select an action set first</option>
          </select>
        </div>

        <button class="ag-btn ag-btn--primary ag-run-cta" id="btn-action-run-active" disabled>
          ⚡ Run Action on Current Document
        </button>
      </div>

      <div class="ag-card">
        <div class="ag-section-label">Batch Automation Options</div>

        <div class="ag-field">
          <label>Apply To Batch Count</label>
          <select class="ag-select" id="action-batch-count">
            <option value="all">All images in queue</option>
            <option value="10">First 10 images</option>
            <option value="50">First 50 images</option>
            <option value="100">First 100 images</option>
            <option value="500">First 500 images</option>
          </select>
        </div>

        <div class="ag-toggle-row">
          <span>Continue Queue on Error</span>
          <label class="ag-toggle">
            <input type="checkbox" id="action-continue-error" checked />
            <span class="ag-toggle__track"></span>
          </label>
        </div>

        <div class="ag-toggle-row">
          <span>Auto-Retry Failed Image (1 attempt)</span>
          <label class="ag-toggle">
            <input type="checkbox" id="action-auto-retry" checked />
            <span class="ag-toggle__track"></span>
          </label>
        </div>

        <div class="ag-btn-group ag-mt-m">
          <button class="ag-btn ag-btn--secondary ag-w-full" id="btn-action-run-batch" disabled>
            🚀 Run Action on Batch Queue
          </button>
          <button class="ag-btn ag-btn--ghost ag-w-full ag-mt-s" id="btn-action-add-workflow">
            + Add to Workflow Builder
          </button>
        </div>
      </div>
    `;

    await _loadActions(container);
    _bindEvents(container);
  }

  async function _loadActions(container) {
    const setSelect = container.querySelector('#action-set-select');
    try {
      _actionSets = await window.AGActionRunner.getAvailableActions();
      setSelect.innerHTML = '<option value="">Select Action Set</option>' +
        _actionSets.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    } catch (err) {
      setSelect.innerHTML = '<option value="">Error loading actions</option>';
      AGLogger.error(`[ActionsModule] Could not load actions: ${err.message}`);
    }
  }

  function _bindEvents(container) {
    const setSelect = container.querySelector('#action-set-select');
    const actSelect = container.querySelector('#action-name-select');
    const btnRunActive = container.querySelector('#btn-action-run-active');
    const btnRunBatch = container.querySelector('#btn-action-run-batch');
    const btnAddWorkflow = container.querySelector('#btn-action-add-workflow');

    setSelect.addEventListener('change', () => {
      _selectedSet = setSelect.value;
      const found = _actionSets.find(s => s.name === _selectedSet);
      if (found && found.actions && found.actions.length > 0) {
        actSelect.disabled = false;
        actSelect.innerHTML = '<option value="">Select Action</option>' +
          found.actions.map(a => `<option value="${a}">${a}</option>`).join('');
      } else {
        actSelect.disabled = true;
        actSelect.innerHTML = '<option value="">No actions found in set</option>';
        btnRunActive.disabled = true;
        btnRunBatch.disabled = true;
      }
    });

    actSelect.addEventListener('change', () => {
      _selectedAction = actSelect.value;
      const ready = !!(_selectedSet && _selectedAction);
      btnRunActive.disabled = !ready;
      btnRunBatch.disabled = !ready;
    });

    btnRunActive.addEventListener('click', async () => {
      btnRunActive.disabled = true;
      btnRunActive.textContent = 'Executing Action…';
      try {
        await window.AGActionRunner.runOnCurrent(_selectedSet, _selectedAction);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Action "${_selectedAction}" completed!`, 'success');
      } catch (err) {
        AGLogger.error(`[ActionsModule] Error: ${err.message}`);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Action failed: ${err.message}`, 'error');
      } finally {
        btnRunActive.disabled = false;
        btnRunActive.textContent = '⚡ Run Action on Current Document';
      }
    });

    btnRunBatch.addEventListener('click', async () => {
      const limitVal = container.querySelector('#action-batch-count').value;
      const limit = limitVal === 'all' ? null : parseInt(limitVal, 10);
      const continueOnError = container.querySelector('#action-continue-error').checked;
      const autoRetry = container.querySelector('#action-auto-retry').checked;

      try {
        await window.AGActionRunner.runOnBatch(_selectedSet, _selectedAction, {
          batchLimit: limit,
          continueOnError,
          retryCount: autoRetry ? 1 : 0
        });
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Batch action execution launched!', 'success');
        // Switch to queue view to watch
        if (window.AGUI && window.AGUI.navigate) window.AGUI.navigate('queue');
      } catch (err) {
        AGLogger.error(`[ActionsModule] Batch error: ${err.message}`);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(err.message, 'error');
      }
    });

    btnAddWorkflow.addEventListener('click', () => {
      if (!_selectedSet || !_selectedAction) {
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast('Please select an action set and action first', 'warn');
        return;
      }
      if (window.AGWorkflowEngine) {
        window.AGWorkflowEngine.addStep('action', `Action: ${_selectedAction}`, {
          actionSet: _selectedSet,
          actionName: _selectedAction
        });
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Added action "${_selectedAction}" to Workflow`, 'success');
      }
    });
  }

  return { render };
})();

window.AGActionsModule = AGActionsModule;

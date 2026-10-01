/**
 * logger.js
 * ─────────
 * Central logging system for the AntryGravity Auto Script Runner.
 * Provides timestamped log entries, level-based filtering, and log export.
 * Must be loaded FIRST because all other modules depend on it.
 */

'use strict';

const AGLogger = (() => {
  const MAX_LINES  = 500;
  const _entries   = [];        // { time, level, msg }
  let   _panelEl   = null;      // DOM element for real-time display
  let   _listeners = [];        // subscribers

  // ─── Levels ───────────────────────────────────────────────────────
  const LEVELS = { info:'info', success:'success', warn:'warn', error:'error' };

  // ─── Format timestamp ─────────────────────────────────────────────
  function _ts() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  }

  // ─── Core log ─────────────────────────────────────────────────────
  function _log(level, msg) {
    const entry = { time: _ts(), level, msg: String(msg) };
    _entries.push(entry);
    if (_entries.length > MAX_LINES) _entries.shift();

    // Append to panel if mounted
    if (_panelEl) {
      const line = document.createElement('div');
      line.className = `ag-log-line ag-log-line--${level}`;
      line.innerHTML = `<span class="ag-log-line__time">${entry.time}</span><span class="ag-log-line__msg">${_escHtml(entry.msg)}</span>`;
      _panelEl.appendChild(line);
      _panelEl.scrollTop = _panelEl.scrollHeight;
    }

    // Notify subscribers
    _listeners.forEach(fn => { try { fn(entry); } catch(e) { /* silent */ } });

    // Also echo to console for debug
    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleFn(`[AG ${entry.time}] ${msg}`);
  }

  function _escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ─── Public API ───────────────────────────────────────────────────
  return {
    info   (msg) { _log(LEVELS.info,    msg); },
    success(msg) { _log(LEVELS.success, msg); },
    warn   (msg) { _log(LEVELS.warn,    msg); },
    error  (msg) { _log(LEVELS.error,   msg); },

    /** Mount the panel element; called by ui.js after DOM ready */
    mount(el) {
      _panelEl = el;
      // Render existing entries
      _entries.forEach(e => {
        const line = document.createElement('div');
        line.className = `ag-log-line ag-log-line--${e.level}`;
        line.innerHTML = `<span class="ag-log-line__time">${e.time}</span><span class="ag-log-line__msg">${_escHtml(e.msg)}</span>`;
        _panelEl.appendChild(line);
      });
    },

    /** Subscribe to log events */
    on(fn) { _listeners.push(fn); },

    /** Return all entries as text */
    export() {
      return _entries.map(e => `${e.time}  [${e.level.toUpperCase()}]  ${e.msg}`).join('\n');
    },

    /** Return all entries (read-only copy) */
    getAll() { return [..._entries]; },

    /** Clear the log */
    clear() {
      _entries.length = 0;
      if (_panelEl) _panelEl.innerHTML = '';
    },

    LEVELS
  };
})();

// Make globally available
window.AGLogger = AGLogger;

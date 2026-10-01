/**
 * queue.js (Batch Processing Queue Engine)
 * ─────────────────────────────────────────
 * Non-blocking, event-driven queue system for batch processing Photoshop operations.
 * 
 * Features:
 *  - Handles large batches (10 to 1,000+ files) without freezing Photoshop
 *  - Supports Start, Pause, Resume, Stop, Skip, Retry Failed, Clear
 *  - Per-item status tracking: 'waiting' | 'processing' | 'completed' | 'failed' | 'skipped'
 *  - Progress calculation and estimated time remaining
 *  - Resilient error handling: single-file failure does not abort queue
 */

'use strict';

const AGQueue = (() => {

  const STATUS = {
    WAITING: 'waiting',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    SKIPPED: 'skipped'
  };

  let _items = []; // Array of { id, name, path, entry, status, error, startTime, endTime }
  let _isRunning = false;
  let _isPaused = false;
  let _currentIndex = -1;
  let _delayMs = 250; // user configured delay between docs to prevent memory lock
  let _listeners = [];
  let _processorCallback = null; // function(item, index) => Promise<boolean>

  function _emit(event, data) {
    _listeners.forEach(fn => {
      try { fn(event, data); } catch (e) { console.error('Queue listener error:', e); }
    });
  }

  function _calculateStats() {
    const total = _items.length;
    const completed = _items.filter(i => i.status === STATUS.COMPLETED).length;
    const failed = _items.filter(i => i.status === STATUS.FAILED).length;
    const skipped = _items.filter(i => i.status === STATUS.SKIPPED).length;
    const processing = _items.filter(i => i.status === STATUS.PROCESSING).length;
    const remaining = total - (completed + failed + skipped);
    const percent = total > 0 ? Math.round(((completed + failed + skipped) / total) * 100) : 0;

    return { total, completed, failed, skipped, processing, remaining, percent };
  }

  async function _step() {
    if (!_isRunning) return;

    if (_isPaused) {
      _emit('paused', _calculateStats());
      return;
    }

    // Find next waiting item
    _currentIndex = _items.findIndex(i => i.status === STATUS.WAITING);

    if (_currentIndex === -1) {
      // All items finished
      _isRunning = false;
      const finalStats = _calculateStats();
      AGLogger.success(`[Queue] Batch complete! Processed: ${finalStats.completed}, Failed: ${finalStats.failed}`);
      _emit('complete', finalStats);
      return;
    }

    const item = _items[_currentIndex];
    item.status = STATUS.PROCESSING;
    item.startTime = Date.now();
    _emit('item-start', { item, stats: _calculateStats() });
    AGLogger.info(`[Queue] Processing [${_currentIndex + 1}/${_items.length}]: ${item.name}`);

    try {
      if (_processorCallback) {
        await _processorCallback(item, _currentIndex);
      }
      item.status = STATUS.COMPLETED;
      item.endTime = Date.now();
      AGLogger.success(`[Queue] Completed: ${item.name}`);
      _emit('item-complete', { item, stats: _calculateStats() });
    } catch (err) {
      item.status = STATUS.FAILED;
      item.error = err.message || 'Unknown processing error';
      item.endTime = Date.now();
      AGLogger.error(`[Queue] Failed (${item.name}): ${item.error}`);
      _emit('item-fail', { item, error: item.error, stats: _calculateStats() });
    }

    // Delay between documents to allow garbage collection and OS message pump
    if (_delayMs > 0) {
      await new Promise(r => setTimeout(r, _delayMs));
    }

    // Trigger next item in next microtask / macrotask
    setTimeout(_step, 10);
  }

  return {
    STATUS,

    /**
     * Set the task handler for each item in the queue.
     * @param {Function} callback - async function(item, index)
     */
    setProcessor(callback) {
      _processorCallback = callback;
    },

    setDelay(ms) {
      _delayMs = Math.max(0, parseInt(ms, 10) || 0);
    },

    /**
     * Add files to the queue.
     * @param {Array<Object>} files - [{ name, path, entry }]
     */
    addFiles(files) {
      const added = files.map((f, idx) => ({
        id: `q_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        name: f.name || 'Untitled',
        path: f.path || '',
        entry: f.entry || null,
        status: STATUS.WAITING,
        error: null,
        startTime: null,
        endTime: null
      }));

      _items.push(...added);
      AGLogger.info(`[Queue] Added ${added.length} images. Total in queue: ${_items.length}`);
      _emit('update', _calculateStats());
      return added;
    },

    start() {
      if (_items.length === 0) {
        AGLogger.warn('[Queue] Cannot start empty queue');
        return;
      }
      if (_isRunning && !_isPaused) return;

      _isRunning = true;
      _isPaused = false;
      AGLogger.info('[Queue] Starting batch queue...');
      _emit('start', _calculateStats());
      _step();
    },

    pause() {
      if (!_isRunning || _isPaused) return;
      _isPaused = true;
      AGLogger.warn('[Queue] Batch processing paused');
      _emit('paused', _calculateStats());
    },

    resume() {
      if (!_isRunning || !_isPaused) return;
      _isPaused = false;
      AGLogger.info('[Queue] Batch processing resumed');
      _emit('resume', _calculateStats());
      _step();
    },

    stop() {
      _isRunning = false;
      _isPaused = false;
      AGLogger.warn('[Queue] Batch processing stopped by user');
      _emit('stopped', _calculateStats());
    },

    skip() {
      if (_currentIndex >= 0 && _currentIndex < _items.length) {
        const item = _items[_currentIndex];
        if (item.status === STATUS.PROCESSING) {
          item.status = STATUS.SKIPPED;
          AGLogger.warn(`[Queue] Skipped current item: ${item.name}`);
          _emit('item-skipped', { item, stats: _calculateStats() });
        }
      }
    },

    retryFailed() {
      let resetCount = 0;
      _items.forEach(i => {
        if (i.status === STATUS.FAILED) {
          i.status = STATUS.WAITING;
          i.error = null;
          resetCount++;
        }
      });
      AGLogger.info(`[Queue] Reset ${resetCount} failed items to waiting status`);
      _emit('update', _calculateStats());
      if (resetCount > 0 && !_isRunning) {
        this.start();
      }
    },

    clearQueue() {
      if (_isRunning) {
        this.stop();
      }
      _items = [];
      _currentIndex = -1;
      AGLogger.info('[Queue] Queue cleared');
      _emit('cleared', _calculateStats());
    },

    getItems() {
      return [..._items];
    },

    getStats() {
      return _calculateStats();
    },

    isRunning() {
      return _isRunning && !_isPaused;
    },

    isPaused() {
      return _isPaused;
    },

    on(fn) {
      _listeners.push(fn);
    }
  };
})();

window.AGQueue = AGQueue;

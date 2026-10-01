/**
 * CSInterface.js - Adobe CEP Common Extensibility Platform Interface
 * Provides host communication for Adobe Photoshop 2020 (v21) and 2021 (v22).
 * Safely guards execution in modern UXP and browser environments.
 */

'use strict';

(function(global) {
  if (typeof global.CSInterface !== 'undefined') return;

  function CSInterface() {
    this.isCEP = typeof window.__adobe_cep__ !== 'undefined';
  }

  CSInterface.prototype.getHostEnvironment = function() {
    if (this.isCEP) {
      try {
        return JSON.parse(window.__adobe_cep__.getHostEnvironment());
      } catch (e) {
        return { appId: 'PHSP', appVersion: '21.0.0' };
      }
    }
    return {
      appId: 'PHSP',
      appName: 'Photoshop',
      appVersion: '23.0.0',
      appLocale: 'en_US'
    };
  };

  CSInterface.prototype.evalScript = function(script, callback) {
    if (this.isCEP) {
      window.__adobe_cep__.evalScript(script, callback || function() {});
    } else {
      if (typeof callback === 'function') {
        callback('Error: Not in CEP environment');
      }
    }
  };

  CSInterface.prototype.addEventListener = function(type, listener, obj) {
    if (this.isCEP) {
      window.__adobe_cep__.addEventListener(type, listener, obj);
    }
  };

  CSInterface.prototype.removeEventListener = function(type, listener, obj) {
    if (this.isCEP) {
      window.__adobe_cep__.removeEventListener(type, listener, obj);
    }
  };

  CSInterface.prototype.dispatchEvent = function(event) {
    if (this.isCEP) {
      window.__adobe_cep__.dispatchEvent(event);
    }
  };

  CSInterface.prototype.closeExtension = function() {
    if (this.isCEP) {
      window.__adobe_cep__.closeExtension();
    }
  };

  CSInterface.prototype.openURLInDefaultBrowser = function(url) {
    if (this.isCEP && window.__adobe_cep__.openURLInDefaultBrowser) {
      window.__adobe_cep__.openURLInDefaultBrowser(url);
    } else {
      window.open(url, '_blank');
    }
  };

  CSInterface.prototype.getSystemPath = function(pathType) {
    if (this.isCEP && window.__adobe_cep__.getSystemPath) {
      return window.__adobe_cep__.getSystemPath(pathType);
    }
    return '';
  };

  CSInterface.SystemPath = {
    USER_DATA: "userData",
    COMMON_FILES: "commonFiles",
    MY_DOCUMENTS: "myDocuments",
    APPLICATION: "application",
    EXTENSION: "extension",
    HOST_APPLICATION: "hostApplication"
  };

  global.SystemPath = CSInterface.SystemPath;
  global.CSInterface = CSInterface;
})(typeof window !== 'undefined' ? window : this);

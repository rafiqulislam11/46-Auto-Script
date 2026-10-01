/**
 * AntryGravity Photoshop Automation Script: Multi-Blur Engine
 * Compatibility: Photoshop CS6, CC 2014-2026 (ExtendScript JSX)
 */

#target photoshop

(function() {
  if (app.documents.length === 0) {
    alert("AntryGravity: Please open a document first.");
    return;
  }

  var doc = app.activeDocument;
  var blurRadius = 6.0;

  try {
    app.displayDialogs = DialogModes.NO;
    doc.activeLayer.applyGaussianBlur(blurRadius);
  } catch(e) {
    alert("Error applying Gaussian blur: " + e.message);
  }
})();

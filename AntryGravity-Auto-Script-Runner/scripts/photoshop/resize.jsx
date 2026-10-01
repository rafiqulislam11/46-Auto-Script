/**
 * AntryGravity Photoshop Automation Script: Resize & DPI Resample
 * Compatibility: Photoshop CS6, CC 2014-2026 (ExtendScript JSX)
 */

#target photoshop

(function() {
  if (app.documents.length === 0) {
    alert("AntryGravity: Please open a document first.");
    return;
  }

  var doc = app.activeDocument;
  var targetWidth = 3840;  // Default 4K width
  var targetHeight = 2160; // Default 4K height
  var targetDPI = 300;     // Default print resolution

  try {
    app.displayDialogs = DialogModes.NO;

    // Set resolution without resampling pixels first
    doc.resizeImage(null, null, targetDPI, ResampleMethod.NONE);

    // Resample dimensions with Bicubic Automatic
    var w = new UnitValue(targetWidth, "px");
    var h = new UnitValue(targetHeight, "px");
    doc.resizeImage(w, h, null, ResampleMethod.BICUBICAUTOMATIC);

  } catch(e) {
    alert("Error resizing document: " + e.message);
  }
})();

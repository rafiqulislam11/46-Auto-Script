/**
 * AntryGravity Photoshop Automation Script: Passport Photo Sheet Generator
 * Compatibility: Photoshop CS6, CC 2014-2026 (ExtendScript JSX)
 * Crops active photo to passport dimensions, enforces 300 DPI, and arranges a 6-up print grid.
 */

#target photoshop

(function() {
  if (app.documents.length === 0) {
    alert("AntryGravity: Please open an image document first.");
    return;
  }

  var srcDoc = app.activeDocument;
  var targetDPI = 300;
  var photoWidthInches = 2.0;
  var photoHeightInches = 2.0;

  try {
    app.displayDialogs = DialogModes.NO;

    // Resample resolution to 300 DPI
    srcDoc.resizeImage(null, null, targetDPI, ResampleMethod.NONE);

    // Crop or resize to 2x2 inches (600x600 pixels)
    var photoPxW = photoWidthInches * targetDPI;
    var photoPxH = photoHeightInches * targetDPI;
    srcDoc.resizeImage(new UnitValue(photoPxW, "px"), new UnitValue(photoPxH, "px"), targetDPI, ResampleMethod.BICUBICAUTOMATIC);
    srcDoc.flatten();

    // Copy photo
    srcDoc.selection.selectAll();
    srcDoc.selection.copy();

    // Create 4x6 inch print sheet (1200 x 1800 px at 300 DPI)
    var sheetDoc = app.documents.add(
      new UnitValue(1800, "px"),
      new UnitValue(1200, "px"),
      targetDPI,
      "Passport_Print_Sheet_4x6",
      NewDocumentMode.RGB,
      DocumentFill.WHITE
    );

    // Paste 6 copies in a 3x2 grid with margins
    // Columns: x = 150, 650, 1150; Rows: y = 50, 600
    var positions = [
      [150, 50],  [650, 50],  [1150, 50],
      [150, 600], [650, 600], [1150, 600]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pasteLayer = sheetDoc.paste();
      pasteLayer.name = "Passport Copy " + (i + 1);

      // Translate layer to grid position
      var currentBounds = pasteLayer.bounds;
      var currentX = currentBounds[0].value;
      var currentY = currentBounds[1].value;

      var targetX = positions[i][0];
      var targetY = positions[i][1];

      pasteLayer.translate(targetX - currentX, targetY - currentY);
    }

    sheetDoc.flatten();

  } catch(err) {
    alert("AntryGravity Passport Error: " + err.message);
  }
})();

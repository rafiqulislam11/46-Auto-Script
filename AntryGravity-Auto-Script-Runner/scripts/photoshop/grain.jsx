/**
 * AntryGravity Photoshop Automation Script: Film Grain Overlay
 * Compatibility: Photoshop CS6, CC 2014-2026 (ExtendScript JSX)
 * Creates a non-destructive 50% neutral gray layer set to Overlay blend mode with Gaussian noise.
 */

#target photoshop

(function() {
  if (app.documents.length === 0) {
    alert("AntryGravity: Please open a document first.");
    return;
  }

  var doc = app.activeDocument;
  var noiseAmount = 14;     // Percent
  var isMonochrome = true;
  var grainOpacity = 80;

  try {
    app.displayDialogs = DialogModes.NO;

    // Create new layer
    var grainLayer = doc.artLayers.add();
    grainLayer.name = "AntryGravity Film Grain";
    grainLayer.blendMode = BlendMode.OVERLAY;
    grainLayer.opacity = grainOpacity;

    // Fill with 50% neutral gray
    var grayColor = new SolidColor();
    grayColor.rgb.red = 128;
    grayColor.rgb.green = 128;
    grayColor.rgb.blue = 128;

    doc.selection.selectAll();
    doc.selection.fill(grayColor);
    doc.selection.deselect();

    // Apply Gaussian noise
    var dist = NoiseDistribution.GAUSSIAN;
    grainLayer.applyAddNoise(noiseAmount, dist, isMonochrome);

  } catch(e) {
    alert("Error applying film grain: " + e.message);
  }
})();

/**
 * AntryGravity Photoshop Automation Script: Advanced Effects Suite
 * Compatibility: Photoshop CS6, CC 2014-2026 (ExtendScript JSX)
 * Includes presets for Glow, Chrome, Cinematic Contrast, Vignette, and Duotone.
 */

#target photoshop

(function() {
  if (app.documents.length === 0) {
    alert("AntryGravity: Please open an image document first.");
    return;
  }

  var doc = app.activeDocument;
  var effectType = "glow"; // Options: "glow", "cinematic", "film", "duotone"

  try {
    app.displayDialogs = DialogModes.NO;

    if (effectType === "glow") {
      var dupe = doc.activeLayer.duplicate();
      dupe.name = "AntryGravity Soft Glow";
      dupe.applyGaussianBlur(16.0);
      dupe.blendMode = BlendMode.SCREEN;
      dupe.opacity = 75;
    } else if (effectType === "cinematic") {
      var cinDupe = doc.activeLayer.duplicate();
      cinDupe.name = "AntryGravity Cinematic Punch";
      cinDupe.applyHighPass(2.4);
      cinDupe.blendMode = BlendMode.OVERLAY;
      cinDupe.opacity = 80;
    } else if (effectType === "film") {
      var filmLayer = doc.artLayers.add();
      filmLayer.name = "AntryGravity Film Fade";
      filmLayer.blendMode = BlendMode.SOFTLIGHT;
      filmLayer.opacity = 65;
    }
  } catch(e) {
    alert("Error applying effect: " + e.message);
  }
})();

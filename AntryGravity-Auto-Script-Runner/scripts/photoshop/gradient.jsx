/**
 * AntryGravity Photoshop Automation Script: Gradient Tone Overlay
 * Compatibility: Photoshop CS6, CC 2014-2026 (ExtendScript JSX)
 */

#target photoshop

(function() {
  if (app.documents.length === 0) {
    alert("AntryGravity: Please open a document first.");
    return;
  }

  var doc = app.activeDocument;

  try {
    app.displayDialogs = DialogModes.NO;

    var gradLayer = doc.artLayers.add();
    gradLayer.name = "AntryGravity Gradient Tone";
    gradLayer.blendMode = BlendMode.SOFTLIGHT;
    gradLayer.opacity = 75;

    // Execute gradient map adjustment via action descriptor
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass(stringIDToTypeID("gradientMapClass"));
    desc.putReference(stringIDToTypeID("null"), ref);
    executeAction(stringIDToTypeID("make"), desc, DialogModes.NO);

  } catch(e) {
    alert("Error applying gradient overlay: " + e.message);
  }
})();

/**
 * AntryGravity Photoshop Automation Script: Subject Isolation & Background Removal
 * Compatibility: Photoshop CC 2018-2026 (ExtendScript JSX)
 * Triggers Sensei Select Subject via stringIDToTypeID autoCutout and creates layer mask.
 */

#target photoshop

(function() {
  if (app.documents.length === 0) {
    alert("AntryGravity: Please open an image document first.");
    return;
  }

  var doc = app.activeDocument;

  try {
    app.displayDialogs = DialogModes.NO;

    // Trigger Select Subject
    var desc = new ActionDescriptor();
    desc.putBoolean(stringIDToTypeID("sampleAllLayers"), false);
    executeAction(stringIDToTypeID("autoCutout"), desc, DialogModes.NO);

    // Apply feather of 0.5px
    doc.selection.feather(0.5);

    // Add Layer Mask from selection
    var maskDesc = new ActionDescriptor();
    maskDesc.putClass(stringIDToTypeID("new"), stringIDToTypeID("channel"));
    var ref = new ActionReference();
    ref.putEnumerated(stringIDToTypeID("channel"), stringIDToTypeID("channel"), stringIDToTypeID("mask"));
    maskDesc.putReference(stringIDToTypeID("at"), ref);
    maskDesc.putEnumerated(stringIDToTypeID("using"), stringIDToTypeID("userMaskOptions"), stringIDToTypeID("revealSelection"));
    executeAction(stringIDToTypeID("make"), maskDesc, DialogModes.NO);

  } catch(e) {
    alert("Error executing background separation: " + e.message);
  }
})();

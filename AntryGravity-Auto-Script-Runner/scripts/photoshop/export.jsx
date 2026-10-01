/**
 * AntryGravity Photoshop Automation Script: Batch Document Exporter
 * Compatibility: Photoshop CS6, CC 2014-2026 (ExtendScript JSX)
 */

#target photoshop

(function() {
  if (app.documents.length === 0) return;

  var doc = app.activeDocument;
  var desktopFolder = Folder.desktop;
  var outFileName = doc.name.replace(/\.[^\.]+$/, "") + "_EXPORT.jpg";
  var outFile = new File(desktopFolder + "/" + outFileName);

  try {
    app.displayDialogs = DialogModes.NO;

    var saveOptions = new JPEGSaveOptions();
    saveOptions.quality = 11;
    saveOptions.formatOptions = FormatOptions.STANDARDBASELINE;
    saveOptions.embedColorProfile = true;

    doc.saveAs(outFile, saveOptions, true, Extension.LOWERCASE);
  } catch(e) {
    alert("Export failed: " + e.message);
  }
})();

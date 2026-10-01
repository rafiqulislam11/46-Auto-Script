/**
 * AntryGravity Adobe Illustrator Automation Script: Image Trace Vectorizer
 * Compatibility: Adobe Illustrator CS6, CC 2014-2026 (ExtendScript JSX)
 * Opens an active or selected raster image, applies Image Trace preset, expands paths,
 * and converts pixels into clean editable vector geometry.
 */

#target illustrator

function traceRasterImage(sourceFilePath, outputVectorPath, presetName, outputFormat) {
  try {
    var srcFile = new File(sourceFilePath);
    if (!srcFile.exists) {
      return JSON.stringify({ error: "Source file not found: " + sourceFilePath });
    }

    var doc = app.open(srcFile);
    var rasterItem = null;

    if (doc.placedItems.length > 0) {
      rasterItem = doc.placedItems[0];
    } else if (doc.rasterItems.length > 0) {
      rasterItem = doc.rasterItems[0];
    }

    if (!rasterItem) {
      doc.close(SaveOptions.DONOTSAVECHANGES);
      return JSON.stringify({ error: "No raster item found in document to trace." });
    }

    // Apply Live Trace / Image Trace
    var traceObj = rasterItem.trace();
    if (presetName) {
      try {
        traceObj.tracing.preset = presetName;
      } catch(presetErr) {
        // Fall back to default tracing preset
      }
    }

    // Expand tracing into paths
    app.executeMenuCommand("Live Trace Expand");

    // Export to target format
    var destFile = new File(outputVectorPath);
    var fmt = (outputFormat || "svg").toLowerCase();

    if (fmt === "svg") {
      var svgOpts = new ExportOptionsSVG();
      svgOpts.embedRasterImages = false;
      svgOpts.cssProperties = SVGCSSPropertyLocation.STYLEATTRIBUTES;
      svgOpts.fontSubsetting = SVGFontSubsetting.GLYPHSUSED;
      doc.exportFile(destFile, ExportType.SVG, svgOpts);
    } else if (fmt === "eps") {
      var epsOpts = new EPSSaveOptions();
      epsOpts.compatibility = Compatibility.ILLUSTRATOR17;
      doc.saveAs(destFile, epsOpts);
    } else {
      var aiOpts = new IllustratorSaveOptions();
      aiOpts.compatibility = Compatibility.ILLUSTRATOR17;
      doc.saveAs(destFile, aiOpts);
    }

    doc.close(SaveOptions.DONOTSAVECHANGES);
    return JSON.stringify({ success: true, path: destFile.fsName });

  } catch(err) {
    return JSON.stringify({ error: err.message });
  }
}

// Can be run standalone in Illustrator
if (typeof $.level !== "undefined" && app.documents.length > 0) {
  // Standalone execution on active document
  if (app.activeDocument.rasterItems.length > 0 || app.activeDocument.placedItems.length > 0) {
    var item = app.activeDocument.placedItems.length > 0 ? app.activeDocument.placedItems[0] : app.activeDocument.rasterItems[0];
    item.trace();
    app.executeMenuCommand("Live Trace Expand");
    alert("AntryGravity: Image Trace completed & expanded!");
  }
}

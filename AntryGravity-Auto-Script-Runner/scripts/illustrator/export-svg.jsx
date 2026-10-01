/**
 * AntryGravity Adobe Illustrator Automation Script: Optimized SVG Exporter
 * Compatibility: Adobe Illustrator CS6, CC 2014-2026 (ExtendScript JSX)
 * Exports active document to clean web-ready SVG without embedded raster binaries.
 */

#target illustrator

(function() {
  if (app.documents.length === 0) {
    alert("AntryGravity: Please open an Illustrator vector document first.");
    return;
  }

  var doc = app.activeDocument;
  var desktopFolder = Folder.desktop;
  var baseName = doc.name.replace(/\.[^\.]+$/, "");
  var outFile = new File(desktopFolder + "/" + baseName + "_VECTOR.svg");

  try {
    var svgOptions = new ExportOptionsSVG();
    svgOptions.embedRasterImages = false;
    svgOptions.cssProperties = SVGCSSPropertyLocation.STYLEATTRIBUTES;
    svgOptions.coordinatePrecision = 3;
    svgOptions.documentEncoding = SVGDocumentEncoding.UTF8;
    svgOptions.fontSubsetting = SVGFontSubsetting.GLYPHSUSED;

    doc.exportFile(outFile, ExportType.SVG, svgOptions);
    alert("AntryGravity: Vector exported to " + outFile.fsName);
  } catch(e) {
    alert("SVG Export failed: " + e.message);
  }
})();

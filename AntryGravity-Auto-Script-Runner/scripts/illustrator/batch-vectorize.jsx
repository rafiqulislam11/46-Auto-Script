/**
 * AntryGravity Adobe Illustrator Automation Script: Batch Raster-to-Vector Processor
 * Compatibility: Adobe Illustrator CS6, CC 2014-2026 (ExtendScript JSX)
 * Processes an entire folder of bitmap images, executes Image Trace, and outputs SVG/EPS.
 */

#target illustrator

(function() {
  var inFolder = Folder.selectDialog("AntryGravity: Select input folder with images to vectorize");
  if (!inFolder) return;

  var outFolder = Folder.selectDialog("AntryGravity: Select output folder for vector files");
  if (!outFolder) return;

  var files = inFolder.getFiles(/\.(jpg|jpeg|png|tif|tiff|bmp)$/i);
  if (files.length === 0) {
    alert("No supported images found in " + inFolder.fsName);
    return;
  }

  var successCount = 0;
  var failCount = 0;

  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    try {
      var doc = app.open(f);
      var item = doc.placedItems.length > 0 ? doc.placedItems[0] : (doc.rasterItems.length > 0 ? doc.rasterItems[0] : null);

      if (item) {
        item.trace();
        app.executeMenuCommand("Live Trace Expand");

        var outSvg = new File(outFolder.fsName + "/" + f.name.replace(/\.[^\.]+$/, "") + ".svg");
        var svgOpts = new ExportOptionsSVG();
        svgOpts.embedRasterImages = false;
        doc.exportFile(outSvg, ExportType.SVG, svgOpts);
        successCount++;
      } else {
        failCount++;
      }

      doc.close(SaveOptions.DONOTSAVECHANGES);
    } catch(err) {
      failCount++;
    }
  }

  alert("AntryGravity Vector Batch Completed!\nVectorized: " + successCount + "\nFailed: " + failCount);
})();

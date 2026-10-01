/**
 * AntryGravity Photoshop Automation Script: Action Runner Bridge
 * Compatibility: Photoshop CS6, CC 2014-2026 (ExtendScript JSX)
 * Executes a named action safely within an ActionSet with error logging.
 */

#target photoshop

function runAntryGravityAction(actionName, actionSet) {
  if (app.documents.length === 0) {
    return JSON.stringify({ error: "No active document open" });
  }

  try {
    app.displayDialogs = DialogModes.NO;
    app.doAction(actionName, actionSet);
    return JSON.stringify({ success: true, action: actionName, set: actionSet });
  } catch(e) {
    return JSON.stringify({ error: e.message, action: actionName, set: actionSet });
  }
}

// Example invocation when run directly from Photoshop File > Scripts
if (typeof $.level !== "undefined" && app.documents.length > 0) {
  // Can be tested interactively
  // runAntryGravityAction("Vignette (selection)", "Default Actions");
}

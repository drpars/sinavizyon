// modules/ui/updaters/button-updater.js
export function setUIEnabled(enabled) {
  const buttons = ["btnSina", "btnHyp", "btnDeleteData", "btnExportData", "btnRevokeConsent", "btnChangelog"];
  buttons.forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = !enabled;
  });
  const inputs = ["ay", "yil", "birimId", "nufus"];
  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = !enabled;
  });
}

// modules/ui/updaters/kvkk-updater.js
export function applyKvkkVisibility(hide) {
  const settingsNote = document.getElementById("kvkkSettingsNote");
  const footer = document.getElementById("kvkkFooter");
  const toggleBtn = document.getElementById("btnToggleKvkk");
  
  if (settingsNote) settingsNote.style.display = hide ? "none" : "block";
  if (footer) footer.style.display = hide ? "none" : "flex";
  if (toggleBtn) {
    toggleBtn.textContent = hide ? "🔓 KVKK Bilgilendirmelerini Göster" : "🔒 KVKK Bilgilendirmelerini Gizle";
  }
  chrome.storage.local.set({ kvkkHidden: hide, kvkkFooterHidden: hide });
}

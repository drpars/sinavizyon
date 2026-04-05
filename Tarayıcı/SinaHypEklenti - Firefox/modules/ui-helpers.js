// modules/ui-helpers.js
import { calculateKHTPerformance } from './calculations.js';

export function updateKHTBar(data, userType = "doctor") {
  const kht = calculateKHTPerformance(data, userType);
  const percent = kht.percentage;
  const percentElem = document.getElementById('khtPercentage');
  const barFill = document.getElementById('khtBarFill');
  const khtDurumElem = document.getElementById('khtDurum');
  if (percentElem) percentElem.innerText = percent + '%';
  if (barFill) barFill.style.width = percent + '%';
  if (khtDurumElem) {
    khtDurumElem.innerText = percent >= 70 ? 'TAMAM' : 'EKSİK';
    khtDurumElem.style.color = percent >= 70 ? 'var(--green)' : 'var(--red)';
  }
  const marks = document.querySelectorAll('.kht-bar-marks span');
  if (marks.length >= 4) {
    const mark40 = marks[1];
    const mark70 = marks[2];
    if (mark40) mark40.innerHTML = percent >= 40 ? '40% ✓' : '40%';
    if (mark70) mark70.innerHTML = percent >= 70 ? '70% ✓' : '70%';
  }
}

export function applyTheme(theme) {
  if (theme === "dark") document.body.classList.add("dark-mode");
  else document.body.classList.remove("dark-mode");
}

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

export function setUIEnabled(enabled) {
  const buttons = ["btnSina", "btnHyp", "btnDeleteData", "btnExportData", "btnRevokeConsent", "btnChangelog"];
  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = !enabled;
  });
  const inputs = ["ay", "yil", "birimId", "nufus", "surecYonetimi"];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = !enabled;
  });
}

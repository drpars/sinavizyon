// modules/ui-updaters.js
// ============================================================
// Tüm UI güncelleme fonksiyonları buradan yönetilir
// ============================================================

import { buttons, inputs, containers, infoElements, setDomSinaTime, setDomHypTime } from './dom-elements.js';
import { getCurrentUserType as getStateUserType } from './state.js';  // ← DÜZELTİLDİ
import { updateKHTBar } from './ui-helpers.js';
import { updateTable } from './ui.js';
import { tavanHesapla } from './calculations.js';
import { loadNufusForBirim, loadDataForCurrentBirim, loadDataForCurrentBirimWithMerge } from './storage.js';
import { loadNurseShowAllForBirim } from './state.js';  // ← BU DA DÜZELTİLDİ

// ========== TABLO GÜNCELLEMELERİ ==========
export function clearTable() {
  const tbody = containers.tableBody();
  if (tbody) tbody.innerHTML = "";
}

export function resetKatsayiValues() {
  const katsayiElement = infoElements.totalKatsayi();
  if (katsayiElement) katsayiElement.textContent = "1.00000";
  
  const tavanElement = infoElements.tavanKatsayi();
  if (tavanElement && getStateUserType() === "nurse") {
    tavanElement.textContent = "1.00000";
  }
}

// ========== ZAMAN GÖSTERGELERİ ==========
export function clearTimeIndicators() {
  setDomSinaTime("");
  setDomHypTime("");
}

// ========== BUTON DURUM GÜNCELLEMELERİ ==========
export function updateHypButtonState(hasData) {
  const hypBtn = buttons.hyp();
  if (hypBtn) hypBtn.disabled = !hasData;
}

// ========== KULLANICI TİPİ UI GÜNCELLEMELERİ ==========
export function updateUIForUserType(type, birimId, currentAy, currentYil, updateHypButtonStateFn) {
  const tavanKart = document.getElementById("tavanKatsayi")?.closest(".score-box");
  const surecRow = document.getElementById("surecYonetimi")?.closest(".row");
  const nufusRow = document.getElementById("nufus")?.closest(".row");
  const sinaBtn = buttons.sina();
  const hypBtn = buttons.hyp();
  
  if (type === "nurse") {
    // ASÇ MODU
    if (tavanKart) tavanKart.style.display = "none";
    if (surecRow) surecRow.style.display = "none";
    if (nufusRow) nufusRow.style.display = "none";
    if (sinaBtn) sinaBtn.textContent = "SİNA";
    if (hypBtn) hypBtn.textContent = "SİNA BİRİM";
    if (sinaBtn) sinaBtn.disabled = false;
    
    if (birimId) {
      loadNurseShowAllForBirim(birimId).then((showAll) => {
        loadDataForCurrentBirimWithMerge(updateTable, type, birimId, updateHypButtonStateFn, showAll, currentAy, currentYil);
      });
    } else {
      loadDataForCurrentBirimWithMerge(updateTable, type, birimId, updateHypButtonStateFn, false, currentAy, currentYil);
    }
  } else {
    // DOKTOR MODU
    if (tavanKart) tavanKart.style.display = "flex";
    if (surecRow) surecRow.style.display = "flex";
    if (nufusRow) nufusRow.style.display = "flex";
    if (sinaBtn) sinaBtn.textContent = "SİNA";
    if (hypBtn) hypBtn.textContent = "HYP";
    if (sinaBtn) sinaBtn.disabled = false;
    
    if (birimId) {
      loadNufusForBirim(birimId, tavanHesapla);
    }
    loadDataForCurrentBirim(updateTable, type, birimId, updateHypButtonStateFn, false, currentAy, currentYil);
  }
}

// ========== KVKK GÖRÜNÜRLÜK ==========
export function applyKvkkVisibilityFromStorage() {
  chrome.storage.local.get(["kvkkHidden"], (res) => {
    const kvkkSettingsNote = document.getElementById("kvkkSettingsNote");
    const footer = document.getElementById("kvkkFooter");
    const toggleBtn = document.getElementById("btnToggleKvkk");
    const hide = res.kvkkHidden === true;
    
    if (kvkkSettingsNote) kvkkSettingsNote.style.display = hide ? "none" : "block";
    if (footer) footer.style.display = hide ? "none" : "flex";
    if (toggleBtn) {
      toggleBtn.textContent = hide ? "🔓 KVKK Bilgilendirmelerini Göster" : "🔒 KVKK Bilgilendirmelerini Gizle";
    }
  });
}

// ========== TÜM UI'YI SIfIRLA ==========
export function resetUIAfterDataClear() {
  clearTable();
  clearTimeIndicators();
  resetKatsayiValues();
  updateKHTBar([], getStateUserType());
}

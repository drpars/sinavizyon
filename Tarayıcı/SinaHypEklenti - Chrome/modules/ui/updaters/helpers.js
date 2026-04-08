// modules/ui/updaters/helpers.js
import { buttons, inputs, containers, infoElements, setDomSinaTime, setDomHypTime } from '../../core/dom.js';
import { getCurrentUserType as getStateUserType } from '../../core/state.js';
import { updateKHTBar } from './kht-updater.js';
import { updateTable } from './table-updater.js';
import { tavanHesapla } from '../../lib/calculations.js';
import { loadNufusForBirim, loadDataForCurrentBirim, loadDataForCurrentBirimWithMerge } from '../../core/storage.js';
import { loadNurseShowAllForBirim } from '../../features/nurse/index.js';

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
export function updateHypButtonStateUI(hasData, userType = null) {
  const hypBtn = buttons.hyp();
  if (!hypBtn) return;
  
  // ASÇ modunda SİNA BİRİM butonu HER ZAMAN aktif
  if (userType === "nurse") {
    hypBtn.disabled = false;
    console.log("🔘 ASÇ modu: SİNA BİRİM butonu aktif edildi");
  } else {
    // Doktor modunda HYP butonu sadece SİNA verisi varsa aktif
    hypBtn.disabled = !hasData;
    console.log("🔘 Doktor modu: HYP butonu aktif:", !hypBtn.disabled);
  }
}

// ========== KULLANICI TİPİ UI GÜNCELLEMELERİ ==========
export function updateUIForUserType(type, birimId, currentAy, currentYil, updateHypButtonStateFn) {
  const tavanKart = document.getElementById("tavanKatsayi")?.closest(".score-box");
  const nufusRow = document.getElementById("nufus")?.closest(".row");
  const sinaBtn = buttons.sina();
  const hypBtn = buttons.hyp();
  
  if (type === "nurse") {
    // ASÇ MODU
    if (tavanKart) tavanKart.style.display = "none";
    if (nufusRow) nufusRow.style.display = "none";
    if (sinaBtn) sinaBtn.textContent = "SİNA";
    if (hypBtn) hypBtn.textContent = "SİNA BİRİM";
    if (sinaBtn) sinaBtn.disabled = false;
    
    // ✅ SİNA BİRİM butonunu her zaman aktif yap
    if (hypBtn) hypBtn.disabled = false;
    
    if (birimId) {
      loadNurseShowAllForBirim(birimId).then((showAll) => {
        loadDataForCurrentBirimWithMerge(updateTable, type, birimId, (hasData) => {
          // ASÇ modunda buton her zaman aktif olduğu için updateHypButtonStateFn çağrısına gerek yok
          // ama callback'i çağırarak dışarıdaki state'i güncelleyelim
          if (updateHypButtonStateFn) updateHypButtonStateFn(hasData, type);
        }, showAll, currentAy, currentYil);
      });
    } else {
      loadDataForCurrentBirimWithMerge(updateTable, type, birimId, (hasData) => {
        if (updateHypButtonStateFn) updateHypButtonStateFn(hasData, type);
      }, false, currentAy, currentYil);
    }
  } else {
    // DOKTOR MODU
    if (tavanKart) tavanKart.style.display = "flex";
    if (nufusRow) nufusRow.style.display = "flex";
    if (sinaBtn) sinaBtn.textContent = "SİNA";
    if (hypBtn) hypBtn.textContent = "HYP";
    if (sinaBtn) sinaBtn.disabled = false;
    
    if (birimId) {
      loadNufusForBirim(birimId, tavanHesapla);
    }
    loadDataForCurrentBirim(updateTable, type, birimId, (hasData) => {
      if (updateHypButtonStateFn) updateHypButtonStateFn(hasData, type);
    }, false, currentAy, currentYil);
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

// ========== TÜM UI'YI SIFIRLA ==========
export function resetUIAfterDataClear() {
  clearTable();
  clearTimeIndicators();
  resetKatsayiValues();
  updateKHTBar([], getStateUserType());
}

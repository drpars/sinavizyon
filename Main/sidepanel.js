// sidepanel.js - v1.6.7
// ============================================================
// SADECE BAŞLATMA VE ORCHESTRATION
// ============================================================

// ---------- CORE ----------
import { 
  buttons, inputs, containers, infoElements, modals, khtMarks,
  getDomBirimId, getDomUserType, getDomAy, getDomYil,
  getDomSurecCarpan, getDomNufus, setDomNufus, setDomBirimId,
  setDomSinaTime, setDomHypTime, setDomTotalKatsayi, setDomTavanKatsayi,
  setDomKhtPercentage, setDomKhtBarWidth, setDomKhtDurum, clearDomTableBody,
  showDomSettingsPanel, toggleDomSettingsPanel, showDomAdvancedSettings, toggleDomAdvancedSettings
} from './modules/core/dom.js';

import { 
  getCurrentUserType, getCurrentBirimId, getCurrentShowAll,
  getPendingStorageType, getPendingShowAll, getFontSettingsActive,
  setCurrentUserType, setCurrentBirimId, setCurrentShowAll,
  setPendingStorageType, setPendingShowAll, setFontSettingsActive,
  updateState, loadStateFromStorage, saveCurrentUserTypeToStorage,
  saveCurrentBirimIdToStorage
} from './modules/core/state.js';

import { 
  loadNurseShowAllForBirim, saveNurseShowAllForBirim 
} from './modules/features/nurse/index.js';

import { 
  getCurrentBirimId as getStorageBirimId,
  storeDataWithTimestamp, saveNufusForBirim, loadNufusForBirim,
  loadDataForCurrentBirim, loadDataForCurrentBirimWithMerge,
  cleanExpiredData, exportData, revokeConsent
} from './modules/core/storage.js';

import { bindAllEvents } from './modules/core/events.js';

// ---------- UI ----------
import { 
  updateTable, applyTheme, applyKvkkVisibility, setUIEnabled,
  updateHypButtonStateUI, updateUIForUserType,
  applyKvkkVisibilityFromStorage, resetUIAfterDataClear, updateKHTBar
} from './modules/ui/updaters/index.js';

import { 
  requestConsent, showFirstTimeUserTypeModal, showWhatsNewModal
} from './modules/ui/components/index.js';

// ---------- LIB ----------
import { tavanHesapla } from './modules/lib/calculations.js';
import { getCurrentYearMonth, getMonthNumber, isDateValid } from './modules/lib/date-utils.js';
import { migrateFromOldStorage } from './modules/lib/migration.js';
import { hypToSinaMap } from './modules/lib/constants.js';
import { buildSinaUrl, HYP_URLS } from './modules/lib/config.js';

// ========== HELPER FUNCTIONS ==========
function combineData(data) {
  const map = new Map();
  data.forEach(item => {
    const existing = map.get(item.ad);
    if (existing) {
      existing.gereken = item.gereken || existing.gereken;
      existing.devreden = item.devreden || existing.devreden;
      existing.yapilan = item.yapilan || existing.yapilan;
    } else {
      map.set(item.ad, { ...item });
    }
  });
  return Array.from(map.values());
}

function setUserType(type) {
  setCurrentUserType(type);
  saveCurrentUserTypeToStorage();
  
  const birimId = getDomBirimId();
  setCurrentBirimId(birimId);
  
  const currentAy = getDomAy();
  const currentYil = getDomYil();
  
  updateUIForUserType(type, birimId, currentAy, currentYil, updateHypButtonStateUI);
}

function deleteAllData() {
  import('./modules/ui/components/index.js').then(({ confirmDialog, messageDialog }) => {
    confirmDialog(
      "TÜM BİRİMLERİN tüm verileri kalıcı olarak silinecek. Devam etmek istiyor musunuz?",
      "Veri Silme Onayı"
    ).then((confirmed) => {
      if (!confirmed) return;
      const prefixes = ["savedResults_", "sinaLastTime_", "hypLastTime_", "nufus_", "nurseShowAll_"];
      chrome.storage.local.get(null, (items) => {
        const keysToRemove = Object.keys(items).filter(key => prefixes.some(p => key.startsWith(p)));
        if (items.birimId !== undefined) keysToRemove.push("birimId");
        const userTypeBeforeDelete = items.userType || "doctor";
        if (keysToRemove.length > 0) {
          chrome.storage.local.remove(keysToRemove, () => {
            resetUIAfterDataClear();
            setDomNufus("");
            setDomBirimId("");
            setCurrentBirimId("");
            setCurrentShowAll(false);
            
            const userTypeSelect = inputs.userType();
            if (userTypeSelect) userTypeSelect.value = userTypeBeforeDelete;
            setUserType(userTypeBeforeDelete);
            
            messageDialog("Tüm birimlere ait veriler başarıyla silindi.", "İşlem Tamam");
          });
        } else {
          messageDialog("Silinecek veri bulunamadı.", "Bilgi");
        }
      });
    });
  });
}

// ========== SAYFA YÜKLENİNCE ==========
document.addEventListener("DOMContentLoaded", async function () {
  const aylar = ["OCAK", "SUBAT", "MART", "NISAN", "MAYIS", "HAZIRAN", "TEMMUZ", "AGUSTOS", "EYLUL", "EKIM", "KASIM", "ARALIK"];
  const suAn = new Date();
  const aySelect = document.getElementById("ay");
  const yilInput = document.getElementById("yil");

  function reloadDataByMonth() {
    const birimId = getCurrentBirimId();
    if (!birimId) return;
    
    const selectedAy = getDomAy();
    const selectedYil = getDomYil();
    const userType = getCurrentUserType();
    
    if (userType === "nurse") {
      loadNurseShowAllForBirim(birimId).then((showAll) => {
        loadDataForCurrentBirimWithMerge(updateTable, userType, birimId, (hasData) => {
          updateHypButtonStateUI(hasData, userType);
        }, showAll, selectedAy, selectedYil);
      });
    } else {
      loadDataForCurrentBirim(updateTable, userType, birimId, (hasData) => {
        updateHypButtonStateUI(hasData, userType);
      }, false, selectedAy, selectedYil);
    }
  }

  if (aySelect) aySelect.value = aylar[suAn.getMonth()];
  if (yilInput) yilInput.value = suAn.getFullYear();

  // Rıza kontrolü
  const consentRes = await new Promise(resolve => chrome.storage.local.get(["kvkkConsent"], resolve));
  let hasConsent = consentRes.kvkkConsent === true;
  if (!hasConsent) hasConsent = await requestConsent();
  if (!hasConsent) {
    setUIEnabled(false);
    document.getElementById("consentWarning")?.classList.remove("hidden");
    return;
  }
  setUIEnabled(true);
  document.getElementById("consentWarning")?.classList.add("hidden");

  // İlk kurulum kontrolü
  const userTypeExists = await new Promise(resolve => 
    chrome.storage.local.get(["userType"], (res) => resolve(res.userType !== undefined))
  );
  if (!userTypeExists) {
    const { userType: selectedType, theme: selectedTheme } = await showFirstTimeUserTypeModal();
    await chrome.storage.local.set({ userType: selectedType, themePreference: selectedTheme });
    const userTypeSelect = document.getElementById("userTypeSelect");
    if (userTypeSelect) userTypeSelect.value = selectedType;
    applyTheme(selectedTheme);
    setUserType(selectedType);
  }

  cleanExpiredData(updateTable);
  migrateFromOldStorage();

  // Güncelleme sonrası yenilikler
  const lastVersionSeen = await new Promise(resolve => 
    chrome.storage.local.get(["lastVersionSeen"], (res) => resolve(res.lastVersionSeen))
  );
  if (lastVersionSeen !== "1.6.7") {
    await showWhatsNewModal("1.6.7");
    await chrome.storage.local.set({ lastVersionSeen: "1.6.7" });
  }

  // Kullanıcı tipi
  const userTypeSelect = document.getElementById("userTypeSelect");
  if (userTypeSelect) userTypeSelect.value = "doctor";
  if (userTypeExists) {
    chrome.storage.local.get(["userType"], (res) => {
      const savedType = res.userType || "doctor";
      if (userTypeSelect) userTypeSelect.value = savedType;
      setUserType(savedType);
    });
  }

  // Sürüm numarası
  try {
    const manifest = chrome.runtime.getManifest();
    const versionBadge = document.getElementById("versionBadge");
    if (versionBadge && manifest?.version) versionBadge.textContent = `v${manifest.version}`;
  } catch (e) {
    const versionBadge = document.getElementById("versionBadge");
    if (versionBadge) versionBadge.textContent = "v1.6.7";
  }

  // Font ayarı
  const fontToggle = document.getElementById("fontToggleCheckbox");
  const fontContainer = document.getElementById("fontSettingsContainer");
  const fontSizeSlider = document.getElementById("fontSizeSlider");
  const fontSizeValue = document.getElementById("fontSizeValue");
  let fontSettingsActive = false;
  const DEFAULT_FONT_SIZE = 16;
  
  function applyFontSize(size) {
    if (fontSettingsActive) {
      document.documentElement.style.fontSize = `${size}px`;
      if (fontSizeValue) fontSizeValue.textContent = `${size}px`;
    } else {
      document.documentElement.style.fontSize = `${DEFAULT_FONT_SIZE}px`;
      if (fontSizeValue) fontSizeValue.textContent = `${DEFAULT_FONT_SIZE}px`;
    }
  }
  
  if (fontToggle) {
    fontToggle.addEventListener("change", (e) => {
      fontSettingsActive = e.target.checked;
      if (fontSettingsActive) {
        fontContainer.style.display = "block";
        chrome.storage.local.get(["userFontSize"], (res) => {
          const savedSize = res.userFontSize || DEFAULT_FONT_SIZE;
          if (fontSizeSlider) fontSizeSlider.value = savedSize;
          applyFontSize(savedSize);
        });
      } else {
        fontContainer.style.display = "none";
        applyFontSize(DEFAULT_FONT_SIZE);
      }
    });
  }
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener("input", (e) => {
      if (fontSettingsActive) {
        const size = parseFloat(e.target.value);
        applyFontSize(size);
        chrome.storage.local.set({ userFontSize: size });
      }
    });
  }
  if (fontToggle) fontToggle.checked = false;
  fontSettingsActive = false;
  if (fontContainer) fontContainer.style.display = "none";
  applyFontSize(DEFAULT_FONT_SIZE);

  // Birim ID
  const birimIdInput = document.getElementById("birimId");
  if (birimIdInput) {
    chrome.storage.local.get(["birimId"], (res) => {
      if (res.birimId) {
        birimIdInput.value = res.birimId;
        setCurrentBirimId(res.birimId);
        loadNufusForBirim(res.birimId, tavanHesapla);
        chrome.storage.local.get(["userType"], (userRes) => {
          const savedType = userRes.userType || "doctor";
          if (userTypeSelect) userTypeSelect.value = savedType;
          setUserType(savedType);
          const surecRow = document.getElementById("surecYonetimi")?.closest(".row");
          if (surecRow) surecRow.style.display = savedType === "nurse" ? "none" : "flex";
          const nufusRow = document.getElementById("nufus")?.closest(".row");
          if (nufusRow) nufusRow.style.display = savedType === "nurse" ? "none" : "flex";
        });
      } else {
        chrome.storage.local.get(["userType"], (userRes) => {
          const savedType = userRes.userType || "doctor";
          if (userTypeSelect) userTypeSelect.value = savedType;
          setUserType(savedType);
        });
      }
    });
  }

  // KVKK görünürlük
  applyKvkkVisibilityFromStorage();

  // Tema yükleme
  const themeSelect = inputs.theme();
  if (themeSelect) {
    chrome.storage.local.get(["themePreference"], (res) => {
      const savedTheme = res.themePreference || "light";
      themeSelect.value = savedTheme;
      applyTheme(savedTheme);
    });
  }

  // Tüm event handler'ları bağla
  bindAllEvents(
    setUserType, deleteAllData, revokeConsent,
    getDomAy, getDomYil, getDomBirimId,
    reloadDataByMonth, loadNufusForBirim, tavanHesapla,
    updateHypButtonStateUI, aySelect, yilInput
  );

  // Mesaj dinleyici
  chrome.runtime.onMessage.addListener(async (msg) => {
    const simdi = new Date().toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const { confirmDialog, messageDialog } = await import('./modules/ui/components/index.js');

    if (msg.action === "dataParsed") {
      const ayStr = document.getElementById("ay")?.value || "";
      const yil = parseInt(document.getElementById("yil")?.value || "0");
      const birimId = getCurrentBirimId();
      const userType = getCurrentUserType();
      let currentShowAllValue = getCurrentShowAll();

      if (!birimId) return;
      let targetUserType = userType;
      let pendingStorage = getPendingStorageType();
      if (userType === "nurse" && pendingStorage) targetUserType = pendingStorage;
      const key = `savedResults_${targetUserType}_${birimId}`;
      
      chrome.storage.local.get([key], async (res) => {
        let existingData = res[key]?.data || [];
        const hypYapilanMap = new Map();
        existingData.forEach(item => hypYapilanMap.set(item.ad, item.yapilan));
        const merged = msg.results.map(sinaItem => {
          const hypYapilan = hypYapilanMap.get(sinaItem.ad);
          if (hypYapilan !== undefined && hypYapilan !== sinaItem.yapilan) return { ...sinaItem, yapilan: hypYapilan };
          return sinaItem;
        });

        if (merged.length > 0) {
          storeDataWithTimestamp("savedResults", merged, targetUserType, birimId, ayStr, yil);
          storeDataWithTimestamp("sinaLastTime", simdi, targetUserType, birimId);
          
          if (targetUserType === "nurse") {
            const sinaTimeSpan = document.getElementById("sinaTime");
            if (sinaTimeSpan) sinaTimeSpan.textContent = simdi;
          }
        }

        if (merged.length === 0) {
          const tbody = document.getElementById("tableBody");
          if (tbody) tbody.innerHTML = "";
          const katsayiElement = document.getElementById("totalKatsayi");
          if (katsayiElement) katsayiElement.textContent = "1.00000";
          const tavanElement = document.getElementById("tavanKatsayi");
          if (tavanElement && userType === "nurse") {
            tavanElement.textContent = "1.00000";
          }
          updateKHTBar([], userType);
          
          let uyariMesaji = "";
          const suAn = new Date();
          const cariAyIndex = suAn.getMonth();
          const cariYil = suAn.getFullYear();
          const gun = suAn.getDate();
          const cariAyAdi = aylar[cariAyIndex];
          
          if (ayStr === cariAyAdi && yil === cariYil && gun <= 10) {
            let oncekiAyIndex = cariAyIndex - 1;
            let oncekiYil = cariYil;
            if (oncekiAyIndex < 0) {
              oncekiAyIndex = 11;
              oncekiYil--;
            }
            const oncekiAyAdi = aylar[oncekiAyIndex];
            uyariMesaji = `Seçtiğiniz dönem (${ayStr} ${yil}) için SİNA'da veri bulunamadı.\n\n📌 Veriler genellikle ayın 8-10. günlerinde sisteme yansır.\n📌 ${oncekiAyAdi} ${oncekiYil} veya daha eski ayları seçerek mevcut verileri görüntüleyebilirsiniz.\n📌 Daha sonra tekrar deneyiniz.`;
          } else if (ayStr === cariAyAdi && yil === cariYil && gun > 10) {
            uyariMesaji = `Seçtiğiniz dönem (${ayStr} ${yil}) için SİNA'da veri bulunamadı.\n\n📌 Veriler sisteme yansımamış olabilir.\n📌 Lütfen daha sonra tekrar deneyiniz.`;
          } else {
            uyariMesaji = `Seçtiğiniz dönem (${ayStr} ${yil}) için SİNA'da veri bulunamadı.\n\n📌 Bir süre sonra tekrar deneyebilirsiniz.`;
          }
          
          await messageDialog(uyariMesaji, "⚠️ Bilgilendirme");
          
          setCurrentShowAll(false);
          updateTable([], userType, false, birimId);
        }

        if (userType === "nurse" && targetUserType === "doctor") {
          const hypTimeSpan = document.getElementById("hypTime");
          if (hypTimeSpan) hypTimeSpan.textContent = simdi;
        }

        if (userType === "nurse") {
          if (merged.length === 0) {
            setCurrentShowAll(false);
            updateTable([], userType, false, birimId);
          } else {
            // ✅ YENİ EKLENEN: SİNA BİRİM (doctor verisi) çekildiyse showAll'ı true yap
            if (targetUserType === "doctor") {
              setCurrentShowAll(true);
              saveNurseShowAllForBirim(birimId, true);
            }
            
            chrome.storage.local.get([`nurseShowAll_${birimId}`], (showAllRes) => {
              const showAll = showAllRes[`nurseShowAll_${birimId}`] === true;
              if (showAll) {
                const nurseKey = `savedResults_nurse_${birimId}`;
                const doctorKey = `savedResults_doctor_${birimId}`;
                chrome.storage.local.get([nurseKey, doctorKey], (allRes) => {
                  const nurseData = allRes[nurseKey]?.data || [];
                  const doctorData = allRes[doctorKey]?.data || [];
                  const combinedData = [...nurseData, ...doctorData];
                  updateTable(combineData(combinedData), userType, true, birimId);
                });
              } else {
                updateTable(merged, userType, false, birimId);
              }
            });
          }
        } else {
          updateTable(merged, userType, currentShowAllValue, birimId);
        }
        const hypBtn = document.getElementById("btnHyp");
        if (hypBtn) hypBtn.disabled = false;
        setPendingShowAll(false);
        setPendingStorageType("nurse");
      });
    } else if (msg.action === "hypDataParsed") {
      const ayStr = document.getElementById("ay")?.value || "";
      const yil = parseInt(document.getElementById("yil")?.value || "0");
      const birimId = getCurrentBirimId();

      if (!birimId) return;
      const userType = getCurrentUserType();
      const showAll = getCurrentShowAll();
      const key = `savedResults_${userType}_${birimId}`;
      
      chrome.storage.local.get([key], async (res) => {
        // ✅ BU KONTROLÜ KALDIR VEYA DEĞİŞTİR
        // if (!res[key]?.data) {
        //   await messageDialog("Önce SİNA verilerini çekmelisiniz.", "Uyarı");
        //   return;
        // }
        
        // Yeni yaklaşım: SİNA verisi yoksa bile doktor verisini kaydet
        let guncelVeri = res[key]?.data || [];
        
        msg.results.forEach((hypItem) => {
          const sinaKarsiligi = hypToSinaMap[hypItem.ad.toUpperCase()];
          if (sinaKarsiligi) {
            const idx = guncelVeri.findIndex(s => s.ad.toUpperCase().includes(sinaKarsiligi));
            if (idx !== -1) guncelVeri[idx].yapilan = hypItem.yapilan;
          }
        });

        if (guncelVeri.length > 0) {
          storeDataWithTimestamp("savedResults", guncelVeri, userType, birimId, ayStr, yil);
          storeDataWithTimestamp("hypLastTime", simdi, userType, birimId);
          const hypTimeSpan = document.getElementById("hypTime");
          if (hypTimeSpan) hypTimeSpan.textContent = simdi;
        }
        
        // Tabloyu güncelle (mevcut showAll değerine göre)
        loadDataForCurrentBirimWithMerge(updateTable, userType, birimId, null, showAll);
      });
    }
  });
});

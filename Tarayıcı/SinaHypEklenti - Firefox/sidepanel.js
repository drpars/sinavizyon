// sidepanel.js - v1.6.7
// ============================================================
// SADECE BAŞLATMA VE ORCHESTRATION
// ============================================================

// ---------- CORE ----------
import { 
  buttons, inputs, containers, infoElements, modals, khtMarks,
  getDomBirimId, getDomUserType, getDomAy, getDomYil,
  getDomNufus, setDomNufus, setDomBirimId,
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
let spinnerTimeout = null;  // Timeout için global değişken

function showLoadingSpinner() {
  const spinner = document.getElementById("loadingSpinner");
  const table = document.getElementById("dataTable");
  
  // Önceki timeout'u temizle
  if (spinnerTimeout) {
    clearTimeout(spinnerTimeout);
    spinnerTimeout = null;
  }
  
  if (spinner) {
    spinner.style.display = "block";
    spinner.style.opacity = "1";
  }
  if (table) table.style.display = "none";
  
  // Güvenlik: 15 saniye sonra spinner'ı zorla kapat
  spinnerTimeout = setTimeout(() => {
    console.warn("⚠️ Spinner timeout: 15 saniye geçti, zorla kapatılıyor");
    hideLoadingSpinner();
    
    // Kullanıcıya bilgi ver
    import('./modules/ui/components/index.js').then(({ messageDialog }) => {
      messageDialog("Veri çekme işlemi çok uzun sürüyor. Lütfen daha sonra tekrar deneyin.\n\n⏱️ Bekleme süresi aşıldı (15 saniye).", "Zaman Aşımı");
    });
  }, 15000);
}

function hideLoadingSpinner() {
  const spinner = document.getElementById("loadingSpinner");
  const table = document.getElementById("dataTable");
  
  // Timeout'u temizle
  if (spinnerTimeout) {
    clearTimeout(spinnerTimeout);
    spinnerTimeout = null;
  }
  
  if (spinner) {
    spinner.style.opacity = "0";
    setTimeout(() => {
      if (spinner) spinner.style.display = "none";
    }, 200);
  }
  if (table) table.style.display = "table";
}

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

// ========== GLOBAL UI REFRESH FONKSİYONU (Ayarlar modal'ı için) ==========
window.refreshUIForUserType = setUserType;

export function deleteAllData() {
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

// ========== KAYITLI AYARLARI YÜKLE ==========
async function loadSavedPeriodSettings() {
  // Ay
  const savedAy = await new Promise(resolve => 
    chrome.storage.local.get(["lastSelectedAy"], (res) => resolve(res.lastSelectedAy))
  );
  if (savedAy) {
    const aySelect = document.getElementById("ay");
    if (aySelect) aySelect.value = savedAy;
  }
  
  // Yıl
  const savedYil = await new Promise(resolve => 
    chrome.storage.local.get(["lastSelectedYil"], (res) => resolve(res.lastSelectedYil))
  );
  if (savedYil) {
    const yilInput = document.getElementById("yil");
    if (yilInput) yilInput.value = savedYil;
  }
  
  // Birim ID
  const savedBirimId = await new Promise(resolve => 
    chrome.storage.local.get(["birimId"], (res) => resolve(res.birimId))
  );
  if (savedBirimId) {
    const birimIdInput = document.getElementById("birimId");
    if (birimIdInput) birimIdInput.value = savedBirimId;
    setCurrentBirimId(savedBirimId);
    
    const savedNufus = await new Promise(resolve => 
      chrome.storage.local.get([`nufus_${savedBirimId}`], (res) => resolve(res[`nufus_${savedBirimId}`]))
    );
    if (savedNufus) {
      const nufusInput = document.getElementById("nufus");
      if (nufusInput) nufusInput.value = savedNufus;
      tavanHesapla(savedNufus);
    }
  }
  
  // ✅ TEMA
  const savedTheme = await new Promise(resolve => 
    chrome.storage.local.get(["themePreference"], (res) => resolve(res.themePreference || "light"))
  );
  applyTheme(savedTheme);
  
  // ✅ KULLANICI TİPİ - AL ve UYGULA (setUserType fonksiyonunu kullan!)
  const savedUserType = await new Promise(resolve => 
    chrome.storage.local.get(["userType"], (res) => resolve(res.userType || "doctor"))
  );
  
  // setUserType fonksiyonu UI'ı tamamen günceller
  if (typeof setUserType === 'function') {
    setUserType(savedUserType);
  } else {
    // Fallback: manuel güncelle
    setCurrentUserType(savedUserType);
    await saveCurrentUserTypeToStorage();
    
    const birimId = getCurrentBirimId();
    const currentAy = getDomAy();
    const currentYil = getDomYil();
    
    // UI'ı güncelle
    updateUIForUserType(savedUserType, birimId, currentAy, currentYil, updateHypButtonStateUI);
  }
  
  // ✅ YAZI BOYUTU
  const savedFontSize = await new Promise(resolve => 
    chrome.storage.local.get(["userFontSize"], (res) => resolve(res.userFontSize || 16))
  );
  document.documentElement.style.fontSize = savedFontSize + "px";
  
  const fontToggleCheckbox = document.getElementById("fontToggleCheckbox");
  const fontContainer = document.getElementById("fontSettingsContainer");
  if (fontToggleCheckbox && savedFontSize !== 12) {
    fontToggleCheckbox.checked = true;
    if (fontContainer) fontContainer.style.display = "block";
  } else if (fontToggleCheckbox) {
    fontToggleCheckbox.checked = false;
    if (fontContainer) fontContainer.style.display = "none";
  }
  
  const fontSizeValue = document.getElementById("fontSizeValue");
  if (fontSizeValue) fontSizeValue.textContent = savedFontSize + "px";
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

  const manifest = chrome.runtime.getManifest();
  const currentVersion = manifest.version;

  // ✅ v2.0.0 için ilk açılışta göster
  if (lastVersionSeen !== currentVersion) {
    await showWhatsNewModal(currentVersion);
    await chrome.storage.local.set({ lastVersionSeen: currentVersion });
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

  // Ayarlar butonu
  const settingsBtn = document.getElementById("btnSettings");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      import('./modules/ui/components/modal/settings.js').then(({ openSettingsModal }) => {
        openSettingsModal();
      });
    });
  }

  // ✅ KAYITLI DÖNEM AYARLARINI YÜKLE (veri yenilemeden ÖNCE)
  await loadSavedPeriodSettings();

  // Tüm event handler'ları bağla
  bindAllEvents(
    setUserType, deleteAllData, revokeConsent,
    getDomAy, getDomYil, getDomBirimId,
    reloadDataByMonth, loadNufusForBirim, tavanHesapla,
    updateHypButtonStateUI, aySelect, yilInput
  );

  // Mesaj dinleyici
  chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    console.log("📨 Mesaj alındı:", msg.action);
    
    // ✅ SPINNER KONTROLÜ EKLE
    if (msg.action === "showSpinner") {
      showLoadingSpinner();
      sendResponse({ status: "ok" });
      return true;
    }
    
    if (msg.action === "hideSpinner") {
      hideLoadingSpinner();
      sendResponse({ status: "ok" });
      return true;
    }

    const simdi = new Date().toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const { confirmDialog, messageDialog } = await import('./modules/ui/components/index.js');

    if (msg.action === "dataParsed") {
      hideLoadingSpinner();
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
      
      // ✅ BİRLEŞTİRME YOK: Sadece gelen SİNA verisini kullan
      const merged = msg.results;  // Hiçbir hyp birleştirmesi yapma
      
      console.log(`📊 dataParsed: ${merged.length} işlem, targetUserType=${targetUserType}`);

      if (merged.length > 0) {
        // ✅ Eski veriyi tamamen temizle
        const eskiKey = `savedResults_${targetUserType}_${birimId}`;
        await new Promise(resolve => chrome.storage.local.remove([eskiKey], resolve));
        console.log(`🗑️ Eski veri temizlendi: ${eskiKey}`);
        
        // Yeni veriyi kaydet
        storeDataWithTimestamp("savedResults", merged, targetUserType, birimId, ayStr, yil);
        storeDataWithTimestamp("sinaLastTime", simdi, targetUserType, birimId);
        
        if (targetUserType === "nurse") {
          const sinaTimeSpan = document.getElementById("sinaTime");
          if (sinaTimeSpan) sinaTimeSpan.textContent = simdi;
        }
      }

      if (merged.length === 0) {
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
        
        // ✅ KRİTİK: Mevcut verileri storage'dan TEKRAR YÜKLE (silme!)
        if (userType === "nurse") {
          loadNurseShowAllForBirim(birimId).then((showAll) => {
            loadDataForCurrentBirimWithMerge(updateTable, userType, birimId, null, showAll, ayStr, yil);
          });
        } else {
          loadDataForCurrentBirim(updateTable, userType, birimId, null, false, ayStr, yil);
        }
        
        if (sendResponse) sendResponse({ status: "ok", data: [] });
        return;  // İşlemi bitir, aşağıdaki kod çalışmasın
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
      
      if (sendResponse) sendResponse({ status: "ok", data: merged });
      return true;
    } else if (msg.action === "hypDataParsed") {
      hideLoadingSpinner();
      const ayStr = document.getElementById("ay")?.value || "";
      const yil = parseInt(document.getElementById("yil")?.value || "0");
      const birimId = getCurrentBirimId();

      if (!birimId) return;
      const userType = getCurrentUserType();
      const showAll = getCurrentShowAll();
      const key = `savedResults_${userType}_${birimId}`;
      
      chrome.storage.local.get([key], async (res) => {
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
          const eskiKey = `savedResults_${userType}_${birimId}`;
          chrome.storage.local.remove([eskiKey], () => {
            console.log(`🗑️ Eski HYP verisi temizlendi: ${eskiKey}`);
          });

          storeDataWithTimestamp("savedResults", guncelVeri, userType, birimId, ayStr, yil);
          storeDataWithTimestamp("hypLastTime", simdi, userType, birimId);
          const hypTimeSpan = document.getElementById("hypTime");
          if (hypTimeSpan) hypTimeSpan.textContent = simdi;
        }
        
        // Tabloyu güncelle (mevcut showAll değerine göre)
        loadDataForCurrentBirimWithMerge(updateTable, userType, birimId, null, showAll);
      });
      if (sendResponse && typeof sendResponse === 'function') {
        sendResponse({ status: "ok" });
      }
      return true;
    }
    return true;
  });
});

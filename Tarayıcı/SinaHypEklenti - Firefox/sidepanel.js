// sidepanel.js - en üst satırlar
// ========== DOM ELEMENTS (dom-elements.js) ==========
import { 
  buttons, inputs, containers, infoElements, modals, khtMarks,
  getDomBirimId, getDomUserType, getDomAy, getDomYil,
  getDomSurecCarpan, getDomNufus, setDomNufus, setDomBirimId,
  setDomSinaTime, setDomHypTime, setDomTotalKatsayi, setDomTavanKatsayi,
  setDomKhtPercentage, setDomKhtBarWidth, setDomKhtDurum, clearDomTableBody,
  showDomSettingsPanel, toggleDomSettingsPanel, showDomAdvancedSettings, toggleDomAdvancedSettings
} from './modules/dom-elements.js';

// ========== STATE YÖNETİMİ (state.js) ==========
import { 
  getCurrentUserType as getStateUserType,
  getCurrentBirimId as getStateBirimId,
  getCurrentShowAll as getStateShowAll,
  getPendingStorageType as getStatePendingStorageType,
  getPendingShowAll as getStatePendingShowAll,
  getFontSettingsActive as getStateFontSettingsActive,
  setCurrentUserType as setStateUserType,
  setCurrentBirimId as setStateBirimId,
  setCurrentShowAll as setStateShowAll,
  setPendingStorageType as setStatePendingStorageType,
  setPendingShowAll as setStatePendingShowAll,
  setFontSettingsActive as setStateFontSettingsActive,
  updateState, loadStateFromStorage, saveCurrentUserTypeToStorage,
  saveCurrentBirimIdToStorage, loadNurseShowAllForBirim, saveNurseShowAllForBirim
} from './modules/state.js';

// ========== UI UPDATERS ==========
import { 
  clearTable, clearTimeIndicators, resetKatsayiValues, resetUIAfterDataClear,
  updateHypButtonStateUI, 
  updateUIForUserType, applyKvkkVisibilityFromStorage
} from './modules/ui-updaters.js';

// ========== EVENT HANDLER'LARI BAĞLA ==========
import { bindAllEvents } from './modules/event-handlers.js';





import { buildSinaUrl, HYP_URLS } from './modules/config.js';
import { hypToSinaMap } from './modules/constants.js';
import { 
  getCurrentBirimId, storeDataWithTimestamp,
  saveNufusForBirim, loadNufusForBirim, loadDataForCurrentBirim, loadDataForCurrentBirimWithMerge, cleanExpiredData, exportData, revokeConsent 
} from './modules/storage.js';
import { tavanHesapla } from './modules/calculations.js';
import { updateTable, applyTheme, applyKvkkVisibility, setUIEnabled } from './modules/ui.js';
import { updateKHTBar } from './modules/ui-helpers.js';
import { requestConsent, showChangelog, closeModal, confirmDialog, messageDialog, showAboutDialog, showFirstTimeUserTypeModal, showWhatsNewModal } from './modules/modals.js';
import { getCurrentYearMonth, getMonthNumber, isDateValid } from './modules/date-utils.js';
import { migrateFromOldStorage } from './modules/migration.js';

// ========== GLOBAL FONKSİYONLAR ==========
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

// ========== SET USERTYPE (GLOBAL) ==========
function setUserType(type) {
  // State'i güncelle
  setStateUserType(type);
  saveCurrentUserTypeToStorage();
  
  const birimId = getDomBirimId();
  setStateBirimId(birimId);
  
  const currentAy = getDomAy();
  const currentYil = getDomYil();
  
  // UI güncellemelerini ui-updaters'a devret
  updateUIForUserType(type, birimId, currentAy, currentYil, updateHypButtonStateUI);
}

// ========== TÜM VERİLERİ SİL (GLOBAL) ==========
function deleteAllData() {
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
          // UI'ı temizle (ui-updaters kullan)
          resetUIAfterDataClear();
          setDomNufus("");
          setDomBirimId("");
          
          // State'i sıfırla
          setStateBirimId("");
          setStateShowAll(false);
          
          // Kullanıcı tipini eski haline getir
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
}

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", async function () {
  // Tarih ve ay seçimleri
  const aylar = ["OCAK", "SUBAT", "MART", "NISAN", "MAYIS", "HAZIRAN", "TEMMUZ", "AGUSTOS", "EYLUL", "EKIM", "KASIM", "ARALIK"];
  const suAn = new Date();
  const aySelect = document.getElementById("ay");
  const yilInput = document.getElementById("yil");

  // ========== Ay veya yıl değiştiğinde verileri yeniden yükle ==========
  function reloadDataByMonth() {
    const birimId = getStateBirimId();
    if (!birimId) return;
    
    const selectedAy = getDomAy();
    const selectedYil = getDomYil();
    const userType = getStateUserType();
    
    if (userType === "nurse") {
      // ASÇ modunda, ay değiştiğinde storage'dan showAll değerini tazele
      loadNurseShowAllForBirim(birimId).then((showAll) => {
        loadDataForCurrentBirimWithMerge(updateTable, userType, birimId, updateHypButtonStateUI, showAll, selectedAy, selectedYil);
        //                                                          ^^^^^^^^^^^^^^^^^^^^^^^ DÜZELTİLDİ
      });
    } else {
      loadDataForCurrentBirim(updateTable, userType, birimId, updateHypButtonStateUI, false, selectedAy, selectedYil);
      //                                                      ^^^^^^^^^^^^^^^^^^^^^^^ DÜZELTİLDİ
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

  // ========== İLK KURULUM KONTROLÜ ==========
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

  // Saklama süresi temizliği
  cleanExpiredData(updateTable);

  migrateFromOldStorage();

  // ========== GÜNCELLEME SONRASI YENİLİKLER (SADECE 1.6.0 İÇİN BİR KERE) ==========
  const lastVersionSeen = await new Promise(resolve => 
    chrome.storage.local.get(["lastVersionSeen"], (res) => resolve(res.lastVersionSeen))
  );

  if (lastVersionSeen !== "1.6.0") {
    await showWhatsNewModal("1.6.0");
    await chrome.storage.local.set({ lastVersionSeen: "1.6.0" });
  }

  // ========== KULLANICI TİPİ ==========
  const userTypeSelect = document.getElementById("userTypeSelect");
  if (userTypeSelect) userTypeSelect.value = "doctor";

  // Storage'dan kullanıcı tipini yükle (ilk kurulumda zaten ayarlandı)
  if (userTypeExists) {
    chrome.storage.local.get(["userType"], (res) => {
      const savedType = res.userType || "doctor";
      if (userTypeSelect) userTypeSelect.value = savedType;
      setUserType(savedType);
    });
  }

  // ========== SÜRÜM NUMARASI ==========
  try {
    const manifest = chrome.runtime.getManifest();
    const versionBadge = document.getElementById("versionBadge");
    if (versionBadge && manifest?.version) versionBadge.textContent = `v${manifest.version}`;
  } catch (e) {
    const versionBadge = document.getElementById("versionBadge");
    if (versionBadge) versionBadge.textContent = "v1.5.5";
  }

  // ========== FONT AYARI ==========
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

  // ========== BİRİM ID ==========
  const birimIdInput = document.getElementById("birimId");
  if (birimIdInput) {
    chrome.storage.local.get(["birimId"], (res) => {
      if (res.birimId) {
        birimIdInput.value = res.birimId;
        setStateBirimId(res.birimId);
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

  // ========== KVKK GÖRÜNÜRLÜK ==========
  applyKvkkVisibilityFromStorage();

  // ========== TEMA YÜKLEME ==========
  const themeSelect = inputs.theme();
  if (themeSelect) {
    chrome.storage.local.get(["themePreference"], (res) => {
      const savedTheme = res.themePreference || "light";
      themeSelect.value = savedTheme;
      applyTheme(savedTheme);
    });
  }

  // ========== TÜM EVENT HANDLER'LARI TEK SEFERDE BAĞLA ==========
  bindAllEvents(
    setUserType,                 // Kullanıcı tipi değişince çağrılacak fonksiyon
    deleteAllData,               // Veri silme butonu için
    revokeConsent,               // Rıza iptali için
    getDomAy,                    // Seçili ayı okumak için
    getDomYil,                   // Seçili yılı okumak için
    getDomBirimId,               // Birim ID'yi okumak için
    reloadDataByMonth,           // Ay/Yıl değişince verileri yeniden yüklemek için
    loadNufusForBirim,           // Nüfus yüklemek için
    tavanHesapla,                // Tavan katsayısı hesaplamak için
    updateHypButtonStateUI,      // HYP buton durumunu güncellemek için
    aySelect,                    // Ay select DOM elementi
    yilInput                     // Yıl input DOM elementi
  );

  // ========== MESAJ DİNLEYİCİ (DÜZELTİLMİŞ) ==========
  chrome.runtime.onMessage.addListener(async (msg) => {
    const simdi = new Date().toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

    if (msg.action === "dataParsed") {
      const ayStr = document.getElementById("ay")?.value || "";
      const yil = parseInt(document.getElementById("yil")?.value || "0");
      const birimId = getStateBirimId();
      const userType = getStateUserType();
      let currentShowAllValue = getStateShowAll();

      if (!birimId) return;
      let targetUserType = userType;
      let pendingStorage = getStatePendingStorageType();
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

        // Sadece veri varsa kaydet ve zamanı güncelle
        if (merged.length > 0) {
          storeDataWithTimestamp("savedResults", merged, targetUserType, birimId, ayStr, yil);
          storeDataWithTimestamp("sinaLastTime", simdi, targetUserType, birimId);
          
          // ========== SİNA ZAMANINI GÜNCELLE (SADECE ASÇ VERİSİ İÇİN) ==========
          if (targetUserType === "nurse") {
            const sinaTimeSpan = document.getElementById("sinaTime");
            if (sinaTimeSpan) sinaTimeSpan.textContent = simdi;
          }
        }

        // ========== VERİ YOKSA TABLOYU TEMİZLE VE UYARI GÖSTER ==========
        if (merged.length === 0) {
          // ========== HER DURUMDA TABLOYU TEMİZLE ==========
          const tbody = document.getElementById("tableBody");
          if (tbody) tbody.innerHTML = "";
          const katsayiElement = document.getElementById("totalKatsayi");
          if (katsayiElement) katsayiElement.textContent = "1.00000";
          const tavanElement = document.getElementById("tavanKatsayi");
          if (tavanElement && userType === "nurse") {
            tavanElement.textContent = "1.00000";
          }
          updateKHTBar([], userType);
          
          // ========== UYARI MESAJINI BELİRLE (KOŞULA GÖRE) ==========
          let uyariMesaji = "";
          const suAn = new Date();
          const cariAyIndex = suAn.getMonth();
          const cariYil = suAn.getFullYear();
          const gun = suAn.getDate();
          const aylar = ["OCAK", "SUBAT", "MART", "NISAN", "MAYIS", "HAZIRAN", "TEMMUZ", "AGUSTOS", "EYLUL", "EKIM", "KASIM", "ARALIK"];
          const cariAyAdi = aylar[cariAyIndex];
          
          // DEBUG: Koşul kontrolü
          console.log("DEBUG: gun =", gun, "cariAyAdi =", cariAyAdi, "secilenAyAdi =", ayStr, "secilenYil =", yil, "cariYil =", cariYil, "kosul =", ayStr === cariAyAdi && yil === cariYil && gun <= 10);
          
          if (ayStr === cariAyAdi && yil === cariYil && gun <= 10) {
            // Cari ay, ilk 10 gün: Detaylı uyarı
            let oncekiAyIndex = cariAyIndex - 1;
            let oncekiYil = cariYil;
            if (oncekiAyIndex < 0) {
              oncekiAyIndex = 11;
              oncekiYil--;
            }
            const oncekiAyAdi = aylar[oncekiAyIndex];
            uyariMesaji = `Seçtiğiniz dönem (${ayStr} ${yil}) için SİNA'da veri bulunamadı.\n\n📌 Veriler genellikle ayın 8-10. günlerinde sisteme yansır.\n📌 ${oncekiAyAdi} ${oncekiYil} veya daha eski ayları seçerek mevcut verileri görüntüleyebilirsiniz.\n📌 Daha sonra tekrar deneyiniz.`;
          } else if (ayStr === cariAyAdi && yil === cariYil && gun > 10) {
            // Cari ay, 10 gün geçti ama veri yok
            uyariMesaji = `Seçtiğiniz dönem (${ayStr} ${yil}) için SİNA'da veri bulunamadı.\n\n📌 Veriler sisteme yansımamış olabilir.\n📌 Lütfen daha sonra tekrar deneyiniz.`;
          } else {
          // Geçmiş ay için veri yoksa
          uyariMesaji = `Seçtiğiniz dönem (${ayStr} ${yil}) için SİNA'da veri bulunamadı.\n\n📌 Bir süre sonra tekrar deneyebilirsiniz.`;
          }
          
          await messageDialog(uyariMesaji, "⚠️ Bilgilendirme");
          
          // ========== KRİTİK: STORAGE'DAKİ SHOWALL DEĞERİNİ DE SIFIRLA ==========
          setStateShowAll(false);
          updateTable([], userType, false, birimId);
          // =====================================================================
        }

        // *** DÜZELTME: ASÇ modunda SİNA BİRİM (doctor verisi) çekildiyse hypTimeSpan güncellensin ***
        if (userType === "nurse" && targetUserType === "doctor") {
          const hypTimeSpan = document.getElementById("hypTime");
          if (hypTimeSpan) hypTimeSpan.textContent = simdi;
        }

        if (userType === "nurse") {
          // Eğer veri yoksa, showAll'ı kesinlikle false yap (storage'ı yoksay)
          if (merged.length === 0) {
            setStateShowAll(false);
            updateTable([], userType, false, birimId);
          } else {
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
        setStatePendingShowAll(false);
        setStatePendingStorageType("nurse");
      });
    } else if (msg.action === "hypDataParsed") {
      const ayStr = document.getElementById("ay")?.value || "";
      const yil = parseInt(document.getElementById("yil")?.value || "0");
      const birimId = getStateBirimId();

      if (!birimId) return;
      const userType = getStateUserType();
      const showAll = getStateShowAll();
      const key = `savedResults_${userType}_${birimId}`;
      chrome.storage.local.get([key], async (res) => {
        if (!res[key]?.data) {
          await messageDialog("Önce SİNA verilerini çekmelisiniz.", "Uyarı");
          return;
        }
        let guncelVeri = [...res[key].data];
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
        } else {
          console.log("HYP verisi boş, storage ve zaman güncellenmedi");
        }
        // Tabloyu güncelle
        loadDataForCurrentBirimWithMerge(updateTable, userType, birimId, null, showAll);
      });
    }
  });
});


// sidepanel.js
// ============================================================
// SADECE BAŞLATMA VE ORCHESTRATION
// ============================================================
// ---------- CORE ----------
import { getDomAy, getDomBirimId, getDomYil, inputs, setDomBirimId, setDomNufus } from "./modules/core/dom.js";
import { bindAllEvents } from "./modules/core/events.js";
import {
  getCurrentBirimId,
  getCurrentShowAll,
  getCurrentUserType,
  loadStateFromStorage,
  saveCurrentUserTypeToStorage,
  setCurrentBirimId,
  setCurrentShowAll,
  setCurrentUserType,
  setPendingShowAll,
  setPendingStorageType,
} from "./modules/core/state.js";
import {
  cleanExpiredData,
  loadDataForCurrentBirim,
  loadDataForCurrentBirimWithMerge,
  loadNufusForBirim,
  storeDataWithTimestamp,
} from "./modules/core/storage.js";
import { requestConsent, revokeConsent } from "./modules/features/consent/index.js";
import { loadNurseShowAllForBirim, saveNurseShowAllForBirim } from "./modules/features/nurse/index.js";
// ---------- LIB ----------
import { tavanHesapla } from "./modules/lib/calculations.js";
import { hypToSinaMapNormalized } from "./modules/lib/constants.js";
import { migrateFromOldStorage } from "./modules/lib/migration.js";
import { showFirstTimeUserTypeModal, showWhatsNewModal } from "./modules/ui/components/index.js";
import { showSimulatorModal } from "./modules/ui/components/modal/simulator.js";
// ---------- UI ----------
import {
  applyKvkkVisibilityFromStorage,
  applyTheme,
  resetUIAfterDataClear,
  setUIEnabled,
  updateHypButtonStateUI,
  updateKHTBar,
  updateTable,
  updateUIForUserType,
} from "./modules/ui/updaters/index.js";
// ---------- UTILS ----------
import { normalizeText } from "./modules/utils/text-utils.js";

// ========== HELPER FUNCTIONS ==========
let spinnerTimeout = null;

function showLoadingSpinner() {
  const spinner = document.getElementById("loadingSpinner");
  const table = document.getElementById("dataTable");

  if (spinnerTimeout) {
    clearTimeout(spinnerTimeout);
    spinnerTimeout = null;
  }

  if (spinner) {
    spinner.style.display = "block";
    spinner.style.opacity = "1";
  }
  if (table) table.style.display = "none";

  spinnerTimeout = setTimeout(() => {
    console.warn("⚠️ Spinner timeout: 15 saniye geçti, zorla kapatılıyor");
    hideLoadingSpinner();

    import("./modules/ui/components/index.js").then(({ messageDialog }) => {
      messageDialog(
        "Veri çekme işlemi çok uzun sürüyor. Lütfen daha sonra tekrar deneyin.\n\n⏱️ Bekleme süresi aşıldı (15 saniye).",
        "Zaman Aşımı"
      );
    });
  }, 15000);
}

function hideLoadingSpinner() {
  const spinner = document.getElementById("loadingSpinner");
  const table = document.getElementById("dataTable");

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
  data.forEach((item) => {
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

  // Simülatör butonu görünürlüğü
  const simulatorBtn = document.getElementById("btnSimulator");
  const simulatorWrapper = simulatorBtn?.closest(".btn-wrapper");
  if (simulatorWrapper) {
    simulatorWrapper.style.display = type === "doctor" ? "flex" : "none";
  }

  updateUIForUserType(type, birimId, currentAy, currentYil, updateHypButtonStateUI);
}

/**
 * SİNA'dan gelen yeni veriyi mevcut veriyle birleştirir.
 * Mevcut yapilan ve devreden değerlerini korur, diğer alanları günceller.
 * @param {Array} existingData Mevcut veri
 * @param {Array} newData SİNA'dan gelen yeni veri
 * @returns {Array} Birleştirilmiş veri
 */
function mergeSinaData(existingData, newData) {
  if (!existingData || existingData.length === 0) {
    return newData;
  }

  // Mevcut yapilan ve devreden değerlerini bir Map'e kaydet
  const yapilanMap = new Map();
  const devredenMap = new Map();

  existingData.forEach((item) => {
    const key = normalizeText(item.ad);
    yapilanMap.set(key, item.yapilan);
    devredenMap.set(key, item.devreden);
  });

  // Yeni veriyi oluştur
  return newData.map((item) => {
    const key = normalizeText(item.ad);
    const existingYapilan = yapilanMap.get(key);
    const existingDevreden = devredenMap.get(key);
    const newYapilan = item.yapilan;

    // ✅ Büyük olan yapilan'ı al (yapılan işlem geri alınamaz!)
    const finalYapilan =
      existingYapilan !== undefined && parseFloat(existingYapilan) > parseFloat(newYapilan)
        ? existingYapilan
        : newYapilan;

    return {
      ...item,
      yapilan: finalYapilan,
      devreden: existingDevreden !== undefined ? existingDevreden : item.devreden,
    };
  });
}

// ========== SİMÜLATÖR FONKSİYONU ==========
function openSimulator() {
  const birimId = getCurrentBirimId();
  const userType = getCurrentUserType();

  // 1. Kullanıcı tipi kontrolü
  if (userType !== "doctor") {
    import("./modules/ui/components/index.js").then(({ messageDialog }) => {
      messageDialog("Bu özellik sadece Aile Hekimi modunda kullanılabilir.", "Bilgi");
    });
    return;
  }

  // 2. Birim ID kontrolü
  if (!birimId) {
    import("./modules/ui/components/index.js").then(({ messageDialog }) => {
      messageDialog("Lütfen önce Birim ID girin!", "Uyarı");
    });
    return;
  }

  // 3. Nüfus kontrolü (YENİ!)
  const nufusInput = document.getElementById("nufus");
  const nufus = parseFloat(nufusInput?.value) || 0;

  if (nufus <= 0) {
    import("./modules/ui/components/index.js").then(({ messageDialog }) => {
      messageDialog(
        "Tavan katsayısı hesaplamak için Nüfus bilgisi gereklidir.\n\n" + "Lütfen önce Nüfus değerini girin.",
        "Eksik Bilgi"
      );
    });
    return;
  }

  // 4. Veri kontrolü
  const key = `savedResults_doctor_${birimId}`;
  chrome.storage.local.get([key], (res) => {
    const savedData = res[key]?.data || [];

    if (savedData.length === 0) {
      import("./modules/ui/components/index.js").then(({ messageDialog }) => {
        messageDialog(
          "Henüz veri çekilmemiş.\n\n" + "Lütfen önce SİNA butonuna tıklayarak verileri getirin.",
          "Veri Bulunamadı"
        );
      });
      return;
    }

    // 5. Tavan katsayısını hesapla
    const tavanKatsayi = nufus > 0 ? Math.min(1.5, Math.max(1.0, 4000 / nufus)) : 1.0;

    // 6. Simülasyon modalını aç
    showSimulatorModal(savedData, tavanKatsayi);
  });
}

// ========== GLOBAL UI REFRESH FONKSİYONU ==========
window.refreshUIForUserType = function (type) {
  setUserType(type);

  // Simülatör butonu görünürlüğünü güncelle
  const simulatorWrapper = document.getElementById("btnSimulator")?.closest(".btn-wrapper");
  if (simulatorWrapper) {
    simulatorWrapper.style.display = type === "doctor" ? "flex" : "none";
  }
};

export function deleteAllData() {
  import("./modules/ui/components/index.js").then(({ confirmDialog, messageDialog }) => {
    confirmDialog(
      "TÜM BİRİMLERİN tüm verileri kalıcı olarak silinecek. Devam etmek istiyor musunuz?",
      "Veri Silme Onayı"
    ).then((confirmed) => {
      if (!confirmed) return;
      const prefixes = ["savedResults_", "sinaLastTime_", "hypLastTime_", "nufus_", "nurseShowAll_"];
      chrome.storage.local.get(null, (items) => {
        const keysToRemove = Object.keys(items).filter((key) => prefixes.some((p) => key.startsWith(p)));
        if (items.birimId !== undefined) keysToRemove.push("birimId");
        const userTypeBeforeDelete = items.userType || "doctor";
        if (keysToRemove.length > 0) {
          chrome.storage.local.remove(keysToRemove, () => {
            resetUIAfterDataClear();
            setDomNufus("");
            setDomBirimId("");
            setCurrentBirimId("");
            setCurrentShowAll(false);
            tavanHesapla("");

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
  const savedAy = await new Promise((resolve) =>
    chrome.storage.local.get(["lastSelectedAy"], (res) => resolve(res.lastSelectedAy))
  );
  if (savedAy) {
    const aySelect = document.getElementById("ay");
    if (aySelect) aySelect.value = savedAy;
  }

  const savedYil = await new Promise((resolve) =>
    chrome.storage.local.get(["lastSelectedYil"], (res) => resolve(res.lastSelectedYil))
  );
  if (savedYil) {
    const yilInput = document.getElementById("yil");
    if (yilInput) yilInput.value = savedYil;
  }

  const savedBirimId = await new Promise((resolve) =>
    chrome.storage.local.get(["birimId"], (res) => resolve(res.birimId))
  );
  if (savedBirimId) {
    const birimIdInput = document.getElementById("birimId");
    if (birimIdInput) birimIdInput.value = savedBirimId;
    setCurrentBirimId(savedBirimId);

    const savedNufus = await new Promise((resolve) =>
      chrome.storage.local.get([`nufus_${savedBirimId}`], (res) => resolve(res[`nufus_${savedBirimId}`]))
    );
    if (savedNufus) {
      const nufusInput = document.getElementById("nufus");
      if (nufusInput) nufusInput.value = savedNufus;
      tavanHesapla(savedNufus);
    }
  }

  const savedTheme = await new Promise((resolve) =>
    chrome.storage.local.get(["themePreference"], (res) => resolve(res.themePreference || "light"))
  );
  applyTheme(savedTheme);

  const savedUserType = await new Promise((resolve) =>
    chrome.storage.local.get(["userType"], (res) => resolve(res.userType || "doctor"))
  );

  if (typeof setUserType === "function") {
    setUserType(savedUserType);
  } else {
    setCurrentUserType(savedUserType);
    saveCurrentUserTypeToStorage();

    const birimId = getCurrentBirimId();
    const currentAy = getDomAy();
    const currentYil = getDomYil();

    updateUIForUserType(savedUserType, birimId, currentAy, currentYil, updateHypButtonStateUI);
  }

  const savedFontSize = await new Promise((resolve) =>
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
  // State'i storage'dan yükle
  await loadStateFromStorage();

  // Tema yükleme
  const themeSelect = inputs.theme();
  if (themeSelect) {
    const savedTheme = await new Promise((resolve) =>
      chrome.storage.local.get(["themePreference"], (res) => resolve(res.themePreference || "light"))
    );
    applyTheme(savedTheme);
    themeSelect.value = savedTheme;
  }

  const aylar = [
    "OCAK",
    "SUBAT",
    "MART",
    "NISAN",
    "MAYIS",
    "HAZIRAN",
    "TEMMUZ",
    "AGUSTOS",
    "EYLUL",
    "EKIM",
    "KASIM",
    "ARALIK",
  ];
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
        loadDataForCurrentBirimWithMerge(
          updateTable,
          userType,
          birimId,
          (hasData) => {
            updateHypButtonStateUI(hasData, userType);

            // ✅ Simülatör butonunu güncelle
            const simulatorBtn = document.getElementById("btnSimulator");
            if (simulatorBtn) simulatorBtn.disabled = !hasData;
          },
          showAll,
          selectedAy,
          selectedYil
        );
      });
    } else {
      loadDataForCurrentBirim(
        updateTable,
        userType,
        birimId,
        (hasData) => {
          updateHypButtonStateUI(hasData, userType);

          // ✅ Simülatör butonunu güncelle
          const simulatorBtn = document.getElementById("btnSimulator");
          if (simulatorBtn) simulatorBtn.disabled = !hasData;
        },
        false,
        selectedAy,
        selectedYil
      );
    }
  }

  if (aySelect) aySelect.value = aylar[suAn.getMonth()];
  if (yilInput) yilInput.value = suAn.getFullYear();

  // Rıza kontrolü
  const consentRes = await new Promise((resolve) => chrome.storage.local.get(["kvkkConsent"], resolve));
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
  const userTypeExists = await new Promise((resolve) =>
    chrome.storage.local.get(["userType"], (res) => resolve(res.userType !== undefined))
  );
  if (!userTypeExists) {
    const { userType: selectedType, theme: selectedTheme } = await showFirstTimeUserTypeModal();
    await chrome.storage.local.set({
      userType: selectedType,
      themePreference: selectedTheme,
    });
    const userTypeSelect = document.getElementById("userTypeSelect");
    if (userTypeSelect) userTypeSelect.value = selectedType;
    applyTheme(selectedTheme);
    setUserType(selectedType);
  }

  cleanExpiredData(updateTable);
  migrateFromOldStorage();

  // Güncelleme sonrası yenilikler
  const lastVersionSeen = await new Promise((resolve) =>
    chrome.storage.local.get(["lastVersionSeen"], (res) => resolve(res.lastVersionSeen))
  );

  const manifest = chrome.runtime.getManifest();
  const currentVersion = manifest.version;

  if (lastVersionSeen !== currentVersion) {
    await showWhatsNewModal(currentVersion); // ← Artık doğru tema ile açılır!
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
    const versionBadge = document.getElementById("versionBadge");
    if (versionBadge && manifest?.version) versionBadge.textContent = `v${manifest.version}`;
  } catch (e) {
    const versionBadge = document.getElementById("versionBadge");
    if (versionBadge) versionBadge.textContent = "v2.0.2";
  }

  // Simülatör butonu
  const simulatorBtn = document.getElementById("btnSimulator");
  if (simulatorBtn) {
    simulatorBtn.addEventListener("click", openSimulator);
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

  // Ayarlar butonu
  const settingsBtn = document.getElementById("btnSettings");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      import("./modules/ui/components/modal/settings.js").then(({ openSettingsModal }) => {
        openSettingsModal();
      });
    });
  }

  // Kayıtlı dönem ayarlarını yükle
  await loadSavedPeriodSettings();

  // Tüm event handler'ları bağla
  bindAllEvents(
    setUserType,
    deleteAllData,
    revokeConsent,
    getDomAy,
    getDomYil,
    getDomBirimId,
    reloadDataByMonth,
    loadNufusForBirim,
    tavanHesapla,
    updateHypButtonStateUI,
    aySelect,
    yilInput
  );

  // Mesaj dinleyici
  chrome.runtime.onMessage.addListener(async (msg, _sender, sendResponse) => {
    console.log("📨 Mesaj alındı:", msg.action);

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

    const simdi = new Date().toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const { messageDialog } = await import("./modules/ui/components/index.js");

    if (msg.action === "dataParsed") {
      hideLoadingSpinner();
      const ayStr = document.getElementById("ay")?.value || "";
      const yil = parseInt(document.getElementById("yil")?.value || "0");
      const birimId = getDomBirimId();
      const userType = getCurrentUserType();

      let targetUserType = userType;
      let pendingStorage = "nurse";

      // pendingStorageType'ı state'ten al
      chrome.storage.local.get(["pendingStorageType"], (res) => {
        pendingStorage = res.pendingStorageType || "nurse";
        console.log(`🔍 pendingStorageType: ${pendingStorage}`); // ← BU LOGU EKLE

        if (!birimId) {
          if (sendResponse) sendResponse({ status: "error", message: "Birim ID gerekli" });
          return;
        }

        if (userType === "nurse" && pendingStorage) {
          targetUserType = pendingStorage;
        }

        const merged = msg.results;

        console.log(`📊 dataParsed: ${merged.length} işlem, targetUserType=${targetUserType}`);

        if (merged.length > 0) {
          const key = `savedResults_${targetUserType}_${birimId}`;

          chrome.storage.local.get([key], (res) => {
            const existingRecord = res[key];
            let existingData = existingRecord?.data || [];

            // Ay/yıl kontrolü
            if (existingRecord) {
              const hasMonthYear = existingRecord.ay !== undefined && existingRecord.yil !== undefined;
              if (hasMonthYear && (existingRecord.ay !== ayStr || existingRecord.yil !== yil)) {
                console.log(`📅 Farklı ay/yıl tespit edildi, mevcut veri kullanılmayacak`);
                existingData = [];
              }
            }

            // Birleştir
            const finalData = mergeSinaData(existingData, merged);

            console.log(`📊 Birleştirme sonucu: ${finalData.length} işlem`);

            // ✅ TEK SEFERDE KAYDET
            const saveData = {
              [`savedResults_${targetUserType}_${birimId}`]: {
                data: finalData,
                timestamp: Date.now(),
                ay: ayStr,
                yil: yil,
              },
              [`sinaLastTime_${targetUserType}_${birimId}`]: {
                data: simdi,
                timestamp: Date.now(),
              },
            };

            chrome.storage.local.set(saveData, () => {
              console.log(`✅ Veriler kaydedildi: ${targetUserType}`);

              const sinaTimeSpan = document.getElementById("sinaTime");
              if (sinaTimeSpan) sinaTimeSpan.textContent = simdi;

              // ✅ TABLOYU GÜNCELLE
              if (userType === "nurse") {
                if (targetUserType === "doctor") {
                  const hypTimeSpan = document.getElementById("hypTime");
                  if (hypTimeSpan) hypTimeSpan.textContent = simdi;
                  setCurrentShowAll(true);
                  saveNurseShowAllForBirim(birimId, true);
                }

                const nurseKey = `savedResults_nurse_${birimId}`;
                const doctorKey = `savedResults_doctor_${birimId}`;

                chrome.storage.local.get([nurseKey, doctorKey], (allRes) => {
                  let nurseData = allRes[nurseKey]?.data || [];
                  let doctorData = allRes[doctorKey]?.data || [];

                  const nurseRecord = allRes[nurseKey];
                  const doctorRecord = allRes[doctorKey];

                  if (nurseRecord) {
                    const hasMonthYear = nurseRecord.ay !== undefined && nurseRecord.yil !== undefined;
                    if (hasMonthYear && (nurseRecord.ay !== ayStr || nurseRecord.yil !== yil)) {
                      nurseData = [];
                    }
                  }

                  if (doctorRecord) {
                    const hasMonthYear = doctorRecord.ay !== undefined && doctorRecord.yil !== undefined;
                    if (hasMonthYear && (doctorRecord.ay !== ayStr || doctorRecord.yil !== yil)) {
                      doctorData = [];
                    }
                  }

                  console.log(`📊 ASÇ Tablo: nurseData=${nurseData.length}, doctorData=${doctorData.length}`);

                  const hasBoth = nurseData.length > 0 && doctorData.length > 0;
                  const hasAny = nurseData.length > 0 || doctorData.length > 0;

                  if (!hasAny) {
                    updateTable([], userType, false, birimId);
                    return;
                  }

                  if (hasBoth) {
                    const mergedData = [...nurseData];
                    doctorData.forEach((doctorItem) => {
                      const doctorAd = normalizeText(doctorItem.ad);
                      const exists = nurseData.some((nurseItem) => normalizeText(nurseItem.ad) === doctorAd);
                      if (!exists) mergedData.push(doctorItem);
                    });
                    console.log(`📊 ASÇ Tablo: Birleştirilmiş veri ${mergedData.length} işlem`);
                    updateTable(combineData(mergedData), userType, true, birimId);
                  } else if (nurseData.length > 0) {
                    console.log(`📊 ASÇ Tablo: Sadece hemşire verisi`);
                    updateTable(nurseData, userType, false, birimId);
                  } else if (doctorData.length > 0) {
                    console.log(`📊 ASÇ Tablo: Sadece doktor verisi`);
                    updateTable(doctorData, userType, true, birimId);
                  }
                });
              } else {
                updateTable(finalData, userType, getCurrentShowAll(), birimId);
              }

              // Butonları aktif et
              const hypBtn = document.getElementById("btnHyp");
              const simulatorBtn = document.getElementById("btnSimulator");
              if (hypBtn) hypBtn.disabled = false;
              if (simulatorBtn && userType === "doctor") {
                simulatorBtn.disabled = false;
              }

              setPendingShowAll(false);
              setPendingStorageType("nurse");

              if (sendResponse) sendResponse({ status: "ok", data: finalData });
            });
          });

          return true;
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
            uyariMesaji = `${ayStr} ${yil} için henüz veri bulunmuyor.\n\nVeriler genellikle ayın 8-10. günlerinde sisteme yansır.\n\n${oncekiAyAdi} ${oncekiYil} veya daha eski bir ayı seçmeyi deneyin.`;
          } else if (ayStr === cariAyAdi && yil === cariYil && gun > 10) {
            uyariMesaji = `${ayStr} ${yil} için veri bulunamadı.\n\nVeriler henüz sisteme yansımamış olabilir. Lütfen daha sonra tekrar deneyin.`;
          } else {
            uyariMesaji = `${ayStr} ${yil} için veri bulunamadı.\n\nLütfen daha sonra tekrar deneyin.`;
          }

          messageDialog(uyariMesaji, "Bilgilendirme");

          if (userType === "nurse") {
            loadNurseShowAllForBirim(birimId).then((showAll) => {
              loadDataForCurrentBirimWithMerge(updateTable, userType, birimId, null, showAll, ayStr, yil);
            });
          } else {
            loadDataForCurrentBirim(updateTable, userType, birimId, null, false, ayStr, yil);
          }

          if (sendResponse) sendResponse({ status: "ok", data: [] });
          return;
        }
      });
    } else if (msg.action === "hypError") {
      hideLoadingSpinner();
      messageDialog(msg.error, "HYP Hatası");
      return true;
    } else if (msg.action === "hypDataParsed") {
      hideLoadingSpinner();

      const ayStr = document.getElementById("ay")?.value || "";
      const yil = parseInt(document.getElementById("yil")?.value || "0");
      const birimId = getDomBirimId();

      if (!birimId) {
        if (sendResponse) sendResponse({ status: "error", message: "Birim ID gerekli" });
        return true;
      }

      const userType = getCurrentUserType();
      const showAll = getCurrentShowAll();
      const key = `savedResults_${userType}_${birimId}`;

      chrome.storage.local.get([key], async (res) => {
        const existingRecord = res[key];
        let guncelVeri = existingRecord?.data || [];

        // Mevcut ay/yıl kontrolü
        if (existingRecord) {
          const hasMonthYear = existingRecord.ay !== undefined && existingRecord.yil !== undefined;
          if (hasMonthYear && (existingRecord.ay !== ayStr || existingRecord.yil !== yil)) {
            console.log(`📅 HYP: Farklı ay/yıl, mevcut veri kullanılmayacak`);
            guncelVeri = [];
          }
        }

        // ✅ LOGLAR
        console.log("📊 HYP gelen veri:", msg.results);
        console.log("📊 Storage key:", key);
        console.log("📊 existingRecord:", existingRecord);
        console.log("📊 guncelVeri (ilk hali):", guncelVeri.length, "işlem");
        console.log("📊 ayStr:", ayStr, "yil:", yil);

        // HYP verilerini mevcut veriye ekle
        msg.results.forEach((hypItem) => {
          const hypAdNormalized = normalizeText(hypItem.ad);
          const idx = guncelVeri.findIndex((s) => normalizeText(s.ad) === hypAdNormalized);
          if (idx !== -1) {
            guncelVeri[idx].yapilan = hypItem.yapilan;
          }
        });

        console.log("📊 guncelVeri (güncellenmiş):", guncelVeri);

        if (guncelVeri.length > 0) {
          storeDataWithTimestamp("savedResults", guncelVeri, userType, birimId, ayStr, yil);
          storeDataWithTimestamp("hypLastTime", simdi, userType, birimId);

          const hypTimeSpan = document.getElementById("hypTime");
          if (hypTimeSpan) hypTimeSpan.textContent = simdi;
        }

        // ✅ TABLOYU GÜNCELLE
        loadDataForCurrentBirimWithMerge(updateTable, userType, birimId, null, showAll, ayStr, yil);

        const simulatorBtn = document.getElementById("btnSimulator");
        if (simulatorBtn && userType === "doctor") {
          simulatorBtn.disabled = false;
        }

        if (sendResponse && typeof sendResponse === "function") {
          sendResponse({ status: "ok" });
        }
      });

      return true;
    }
    return true;
  });
});

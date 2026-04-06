import { buildSinaUrl, HYP_URLS } from './modules/config.js';
import { hypToSinaMap } from './modules/constants.js';
import { 
  getCurrentBirimId, storeDataWithTimestamp,
  saveNufusForBirim, loadNufusForBirim, loadDataForCurrentBirim, loadDataForCurrentBirimWithMerge, cleanExpiredData, exportData, revokeConsent 
} from './modules/storage.js';
import { tavanHesapla } from './modules/calculations.js';
import { updateTable, applyTheme, applyKvkkVisibility, setUIEnabled } from './modules/ui.js';
import { requestConsent, showChangelog, closeModal, confirmDialog, messageDialog, showAboutDialog, showFirstTimeUserTypeModal, showWhatsNewModal } from './modules/modals.js';
import { getCurrentYearMonth, getMonthNumber, isDateValid } from './modules/date-utils.js';
import { migrateFromOldStorage } from './modules/migration.js';

// ========== GLOBAL DEĞİŞKENLER ==========
let currentUserType = "doctor";
let currentBirimId = "";
let pendingShowAll = false;
let pendingStorageType = "nurse";
let currentShowAll = false;

// ========== GLOBAL FONKSİYONLAR ==========
function updateHypButtonState(hasData) {
  const hypBtn = document.getElementById("btnHyp");
  if (hypBtn) hypBtn.disabled = !hasData;
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

// ========== SET USERTYPE (GLOBAL) ==========
function setUserType(type) {
  currentUserType = type;
  chrome.storage.local.set({ userType: type });
  currentBirimId = getCurrentBirimId();

  const tavanKart = document.getElementById("tavanKatsayi")?.closest(".score-box");
  const surecRow = document.getElementById("surecYonetimi")?.closest(".row");
  const nufusRow = document.getElementById("nufus")?.closest(".row");
  const sinaBtn = document.getElementById("btnSina");
  const hypBtn = document.getElementById("btnHyp");

  const currentAy = document.getElementById("ay")?.value || "";
  const currentYil = parseInt(document.getElementById("yil")?.value || "0");


  if (type === "nurse") {
    if (tavanKart) tavanKart.style.display = "none";
    if (surecRow) surecRow.style.display = "none";
    if (nufusRow) nufusRow.style.display = "none";
    if (sinaBtn) sinaBtn.textContent = "SİNA";
    if (hypBtn) hypBtn.textContent = "SİNA BİRİM";
    if (sinaBtn) sinaBtn.disabled = false;

    if (currentBirimId) {
      chrome.storage.local.get([`nurseShowAll_${currentBirimId}`], async (res) => {
        let showAll = res[`nurseShowAll_${currentBirimId}`] === true;
        if (res[`nurseShowAll_${currentBirimId}`] === undefined) {
          const doctorKey = `savedResults_doctor_${currentBirimId}`;
          const doctorRes = await new Promise(resolve => chrome.storage.local.get([doctorKey], resolve));
          const hasDoctorData = doctorRes[doctorKey]?.data && doctorRes[doctorKey].data.length > 0;
          if (hasDoctorData) {
            showAll = true;
            chrome.storage.local.set({ [`nurseShowAll_${currentBirimId}`]: true });
          }
        }
        currentShowAll = showAll;
        loadDataForCurrentBirimWithMerge(updateTable, currentUserType, currentBirimId, updateHypButtonState, currentShowAll, currentAy, currentYil);
      });
    } else {
      loadDataForCurrentBirimWithMerge(updateTable, currentUserType, currentBirimId, updateHypButtonState, false, currentAy, currentYil);
    }
  } else {
    if (tavanKart) tavanKart.style.display = "flex";
    if (surecRow) surecRow.style.display = "flex";
    if (nufusRow) nufusRow.style.display = "flex";
    if (sinaBtn) sinaBtn.textContent = "SİNA";
    if (hypBtn) hypBtn.textContent = "HYP";
    if (sinaBtn) sinaBtn.disabled = false;
    currentShowAll = false;

    if (currentBirimId) {
      loadNufusForBirim(currentBirimId, tavanHesapla);
    }
    loadDataForCurrentBirim(updateTable, currentUserType, currentBirimId, updateHypButtonState, false, currentAy, currentYil);
  }
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
      const currentUserTypeBeforeDelete = items.userType || "doctor";
      if (keysToRemove.length > 0) {
        chrome.storage.local.remove(keysToRemove, () => {
          updateTable([]);
          document.getElementById("sinaTime").textContent = "";
          document.getElementById("hypTime").textContent = "";
          document.getElementById("nufus").value = "";
          document.getElementById("birimId").value = "";
          currentBirimId = "";
          currentShowAll = false;
          currentUserType = currentUserTypeBeforeDelete;
          const userTypeSelect = document.getElementById("userTypeSelect");
          if (userTypeSelect) userTypeSelect.value = currentUserTypeBeforeDelete;
          setUserType(currentUserTypeBeforeDelete);
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

  // Ay veya yıl değiştiğinde verileri yeniden yükle
  function reloadDataByMonth() {
    if (!currentBirimId) return;
    const selectedAy = aySelect?.value || "";
    const selectedYil = parseInt(yilInput?.value || "0");
    if (currentUserType === "nurse") {
      loadDataForCurrentBirimWithMerge(updateTable, currentUserType, currentBirimId, updateHypButtonState, currentShowAll, selectedAy, selectedYil);
    } else {
      loadDataForCurrentBirim(updateTable, currentUserType, currentBirimId, updateHypButtonState, false, selectedAy, selectedYil);
    }
  }

  if (aySelect) aySelect.addEventListener("change", reloadDataByMonth);
  if (yilInput) yilInput.addEventListener("change", reloadDataByMonth);

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

  userTypeSelect.addEventListener("change", (e) => {
    setUserType(e.target.value);
  });

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

  // ========== PANEL KAPATMA (WHEEL / CLICK) ==========
  document.addEventListener('wheel', (event) => {
    const settingsPanel = document.getElementById('settingsPanel');
    const advancedDiv = document.getElementById('advancedSettings');
    chrome.storage.local.get(["closeOnWheelOutside"], (res) => {
      const closeOnWheel = res.closeOnWheelOutside !== false;
      if (closeOnWheel) {
        if (settingsPanel?.style.display === 'block' && !settingsPanel.contains(event.target))
          settingsPanel.style.display = 'none';
        if (advancedDiv?.classList.contains('show') && !advancedDiv.contains(event.target)) {
          advancedDiv.classList.remove('show');
          const toggleBtn = document.getElementById('toggleAdvancedBtn');
          if (toggleBtn) toggleBtn.textContent = '🔧 Gelişmiş Ayarlar';
        }
      }
    });
  });

  document.addEventListener('click', (event) => {
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsBtn = document.getElementById('btnSettings');
    const advancedDiv = document.getElementById('advancedSettings');
    const toggleBtn = document.getElementById('toggleAdvancedBtn');
    chrome.storage.local.get(["closeOnClickOutside"], (res) => {
      const closeOnClick = res.closeOnClickOutside !== false;
      if (closeOnClick) {
        if (settingsPanel?.style.display === 'block' && !settingsPanel.contains(event.target) && event.target !== settingsBtn)
          settingsPanel.style.display = 'none';
        if (advancedDiv?.classList.contains('show') && !advancedDiv.contains(event.target) && event.target !== toggleBtn) {
          advancedDiv.classList.remove('show');
          if (toggleBtn) toggleBtn.textContent = '🔧 Gelişmiş Ayarlar';
        }
      }
    });
  });

  // ========== TEMA ==========
  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) {
    chrome.storage.local.get(["themePreference"], (res) => {
      const savedTheme = res.themePreference || "light";
      themeSelect.value = savedTheme;
      applyTheme(savedTheme);
    });
    themeSelect.addEventListener("change", (e) => {
      const theme = e.target.value;
      applyTheme(theme);
      chrome.storage.local.set({ themePreference: theme });
      if (currentBirimId) {
        if (currentUserType === "nurse") {
          loadDataForCurrentBirimWithMerge(updateTable, currentUserType, currentBirimId, undefined, currentShowAll);
        } else {
          const key = `savedResults_${currentUserType}_${currentBirimId}`;
          chrome.storage.local.get([key], (res) => {
            if (res[key]?.data) updateTable(res[key].data, currentUserType, false, currentBirimId);
          });
        }
      }
    });
  }

  // ========== SÜREÇ YÖNETİMİ ==========
  const surecSelect = document.getElementById("surecYonetimi");
  if (surecSelect) {
    chrome.storage.local.get(["surec"], (res) => {
      surecSelect.value = res.surec?.data || "1.03";
    });
    surecSelect.addEventListener("change", (e) => {
      storeDataWithTimestamp("surec", e.target.value, currentUserType, currentBirimId);
      loadDataForCurrentBirimWithMerge(updateTable, currentUserType, currentBirimId, undefined, currentShowAll);
    });
  }

  // ========== BİRİM ID ==========
  const birimIdInput = document.getElementById("birimId");
  if (birimIdInput) {
    chrome.storage.local.get(["birimId"], (res) => {
      if (res.birimId) {
        birimIdInput.value = res.birimId;
        currentBirimId = res.birimId;
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

    birimIdInput.addEventListener("change", (e) => {
      const newBirimId = e.target.value.trim();
      currentBirimId = newBirimId;
      chrome.storage.local.set({ birimId: newBirimId });
      document.getElementById("hypTime").textContent = "";
      document.getElementById("sinaTime").textContent = "";
      loadNufusForBirim(newBirimId, tavanHesapla);
      if (currentUserType === "nurse") {
        chrome.storage.local.get([`nurseShowAll_${newBirimId}`], (res) => {
          currentShowAll = res[`nurseShowAll_${newBirimId}`] === true;
          loadDataForCurrentBirimWithMerge(updateTable, currentUserType, newBirimId, updateHypButtonState, currentShowAll);
        });
      } else {
        currentShowAll = false;
        loadDataForCurrentBirimWithMerge(updateTable, currentUserType, newBirimId, updateHypButtonState, false);
      }
    });
  }

  // ========== NÜFUS ==========
  const nufusInput = document.getElementById("nufus");
  if (nufusInput) {
    nufusInput.addEventListener("change", (e) => {
      const val = e.target.value;
      if (currentBirimId) saveNufusForBirim(currentBirimId, val);
      tavanHesapla(val);
    });
    nufusInput.addEventListener("input", (e) => tavanHesapla(e.target.value));
  }

  // ========== KVKK GÖRÜNÜRLÜK ==========
  chrome.storage.local.get(["kvkkHidden"], (res) => applyKvkkVisibility(res.kvkkHidden === true));

  // ========== BUTONLAR ==========
  document.getElementById("btnSina")?.addEventListener("click", async () => {
    const ayStr = document.getElementById("ay")?.value || "";
    const yil = parseInt(document.getElementById("yil")?.value || "0");
    const ayNum = getMonthNumber(ayStr);
    if (!ayStr || !yil) {
      await messageDialog("Lütfen Ay ve Yıl seçin!", "Uyarı");
      return;
    }
    if (!isDateValid(yil, ayNum, true)) {
      const current = getCurrentYearMonth();
      await messageDialog(`SİNA butonu sadece cari dönem ve öncesi, ${current.year} yılı ${current.month+1}. ay ve öncesi için çalışır.`, "Uyarı");
      return;
    }
    if (!currentBirimId) {
      await messageDialog("Lütfen Birim ID girin!", "Uyarı");
      return;
    }
    let url;
    if (currentUserType === "nurse") {
      url = buildSinaUrl("nurse", ayStr, currentBirimId, yil);
      pendingStorageType = "nurse";
    } else {
      url = buildSinaUrl("doctor", ayStr, currentBirimId, yil);
    }
    chrome.tabs.create({ url });
  });

  document.getElementById("btnHyp")?.addEventListener("click", async () => {
    const ayStr = document.getElementById("ay")?.value || "";
    const yil = parseInt(document.getElementById("yil")?.value || "0");
    const ayNum = getMonthNumber(ayStr);
    if (!ayStr || !yil) {
      await messageDialog("Lütfen Ay ve Yıl seçin!", "Uyarı");
      return;
    }
    let url;
    if (currentUserType === "nurse") {
      if (!isDateValid(yil, ayNum, true)) {
        const current = getCurrentYearMonth();
        await messageDialog(`SİNA BİRİM butonu sadece cari dönem ve öncesi, ${current.year} yılı ${current.month+1}. ay ve öncesi için çalışır.`, "Uyarı");
        return;
      }
      url = buildSinaUrl("doctor", ayStr, currentBirimId, yil);
      currentShowAll = true;
      chrome.storage.local.set({ [`nurseShowAll_${currentBirimId}`]: true });
      pendingStorageType = "doctor";
    } else {
      if (!isDateValid(yil, ayNum, false)) {
        const current = getCurrentYearMonth();
        await messageDialog(`HYP butonu sadece cari dönem, ${current.year} yılı ${current.month+1}. ay için çalışır.`, "Uyarı");
        return;
      }
      url = HYP_URLS.DASHBOARD;
    }
    chrome.tabs.create({ url });
  });

  document.getElementById("btnDeleteData")?.addEventListener("click", deleteAllData);
  document.getElementById("btnExportData")?.addEventListener("click", () => exportData(currentUserType, currentBirimId));
  document.getElementById("btnRevokeConsent")?.addEventListener("click", revokeConsent);
  document.getElementById("btnChangelog")?.addEventListener("click", showChangelog);
  document.getElementById("btnToggleKvkk")?.addEventListener("click", () => {
    chrome.storage.local.get(["kvkkHidden"], (res) => {
      const newHide = !(res.kvkkHidden === true);
      chrome.storage.local.set({ kvkkHidden: newHide });
      applyKvkkVisibility(newHide);
    });
  });

  const btnSettings = document.getElementById("btnSettings");
  const settingsPanel = document.getElementById("settingsPanel");
  if (btnSettings && settingsPanel) {
    btnSettings.addEventListener("click", () => {
      settingsPanel.style.display = settingsPanel.style.display === "none" ? "block" : "none";
    });
  }

  const closeSpan = document.querySelector("#changelogModal .modal-close");
  if (closeSpan) closeSpan.addEventListener("click", closeModal);
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("changelogModal");
    if (event.target === modal) closeModal();
  });

  document.getElementById("btnAbout")?.addEventListener("click", showAboutDialog);

  // KVKK FOOTER
  const kvkkFooter = document.getElementById("kvkkFooter");
  const toggleFooterBtn = document.getElementById("toggleKvkkFooterBtn");
  if (kvkkFooter && toggleFooterBtn) {
    chrome.storage.local.get(["kvkkFooterHidden"], (res) => {
      kvkkFooter.style.display = res.kvkkFooterHidden === true ? "none" : "flex";
    });
    toggleFooterBtn.addEventListener("click", async () => {
      const confirmed = await confirmDialog("KVKK bilgilendirme metni gizlenecektir. Tekrar göstermek için ayarlar panelindeki (⚙️) 'KVKK Bilgilendirmelerini Göster' butonunu kullanabilirsiniz.\n\nDevam etmek istiyor musunuz?", "Bilgilendirme Metnini Gizle");
      if (!confirmed) return;
      kvkkFooter.style.display = "none";
      chrome.storage.local.set({ kvkkFooterHidden: true });
      applyKvkkVisibility(true);
    });
  }

  // ========== MESAJ DİNLEYİCİ (DÜZELTİLMİŞ) ==========
  chrome.runtime.onMessage.addListener(async (msg) => {
    const simdi = new Date().toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

    if (msg.action === "dataParsed") {
      const ayStr = document.getElementById("ay")?.value || "";
      const yil = parseInt(document.getElementById("yil")?.value || "0");

      if (!currentBirimId) return;
      let targetUserType = currentUserType;
      if (currentUserType === "nurse" && pendingStorageType) targetUserType = pendingStorageType;
      const key = `savedResults_${targetUserType}_${currentBirimId}`;
      chrome.storage.local.get([key], async (res) => {
        let existingData = res[key]?.data || [];
        const hypYapilanMap = new Map();
        existingData.forEach(item => hypYapilanMap.set(item.ad, item.yapilan));
        const merged = msg.results.map(sinaItem => {
          const hypYapilan = hypYapilanMap.get(sinaItem.ad);
          if (hypYapilan !== undefined && hypYapilan !== sinaItem.yapilan) return { ...sinaItem, yapilan: hypYapilan };
          return sinaItem;
        });

        storeDataWithTimestamp("savedResults", merged, targetUserType, currentBirimId, ayStr, yil);
        storeDataWithTimestamp("sinaLastTime", simdi, targetUserType, currentBirimId);
        const sinaTimeSpan = document.getElementById("sinaTime");
        if (sinaTimeSpan) sinaTimeSpan.textContent = simdi;

        // ========== VERİ YOKSA UYARI GÖSTER (SADECE CARİ AY VE GÜN ≤ 10 İSE) ==========
        if (merged.length === 0) {
          const suAn = new Date();
          const cariAyIndex = suAn.getMonth();
          const cariYil = suAn.getFullYear();
          const gun = suAn.getDate();
          const secilenAyAdi = ayStr;
          const secilenYil = yil;
          const aylar = ["OCAK", "SUBAT", "MART", "NISAN", "MAYIS", "HAZIRAN", "TEMMUZ", "AGUSTOS", "EYLUL", "EKIM", "KASIM", "ARALIK"];
          const cariAyAdi = aylar[cariAyIndex];
          
          if (secilenAyAdi === cariAyAdi && secilenYil === cariYil && gun <= 10) {
            let oncekiAyIndex = cariAyIndex - 1;
            let oncekiYil = cariYil;
            if (oncekiAyIndex < 0) {
              oncekiAyIndex = 11;
              oncekiYil--;
            }
            const oncekiAyAdi = aylar[oncekiAyIndex];
            const uyariMesaji = `Seçtiğiniz dönem (${secilenAyAdi} ${secilenYil}) için SİNA'da veri bulunamadı.\n\n📌 Veriler genellikle ayın 8-10. günlerinde sisteme yansır.\n📌 ${oncekiAyAdi} ${oncekiYil} veya daha eski ayları seçerek mevcut verileri görüntüleyebilirsiniz.`;
            await messageDialog(uyariMesaji, "⚠️ Bilgilendirme");
          }
        }

        // *** DÜZELTME: ASÇ modunda SİNA BİRİM (doctor verisi) çekildiyse hypTimeSpan güncellensin ***
        if (currentUserType === "nurse" && targetUserType === "doctor") {
          const hypTimeSpan = document.getElementById("hypTime");
          if (hypTimeSpan) hypTimeSpan.textContent = simdi;
        }

        if (currentUserType === "nurse") {
          chrome.storage.local.get([`nurseShowAll_${currentBirimId}`], (showAllRes) => {
            const showAll = showAllRes[`nurseShowAll_${currentBirimId}`] === true;
            currentShowAll = showAll;
            if (showAll) {
              const nurseKey = `savedResults_nurse_${currentBirimId}`;
              const doctorKey = `savedResults_doctor_${currentBirimId}`;
              chrome.storage.local.get([nurseKey, doctorKey], (allRes) => {
                const nurseData = allRes[nurseKey]?.data || [];
                const doctorData = allRes[doctorKey]?.data || [];
                const combinedData = [...nurseData, ...doctorData];
                updateTable(combineData(combinedData), currentUserType, true, currentBirimId);
              });
            } else {
              updateTable(merged, currentUserType, false, currentBirimId);
            }
          });
        } else {
          updateTable(merged, currentUserType, currentShowAll, currentBirimId);
        }
        const hypBtn = document.getElementById("btnHyp");
        if (hypBtn) hypBtn.disabled = false;
        pendingShowAll = false;
        pendingStorageType = "nurse";
      });
    } else if (msg.action === "hypDataParsed") {
      const ayStr = document.getElementById("ay")?.value || "";
      const yil = parseInt(document.getElementById("yil")?.value || "0");
      if (!currentBirimId) return;
      const key = `savedResults_${currentUserType}_${currentBirimId}`;
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
        storeDataWithTimestamp("savedResults", guncelVeri, currentUserType, currentBirimId, ayStr, yil);
        storeDataWithTimestamp("hypLastTime", simdi, currentUserType, currentBirimId);
        const hypTimeSpan = document.getElementById("hypTime");
        if (hypTimeSpan) hypTimeSpan.textContent = simdi;
        loadDataForCurrentBirimWithMerge(updateTable, currentUserType, currentBirimId, null, currentShowAll);
      });
    }
  });
});


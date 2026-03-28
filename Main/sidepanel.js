import { hypToSinaMap } from './modules/constants.js';
import { 
  getCurrentBirimId, getStorageKey, storeDataWithTimestamp,
  saveNufusForBirim, loadNufusForBirim, loadDataForCurrentBirim, cleanExpiredData, deleteAllData, exportData, revokeConsent 
} from './modules/storage.js';
import { tavanHesapla } from './modules/calculations.js';
import { updateTable, applyTheme, applyKvkkVisibility, setUIEnabled } from './modules/ui.js';
import { requestConsent, showChangelog, closeModal } from './modules/modals.js';
import { getCurrentYearMonth, getMonthNumber, isDateValid } from './modules/date-utils.js';
import { migrateFromOldStorage } from './modules/migration.js';

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", async function () {
  // Tarih ve ay seçimleri
  const aylar = ["OCAK", "SUBAT", "MART", "NISAN", "MAYIS", "HAZIRAN", "TEMMUZ", "AGUSTOS", "EYLUL", "EKIM", "KASIM", "ARALIK"];
  const suAn = new Date();
  const aySelect = document.getElementById("ay");
  const yilInput = document.getElementById("yil");
  if (aySelect) aySelect.value = aylar[suAn.getMonth()];
  if (yilInput) yilInput.value = suAn.getFullYear();

  // Rıza kontrolü
  const consentRes = await new Promise(resolve => chrome.storage.local.get(["kvkkConsent"], resolve));
  let hasConsent = consentRes.kvkkConsent === true;

  if (!hasConsent) {
    hasConsent = await requestConsent();
  }

  if (!hasConsent) {
    setUIEnabled(false);
    document.getElementById("consentWarning")?.classList.remove("hidden");
    return;
  }

  setUIEnabled(true);
  document.getElementById("consentWarning")?.classList.add("hidden");

  // Saklama süresi temizliği
  cleanExpiredData(updateTable);

  // Migration (eski storage'dan yeni yapıya geçiş)
  migrateFromOldStorage();

  // ========== TEMA ==========
  const themeSelect = document.getElementById("themeSelect");
  chrome.storage.local.get(["themePreference"], (res) => {
    const savedTheme = res.themePreference || "light";
    if (themeSelect) themeSelect.value = savedTheme;
    applyTheme(savedTheme);
  });
  if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
      const theme = e.target.value;
      applyTheme(theme);
      chrome.storage.local.set({ themePreference: theme });
      const birimId = getCurrentBirimId();
      if (birimId) {
        const key = getStorageKey("savedResults", birimId);
        chrome.storage.local.get([key], (res) => {
          if (res[key]?.data) updateTable(res[key].data);
        });
      }
    });
  }
  
  // ========== SÜRÜM NUMARASI ==========
  try {
    const manifest = chrome.runtime.getManifest();
    const versionBadge = document.getElementById("versionBadge");
    if (versionBadge && manifest && manifest.version) {
      versionBadge.textContent = `v${manifest.version}`;
    }
  } catch (e) {
    console.warn("Sürüm numarası okunamadı:", e);
    const versionBadge = document.getElementById("versionBadge");
    if (versionBadge) versionBadge.textContent = "v1.5.4";
  }

  // ========== SÜREÇ YÖNETİMİ ==========
  const surecSelect = document.getElementById("surecYonetimi");
  if (surecSelect) {
    chrome.storage.local.get(["surec"], (res) => {
      if (res.surec?.data) surecSelect.value = res.surec.data;
      else surecSelect.value = "1.03";
    });
    surecSelect.addEventListener("change", (e) => {
      storeDataWithTimestamp("surec", e.target.value);
      loadDataForCurrentBirim(updateTable, tavanHesapla);
    });
  }

  // ========== BİRİM ID ==========
  const birimIdInput = document.getElementById("birimId");
  if (birimIdInput) {
    chrome.storage.local.get(["birimId"], (res) => {
      if (res.birimId) {
        birimIdInput.value = res.birimId;
        loadNufusForBirim(res.birimId, tavanHesapla);
        loadDataForCurrentBirim(updateTable, tavanHesapla);
      }
    });
    birimIdInput.addEventListener("change", (e) => {
      const newBirimId = e.target.value.trim();
      chrome.storage.local.set({ birimId: newBirimId });
      loadNufusForBirim(newBirimId, tavanHesapla);
      loadDataForCurrentBirim(updateTable, tavanHesapla);
    });
  }

  // ========== NÜFUS ==========
  const nufusInput = document.getElementById("nufus");
  if (nufusInput) {
    nufusInput.addEventListener("change", (e) => {
      const val = e.target.value;
      const birimId = getCurrentBirimId();
      if (birimId) saveNufusForBirim(birimId, val);
      tavanHesapla(val);
    });
    nufusInput.addEventListener("input", (e) => {
      tavanHesapla(e.target.value);
    });
  }

  // ========== KVKK GÖRÜNÜRLÜK ==========
  chrome.storage.local.get(["kvkkHidden"], (res) => {
    applyKvkkVisibility(res.kvkkHidden === true);
  });

  // ========== BUTONLAR ==========
  document.getElementById("btnSina")?.addEventListener("click", () => {
    const ayStr = document.getElementById("ay")?.value || "";
    const yil = parseInt(document.getElementById("yil")?.value || "0");
    const ayNum = getMonthNumber(ayStr);
    if (!ayStr || !yil) {
      alert("Lütfen Ay ve Yıl seçin!");
      return;
    }
    if (!isDateValid(yil, ayNum, true)) {
      const current = getCurrentYearMonth();
      alert(`SİNA butonu sadece cari dönem ve öncesi, ${current.year} yılı ${current.month+1}. ay ve öncesi dönem için çalışır.`);
      return;
    }
    const birimId = getCurrentBirimId();
    if (!birimId) {
      alert("Lütfen Birim ID girin!");
      return;
    }
    const url = `https://sina.saglik.gov.tr/showcases/SC-DBBEMXEEDFCCEAB/SCI-2N8Y5C2ADDC1FCD?filters=252840=${ayStr}%26252860=${birimId}%26252916=${yil}%26330586#kopyala`;
    chrome.tabs.create({ url });
  });

  document.getElementById("btnHyp")?.addEventListener("click", () => {
    const ayStr = document.getElementById("ay")?.value || "";
    const yil = parseInt(document.getElementById("yil")?.value || "0");
    const ayNum = getMonthNumber(ayStr);
    if (!ayStr || !yil) {
      alert("Lütfen Ay ve Yıl seçin!");
      return;
    }
    if (!isDateValid(yil, ayNum, false)) {
      const current = getCurrentYearMonth();
      alert(`HYP butonu sadece cari dönem, ${current.year} yılı ${current.month+1}. ay için çalışır.`);
      return;
    }
    chrome.tabs.create({ url: "https://hyp.saglik.gov.tr/dashboard#kopyala" });
  });

  document.getElementById("btnDeleteData")?.addEventListener("click", deleteAllData);
  document.getElementById("btnExportData")?.addEventListener("click", exportData);
  document.getElementById("btnRevokeConsent")?.addEventListener("click", revokeConsent);
  
  const btnChangelog = document.getElementById("btnChangelog");
  if (btnChangelog) btnChangelog.addEventListener("click", showChangelog);

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

  // ========== MESAJ DİNLEYİCİ ==========
  chrome.runtime.onMessage.addListener((msg) => {
    const simdi = new Date().toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (msg.action === "dataParsed") {
      const birimId = getCurrentBirimId();
      if (!birimId) return;
      const key = getStorageKey("savedResults", birimId);
      chrome.storage.local.get([key], (res) => {
        let existingData = res[key]?.data || [];
        const hypYapilanMap = new Map();
        existingData.forEach(item => hypYapilanMap.set(item.ad, item.yapilan));
        const merged = msg.results.map(sinaItem => {
          const hypYapilan = hypYapilanMap.get(sinaItem.ad);
          if (hypYapilan !== undefined && hypYapilan !== sinaItem.yapilan) {
            return { ...sinaItem, yapilan: hypYapilan };
          }
          return sinaItem;
        });
        storeDataWithTimestamp("savedResults", merged);
        storeDataWithTimestamp("sinaLastTime", simdi);
        const sinaTimeSpan = document.getElementById("sinaTime");
        if (sinaTimeSpan) sinaTimeSpan.textContent = simdi;
        updateTable(merged);
      });
    } else if (msg.action === "hypDataParsed") {
      const birimId = getCurrentBirimId();
      if (!birimId) return;
      const key = getStorageKey("savedResults", birimId);
      chrome.storage.local.get([key], (res) => {
        if (!res[key]?.data) {
          alert("Önce SİNA verilerini çekmelisiniz.");
          return;
        }
        let guncelVeri = [...res[key].data];
        msg.results.forEach((hypItem) => {
          const sinaKarsiligi = hypToSinaMap[hypItem.ad.toUpperCase()];
          if (sinaKarsiligi) {
            const hedefIndex = guncelVeri.findIndex((s) =>
              s.ad.toUpperCase().includes(sinaKarsiligi)
            );
            if (hedefIndex !== -1) {
              guncelVeri[hedefIndex].yapilan = hypItem.yapilan;
            }
          }
        });
        storeDataWithTimestamp("savedResults", guncelVeri);
        storeDataWithTimestamp("hypLastTime", simdi);
        const hypTimeSpan = document.getElementById("hypTime");
        if (hypTimeSpan) hypTimeSpan.textContent = simdi;
        updateTable(guncelVeri);
      });
    }
  });
});

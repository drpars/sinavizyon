import { hypToSinaMap } from './modules/constants.js';
import { 
  getCurrentBirimId, storeDataWithTimestamp,
  saveNufusForBirim, loadNufusForBirim, loadDataForCurrentBirim, loadDataForCurrentBirimWithMerge, cleanExpiredData, exportData, revokeConsent 
} from './modules/storage.js';
import { tavanHesapla } from './modules/calculations.js';
import { updateTable, applyTheme, applyKvkkVisibility, setUIEnabled } from './modules/ui.js';
import { requestConsent, showChangelog, closeModal, confirmDialog, messageDialog, showAboutDialog } from './modules/modals.js';
import { getCurrentYearMonth, getMonthNumber, isDateValid } from './modules/date-utils.js';
import { migrateFromOldStorage } from './modules/migration.js';

// Global değişkenler
let currentUserType = "doctor";
let currentBirimId = "";
let pendingShowAll = false;        // Tüm işlemleri göster (ASÇ modu için)
let pendingStorageType = "nurse";  // Hangi storage'a kaydedileceği
let currentShowAll = false;  // ASÇ modunda hangi görünüm modunda olduğumuz

// Storage anahtarı oluşturma (userType ve birimId ile)
function getStorageKeyWithType(baseKey) {
  return `${baseKey}_${currentUserType}_${currentBirimId}`;
}

// HYP buton durumunu güncelleyen yardımcı fonksiyon
function updateHypButtonState(hasData) {
  const hypBtn = document.getElementById("btnHyp");
  if (hypBtn) hypBtn.disabled = !hasData;
}

// function getStorageKeyWithTypeForUser(userType, birimId) {
//   return `savedResults_${userType}_${birimId}`;
// }

function combineData(data) {
  const map = new Map();
  data.forEach(item => {
    const existing = map.get(item.ad);
    if (existing) {
      // Aynı işlem varsa: gereken ve devreden doktordan, yapilan ASÇ'den
      // Basitçe: doktor verisi (gereken, devreden) + ASÇ verisi (yapilan)
      existing.gereken = item.gereken || existing.gereken;
      existing.devreden = item.devreden || existing.devreden;
      existing.yapilan = item.yapilan || existing.yapilan;
    } else {
      map.set(item.ad, { ...item });
    }
  });
  return Array.from(map.values());
}

// ========== TÜM VERİLERİ SİL ==========
function deleteAllData() {
  confirmDialog(
    "TÜM BİRİMLERİN tüm verileri kalıcı olarak silinecek. Devam etmek istiyor musunuz?",
    "Veri Silme Onayı"
  ).then((confirmed) => {
    if (!confirmed) return;
    
    // Silinecek anahtar kalıpları
    const prefixes = ["savedResults_", "sinaLastTime_", "hypLastTime_", "nufus_", "nurseShowAll_"];
    
    chrome.storage.local.get(null, (items) => {
      const keysToRemove = Object.keys(items).filter(key => {
        return prefixes.some(prefix => key.startsWith(prefix));
      });
      
      // **EKLE**: birimId anahtarını da sil
      if (items.birimId !== undefined) {
        keysToRemove.push("birimId");
      }
      
      if (keysToRemove.length > 0) {
        chrome.storage.local.remove(keysToRemove, () => {
          // UI'ı sıfırla
          updateTable([]);
          document.getElementById("sinaTime").textContent = "";
          document.getElementById("hypTime").textContent = "";
          document.getElementById("nufus").value = "";
          document.getElementById("birimId").value = "";
          
          // GLOBAL DEĞİŞKENLERİ SIFIRLA
          currentBirimId = "";
          currentShowAll = false;
          currentUserType = "doctor";
          
          // Kullanıcı tipi dropdown'ını güncelle
          const userTypeSelect = document.getElementById("userTypeSelect");
          if (userTypeSelect) userTypeSelect.value = "doctor";
          
          // Buton metinlerini doktor moduna döndür
          const sinaBtn = document.getElementById("btnSina");
          const hypBtn = document.getElementById("btnHyp");
          if (sinaBtn) sinaBtn.textContent = "SİNA";
          if (hypBtn) hypBtn.textContent = "HYP";
          if (hypBtn) hypBtn.disabled = true;
          
          // Zaman göstergelerini temizle
          const hypTimeSpan = document.getElementById("hypTime");
          if (hypTimeSpan) hypTimeSpan.textContent = "";
          const sinaTimeSpan = document.getElementById("sinaTime");
          if (sinaTimeSpan) sinaTimeSpan.textContent = "";
          
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

  // ========== KULLANICI TİPİ ==========
  const userTypeSelect = document.getElementById("userTypeSelect");

  function setUserType(type) {
    currentUserType = type;
    chrome.storage.local.set({ userType: type });
    currentBirimId = getCurrentBirimId();
    
    const sinaBtn = document.getElementById("btnSina");
    const hypBtn = document.getElementById("btnHyp");
    
    if (type === "nurse") {
      sinaBtn.textContent = "SİNA (ASÇ)";
      hypBtn.textContent = "SİNA BİRİM (ASÇ)";
      sinaBtn.disabled = false;
      
      // Birim ID varsa o birime özel nurseShowAll değerini yükle
      if (currentBirimId) {
        chrome.storage.local.get([`nurseShowAll_${currentBirimId}`], (res) => {
          currentShowAll = res[`nurseShowAll_${currentBirimId}`] === true;
          loadDataForCurrentBirimWithMerge(updateTable, currentUserType, currentBirimId, updateHypButtonState, currentShowAll);
        });
      } else {
        loadDataForCurrentBirimWithMerge(updateTable, currentUserType, currentBirimId, updateHypButtonState, false);
      }
    } else {
      sinaBtn.textContent = "SİNA";
      hypBtn.textContent = "HYP";
      sinaBtn.disabled = false;
      currentShowAll = false;
      loadDataForCurrentBirim(updateTable, currentUserType, currentBirimId, updateHypButtonState, false);
    }
  }

  // Storage'dan kullanıcı tipini yükle
  chrome.storage.local.get(["userType"], (res) => {
    const savedType = res.userType || "doctor";
    if (userTypeSelect) userTypeSelect.value = savedType;
    setUserType(savedType);
  });

  // Dropdown değişince
  userTypeSelect.addEventListener("change", (e) => {
    setUserType(e.target.value);
  });

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
    if (versionBadge) versionBadge.textContent = "v1.5.5";
  }

  // ========== FONT AYARI (TOGGLE SWITCH) ==========
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

  // Toggle değiştiğinde
  if (fontToggle) {
    fontToggle.addEventListener("change", (e) => {
      fontSettingsActive = e.target.checked;
      
      if (fontSettingsActive) {
        fontContainer.style.display = "block";
        // Storage'daki değeri yükle
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

  // Slider değiştiğinde (sadece aktifken)
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener("input", (e) => {
      if (fontSettingsActive) {
        const size = parseFloat(e.target.value);
        applyFontSize(size);
        chrome.storage.local.set({ userFontSize: size });
      }
    });
  }

  // Sayfa açılışında toggle kapalı olsun
  if (fontToggle) fontToggle.checked = false;
  fontSettingsActive = false;
  if (fontContainer) fontContainer.style.display = "none";
  applyFontSize(DEFAULT_FONT_SIZE);

  // ========== TEMA YÜKLEME ==========
  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) {
    // Storage'dan kayıtlı temayı yükle ve uygula
    chrome.storage.local.get(["themePreference"], (res) => {
      const savedTheme = res.themePreference || "light";
      themeSelect.value = savedTheme;
      applyTheme(savedTheme);
    });
    
    // Tema değiştiğinde kaydet ve uygula
    themeSelect.addEventListener("change", (e) => {
      const theme = e.target.value;
      applyTheme(theme);
      chrome.storage.local.set({ themePreference: theme });
      
      // ASÇ modunda ise doğru yükleme fonksiyonunu kullan
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
      if (res.surec?.data) surecSelect.value = res.surec.data;
      else surecSelect.value = "1.03";
    });
      surecSelect.addEventListener("change", (e) => {
        storeDataWithTimestamp("surec", e.target.value, currentUserType, currentBirimId);
        // Mevcut görünüm modunu koru (currentShowAll)
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
        // Birim ID yüklendikten sonra userType'a göre verileri yükle
        chrome.storage.local.get(["userType"], (userRes) => {
          const savedType = userRes.userType || "doctor";
          if (userTypeSelect) userTypeSelect.value = savedType;
          setUserType(savedType);
        });
      } else {
        // Birim ID yoksa sadece userType'ı ayarla
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
      
      const hypTimeSpan = document.getElementById("hypTime");
      if (hypTimeSpan) hypTimeSpan.textContent = "";
      const sinaTimeSpan = document.getElementById("sinaTime");
      if (sinaTimeSpan) sinaTimeSpan.textContent = "";
      
      loadNufusForBirim(newBirimId, tavanHesapla);
      
      // ASÇ modunda ise birime özel nurseShowAll değerini yükle
      if (currentUserType === "nurse") {
        chrome.storage.local.get([`nurseShowAll_${newBirimId}`], (res) => {
          const showAll = res[`nurseShowAll_${newBirimId}`] === true;
          currentShowAll = showAll;
          loadDataForCurrentBirimWithMerge(updateTable, currentUserType, newBirimId, updateHypButtonState, showAll);
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
    nufusInput.addEventListener("input", (e) => {
      tavanHesapla(e.target.value);
    });
  }

  // ========== KVKK GÖRÜNÜRLÜK ==========
  chrome.storage.local.get(["kvkkHidden"], (res) => {
    applyKvkkVisibility(res.kvkkHidden === true);
  });

  // ========== BUTONLAR ==========
  // SİNA butonu (userType'a göre URL)
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
    if (!currentBirimId) {
      alert("Lütfen Birim ID girin!");
      return;
    }
    
    let url;
    if (currentUserType === "nurse") {
      url = `https://sina.saglik.gov.tr/showcases/SC-0320Z42B2FCOK70/SCI-0N184E437ACA419?filters=252840=${ayStr}%26252860=${currentBirimId}%26252916=${yil}%26330586#kopyala`;
      currentShowAll = false;
      chrome.storage.local.set({ [`nurseShowAll_${currentBirimId}`]: false });
      pendingStorageType = "nurse";
    } else {
      url = `https://sina.saglik.gov.tr/showcases/SC-DBBEMXEEDFCCEAB/SCI-2N8Y5C2ADDC1FCD?filters=252840=${ayStr}%26252860=${currentBirimId}%26252916=${yil}%26330586#kopyala`;
      // Doktor için pendingStorageType gerekmez (zaten doctor)
    }
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
    
    let url;
    if (currentUserType === "nurse") {
      if (!isDateValid(yil, ayNum, true)) {
        const current = getCurrentYearMonth();
        alert(`SİNA BİRİM butonu sadece cari dönem ve öncesi, ${current.year} yılı ${current.month+1}. ay ve öncesi dönem için çalışır.`);
        return;
      }
      url = `https://sina.saglik.gov.tr/showcases/SC-DBBEMXEEDFCCEAB/SCI-2N8Y5C2ADDC1FCD?filters=252840=${ayStr}%26252860=${currentBirimId}%26252916=${yil}%26330586#kopyala`;
      currentShowAll = true;
      chrome.storage.local.set({ [`nurseShowAll_${currentBirimId}`]: true });
      pendingStorageType = "doctor";
    } else {
      // Doktor: normal HYP sayfası (cari ay kısıtlaması)
      if (!isDateValid(yil, ayNum, false)) {
        const current = getCurrentYearMonth();
        alert(`HYP butonu sadece cari dönem, ${current.year} yılı ${current.month+1}. ay için çalışır.`);
        return;
      }
      url = "https://hyp.saglik.gov.tr/dashboard#kopyala";
    }
    chrome.tabs.create({ url });
  });

  document.getElementById("btnDeleteData")?.addEventListener("click", deleteAllData);
  document.getElementById("btnExportData")?.addEventListener("click", () => {
    exportData(currentUserType, currentBirimId);
  });
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

  // ========== HAKKINDA BUTONU ==========
  const btnAbout = document.getElementById("btnAbout");
  if (btnAbout) {
    btnAbout.addEventListener("click", () => {
      showAboutDialog();
    });
  }

  // ========== KVKK FOOTER GİZLE (SADECE GİZLE) ==========
  const kvkkFooter = document.getElementById("kvkkFooter");
  const toggleFooterBtn = document.getElementById("toggleKvkkFooterBtn");

  if (kvkkFooter && toggleFooterBtn) {
    // Storage'dan durumu yükle
    chrome.storage.local.get(["kvkkFooterHidden"], (res) => {
      const isHidden = res.kvkkFooterHidden === true;
      if (isHidden) {
        kvkkFooter.style.display = "none";
      } else {
        kvkkFooter.style.display = "flex";
      }
    });

    toggleFooterBtn.addEventListener("click", async () => {
      // Gizlemek istiyor, onay sor
      const confirmed = await confirmDialog(
        "KVKK bilgilendirme metni gizlenecektir. Tekrar göstermek için ayarlar panelindeki (⚙️) 'KVKK Bilgilendirmelerini Göster' butonunu kullanabilirsiniz.\n\nDevam etmek istiyor musunuz?",
        "Bilgilendirme Metnini Gizle"
      );
      if (!confirmed) return;
      
      kvkkFooter.style.display = "none";
      chrome.storage.local.set({ kvkkFooterHidden: true });
      applyKvkkVisibility(true);  // Ayarlar panelindeki butonu güncelle
    });
  }

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
      if (!currentBirimId) return;
      
      let targetUserType = currentUserType;
      if (currentUserType === "nurse" && pendingStorageType) {
        targetUserType = pendingStorageType;
      }
      
      const key = `savedResults_${targetUserType}_${currentBirimId}`;
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
        
        storeDataWithTimestamp("savedResults", merged, targetUserType, currentBirimId);
        storeDataWithTimestamp("sinaLastTime", simdi, targetUserType, currentBirimId);
        
        const sinaTimeSpan = document.getElementById("sinaTime");
        if (sinaTimeSpan) sinaTimeSpan.textContent = simdi;
        
        // ASÇ modunda ve currentShowAll true ise tüm verileri birleştir
        if (currentUserType === "nurse" && currentShowAll) {
          const nurseKey = `savedResults_nurse_${currentBirimId}`;
          const doctorKey = `savedResults_doctor_${currentBirimId}`;
          chrome.storage.local.get([nurseKey, doctorKey], (allRes) => {
            const nurseData = allRes[nurseKey]?.data || [];
            const doctorData = allRes[doctorKey]?.data || [];
            const combinedData = [...nurseData, ...doctorData];
            const mergedData = combineData(combinedData);
            updateTable(mergedData, currentUserType, true, currentBirimId);
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
      // ... HYP verisi geldi (değişiklik yok)
      if (!currentBirimId) return;
      const key = getStorageKeyWithType("savedResults");
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
        storeDataWithTimestamp("savedResults", guncelVeri, currentUserType, currentBirimId);
        storeDataWithTimestamp("hypLastTime", simdi, currentUserType, currentBirimId);
        const hypTimeSpan = document.getElementById("hypTime");
        if (hypTimeSpan) hypTimeSpan.textContent = simdi;
        // HYP verisi geldiğinde showAll flag'i false (sadece mevcut filtreleme)
        updateTable(guncelVeri, currentUserType, false, currentBirimId);
      });
    }
  });
});


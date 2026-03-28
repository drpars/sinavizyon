import { RETENTION_DAYS } from './constants.js';
import { updateTable } from './ui.js';

// Storage ile ilgili yardımcı fonksiyonlar
// Mevcut birimId'yi al
export function getCurrentBirimId() {
  const input = document.getElementById("birimId");
  return input?.value?.trim() || "";
}

// Storage anahtarını birimId ile oluştur
export function getStorageKey(baseKey, birimId) {
  if (!birimId) return baseKey;
  return `${baseKey}_${birimId}`;
}

// Verileri birimId ile kaydet (zaman damgalı)
export function storeDataWithTimestamp(baseKey, data) {
  const timestamp = Date.now();
  const birimId = getCurrentBirimId();
  const key = getStorageKey(baseKey, birimId);
  chrome.storage.local.set({ [key]: { data, timestamp } }).catch(console.error);
}

// Verileri birimId ile oku (callback)
export function getDataWithTimestamp(baseKey, callback) {
  const birimId = getCurrentBirimId();
  const key = getStorageKey(baseKey, birimId);
  chrome.storage.local.get([key], (res) => {
    callback(res[key]?.data || null);
  });
}

// Nüfusu birim ID ile kaydet
export function saveNufusForBirim(birimId, nufus) {
  if (!birimId) return;
  const key = `nufus_${birimId}`;
  chrome.storage.local.set({ [key]: nufus }).catch(console.error);
}

// Nüfusu birim ID ile yükle (inputu doldurur)
export function loadNufusForBirim(birimId, tavanHesaplaFn) {
  const nufusInput = document.getElementById("nufus");
  if (!nufusInput) return;
  if (!birimId) {
    nufusInput.value = "";
    if (tavanHesaplaFn) tavanHesaplaFn("");
    return;
  }
  const key = `nufus_${birimId}`;
  chrome.storage.local.get([key], (res) => {
    const nufus = res[key];
    if (nufus) {
      nufusInput.value = nufus;
      if (tavanHesaplaFn) tavanHesaplaFn(nufus);
    } else {
      nufusInput.value = "";
      if (tavanHesaplaFn) tavanHesaplaFn("");
    }
  });
}

// Veri yükleme (tablo, zaman damgaları)
export function loadDataForCurrentBirim(updateTableFn) {
  const birimId = getCurrentBirimId();
  if (!birimId) {
    if (updateTableFn) updateTableFn([]);
    document.getElementById("sinaTime").textContent = "";
    document.getElementById("hypTime").textContent = "";
    return;
  }
  const key = getStorageKey("savedResults", birimId);
  chrome.storage.local.get([key], (res) => {
    if (res[key]?.data) {
      if (updateTableFn) updateTableFn(res[key].data);
    } else {
      if (updateTableFn) updateTableFn([]);
    }
  });
  const sinaKey = getStorageKey("sinaLastTime", birimId);
  const hypKey = getStorageKey("hypLastTime", birimId);
  chrome.storage.local.get([sinaKey, hypKey], (res) => {
    const sinaTimeSpan = document.getElementById("sinaTime");
    const hypTimeSpan = document.getElementById("hypTime");
    if (sinaTimeSpan && res[sinaKey]?.data) sinaTimeSpan.textContent = res[sinaKey].data;
    if (hypTimeSpan && res[hypKey]?.data) hypTimeSpan.textContent = res[hypKey].data;
  });
}

// Süresi dolmuş verileri temizle
export function cleanExpiredData(updateTableFn) {
  chrome.storage.local.get(null, (items) => {
    const now = Date.now();
    const expiryMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const keysToRemove = [];

    for (const [key, value] of Object.entries(items)) {
      if (value && typeof value === "object" && value.timestamp) {
        if (now - value.timestamp > expiryMs) {
          keysToRemove.push(key);
        }
      }
    }

    if (keysToRemove.length > 0) {
      chrome.storage.local.remove(keysToRemove, () => {
        console.log("Süresi dolan veriler temizlendi:", keysToRemove);
        // Eğer savedResults silindiyse, tabloyu temizle
        if (keysToRemove.some(k => k.startsWith("savedResults_"))) {
          if (updateTableFn) updateTableFn([]);
          const sinaTimeSpan = document.getElementById("sinaTime");
          const hypTimeSpan = document.getElementById("hypTime");
          if (sinaTimeSpan) sinaTimeSpan.textContent = "";
          if (hypTimeSpan) hypTimeSpan.textContent = "";
        }
      });
    }
  });
}

// Tüm verileri sil (tüm birimler)
export function deleteAllData() {
  if (confirm("TÜM BİRİMLERİN tüm verileri kalıcı olarak silinecek. Devam etmek istiyor musunuz?")) {
    // Silinecek anahtar kalıpları
    const prefixes = ["savedResults_", "sinaLastTime_", "hypLastTime_", "nufus_"];
    
    chrome.storage.local.get(null, (items) => {
      const keysToRemove = Object.keys(items).filter(key => {
        return prefixes.some(prefix => key.startsWith(prefix));
      });
      
      if (keysToRemove.length > 0) {
        chrome.storage.local.remove(keysToRemove, () => {
          // UI'ı sıfırla
          updateTable([]);
          document.getElementById("sinaTime").textContent = "";
          document.getElementById("hypTime").textContent = "";
          document.getElementById("nufus").value = "";
          document.getElementById("birimId").value = "";
          alert("Tüm birimlere ait veriler silindi.");
        });
      } else {
        alert("Silinecek veri bulunamadı.");
      }
    });
  }
}

// Veri dışa aktar
export function exportData() {
  const birimId = getCurrentBirimId();
  if (!birimId) {
    alert("Önce Birim ID girin!");
    return;
  }
  const key = getStorageKey("savedResults", birimId);
  chrome.storage.local.get([key, "birimId"], (res) => {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: "1.5.3",
      birimId: birimId,
      data: res[key]?.data || [],
      metadata: {
        exportTool: "SINA-HYP Eklentisi"
      }
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sina_hyp_${birimId}_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Rızayı geri çek
export function revokeConsent() {
  if (confirm("Rızanızı geri çekerseniz tüm verileriniz silinecek ve eklenti veri toplamayı durduracaktır. Devam etmek istiyor musunuz?")) {
    chrome.storage.local.remove(["kvkkConsent", "savedResults", "sinaLastTime", "hypLastTime", "nufus", "birimId", "surec", "theme"], () => {
      updateTable([]);
      document.getElementById("sinaTime").textContent = "";
      document.getElementById("hypTime").textContent = "";
      document.getElementById("nufus").value = "";
      document.getElementById("birimId").value = "";
      setUIEnabled(false);
      alert("Rıza geri çekildi ve tüm veriler silindi.");
    });
  }
}

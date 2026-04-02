import { RETENTION_DAYS } from './constants.js';
import { updateTable } from './ui.js';

// Mevcut birimId'yi al
export function getCurrentBirimId() {
  const input = document.getElementById("birimId");
  return input?.value?.trim() || "";
}

// Mevcut kullanıcı tipini al
export function getCurrentUserType() {
  const select = document.getElementById("userTypeSelect");
  return select?.value || "doctor";
}

// Storage anahtarını birimId ve userType ile oluştur
export function getStorageKey(baseKey, birimId, userType) {
  if (!birimId) return `${baseKey}_${userType}`;
  return `${baseKey}_${userType}_${birimId}`;
}

// Verileri birimId ve userType ile kaydet
export function storeDataWithTimestamp(baseKey, data, userType, birimId) {
  const timestamp = Date.now();
  const key = getStorageKey(baseKey, birimId, userType);
  chrome.storage.local.set({ [key]: { data, timestamp } }).catch(console.error);
}

// Verileri okumak için yardımcı (callback)
export function getDataWithTimestamp(baseKey, userType, birimId, callback) {
  const key = getStorageKey(baseKey, birimId, userType);
  chrome.storage.local.get([key], (res) => {
    callback(res[key]?.data || null);
  });
}

// Nüfus işlemleri (birim bazlı, userType'den bağımsız - aynı nüfus)
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

// Doktor modu için basit veri yükleme (merge yok)
export function loadDataForCurrentBirim(updateTableFn, userType, birimId, onDataLoaded, showAll = false) {
  if (!birimId) {
    if (updateTableFn) updateTableFn([], userType, showAll, birimId);
    document.getElementById("sinaTime").textContent = "";
    document.getElementById("hypTime").textContent = "";
    if (onDataLoaded) onDataLoaded(false);
    return;
  }
  
  const key = getStorageKey("savedResults", birimId, userType);
  chrome.storage.local.get([key], (res) => {
    const hasData = !!(res[key]?.data && res[key].data.length > 0);
    if (hasData) {
      if (updateTableFn) updateTableFn(res[key].data, userType, showAll, birimId);
    } else {
      if (updateTableFn) updateTableFn([], userType, showAll, birimId);
    }
    if (onDataLoaded) onDataLoaded(hasData);
  });
  
  // Zaman damgalarını yükle
  const sinaKey = getStorageKey("sinaLastTime", birimId, userType);
  const hypKey = getStorageKey("hypLastTime", birimId, userType);
  chrome.storage.local.get([sinaKey, hypKey], (res) => {
    const sinaTimeSpan = document.getElementById("sinaTime");
    const hypTimeSpan = document.getElementById("hypTime");
    if (sinaTimeSpan) sinaTimeSpan.textContent = res[sinaKey]?.data || "";
    if (hypTimeSpan) hypTimeSpan.textContent = res[hypKey]?.data || "";
  });
}

// ASÇ modunda showAll true ise hem nurse hem doctor verilerini birleştir
export function loadDataForCurrentBirimWithMerge(updateTableFn, userType, birimId, onDataLoaded, showAll = false) {
  if (!birimId) {
    if (updateTableFn) updateTableFn([], userType, showAll);
    document.getElementById("sinaTime").textContent = "";
    document.getElementById("hypTime").textContent = "";
    if (onDataLoaded) onDataLoaded(false);
    return;
  }
  
  // ASÇ modunda ve showAll true ise, her iki storage'ı da oku
  if (userType === "nurse" && showAll) {
    const nurseKey = getStorageKey("savedResults", birimId, "nurse");
    const doctorKey = getStorageKey("savedResults", birimId, "doctor");
    chrome.storage.local.get([nurseKey, doctorKey], (res) => {
      const nurseData = res[nurseKey]?.data || [];
      const doctorData = res[doctorKey]?.data || [];
      const combinedData = [...nurseData, ...doctorData];
      const hasData = combinedData.length > 0;
      if (updateTableFn) updateTableFn(combinedData, userType, showAll, birimId);
      if (onDataLoaded) onDataLoaded(hasData);
    });
  } else {
    // Normal durum: sadece ilgili storage'ı oku
    const key = getStorageKey("savedResults", birimId, userType);
    chrome.storage.local.get([key], (res) => {
      const hasData = !!(res[key]?.data && res[key].data.length > 0);
      if (hasData) {
        if (updateTableFn) updateTableFn(res[key].data, userType, showAll);
      } else {
        if (updateTableFn) updateTableFn([], userType, showAll);
      }
      if (onDataLoaded) onDataLoaded(hasData);
    });
  }
  
  // Zaman damgalarını yükle (sadece nurse için, doktor için ayrıca göstermiyoruz)
  const sinaKey = getStorageKey("sinaLastTime", birimId, userType);
  const hypKey = getStorageKey("hypLastTime", birimId, userType);
  chrome.storage.local.get([sinaKey, hypKey], (res) => {
    const sinaTimeSpan = document.getElementById("sinaTime");
    const hypTimeSpan = document.getElementById("hypTime");
    if (sinaTimeSpan) sinaTimeSpan.textContent = res[sinaKey]?.data || "";
    if (hypTimeSpan) hypTimeSpan.textContent = res[hypKey]?.data || "";
  });
}

// Süresi dolmuş verileri temizle (prefix bazlı)
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

// Veri dışa aktar (userType ile)
export function exportData() {
  const birimId = getCurrentBirimId();
  if (!birimId) {
    alert("Önce Birim ID girin!");
    return;
  }
  
  const userType = getCurrentUserType(); // userType'ı al
  
  // Sürüm numarasını manifest'ten al
  const manifest = chrome.runtime.getManifest();
  const currentVersion = manifest.version;
  
  const key = getStorageKey("savedResults", birimId, userType); // userType eklendi
  chrome.storage.local.get([key], (res) => {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: currentVersion,
      userType: userType,           // userType eklendi
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
    a.download = `sina_hyp_${userType}_${birimId}_${new Date().toISOString().split("T")[0]}.json`;
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
      
      // HYP butonunu devre dışı bırak
      const hypBtn = document.getElementById("btnHyp");
      if (hypBtn) hypBtn.disabled = true;
      
      setUIEnabled(false);
      alert("Rıza geri çekildi ve tüm veriler silindi.");
    });
  }
}


// modules/core/storage.js
import { RETENTION_DAYS } from '../lib/constants.js';
import { updateTable, setUIEnabled } from '../ui/updaters/index.js';
import { confirmDialog, messageDialog } from '../ui/components/index.js';
import { getCurrentUserType } from './state.js';

// Mevcut birimId'yi al
export function getCurrentBirimId() {
  const input = document.getElementById("birimId");
  return input?.value?.trim() || "";
}

// Storage anahtarını birimId ve userType ile oluştur
export function getStorageKey(baseKey, birimId, userType) {
  if (!birimId) return `${baseKey}_${userType}`;
  return `${baseKey}_${userType}_${birimId}`;
}

// Verileri birimId ve userType ile kaydet (ay ve yıl opsiyonel)
export function storeDataWithTimestamp(baseKey, data, userType, birimId, ay = null, yil = null) {
  const timestamp = Date.now();
  const key = getStorageKey(baseKey, birimId, userType);
  const value = { data, timestamp };
  if (ay !== null) value.ay = ay;
  if (yil !== null) value.yil = yil;
  chrome.storage.local.set({ [key]: value }).catch(console.error);
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

// Doktor modu için basit veri yükleme (merge yok) ay ve yıl eklendi
export function loadDataForCurrentBirim(updateTableFn, userType, birimId, onDataLoaded, showAll = false, ay = null, yil = null) {
  if (!birimId) {
    if (updateTableFn) updateTableFn([], userType, showAll, birimId);
    document.getElementById("sinaTime").textContent = "";
    document.getElementById("hypTime").textContent = "";
    if (onDataLoaded) onDataLoaded(false);
    return;
  }
  
  const key = getStorageKey("savedResults", birimId, userType);
  chrome.storage.local.get([key], (res) => {
    let saved = res[key];
    let data = saved?.data || [];
    // ✅ DÜZELTİLMİŞ FİLTRELEME
    if (ay !== null && yil !== null && saved) {
      const hasMonthYear = saved.ay !== undefined && saved.yil !== undefined;
      if (hasMonthYear) {
        if (saved.ay !== ay || saved.yil !== yil) {
          data = [];
        }
      }
      // hasMonthYear === false ise: eski veri, göster (düzeltmeyelim)
    }
    const hasData = data.length > 0;
    if (hasData) {
      if (updateTableFn) updateTableFn(data, userType, showAll, birimId);
    } else {
      if (updateTableFn) updateTableFn([], userType, showAll, birimId);
    }
    if (onDataLoaded) onDataLoaded(hasData);
  });
  
  // Zaman damgaları aynı kalır (ay/yıl filtresine tabi değil)
  const sinaKey = getStorageKey("sinaLastTime", birimId, userType);
  const hypKey = getStorageKey("hypLastTime", birimId, userType);
  chrome.storage.local.get([sinaKey, hypKey], (res) => {
    const sinaTimeSpan = document.getElementById("sinaTime");
    const hypTimeSpan = document.getElementById("hypTime");
    if (sinaTimeSpan) sinaTimeSpan.textContent = res[sinaKey]?.data || "";
    if (hypTimeSpan) hypTimeSpan.textContent = res[hypKey]?.data || "";
  });
}

// ASÇ modunda showAll true ise hem nurse hem doctor verilerini birleştir ay ve yıl eklendi
export function loadDataForCurrentBirimWithMerge(updateTableFn, userType, birimId, onDataLoaded, showAll = false, ay = null, yil = null) {
  if (!birimId) {
    if (updateTableFn) updateTableFn([], userType, showAll);
    document.getElementById("sinaTime").textContent = "";
    document.getElementById("hypTime").textContent = "";
    if (onDataLoaded) onDataLoaded(false);
    return;
  }
  
  if (userType === "nurse") {
    const nurseKey = getStorageKey("savedResults", birimId, "nurse");
    const doctorKey = getStorageKey("savedResults", birimId, "doctor");
    
    chrome.storage.local.get([nurseKey, doctorKey, `nurseShowAll_${birimId}`], (res) => {
      let nurseData = res[nurseKey]?.data || [];
      let doctorData = res[doctorKey]?.data || [];
      
      // ✅ DÜZELTİLMİŞ FİLTRELEME
      if (ay !== null && yil !== null) {
        const nurseRecord = res[nurseKey];
        const doctorRecord = res[doctorKey];
        
        // Hemşire verisi filtreleme
        if (nurseRecord) {
          const hasMonthYear = nurseRecord.ay !== undefined && nurseRecord.yil !== undefined;
          if (hasMonthYear) {
            // Ay/Yıl bilgisi var ama eşleşmiyorsa boş yap
            if (nurseRecord.ay !== ay || nurseRecord.yil !== yil) {
              nurseData = [];
            }
          }
          // hasMonthYear === false ise: eski veri, göster (düzeltmeyelim)
        } else {
          nurseData = [];
        }
        
        // Doktor verisi filtreleme
        if (doctorRecord) {
          const hasMonthYear = doctorRecord.ay !== undefined && doctorRecord.yil !== undefined;
          if (hasMonthYear) {
            if (doctorRecord.ay !== ay || doctorRecord.yil !== yil) {
              doctorData = [];
            }
          }
        } else {
          doctorData = [];
        }
      }
      
      const storedShowAll = res[`nurseShowAll_${birimId}`];
      let effectiveShowAll = showAll;
      if (storedShowAll === undefined && doctorData.length > 0) {
        effectiveShowAll = true;
        chrome.storage.local.set({ [`nurseShowAll_${birimId}`]: true });
      }
      
      const hasData = (nurseData.length + doctorData.length) > 0;
      
      if (effectiveShowAll) {
        const combinedData = [...nurseData, ...doctorData];
        if (updateTableFn) updateTableFn(combinedData, userType, effectiveShowAll, birimId);
      } else {
        if (updateTableFn) updateTableFn(nurseData, userType, effectiveShowAll, birimId);
      }
      
      if (onDataLoaded) onDataLoaded(hasData);
    });
    
    // Zaman damgaları (değişiklik yok)
    const nurseSinaKey = getStorageKey("sinaLastTime", birimId, "nurse");
    const doctorSinaKey = getStorageKey("sinaLastTime", birimId, "doctor");
    chrome.storage.local.get([nurseSinaKey, doctorSinaKey], (res) => {
      const sinaTimeSpan = document.getElementById("sinaTime");
      const hypTimeSpan = document.getElementById("hypTime");
      if (sinaTimeSpan) sinaTimeSpan.textContent = res[nurseSinaKey]?.data || "";
      if (hypTimeSpan) hypTimeSpan.textContent = res[doctorSinaKey]?.data || "";
    });
    
    return;
  }
  
  // DOKTOR MODU İÇİN DE AYNI DÜZELTME
  const key = getStorageKey("savedResults", birimId, userType);
  chrome.storage.local.get([key], (res) => {
    let saved = res[key];
    let data = saved?.data || [];
    
    // ✅ DÜZELTİLMİŞ DOKTOR FİLTRELEMESİ
    if (ay !== null && yil !== null && saved) {
      const hasMonthYear = saved.ay !== undefined && saved.yil !== undefined;
      if (hasMonthYear) {
        if (saved.ay !== ay || saved.yil !== yil) {
          data = [];
        }
      }
      // hasMonthYear === false ise: eski veri, göster
    }
    
    const hasData = data.length > 0;
    if (hasData) {
      if (updateTableFn) updateTableFn(data, userType, showAll);
    } else {
      if (updateTableFn) updateTableFn([], userType, showAll);
    }
    if (onDataLoaded) onDataLoaded(hasData);
  });
  
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
export async function exportData() {
  const birimId = getCurrentBirimId();
  if (!birimId) {
    await messageDialog("Önce Birim ID girin!", "Uyarı");
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
export async function revokeConsent() {
  const confirmed = await confirmDialog(
    "Rızanızı geri çekerseniz tüm verileriniz silinecek ve eklenti veri toplamayı durduracaktır. Devam etmek istiyor musunuz?",
    "Rıza Geri Çekme"
  );
  if (!confirmed) return;
  
  chrome.storage.local.remove(["kvkkConsent", "savedResults", "sinaLastTime", "hypLastTime", "nufus", "birimId", "surec", "theme"], () => {
    updateTable([]);
    document.getElementById("sinaTime").textContent = "";
    document.getElementById("hypTime").textContent = "";
    document.getElementById("nufus").value = "";
    document.getElementById("birimId").value = "";
    
    const hypBtn = document.getElementById("btnHyp");
    if (hypBtn) hypBtn.disabled = true;
    
    setUIEnabled(false);
    messageDialog("Rıza geri çekildi ve tüm veriler silindi.", "İşlem Tamam");
  });
}


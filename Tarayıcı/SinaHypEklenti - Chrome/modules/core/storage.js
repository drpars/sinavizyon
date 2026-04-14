// modules/core/storage.js
import { RETENTION_DAYS } from '../lib/constants.js';
import { updateTable, setUIEnabled } from '../ui/updaters/index.js';
import { confirmDialog, messageDialog } from '../ui/components/index.js';
import { getCurrentUserType } from './state.js';
import { getDomBirimId } from './dom.js';
import { normalizeText } from '../utils/text-utils.js';

// Storage anahtarını birimId ve userType ile oluştur
export function getStorageKey(baseKey, birimId, userType) {
  if (!birimId) return `${baseKey}_${userType}`;
  return `${baseKey}_${userType}_${birimId}`;
}

// Verileri birimId ve userType ile kaydet
export function storeDataWithTimestamp(baseKey, data, userType, birimId, ay = null, yil = null) {
  const timestamp = Date.now();
  const key = getStorageKey(baseKey, birimId, userType);
  const value = { data, timestamp };
  if (ay !== null) value.ay = ay;
  if (yil !== null) value.yil = yil;
  chrome.storage.local.set({ [key]: value }).catch(console.error);
}

// Verileri okumak için yardımcı
export function getDataWithTimestamp(baseKey, userType, birimId, callback) {
  const key = getStorageKey(baseKey, birimId, userType);
  chrome.storage.local.get([key], (res) => {
    callback(res[key]?.data || null);
  });
}

// Nüfus işlemleri
export function saveNufusForBirim(birimId, nufus) {
  if (!birimId) return;
  const key = `nufus_${birimId}`;
  chrome.storage.local.set({ [key]: nufus }).catch(console.error);
}

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

// Doktor modu için veri yükleme
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
    
    if (ay !== null && yil !== null && saved) {
      const hasMonthYear = saved.ay !== undefined && saved.yil !== undefined;
      if (hasMonthYear) {
        if (saved.ay !== ay || saved.yil !== yil) {
          data = [];
        }
      }
    }
    
    const hasData = data.length > 0;
    if (hasData) {
      if (updateTableFn) updateTableFn(data, userType, showAll, birimId);
    } else {
      if (updateTableFn) updateTableFn([], userType, showAll, birimId);
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

// ASÇ modu için veri yükleme (merge'li)
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
      
      // ✅ AY/YIL FİLTRELEMESİ
      if (ay !== null && yil !== null) {
        const nurseRecord = res[nurseKey];
        const doctorRecord = res[doctorKey];
        
        if (nurseRecord) {
          const hasMonthYear = nurseRecord.ay !== undefined && nurseRecord.yil !== undefined;
          if (hasMonthYear && (nurseRecord.ay !== ay || nurseRecord.yil !== yil)) {
            nurseData = [];
          }
        } else {
          nurseData = [];
        }
        
        if (doctorRecord) {
          const hasMonthYear = doctorRecord.ay !== undefined && doctorRecord.yil !== undefined;
          if (hasMonthYear && (doctorRecord.ay !== ay || doctorRecord.yil !== yil)) {
            doctorData = [];
          }
        } else {
          doctorData = [];
        }
      }
      
      // ✅ Birleştirirken mükerrer kayıtları önle (normalizeText ile)
      const combinedData = [...nurseData];
      
      doctorData.forEach(doctorItem => {
        const doctorAd = normalizeText(doctorItem.ad);
        const existsInNurse = nurseData.some(nurseItem => 
          normalizeText(nurseItem.ad) === doctorAd
        );
        
        if (!existsInNurse) {
          combinedData.push(doctorItem);
        }
      });

      let effectiveShowAll = showAll;
      const storedShowAll = res[`nurseShowAll_${birimId}`];
      
      if (storedShowAll !== undefined) {
        effectiveShowAll = storedShowAll;
      }
      
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
  
  // Doktor modu
  const key = getStorageKey("savedResults", birimId, userType);
  chrome.storage.local.get([key], (res) => {
    let saved = res[key];
    let data = saved?.data || [];
    
    if (ay !== null && yil !== null && saved) {
      const hasMonthYear = saved.ay !== undefined && saved.yil !== undefined;
      if (hasMonthYear) {
        if (saved.ay !== ay || saved.yil !== yil) {
          data = [];
        }
      }
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
  const birimId = getDomBirimId();
  if (!birimId) {
    await messageDialog("Önce Birim ID girin!", "Uyarı");
    return;
  }
  
  const userType = getCurrentUserType();
  
  const manifest = chrome.runtime.getManifest();
  const currentVersion = manifest.version;
  
  const key = getStorageKey("savedResults", birimId, userType);
  chrome.storage.local.get([key], (res) => {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: currentVersion,
      userType: userType,
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

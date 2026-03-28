import { getStorageKey } from './storage.js';

export function migrateFromOldStorage() {
  chrome.storage.local.get(["migrationDone"], (res) => {
    if (res.migrationDone === true) {
      console.log("Migration daha önce yapılmış.");
      return;
    }
    
    chrome.storage.local.get(["savedResults", "sinaLastTime", "hypLastTime", "nufus", "birimId"], (oldItems) => {
      let hasMigrated = false;
      
      if (oldItems.savedResults && Array.isArray(oldItems.savedResults)) {
        const birimId = (oldItems.birimId && typeof oldItems.birimId === "string") ? oldItems.birimId : "default";
        const newKey = getStorageKey("savedResults", birimId);
        const timestamp = Date.now();
        chrome.storage.local.set({ [newKey]: { data: oldItems.savedResults, timestamp } });
        console.log(`✅ Migrated savedResults to ${newKey}`);
        hasMigrated = true;
      }
      
      if (oldItems.sinaLastTime) {
        const birimId = (oldItems.birimId && typeof oldItems.birimId === "string") ? oldItems.birimId : "default";
        const newKey = getStorageKey("sinaLastTime", birimId);
        const timestamp = Date.now();
        let dataValue = oldItems.sinaLastTime;
        if (typeof dataValue === "object" && dataValue.data) dataValue = dataValue.data;
        chrome.storage.local.set({ [newKey]: { data: dataValue, timestamp } });
        console.log(`✅ Migrated sinaLastTime to ${newKey}`);
        hasMigrated = true;
      }
      
      if (oldItems.hypLastTime) {
        const birimId = (oldItems.birimId && typeof oldItems.birimId === "string") ? oldItems.birimId : "default";
        const newKey = getStorageKey("hypLastTime", birimId);
        const timestamp = Date.now();
        let dataValue = oldItems.hypLastTime;
        if (typeof dataValue === "object" && dataValue.data) dataValue = dataValue.data;
        chrome.storage.local.set({ [newKey]: { data: dataValue, timestamp } });
        console.log(`✅ Migrated hypLastTime to ${newKey}`);
        hasMigrated = true;
      }
      
      if (oldItems.nufus && typeof oldItems.nufus === "string") {
        const birimId = (oldItems.birimId && typeof oldItems.birimId === "string") ? oldItems.birimId : "default";
        const key = `nufus_${birimId}`;
        chrome.storage.local.set({ [key]: oldItems.nufus });
        console.log(`✅ Migrated nufus to ${key}`);
        hasMigrated = true;
      }
      
      if (oldItems.birimId && typeof oldItems.birimId !== "string") {
        let correctBirimId = "default";
        if (typeof oldItems.birimId === "object" && oldItems.birimId.data) {
          correctBirimId = oldItems.birimId.data;
        } else {
          correctBirimId = String(oldItems.birimId);
        }
        chrome.storage.local.set({ birimId: correctBirimId });
        console.log(`✅ Fixed birimId from ${JSON.stringify(oldItems.birimId)} to ${correctBirimId}`);
        hasMigrated = true;
      }
      
      if (hasMigrated) {
        const oldKeys = ["savedResults", "sinaLastTime", "hypLastTime", "nufus"];
        chrome.storage.local.remove(oldKeys, () => {
          console.log("🗑️ Eski storage anahtarları temizlendi.");
        });
      }
      
      chrome.storage.local.set({ migrationDone: true });
      if (hasMigrated) {
        console.log("🎉 Migration tamamlandı! Sayfayı yenileyin.");
      } else {
        console.log("ℹ️ Migration gerekli değil, yeni yapı kullanılıyor.");
      }
    });
  });
}

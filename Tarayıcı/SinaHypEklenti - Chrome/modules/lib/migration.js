// modules/lib/migration.js
export function migrateFromOldStorage() {
  chrome.storage.local.get(["storageVersion"], (res) => {
    const oldVersion = res.storageVersion;
    
    if (oldVersion && oldVersion >= "1.5.6") {
      console.log(`ℹ️ Storage zaten güncel (v${oldVersion})`);
      return;
    }
    
    console.log(`🔄 Storage sürümü: ${oldVersion || "yok"} → 1.5.6 migration başlıyor...`);
    
    chrome.storage.local.get(null, (allItems) => {
      let hasMigrated = false;
      const userType = "doctor";
      
      // Nüfus migration
      if (allItems.nufus && typeof allItems.nufus === "string") {
        const birimId = allItems.birimId || "default";
        const newKey = `nufus_${birimId}`;
        if (!allItems[newKey]) {
          chrome.storage.local.set({ [newKey]: allItems.nufus });
          console.log(`✅ Migrated nufus → ${newKey}`);
          hasMigrated = true;
        }
      }
      
      // savedResults migration
      const oldSavedKeys = Object.keys(allItems).filter(k => 
        k.startsWith("savedResults_") && !k.includes("_doctor_") && !k.includes("_nurse_")
      );
      
      for (const oldKey of oldSavedKeys) {
        const data = allItems[oldKey];
        if (data) {
          const birimId = oldKey.replace("savedResults_", "");
          const newKey = `savedResults_${userType}_${birimId}`;
          if (!allItems[newKey]) {
            const timestamp = Date.now();
            const valueToStore = Array.isArray(data) ? { data, timestamp } : data;
            chrome.storage.local.set({ [newKey]: valueToStore });
            console.log(`✅ Migrated ${oldKey} → ${newKey}`);
            chrome.storage.local.remove(oldKey);
            hasMigrated = true;
          }
        }
      }
      
      // sinaLastTime migration
      const oldSinaKeys = Object.keys(allItems).filter(k => 
        k.startsWith("sinaLastTime_") && !k.includes("_doctor_") && !k.includes("_nurse_")
      );
      for (const oldKey of oldSinaKeys) {
        const data = allItems[oldKey];
        if (data) {
          const birimId = oldKey.replace("sinaLastTime_", "");
          const newKey = `sinaLastTime_${userType}_${birimId}`;
          if (!allItems[newKey]) {
            chrome.storage.local.set({ [newKey]: data });
            console.log(`✅ Migrated ${oldKey} → ${newKey}`);
            chrome.storage.local.remove(oldKey);
            hasMigrated = true;
          }
        }
      }
      
      // hypLastTime migration
      const oldHypKeys = Object.keys(allItems).filter(k => 
        k.startsWith("hypLastTime_") && !k.includes("_doctor_") && !k.includes("_nurse_")
      );
      for (const oldKey of oldHypKeys) {
        const data = allItems[oldKey];
        if (data) {
          const birimId = oldKey.replace("hypLastTime_", "");
          const newKey = `hypLastTime_${userType}_${birimId}`;
          if (!allItems[newKey]) {
            chrome.storage.local.set({ [newKey]: data });
            console.log(`✅ Migrated ${oldKey} → ${newKey}`);
            chrome.storage.local.remove(oldKey);
            hasMigrated = true;
          }
        }
      }
      
      chrome.storage.local.set({ storageVersion: "1.5.6" });
      
      if (hasMigrated) {
        console.log("🎉 1.5.6 migration tamamlandı! (reload gerekmez)");
        // ⚠️ H10 DÜZELTİLDİ: location.reload() KALDIRILDI
      } else {
        console.log("ℹ️ 1.5.6 migration gerekli değil, veriler zaten doğru formatta.");
      }
    });
  });
}

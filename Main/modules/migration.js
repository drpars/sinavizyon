// Migration: 1.5.5 ve öncesinden 1.5.6'ya geçiş (nüfus ve çoklu birim düzeltmeleri)
export function migrateFromOldStorage() {
  chrome.storage.local.get(["storageVersion"], (res) => {
    const oldVersion = res.storageVersion;
    
    // Sadece 1.5.5 veya daha eski sürümlerde çalış
    if (oldVersion && oldVersion >= "1.5.6") {
      console.log(`ℹ️ Storage zaten güncel (v${oldVersion})`);
      return;
    }
    
    console.log(`🔄 Storage sürümü: ${oldVersion || "yok"} → 1.5.6 migration başlıyor...`);
    
    chrome.storage.local.get(null, (allItems) => {
      let hasMigrated = false;
      const userType = "doctor";
      
      // ========== 1. NÜFUS DÜZELTMESİ ==========
      // nufus_123 formatında olanları kontrol et (zaten doğru formatta)
      const existingNufusKeys = Object.keys(allItems).filter(k => 
        k.startsWith("nufus_") && !k.includes("_doctor_")
      );
      
      // Eğer nufus_123 formatında veri varsa ama nufus_doctor_123 yoksa, sorun yok. Zaten doğru formatta.
      // Sadece düz nufus formatını taşı (çok eski)
      if (allItems.nufus && typeof allItems.nufus === "string") {
        const birimId = allItems.birimId || "default";
        const newKey = `nufus_${birimId}`;
        if (!allItems[newKey]) {
          chrome.storage.local.set({ [newKey]: allItems.nufus });
          console.log(`✅ Migrated nufus → ${newKey}`);
          hasMigrated = true;
        }
      }
      
      // ========== 2. ÇOKLU BİRİM DÜZELTMESİ ==========
      // Eski savedResults_123 formatındaki tüm anahtarları bul
      const oldSavedKeys = Object.keys(allItems).filter(k => 
        k.startsWith("savedResults_") && !k.includes("_doctor_") && !k.includes("_nurse_")
      );
      
      for (const oldKey of oldSavedKeys) {
        const data = allItems[oldKey];
        if (data) {
          // Birim ID'yi anahtardan çıkar
          const birimId = oldKey.replace("savedResults_", "");
          const newKey = `savedResults_${userType}_${birimId}`;
          
          // Yeni anahtar yoksa taşı
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
      
      // ========== 3. ZAMAN DAMGALARI İÇİN AYNI İŞLEM ==========
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
      
      // Storage sürümünü güncelle
      chrome.storage.local.set({ storageVersion: "1.5.6" });
      
      if (hasMigrated) {
        console.log("🎉 1.5.6 migration tamamlandı! Sayfayı yenileyin.");
        location.reload();
      } else {
        console.log("ℹ️ 1.5.6 migration gerekli değil, veriler zaten doğru formatta.");
      }
    });
  });
}

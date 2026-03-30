// Migration: Storage sürümüne göre veri taşıma
const CURRENT_STORAGE_VERSION = "1.5.5";

export function migrateFromOldStorage() {
  // Önce eski veri varlığını kontrol et
  chrome.storage.local.get(null, (allItems) => {
    let birimId = allItems.birimId;
    if (typeof birimId === "object" && birimId.data) birimId = birimId.data;
    if (!birimId) birimId = "default";
    
    // Eski formatları kontrol et
    const hasOldSavedResults = Object.keys(allItems).some(k => 
      k === "savedResults" || (k.startsWith("savedResults_") && !k.includes("_doctor_") && !k.includes("_nurse_"))
    );
    
    const newKeyExists = allItems[`savedResults_doctor_${birimId}`] !== undefined;
    
    // Eski veri varsa ve yeni yapıda yoksa, migration'ı zorla çalıştır
    if (hasOldSavedResults && !newKeyExists) {
      console.log("🔄 Eski veri bulundu ama yeni yapıda yok, migration zorlanıyor...");
      performMigration(allItems, birimId);
      return;
    }
    
    // Eski veri yoksa, normal version kontrolü yap
    chrome.storage.local.get(["storageVersion"], (res) => {
      const oldVersion = res.storageVersion;
      
      if (oldVersion === CURRENT_STORAGE_VERSION) {
        console.log(`ℹ️ Storage zaten güncel (v${CURRENT_STORAGE_VERSION})`);
        return;
      }
      
      console.log(`🔄 Storage sürümü: ${oldVersion || "yok"} → ${CURRENT_STORAGE_VERSION} migration başlıyor...`);
      performMigration(allItems, birimId);
    });
  });
}

// Migration işlemlerini gerçekleştir
function performMigration(allItems, birimId) {
  const userType = "doctor";
  let hasMigrated = false;
  
  // Eski savedResults_123 formatını bul
  const oldSavedKeys = Object.keys(allItems).filter(k => 
    k.startsWith("savedResults_") && !k.includes("_doctor_") && !k.includes("_nurse_")
  );
  
  for (const oldKey of oldSavedKeys) {
    const data = allItems[oldKey];
    if (data) {
      const newKey = `savedResults_${userType}_${birimId}`;
      const timestamp = Date.now();
      const valueToStore = Array.isArray(data) ? { data, timestamp } : data;
      chrome.storage.local.set({ [newKey]: valueToStore });
      console.log(`✅ Migrated ${oldKey} → ${newKey}`);
      chrome.storage.local.remove(oldKey);
      hasMigrated = true;
    }
  }
  
  // Eski savedResults (düz) formatını bul
  if (allItems.savedResults && Array.isArray(allItems.savedResults)) {
    const newKey = `savedResults_${userType}_${birimId}`;
    const timestamp = Date.now();
    chrome.storage.local.set({ [newKey]: { data: allItems.savedResults, timestamp } });
    console.log(`✅ Migrated savedResults → ${newKey}`);
    chrome.storage.local.remove("savedResults");
    hasMigrated = true;
  }
  
  // sinaLastTime_* taşı
  const oldSinaKeys = Object.keys(allItems).filter(k => 
    k.startsWith("sinaLastTime_") && !k.includes("_doctor_") && !k.includes("_nurse_")
  );
  for (const oldKey of oldSinaKeys) {
    const data = allItems[oldKey];
    if (data) {
      const newKey = `sinaLastTime_${userType}_${birimId}`;
      const timestamp = Date.now();
      const valueToStore = data.timestamp ? data : { data, timestamp };
      chrome.storage.local.set({ [newKey]: valueToStore });
      console.log(`✅ Migrated ${oldKey} → ${newKey}`);
      chrome.storage.local.remove(oldKey);
      hasMigrated = true;
    }
  }
  
  if (allItems.sinaLastTime) {
    const newKey = `sinaLastTime_${userType}_${birimId}`;
    const timestamp = Date.now();
    let dataValue = allItems.sinaLastTime;
    if (typeof dataValue === "object" && dataValue.data) dataValue = dataValue.data;
    chrome.storage.local.set({ [newKey]: { data: dataValue, timestamp } });
    console.log(`✅ Migrated sinaLastTime → ${newKey}`);
    chrome.storage.local.remove("sinaLastTime");
    hasMigrated = true;
  }
  
  // hypLastTime için benzer işlemler
  const oldHypKeys = Object.keys(allItems).filter(k => 
    k.startsWith("hypLastTime_") && !k.includes("_doctor_") && !k.includes("_nurse_")
  );
  for (const oldKey of oldHypKeys) {
    const data = allItems[oldKey];
    if (data) {
      const newKey = `hypLastTime_${userType}_${birimId}`;
      const timestamp = Date.now();
      const valueToStore = data.timestamp ? data : { data, timestamp };
      chrome.storage.local.set({ [newKey]: valueToStore });
      console.log(`✅ Migrated ${oldKey} → ${newKey}`);
      chrome.storage.local.remove(oldKey);
      hasMigrated = true;
    }
  }
  
  if (allItems.hypLastTime) {
    const newKey = `hypLastTime_${userType}_${birimId}`;
    const timestamp = Date.now();
    let dataValue = allItems.hypLastTime;
    if (typeof dataValue === "object" && dataValue.data) dataValue = dataValue.data;
    chrome.storage.local.set({ [newKey]: { data: dataValue, timestamp } });
    console.log(`✅ Migrated hypLastTime → ${newKey}`);
    chrome.storage.local.remove("hypLastTime");
    hasMigrated = true;
  }
  
  // Nüfus taşı
  const oldNufusKeys = Object.keys(allItems).filter(k => k === "nufus" || (k.startsWith("nufus_") && !k.includes("_doctor_")));
  for (const oldKey of oldNufusKeys) {
    const nufus = allItems[oldKey];
    if (nufus && typeof nufus === "string") {
      const newKey = `nufus_${birimId}`;
      chrome.storage.local.set({ [newKey]: nufus });
      console.log(`✅ Migrated ${oldKey} → ${newKey}`);
      chrome.storage.local.remove(oldKey);
      hasMigrated = true;
    }
  }
  
  // BirimId düzeltme
  if (allItems.birimId && typeof allItems.birimId !== "string") {
    let correctBirimId = "default";
    if (typeof allItems.birimId === "object" && allItems.birimId.data) {
      correctBirimId = allItems.birimId.data;
    } else {
      correctBirimId = String(allItems.birimId);
    }
    chrome.storage.local.set({ birimId: correctBirimId });
    console.log(`✅ Fixed birimId from ${JSON.stringify(allItems.birimId)} to ${correctBirimId}`);
    hasMigrated = true;
  }
  
  // Storage sürümünü güncelle
  chrome.storage.local.set({ storageVersion: CURRENT_STORAGE_VERSION });
  
  // Eski migration flag'ini temizle (artık kullanılmıyor)
  chrome.storage.local.remove("migrationDone");
  
  if (hasMigrated) {
    console.log("🎉 Migration tamamlandı! Sayfayı yenileyin.");
    location.reload();
  } else {
    console.log("ℹ️ Migration gerekli değil, yeni yapı kullanılıyor.");
  }
}

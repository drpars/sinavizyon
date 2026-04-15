// modules/lib/migration.js

import { messageDialog } from '../ui/components/index.js';

export function migrateFromOldStorage() {
  // ✅ Manifest'ten güncel versiyonu otomatik al
  const manifest = chrome.runtime.getManifest();
  const currentVersion = manifest.version;
  
  chrome.storage.local.get(['storageVersion'], (res) => {
    const oldVersion = res.storageVersion || '0.0.0';
    
    // 1. Aşama: v1.6.7 öncesi yapısal dönüşümler
    if (!oldVersion || oldVersion < '1.6.7') {
      console.log(`🔄 Storage sürümü: ${oldVersion || 'yok'} → 1.6.7 migration başlıyor...`);
      
      chrome.storage.local.get(null, (allItems) => {
        let hasMigrated = false;
        const userType = 'doctor';
        
        // Nüfus migration
        if (allItems.nufus && typeof allItems.nufus === 'string') {
          const birimId = allItems.birimId || 'default';
          const newKey = `nufus_${birimId}`;
          if (!allItems[newKey]) {
            chrome.storage.local.set({ [newKey]: allItems.nufus });
            console.log(`✅ Migrated nufus → ${newKey}`);
            hasMigrated = true;
          }
        }
        
        // savedResults migration
        const oldSavedKeys = Object.keys(allItems).filter(k => 
          k.startsWith('savedResults_') && !k.includes('_doctor_') && !k.includes('_nurse_')
        );
        
        for (const oldKey of oldSavedKeys) {
          const data = allItems[oldKey];
          if (data) {
            const birimId = oldKey.replace('savedResults_', '');
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
        
        chrome.storage.local.set({ storageVersion: '1.6.7' });
        
        if (hasMigrated) {
          console.log('🎉 1.6.7 migration tamamlandı!');
        }
        
        // 2. aşamaya geç
        migrateFromOldStorage();
      });
      return;
    }
    
    // 2. Aşama: v2.1.2'den önceki sürümler için veri temizliği
    if (oldVersion < '2.1.2') {
      console.log(`🧹 Eski sürümden (v${oldVersion}) geçiş - veriler temizleniyor...`);
      
      chrome.storage.local.get(null, (items) => {
        const keysToRemove = Object.keys(items).filter(key => 
          key.startsWith('savedResults_') ||
          key.startsWith('sinaLastTime_') ||
          key.startsWith('hypLastTime_')
        );
        
        const onComplete = () => {
          // ✅ Otomatik olarak manifest'teki versiyonu yaz
          chrome.storage.local.set({ storageVersion: currentVersion });
          
          // Sadece v2.1.0/v2.1.1'den gelenlere mesaj göster
          if (oldVersion === '2.1.0' || oldVersion === '2.1.1') {
            showMigrationMessage();
          }
        };
        
        if (keysToRemove.length > 0) {
          chrome.storage.local.remove(keysToRemove, () => {
            console.log(`✅ ${keysToRemove.length} adet veri temizlendi.`);
            onComplete();
          });
        } else {
          onComplete();
        }
      });
      return;
    }
    
    // 3. Aşama: Versiyon güncellemesi (yapısal değişiklik yoksa bile)
    if (oldVersion < currentVersion) {
      console.log(`⬆️ Storage sürümü güncelleniyor: ${oldVersion} → ${currentVersion}`);
      chrome.storage.local.set({ storageVersion: currentVersion });
    } else {
      console.log(`ℹ️ Storage zaten güncel (v${oldVersion})`);
    }
  });
}

function showMigrationMessage() {
  messageDialog(
    '📢 v2.1.2 Güncellemesi\n\n' +
    'Verileriniz, yeni sürüme uyum için temizlendi.\n\n' +
    'Lütfen SİNA ve HYP butonlarını kullanarak verilerinizi yeniden çekin.',
    '⚠️ Bilgilendirme'
  );
}

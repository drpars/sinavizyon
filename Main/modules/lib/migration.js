// modules/lib/migration.js - v2.1.2 eklentisi

import { messageDialog } from '../ui/components/index.js';

// Mevcut migrateFromOldStorage fonksiyonunun yanına ekle
export function migrateFrom_v2_1_x_to_v2_1_2() {
  chrome.storage.local.get(['storageVersion'], (res) => {
    const oldVersion = res.storageVersion;
    
    // v2.1.0 veya v2.1.1'den geliyorsa
    if (oldVersion === '2.1.0' || oldVersion === '2.1.1') {
      console.log('🧹 v2.1.x verileri tamamen temizleniyor...');
      
      chrome.storage.local.get(null, (items) => {
        const keysToRemove = Object.keys(items).filter(key => 
          key.startsWith('savedResults_') ||
          key.startsWith('sinaLastTime_') ||
          key.startsWith('hypLastTime_')
        );
        
        if (keysToRemove.length > 0) {
          chrome.storage.local.remove(keysToRemove, () => {
            console.log(`✅ ${keysToRemove.length} adet veri temizlendi.`);
            chrome.storage.local.set({ storageVersion: '2.1.2' });
            
            // Kullanıcıya bilgi mesajı göster
            showMigrationMessage();
          });
        } else {
          chrome.storage.local.set({ storageVersion: '2.1.2' });
        }
      });
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

// Daha güvenilir tarayıcı tespiti
const isFirefox = typeof InstallTrigger !== 'undefined';
const isChrome = typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' && !isFirefox;

if (isFirefox) {
  console.log("🦊 Firefox modu aktif");
  
  // Firefox: Kenar çubuğunu toggle et
  browser.action.onClicked.addListener(async (tab) => {
    console.log("🖱️ Butona tıklandı, tab ID:", tab.id);
    
    try {
      // Önce kenar çubuğunun açık olup olmadığını kontrol et
      const isOpen = await browser.sidebarAction.isOpen({ tabId: tab.id });
      
      if (isOpen) {
        await browser.sidebarAction.close();
        console.log("❌ Kenar çubuğu kapatıldı");
      } else {
        await browser.sidebarAction.open();
        console.log("✅ Kenar çubuğu açıldı");
      }
    } catch (error) {
      console.error("❌ Kenar çubuğu hatası:", error.message);
      
      // Fallback: Direkt open() dene (bazı Firefox sürümlerinde)
      try {
        await browser.sidebarAction.open();
        console.log("✅ Kenar çubuğu (fallback) açıldı");
      } catch (fallbackError) {
        console.error("❌ Fallback da başarısız:", fallbackError.message);
      }
    }
  });
  
  // Sayfa yenilendiğinde veya sekme değiştiğinde panel durumunu koru
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      console.log(`🔄 Sekme yenilendi: ${tabId}`);
    }
  });
  
  console.log("🚀 Firefox eklentisi başarıyla başlatıldı");
  
} else if (isChrome) {
  console.log("🌐 Chrome/Chromium modu aktif");
  
  // Chrome: Daha manuel bir yaklaşım
  let sidePanelOpenTabs = new Set(); // Hangi sekmelerde panel açık? (Chrome'un native toggle'ı olmadığı için)
  
  chrome.action.onClicked.addListener(async (tab) => {
    console.log("🖱️ Butona tıklandı, tab ID:", tab.id);
    
    try {
      // Chrome sidePanel API'sini kontrol et
      if (chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
        
        // Panel zaten açık mı? (Chrome bunu direkt söylemez, biz track edelim)
        if (sidePanelOpenTabs.has(tab.id)) {
          // Chrome'da paneli programatik olarak kapatmanın direkt yolu YOK!
          // Kullanıcıya bilgi ver veya panel içeriğini değiştir
          console.log("ℹ️ Panel zaten açık. Kapatmak için panel içindeki kapat butonunu kullanın.");
          
          // Alternatif: Panel içeriğine mesaj gönder
          chrome.runtime.sendMessage({ action: "focusPanel" });
        } else {
          // Paneli aç
          await chrome.sidePanel.open({ tabId: tab.id });
          sidePanelOpenTabs.add(tab.id);
          console.log("✅ Chrome yan paneli açıldı");
        }
      } else {
        console.error("❌ Chrome sidePanel API'si mevcut değil");
      }
    } catch (error) {
      console.error("❌ Chrome sidePanel hatası:", error.message);
    }
  });
  
  // Sekme kapatıldığında Set'ten temizle
  chrome.tabs.onRemoved.addListener((tabId) => {
    if (sidePanelOpenTabs.has(tabId)) {
      sidePanelOpenTabs.delete(tabId);
      console.log(`🧹 Sekme ${tabId} kapatıldı, temizlendi`);
    }
  });
  
  // Sekme değiştiğinde (isteğe bağlı)
  chrome.tabs.onActivated.addListener((activeInfo) => {
    // Paneli track etmeye devam et
    console.log(`🔄 Aktif sekme değişti: ${activeInfo.tabId}`);
  });
  
  // Eklenti kurulum/update mesajı
  chrome.runtime.onInstalled.addListener((details) => {
    console.log(`📦 Eklenti ${details.reason} edildi (versiyon: ${chrome.runtime.getManifest().version})`);
  });
  
  console.log("🚀 Chrome eklentisi başarıyla başlatıldı");
  
} else {
  console.warn("⚠️ Tanınmayan tarayıcı ortamı. Eklenti çalışmayabilir.");
}

// Ortak: Mesajlaşma sistemi (content script ile iletişim)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Mesaj alındı:", message);
  
  if (message.action === "getPanelStatus") {
    if (isFirefox) {
      browser.sidebarAction.isOpen({})
        .then(isOpen => sendResponse({ isOpen }))
        .catch(err => sendResponse({ error: err.message }));
      return true; // Async response için
    } else {
      // Chrome için panel durumunu track ediyoruz
      const tabId = sender.tab?.id;
      const isOpen = sidePanelOpenTabs.has(tabId);
      sendResponse({ isOpen });
    }
  }
  
  return true; // Async response için
});

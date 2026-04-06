// Tarayıcı tespiti
const isFirefox = typeof browser !== 'undefined' && navigator.userAgent.includes('Firefox');

if (isFirefox) {
  console.log("🔍 Firefox modu aktif");
  
  if (typeof browser.action !== 'undefined') {
    browser.action.onClicked.addListener(async (tab) => {
      console.log("🖱️ Butona tıklandı, tab ID:", tab.id);
      try {
        // Basit toggle - açık/kapalı durumunu otomatik yönetir
        await browser.sidebarAction.toggle();
        console.log("✅ Kenar çubuğu toggle edildi");
      } catch (error) {
        console.error("❌ HATA:", error.message);
      }
    });
  }
  
  console.log("🚀 Firefox eklentisi başlatıldı");
} else {
  // Chrome / Chromium
  console.log("🔍 Chrome/Chromium modu aktif");
  
  (function setupSidePanel() {
    if (typeof chrome !== 'undefined' && chrome.sidePanel) {
      const setBehavior = chrome.sidePanel['setPanelBehavior']; 
      if (typeof setBehavior === 'function') {
        setBehavior.call(chrome.sidePanel, { openPanelOnActionClick: true })
          .catch(err => console.error("Chrome sidePanel hatası:", err));
      }
    } else {
      console.warn("⚠️ sidePanel API desteklenmiyor (eski Chrome veya farklı tarayıcı)");
    }
  })();
}

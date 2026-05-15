// modules/ui/components/modal/about.js
// ============================================================
// Hakkında Modalı
// ============================================================

export async function showAboutDialog() {
  let version = "1.6.7";
  try {
    const manifest = chrome.runtime.getManifest();
    if (manifest && manifest.version) version = manifest.version;
  } catch (e) {
    console.warn("Manifest okunamadı, varsayılan versiyon kullanılıyor:", e);
  }

  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.id = "aboutDialog";
    modal.className = "consent-modal";
    modal.style.animation = "fadeIn 0.2s ease";
    modal.innerHTML = `
      <div class="consent-modal-content" style="max-width: 380px; text-align: center; padding: 24px;">
        <div style="margin-bottom: 20px;">
          <img src="icons/icon-org.svg" style="width: 72px; height: 72px;">
          <h2 style="margin: 12px 0 4px 0; color: var(--blue); font-size: 1.4rem;">SİNA VİZYON</h2>
          <p style="margin: 0; font-size: 0.7rem; opacity: 0.7;">SİNA & HYP Yönetim Eklentisi</p>
        </div>
        
        <div style="background: var(--bg); border-radius: 16px; padding: 16px; margin-bottom: 20px; text-align: left;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);">
            <span style="font-weight: bold;">📦 Sürüm</span>
            <span id="aboutVersion">${version}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);">
            <span style="font-weight: bold;">👨‍💻 Geliştirici</span>
            <span>drizzet</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);">
            <span style="font-weight: bold;">🙏 Teşekkürler</span>
            <span>drumit</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: bold;">🎯 Hedef</span>
            <span>AİLE HEKİMLİĞİ</span>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="font-size: 0.65rem; opacity: 0.6; margin-bottom: 8px;">Yapay zeka desteği</p>
          <div style="display: flex; justify-content: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <img src="icons/deepseek-logo.png" style="height: 18px;">
              <span style="font-size: 0.7rem; font-weight: bold;">DeepSeek AI</span>
            </div>
          </div>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button id="aboutWhatsNewBtn" style="background-color: var(--bg); color: var(--blue); border: 1px solid var(--border); padding: 10px 20px; border-radius: 12px; font-weight: bold; cursor: pointer; flex: 1; transition: all 0.2s;">
            Yenilikler
          </button>
          <button id="aboutOkBtn" style="background-color: var(--blue); color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: bold; cursor: pointer; flex: 1; transition: opacity 0.2s;">
            KAPAT
          </button>
        </div>
      </div>
    `;

    if (!document.querySelector("#aboutDialogStyle")) {
      const style = document.createElement("style");
      style.id = "aboutDialogStyle";
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(modal);
    modal.style.display = "flex";

    const okBtn = document.getElementById("aboutOkBtn");
    const whatsNewBtn = document.getElementById("aboutWhatsNewBtn");

    okBtn.addEventListener("click", () => {
      modal.remove();
        resolve();
    }, { once: true });

    whatsNewBtn.addEventListener("click", async () => {
        modal.remove();
        const { showWhatsNewModal } = await import("./whatsnew.js");
        const manifest = chrome.runtime.getManifest();
        showWhatsNewModal(manifest.version);
        resolve();
      },
      { once: true }
    );
  });
}

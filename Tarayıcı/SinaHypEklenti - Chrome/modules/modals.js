import { changelogData } from './constants.js';

// ========== GENEL DİYALOG FONKSİYONLARI ==========

// Hakkında bilgi göster (HTML içerikli, sağa hizalı imza)
export async function showAboutDialog() {
  const manifest = chrome.runtime.getManifest();
  const version = manifest.version;

  // Modal elementi oluştur (eğer yoksa)
  let modal = document.getElementById("aboutDialog");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "aboutDialog";
    modal.className = "consent-modal";
    modal.innerHTML = `
      <div class="consent-modal-content" style="max-width: 400px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="icons/about.png" style="width: 20px; height: 20px;">
          <h3 style="margin: 0;"></h3>
        </div>
        <div id="aboutContent" style="text-align: left; margin-top: 12px;"></div>
        <div class="consent-modal-buttons">
          <button id="aboutOkBtn" style="background-color: var(--blue); color: white;">Tamam</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const contentDiv = document.getElementById("aboutContent");
  const okBtn = document.getElementById("aboutOkBtn");

  // İçeriği HTML olarak oluştur
  contentDiv.innerHTML = `
      <div style="margin-top: 30px;"></div>
      <p style="margin: 0 0 4px 0; font-size: 1rem;"><strong>Geliştirici :</strong> drpars</p>
      <p style="margin: 0 0 20px 0; font-size: 1rem;"><strong>Teşekkürler :</strong> drumit</p>
      <div style="margin-top: 48px; text-align: right;">
        <div style="font-size: 0.55rem; opacity: 0.6; margin-bottom: 4px; margin-right: 50px;">Yapay zeka destekleri</div>
        <div>
          <img src="icons/deepseek-logo.png" style="height: 20px; vertical-align: middle;"> 
          <strong style="margin-right: 12px; font-size: 0.7rem;">DeepSeek AI</strong>
          <img src="icons/gemini-logo.png" style="height: 20px; vertical-align: middle;"> 
          <strong style="font-size: 0.7rem;">Gemini AI</strong>
        </div>
      </div>
  `;

  modal.style.display = "flex";

  const onOk = () => {
    modal.style.display = "none";
    okBtn.removeEventListener("click", onOk);
  };
  okBtn.addEventListener("click", onOk);
}

/**
 * Kullanıcıya onay sorusu sorar
 * @param {string} prompt - Sorulacak metin
 * @param {string} title - Başlık (varsayılan: "Onay")
 * @returns {Promise<boolean>} - true: kabul, false: red
 */
export async function confirmDialog(prompt, title = "Onay") {
  return new Promise((resolve) => {
    // Modal elementi oluştur (eğer yoksa)
    let modal = document.getElementById("confirmDialog");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "confirmDialog";
      modal.className = "consent-modal";
      modal.innerHTML = `
        <div class="consent-modal-content" style="max-width: 350px;">
          <h3 id="confirmDialogTitle">Onay</h3>
          <p id="confirmDialogPrompt" style="text-align: left;"></p>
          <div class="consent-modal-buttons">
            <button id="confirmDialogYesBtn" style="background-color: var(--green); color: var(--bg-dark);">Evet</button>
            <button id="confirmDialogNoBtn" style="background-color: var(--red); color: white;">Hayır</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const titleElem = document.getElementById("confirmDialogTitle");
    const promptElem = document.getElementById("confirmDialogPrompt");
    const yesBtn = document.getElementById("confirmDialogYesBtn");
    const noBtn = document.getElementById("confirmDialogNoBtn");

    titleElem.textContent = title;
    promptElem.textContent = prompt;

    modal.style.display = "flex";

    const onYes = () => {
      modal.style.display = "none";
      cleanup();
      resolve(true);
    };
    const onNo = () => {
      modal.style.display = "none";
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
    };
    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  });
}

/**
 * Kullanıcıya bilgi mesajı gösterir
 * @param {string} text - Gösterilecek metin
 * @param {string} title - Başlık (varsayılan: "Mesaj")
 * @returns {Promise<void>}
 */
export async function messageDialog(text, title = "Mesaj") {
  return new Promise((resolve) => {
    let modal = document.getElementById("messageDialog");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "messageDialog";
      modal.className = "consent-modal";
      modal.innerHTML = `
        <div class="consent-modal-content" style="max-width: 350px;">
          <h3 id="messageDialogTitle">Mesaj</h3>
          <p id="messageDialogText" style="text-align: left;"></p>
          <div class="consent-modal-buttons">
            <button id="messageDialogOkBtn" style="background-color: var(--blue); color: white;">Tamam</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const titleElem = document.getElementById("messageDialogTitle");
    const textElem = document.getElementById("messageDialogText");
    const okBtn = document.getElementById("messageDialogOkBtn");

    titleElem.textContent = title;
    textElem.textContent = text;

    modal.style.display = "flex";

    const onOk = () => {
      modal.style.display = "none";
      cleanup();
      resolve();
    };
    const cleanup = () => {
      okBtn.removeEventListener("click", onOk);
    };
    okBtn.addEventListener("click", onOk);
  });
}

// Rıza modalını göster ve kullanıcı cevabını bekle
export function showConsentModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById("consentModal");
    const acceptBtn = document.getElementById("consentAcceptBtn");
    const rejectBtn = document.getElementById("consentRejectBtn");
    
    if (!modal || !acceptBtn || !rejectBtn) {
      const userConfirmed = confirm(
        "🔒 KVKK Aydınlatma ve Rıza\n\n" +
        "Bu eklenti, SİNA ve HYP sistemlerinden aldığınız performans verilerini yerel olarak saklar.\n\n" +
        "✓ Verileriniz yalnızca sizin cihazınızda tutulur\n" +
        "✓ Hiçbir sunucuya gönderilmez\n" +
        "✓ İstediğiniz zaman silebilir veya dışa aktarabilirsiniz\n" +
        "✓ Veriler 90 gün sonra otomatik silinir\n\n" +
        "Bu koşulları kabul ediyor musunuz?"
      );
      resolve(userConfirmed);
      return;
    }

    modal.style.display = "flex";

    const onAccept = () => {
      modal.style.display = "none";
      cleanup();
      resolve(true);
    };
    const onReject = () => {
      modal.style.display = "none";
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      acceptBtn.removeEventListener("click", onAccept);
      rejectBtn.removeEventListener("click", onReject);
    };
    acceptBtn.addEventListener("click", onAccept);
    rejectBtn.addEventListener("click", onReject);
  });
}

// Rıza yönetimi (modal ile)
export async function requestConsent() {
  const userConfirmed = await showConsentModal();
  await chrome.storage.local.set({ kvkkConsent: userConfirmed }).catch(console.error);
  return userConfirmed;
}

// Sürüm geçmişi modalını göster
export function showChangelog() {
  const modal = document.getElementById("changelogModal");
  const contentDiv = document.getElementById("changelogContent");
  if (!modal || !contentDiv) {
    console.error("Modal elementi bulunamadı.");
    return;
  }
  contentDiv.innerHTML = "";
  for (const item of changelogData) {
    const title = document.createElement("h4");
    title.textContent = `v${item.version} (${item.date})`;
    contentDiv.appendChild(title);
    const list = document.createElement("ul");
    item.changes.forEach(change => {
      const li = document.createElement("li");
      li.textContent = change;
      list.appendChild(li);
    });
    contentDiv.appendChild(list);
  }
  modal.style.display = "flex";
}

// Modal kapatma
export function closeModal() {
  const modal = document.getElementById("changelogModal");
  if (modal) modal.style.display = "none";
}

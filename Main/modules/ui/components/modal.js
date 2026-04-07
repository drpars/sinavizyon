// modules/ui/components/modal.js
let cachedChangelog = null;

async function getChangelog() {
  if (cachedChangelog) return cachedChangelog;
  try {
    const response = await fetch(chrome.runtime.getURL('modules/data/changelog.json'));
    const data = await response.json();
    cachedChangelog = data.changelogData;
    return cachedChangelog;
  } catch (error) {
    console.error('Changelog yüklenemedi:', error);
    return [];
  }
}

// ========== İLK KURULUM: KULLANICI MODU SEÇİM MODALI ==========
export async function showFirstTimeUserTypeModal() {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.id = "firstTimeModal";
    modal.className = "consent-modal";
    modal.style.animation = "fadeIn 0.2s ease";
    modal.innerHTML = `
      <div class="consent-modal-content" style="max-width: 380px; text-align: center;">
        <div style="margin-bottom: 16px;">
          <img src="icons/icon-org.svg" style="width: 56px; height: 56px;">
          <h3 style="margin: 8px 0 0 0; color: var(--blue);">SİNA VİZYON</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.7rem; opacity: 0.7;">Hoş geldiniz!</p>
        </div>
        
        <p style="margin-bottom: 16px; font-size: 0.8rem;">
          Eklentiyi hangi modda kullanmak istersiniz?
        </p>
        
        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
          <div class="user-type-card" data-type="doctor" style="flex:1; text-align:center; padding: 12px; border: 2px solid var(--border); border-radius: 16px; cursor: pointer; transition: all 0.2s ease;">
            <div style="font-size: 40px;">👨‍⚕️</div>
            <div style="font-weight: bold; margin-top: 8px;">Aile Hekimi</div>
            <div style="font-size: 0.6rem; opacity: 0.7;">Doktor</div>
          </div>
          <div class="user-type-card" data-type="nurse" style="flex:1; text-align:center; padding: 12px; border: 2px solid var(--border); border-radius: 16px; cursor: pointer; transition: all 0.2s ease;">
            <div style="font-size: 40px;">👩‍⚕️</div>
            <div style="font-weight: bold; margin-top: 8px;">ASÇ</div>
            <div style="font-size: 0.6rem; opacity: 0.7;">Aile Sağlığı Çalışanı</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; text-align: left;">
          <label style="font-size: 0.7rem; margin-bottom: 6px; display: block;">GÖRÜNÜM TEMASI</label>
          <select id="firstTimeThemeSelect" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-dark); color: var(--fg);">
            <option value="light">☀️ Açık (Varsayılan)</option>
            <option value="dark">🌙 Koyu (Tokyo Night)</option>
          </select>
        </div>
        
        <p style="font-size: 0.65rem; opacity: 0.6; margin-bottom: 20px;">
          ℹ️ Bu tercihleri daha sonra ⚙️ Ayarlar'dan değiştirebilirsiniz.
        </p>
        
        <button id="firstTimeConfirmBtn" style="background-color: var(--blue); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; transition: opacity 0.2s;">
          BAŞLAT
        </button>
      </div>
    `;
    
    if (!document.querySelector("#firstTimeModalStyle")) {
      const style = document.createElement("style");
      style.id = "firstTimeModalStyle";
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .user-type-card.selected {
          border-color: var(--blue);
          background-color: var(--bg);
          box-shadow: 0 0 0 2px rgba(122, 162, 247, 0.2);
        }
        .user-type-card:hover {
          border-color: var(--blue);
          transform: translateY(-2px);
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
    modal.style.display = "flex";
    
    let selectedType = "doctor";
    const doctorCard = modal.querySelector('.user-type-card[data-type="doctor"]');
    const nurseCard = modal.querySelector('.user-type-card[data-type="nurse"]');
    const themeSelect = document.getElementById("firstTimeThemeSelect");
    const confirmBtn = document.getElementById("firstTimeConfirmBtn");
    
    doctorCard.classList.add("selected");
    
    const selectCard = (type) => {
      selectedType = type;
      if (type === "doctor") {
        doctorCard.classList.add("selected");
        nurseCard.classList.remove("selected");
      } else {
        nurseCard.classList.add("selected");
        doctorCard.classList.remove("selected");
      }
    };
    
    doctorCard.addEventListener("click", () => selectCard("doctor"));
    nurseCard.addEventListener("click", () => selectCard("nurse"));
    
    // ========== TEMA ÖNİZLEME: Seçim anında tema değişsin ==========
    const applyThemePreview = (theme) => {
      if (theme === "dark") {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
    };
    
    themeSelect.addEventListener("change", (e) => {
      applyThemePreview(e.target.value);
    });
    
    const handleConfirm = () => {
      const selectedTheme = themeSelect?.value || "light";
      modal.remove();
      resolve({ userType: selectedType, theme: selectedTheme });
    };
    confirmBtn.addEventListener("click", handleConfirm, { once: true });
  });
}

// Hakkında bilgi göster
export async function showAboutDialog() {
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
            <span id="aboutVersion">${chrome.runtime.getManifest().version}</span>
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
          <p style="font-size: 0.65rem; opacity: 0.6; margin-bottom: 8px;">Yapay zeka destekleri</p>
          <div style="display: flex; justify-content: center; gap: 20px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <img src="icons/deepseek-logo.png" style="height: 18px;">
              <span style="font-size: 0.7rem; font-weight: bold;">DeepSeek AI</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <img src="icons/gemini-logo.png" style="height: 18px;">
              <span style="font-size: 0.7rem; font-weight: bold;">Gemini AI</span>
            </div>
          </div>
        </div>
        
        <button id="aboutOkBtn" style="background-color: var(--blue); color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: bold; cursor: pointer; width: 100%; transition: opacity 0.2s;">
          KAPAT
        </button>
      </div>
    `;
    
    // Animasyon için keyframe ekle (eğer yoksa)
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
    const handleOk = () => {
      modal.remove();
      resolve();
    };
    okBtn.addEventListener("click", handleOk, { once: true });
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
export async function showChangelog() {
  const modal = document.getElementById("changelogModal");
  const contentDiv = document.getElementById("changelogContent");
  if (!modal || !contentDiv) {
    console.error("Modal elementi bulunamadı.");
    return;
  }
  
  const changelogData = await getChangelog();
  
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

// ========== GÜNCELLEME SONRASI YENİLİKLER MODALI ==========
export async function showWhatsNewModal(version) {
  // version parametresine göre ilgili changelog'u bul
  const changelogData = await getChangelog();
  const versionData = changelogData.find(item => item.version === version);
  
  if (!versionData) {
    // versiyon bulunamazsa varsayılan mesaj
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className = "consent-modal";
      modal.style.animation = "fadeIn 0.2s ease";
      modal.innerHTML = `
        <div class="consent-modal-content" style="max-width: 380px; text-align: center;">
          <div style="margin-bottom: 16px;">
            <img src="icons/icon-org.svg" style="width: 56px; height: 56px;">
            <h3 style="margin: 8px 0 0 0; color: var(--blue);">🎉 YENİ SÜRÜM ${version}</h3>
          </div>
          <button id="whatsNewConfirmBtn" style="background-color: var(--blue); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%;">
            BAŞLAT
          </button>
        </div>
      `;
      document.body.appendChild(modal);
      modal.style.display = "flex";
      const confirmBtn = document.getElementById("whatsNewConfirmBtn");
      confirmBtn.addEventListener("click", () => {
        modal.remove();
        resolve();
      }, { once: true });
    });
  }
  
  // versionData varsa detaylı modal göster
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "consent-modal";
    modal.style.animation = "fadeIn 0.2s ease";
    
    const changesHtml = versionData.changes.map(change => {
      // ** ile vurgulananları işaretle
      const formattedChange = change.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return `<p style="margin: 8px 0; font-size: 0.8rem;">${formattedChange}</p>`;
    }).join('');
    
    modal.innerHTML = `
      <div class="consent-modal-content" style="max-width: 380px; text-align: center;">
        <div style="margin-bottom: 16px;">
          <img src="icons/icon-org.svg" style="width: 56px; height: 56px;">
          <h3 style="margin: 8px 0 0 0; color: var(--blue);">🎉 YENİ SÜRÜM ${version}</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.7rem; opacity: 0.7;">${versionData.date}</p>
        </div>
        
        <div style="text-align: left; margin-bottom: 20px; max-height: 300px; overflow-y: auto;">
          ${changesHtml}
        </div>
        
        <button id="whatsNewConfirmBtn" style="background-color: var(--blue); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%;">
          BAŞLAT
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = "flex";
    const confirmBtn = document.getElementById("whatsNewConfirmBtn");
    confirmBtn.addEventListener("click", () => {
      modal.remove();
      resolve();
    }, { once: true });
  });
}


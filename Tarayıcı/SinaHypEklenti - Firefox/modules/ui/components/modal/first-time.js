// modules/ui/components/modal/first-time.js
// ============================================================
// İlk Kurulum - Kullanıcı Tipi Seçim Modalı
// ============================================================

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

    // Stil ekle (eğer yoksa)
    if (!document.querySelector("#firstTimeModalStyle")) {
      const style = document.createElement("style");
      style.id = "firstTimeModalStyle";
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .user-type-card.selected {
          border-color: var(--blue) !important;
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

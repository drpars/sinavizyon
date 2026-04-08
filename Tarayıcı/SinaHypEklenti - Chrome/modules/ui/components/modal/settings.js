// modules/ui/components/modal/settings.js
// Ayarlar Modalı

import { getCurrentUserType, setCurrentUserType, saveCurrentUserTypeToStorage, getCurrentBirimId, setCurrentBirimId, getCurrentShowAll } from '../../../core/state.js';
import { getDomAy, getDomYil, getDomBirimId, getDomNufus } from '../../../core/dom.js';
import { saveNufusForBirim } from '../../../core/storage.js';
import { applyTheme } from '../../updaters/theme-updater.js';
import { tavanHesapla } from '../../../lib/calculations.js';
import { loadDataForCurrentBirim, loadDataForCurrentBirimWithMerge } from '../../../core/storage.js';
import { updateTable } from '../../updaters/table-updater.js';
import { showToast } from '../../../utils/notifications.js';
import { exportData, revokeConsent } from '../../../core/storage.js';
import { confirmDialog } from '../dialog.js';

let modalElement = null;
let currentSettings = {};

// Modal HTML'i oluştur
function createSettingsModal() {
  const modal = document.createElement("div");
  modal.id = "settingsModal";
  modal.className = "settings-modal";
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="settings-modal-overlay"></div>
    <div class="settings-modal-container">
      <div class="settings-modal-header">
        <div class="settings-modal-icon">⚙️</div>
        <h2 class="settings-modal-title">Ayarlar</h2>
        <button class="settings-modal-close" id="closeSettingsModalBtn">&times;</button>
      </div>
      
      <div class="settings-modal-body">
        <!-- KULLANICI TİPİ -->
        <div class="settings-card">
          <div class="settings-card-header">
            <span class="settings-card-icon">👤</span>
            <span class="settings-card-title">Kullanıcı Tipi</span>
          </div>
          <div class="settings-card-body">
            <div class="settings-radio-group">
              <label class="settings-radio">
                <input type="radio" name="userTypeRadio" value="doctor">
                <span class="settings-radio-custom"></span>
                <span class="settings-radio-label">👨‍⚕️ Aile Hekimi</span>
              </label>
              <label class="settings-radio">
                <input type="radio" name="userTypeRadio" value="nurse">
                <span class="settings-radio-custom"></span>
                <span class="settings-radio-label">👩‍⚕️ Aile Sağlığı Çalışanı (ASÇ)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- DÖNEM AYARLARI -->
        <div class="settings-card">
          <div class="settings-card-header">
            <span class="settings-card-icon">📅</span>
            <span class="settings-card-title">Dönem Ayarları</span>
          </div>
          <div class="settings-card-body">
            <div class="settings-row">
              <label class="settings-label">Ay</label>
              <select id="modalAy" class="settings-select">
                <option value="OCAK">OCAK</option>
                <option value="SUBAT">SUBAT</option>
                <option value="MART">MART</option>
                <option value="NISAN">NISAN</option>
                <option value="MAYIS">MAYIS</option>
                <option value="HAZIRAN">HAZIRAN</option>
                <option value="TEMMUZ">TEMMUZ</option>
                <option value="AGUSTOS">AGUSTOS</option>
                <option value="EYLUL">EYLUL</option>
                <option value="EKIM">EKIM</option>
                <option value="KASIM">KASIM</option>
                <option value="ARALIK">ARALIK</option>
              </select>
            </div>
            <div class="settings-row">
              <label class="settings-label">Yıl</label>
              <input type="number" id="modalYil" class="settings-input" value="2026">
            </div>
            <div class="settings-row">
              <label class="settings-label">Birim ID</label>
              <input type="text" id="modalBirimId" class="settings-input" placeholder="Birim ID girin">
            </div>
            <div class="settings-row">
              <label class="settings-label">Nüfus</label>
              <input type="number" id="modalNufus" class="settings-input" placeholder="Nüfus girin">
            </div>
          </div>
        </div>

        <!-- GÖRÜNÜM -->
        <div class="settings-card">
          <div class="settings-card-header">
            <span class="settings-card-icon">🎨</span>
            <span class="settings-card-title">Görünüm</span>
          </div>
          <div class="settings-card-body">
            <div class="settings-row">
              <label class="settings-label">Tema</label>
              <div class="settings-theme-buttons">
                <button class="theme-btn" data-theme="light">☀️ Açık</button>
                <button class="theme-btn" data-theme="dark">🌙 Koyu</button>
              </div>
            </div>
            <div class="settings-row">
              <label class="settings-label">Yazı Boyutu</label>
              <div class="settings-font-control">
                <span class="font-size-value" id="modalFontSizeValue">16px</span>
                <input type="range" id="modalFontSizeSlider" class="settings-slider" min="12" max="20" step="0.5" value="16">
              </div>
            </div>
          </div>
        </div>

        <!-- VERİ YÖNETİMİ -->
        <div class="settings-card">
          <div class="settings-card-header">
            <span class="settings-card-icon">💾</span>
            <span class="settings-card-title">Veri Yönetimi</span>
          </div>
          <div class="settings-card-body">
            <button id="modalExportData" class="settings-btn settings-btn-primary">📤 Verileri Dışa Aktar</button>
            <button id="modalDeleteData" class="settings-btn settings-btn-danger">🗑️ Tüm Verilerimi Sil</button>
            <button id="modalRevokeConsent" class="settings-btn settings-btn-danger">🔒 Rızamı Geri Çek</button>
          </div>
        </div>
      </div>

      <div class="settings-modal-footer">
        <button id="settingsCancelBtn" class="settings-footer-btn settings-footer-btn-secondary">İptal</button>
        <button id="settingsApplyBtn" class="settings-footer-btn settings-footer-btn-primary">Uygula</button>
      </div>
    </div>
  `;
  
  return modal;
}

// Mevcut değerleri modala yükle
function loadCurrentValues() {
  // Kullanıcı tipi
  const currentUserType = getCurrentUserType();
  const userTypeRadio = document.querySelector(`input[name="userTypeRadio"][value="${currentUserType}"]`);
  if (userTypeRadio) userTypeRadio.checked = true;
  
  // Tema
  const isDarkMode = document.body.classList.contains("dark-mode");
  const currentTheme = isDarkMode ? "dark" : "light";
  const themeBtns = document.querySelectorAll(".theme-btn");
  themeBtns.forEach(btn => {
    if (btn.dataset.theme === currentTheme) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  
  // Yazı boyutu
  const currentFontSize = parseInt(document.documentElement.style.fontSize) || 16;
  const fontSizeSlider = document.getElementById("modalFontSizeSlider");
  const fontSizeValue = document.getElementById("modalFontSizeValue");
  if (fontSizeSlider) fontSizeSlider.value = currentFontSize;
  if (fontSizeValue) fontSizeValue.textContent = currentFontSize + "px";
  
  // Dönem ayarları
  const modalAy = document.getElementById("modalAy");
  const modalYil = document.getElementById("modalYil");
  const modalBirimId = document.getElementById("modalBirimId");
  const modalNufus = document.getElementById("modalNufus");
  
  if (modalAy) modalAy.value = getDomAy();
  if (modalYil) modalYil.value = getDomYil();
  if (modalBirimId) modalBirimId.value = getDomBirimId();
  if (modalNufus) modalNufus.value = getDomNufus();
}

// Değişiklikleri kaydet ve uygula
async function applyChanges() {
  // 1. Kullanıcı tipini al ve uygula
  const selectedUserType = document.querySelector('input[name="userTypeRadio"]:checked')?.value;
  if (selectedUserType && selectedUserType !== getCurrentUserType()) {
    setCurrentUserType(selectedUserType);
    await saveCurrentUserTypeToStorage();
  }
  
  // 2. Temayı al ve uygula
  const activeThemeBtn = document.querySelector(".theme-btn.active");
  const selectedTheme = activeThemeBtn?.dataset.theme || "light";
  applyTheme(selectedTheme);
  await chrome.storage.local.set({ themePreference: selectedTheme });
  
  // 3. Yazı boyutunu al ve uygula
  const fontSizeSlider = document.getElementById("modalFontSizeSlider");
  const newFontSize = parseInt(fontSizeSlider?.value) || 12; // Varsayılan 12px

  // ✅ Ana eklentinin fontunu değiştir
  document.documentElement.style.fontSize = newFontSize + "px";
  await chrome.storage.local.set({ userFontSize: newFontSize });

  // Font toggle checkbox'ı varsa işaretli mi kontrol et
  const fontToggleCheckbox = document.getElementById("fontToggleCheckbox");
  if (fontToggleCheckbox && !fontToggleCheckbox.checked) {
    // Eğer font ayarı kapalıysa, aç
    fontToggleCheckbox.checked = true;
    const fontContainer = document.getElementById("fontSettingsContainer");
    if (fontContainer) fontContainer.style.display = "block";
  }
  
  // 4. Dönem ayarlarını al
  const newAy = document.getElementById("modalAy")?.value || getDomAy();
  const newYil = parseInt(document.getElementById("modalYil")?.value) || getDomYil();
  const newBirimId = document.getElementById("modalBirimId")?.value.trim() || "";
  const newNufus = document.getElementById("modalNufus")?.value || "";
  
  // 5. Değişiklikleri uygula
  let needsReload = false;
  let needsStorageUpdate = false;
  
  if (newAy !== getDomAy()) {
    const aySelect = document.getElementById("ay");
    if (aySelect) aySelect.value = newAy;
    needsReload = true;
  }
  
  if (newYil !== getDomYil()) {
    const yilInput = document.getElementById("yil");
    if (yilInput) yilInput.value = newYil;
    needsReload = true;
  }
  
  if (newBirimId !== getDomBirimId()) {
    const birimIdInput = document.getElementById("birimId");
    if (birimIdInput) birimIdInput.value = newBirimId;
    setCurrentBirimId(newBirimId);
    await saveCurrentUserTypeToStorage(); // BirimId'yi kaydet
    needsReload = true;
    needsStorageUpdate = true;
  }
  
  if (newNufus !== getDomNufus()) {
    const nufusInput = document.getElementById("nufus");
    if (nufusInput) nufusInput.value = newNufus;
    if (newBirimId) {
      await saveNufusForBirim(newBirimId, newNufus);
    } else if (getDomBirimId()) {
      await saveNufusForBirim(getDomBirimId(), newNufus);
    }
    tavanHesapla(newNufus);
    needsReload = true;
  }
  
  // 6. Verileri yeniden yükle
  if (needsReload) {
    const birimId = getCurrentBirimId();
    const userType = getCurrentUserType();
    const ay = getDomAy();
    const yil = getDomYil();
    
    if (userType === "nurse") {
      const showAll = getCurrentShowAll();
      loadDataForCurrentBirimWithMerge(updateTable, userType, birimId, null, showAll, ay, yil);
    } else {
      loadDataForCurrentBirim(updateTable, userType, birimId, null, false, ay, yil);
    }
  }
  
  // 7. Başarılı mesajı göster
  showToast("Ayarlar kaydedildi ✅");
  
  // 8. Modal'ı kapat
  closeSettingsModal();
}

// Event listener'ları bağla
function bindEvents() {
  // Kapatma butonları
  const closeBtn = document.getElementById("closeSettingsModalBtn");
  if (closeBtn) closeBtn.addEventListener("click", closeSettingsModal);
  
  const cancelBtn = document.getElementById("settingsCancelBtn");
  if (cancelBtn) cancelBtn.addEventListener("click", closeSettingsModal);
  
  const overlay = document.querySelector(".settings-modal-overlay");
  if (overlay) overlay.addEventListener("click", closeSettingsModal);
  
  // Uygula butonu
  const applyBtn = document.getElementById("settingsApplyBtn");
  if (applyBtn) applyBtn.addEventListener("click", applyChanges);
  
  // Tema butonları
  const themeBtns = document.querySelectorAll(".theme-btn");
  themeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      themeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
  
  // Yazı boyutu slider
  const fontSizeSlider = document.getElementById("modalFontSizeSlider");
  const fontSizeValue = document.getElementById("modalFontSizeValue");
  if (fontSizeSlider && fontSizeValue) {
    fontSizeSlider.addEventListener("input", (e) => {
      fontSizeValue.textContent = e.target.value + "px";
    });
  }
  
  // Veri yönetimi butonları
  const exportBtn = document.getElementById("modalExportData");
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      closeSettingsModal();
      await exportData();
    });
  }
  
  const deleteBtn = document.getElementById("modalDeleteData");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      closeSettingsModal();
      const confirmed = await confirmDialog("Tüm verileriniz kalıcı olarak silinecek. Devam etmek istiyor musunuz?", "Veri Silme Onayı");
      if (confirmed) {
        // deleteAllData fonksiyonu çağrılacak
        const { deleteAllData } = await import('../../../sidepanel.js');
        deleteAllData();
      }
    });
  }
  
  const revokeBtn = document.getElementById("modalRevokeConsent");
  if (revokeBtn) {
    revokeBtn.addEventListener("click", async () => {
      closeSettingsModal();
      await revokeConsent();
    });
  }
}

// Modal'ı aç
export function openSettingsModal() {
  if (!modalElement) {
    modalElement = createSettingsModal();
    document.body.appendChild(modalElement);
    bindEvents();
  }
  loadCurrentValues();
  modalElement.style.display = "flex";
}

// Modal'ı kapat
export function closeSettingsModal() {
  if (modalElement) {
    modalElement.style.display = "none";
  }
}

// Ayarları dışarıdan uygula (gerekirse)
export async function applySettingsFromOutside() {
  await applyChanges();
}

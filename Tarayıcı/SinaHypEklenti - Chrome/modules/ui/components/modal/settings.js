// modules/ui/components/modal/settings.js
// Ayarlar Modalı - Tüm ayarlar hafızada tutulur

import { 
  getCurrentUserType, 
  setCurrentUserType, 
  saveCurrentUserTypeToStorage, 
  getCurrentBirimId, 
  setCurrentBirimId, 
  getCurrentShowAll 
} from '../../../core/state.js';

import { 
  getDomAy, 
  getDomYil, 
  getDomBirimId, 
  getDomNufus 
} from '../../../core/dom.js';

import { 
  saveNufusForBirim, 
  loadNufusForBirim,
  loadDataForCurrentBirim, 
  loadDataForCurrentBirimWithMerge,
  exportData 
} from '../../../core/storage.js';

import { applyTheme } from '../../updaters/theme-updater.js';
import { tavanHesapla } from '../../../lib/calculations.js';
import { updateTable } from '../../updaters/table-updater.js';
import { showToast } from '../../../utils/notifications.js';
import { revokeConsent } from '../../../features/consent/index.js';
import { confirmDialog } from '../dialog.js';

let modalElement = null;

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
        <!-- 1. KULLANICI TİPİ -->
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

        <!-- 2. DÖNEM AYARLARI - YAN YANA -->
        <div class="settings-card">
          <div class="settings-card-header">
            <span class="settings-card-icon">📅</span>
            <span class="settings-card-title">Dönem Ayarları</span>
          </div>
          <div class="settings-card-body">
            <div class="settings-row-double">
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
            </div>
            <div class="settings-row-double">
              <div class="settings-row">
                <label class="settings-label">Birim ID</label>
                <input type="text" id="modalBirimId" class="settings-input" placeholder="Birim ID">
              </div>
              <div class="settings-row">
                <label class="settings-label">Nüfus</label>
                <input type="number" id="modalNufus" class="settings-input" placeholder="Nüfus">
              </div>
            </div>
          </div>
        </div>

        <!-- 3. GÖRÜNÜM -->
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

        <!-- 4. VERİ YÖNETİMİ -->
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

// Modal'a mevcut değerleri yükle
async function loadCurrentValues() {
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
  
  // Yazı boyutu - storage'dan al
  const savedFontSize = await new Promise(resolve => 
    chrome.storage.local.get(["userFontSize"], (res) => resolve(res.userFontSize || 16))
  );
  const fontSizeSlider = document.getElementById("modalFontSizeSlider");
  const fontSizeValue = document.getElementById("modalFontSizeValue");
  if (fontSizeSlider) fontSizeSlider.value = parseFloat(savedFontSize).toFixed(1);
  if (fontSizeValue) fontSizeValue.textContent = savedFontSize + "px";
  
  // Dönem ayarları - storage'dan al
  const savedAy = await new Promise(resolve => 
    chrome.storage.local.get(["lastSelectedAy"], (res) => resolve(res.lastSelectedAy || getDomAy()))
  );
  const savedYil = await new Promise(resolve => 
    chrome.storage.local.get(["lastSelectedYil"], (res) => resolve(res.lastSelectedYil || getDomYil()))
  );
  const savedBirimId = await new Promise(resolve => 
    chrome.storage.local.get(["birimId"], (res) => resolve(res.birimId || getDomBirimId()))
  );
  
  const modalAy = document.getElementById("modalAy");
  const modalYil = document.getElementById("modalYil");
  const modalBirimId = document.getElementById("modalBirimId");
  const modalNufus = document.getElementById("modalNufus");
  
  if (modalAy) modalAy.value = savedAy;
  if (modalYil) modalYil.value = savedYil;
  if (modalBirimId) modalBirimId.value = savedBirimId;
  
  // Nüfusu birim ID'ye göre yükle
  if (savedBirimId) {
    const savedNufus = await new Promise(resolve => 
      chrome.storage.local.get([`nufus_${savedBirimId}`], (res) => resolve(res[`nufus_${savedBirimId}`] || ""))
    );
    if (modalNufus) modalNufus.value = savedNufus;
  } else {
    if (modalNufus) modalNufus.value = "";
  }
}

// Değişiklikleri kaydet ve uygula
async function applyChanges() {
  // 1. Kullanıcı tipi
  const selectedUserType = document.querySelector('input[name="userTypeRadio"]:checked')?.value;
  if (selectedUserType && selectedUserType !== getCurrentUserType()) {
    setCurrentUserType(selectedUserType);
    await saveCurrentUserTypeToStorage();
    
    // ✅ UI'ı yenile (global fonksiyon varsa)
    if (typeof window.refreshUIForUserType === 'function') {
      console.log("🔄 Kullanıcı tipi değişti, UI yenileniyor:", selectedUserType);
      window.refreshUIForUserType(selectedUserType);
    } else {
      console.warn("⚠️ refreshUIForUserType bulunamadı, manuel yenileme yapılıyor");
      // Fallback: buton metinlerini manuel güncelle
      const sinaBtn = document.getElementById("btnSina");
      const hypBtn = document.getElementById("btnHyp");
      if (sinaBtn) sinaBtn.textContent = "SİNA";
      if (hypBtn) hypBtn.textContent = selectedUserType === "nurse" ? "SİNA BİRİM" : "HYP";
      
      // Tavan kartı görünürlüğünü güncelle
      const tavanKart = document.getElementById("tavanKatsayi")?.closest(".score-box");
      const nufusRow = document.getElementById("nufus")?.closest(".row");
      if (tavanKart) tavanKart.style.display = selectedUserType === "nurse" ? "none" : "flex";
      if (nufusRow) nufusRow.style.display = selectedUserType === "nurse" ? "none" : "flex";
    }
  }
  
  // 2. Tema
  const activeThemeBtn = document.querySelector(".theme-btn.active");
  const selectedTheme = activeThemeBtn?.dataset.theme || "light";
  applyTheme(selectedTheme);
  await chrome.storage.local.set({ themePreference: selectedTheme }); // ✅ Kaydediyor
  
  // 3. Yazı boyutu
  const fontSizeSlider = document.getElementById("modalFontSizeSlider");
  const newFontSize = parseFloat(fontSizeSlider?.value) || 16;
  document.documentElement.style.fontSize = newFontSize + "px";
  await chrome.storage.local.set({ userFontSize: newFontSize });
  
  // Font toggle'ı aç
  const fontToggleCheckbox = document.getElementById("fontToggleCheckbox");
  if (fontToggleCheckbox && !fontToggleCheckbox.checked) {
    fontToggleCheckbox.checked = true;
    const fontContainer = document.getElementById("fontSettingsContainer");
    if (fontContainer) fontContainer.style.display = "block";
  }
  
  // 4. Dönem ayarları
  const newAy = document.getElementById("modalAy")?.value || getDomAy();
  const newYil = parseInt(document.getElementById("modalYil")?.value) || getDomYil();
  const newBirimId = document.getElementById("modalBirimId")?.value.trim() || "";
  const newNufus = document.getElementById("modalNufus")?.value || "";
  
  let needsReload = false;
  
  // AY ve YIL - storage'a kaydet
  if (newAy !== getDomAy()) {
    const aySelect = document.getElementById("ay");
    if (aySelect) aySelect.value = newAy;
    await chrome.storage.local.set({ lastSelectedAy: newAy });
    needsReload = true;
  }
  
  if (newYil !== getDomYil()) {
    const yilInput = document.getElementById("yil");
    if (yilInput) yilInput.value = newYil;
    await chrome.storage.local.set({ lastSelectedYil: newYil });
    needsReload = true;
  }
  
  // BİRİM ID - storage'a kaydet
  if (newBirimId !== getDomBirimId()) {
    const birimIdInput = document.getElementById("birimId");
    if (birimIdInput) birimIdInput.value = newBirimId;
    setCurrentBirimId(newBirimId);
    await chrome.storage.local.set({ birimId: newBirimId });
    needsReload = true;
  }
  
  // NÜFUS - storage'a kaydet
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
  
  // Verileri yeniden yükle
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
  
  showToast("Ayarlar kaydedildi ✅");
  closeSettingsModal();
}

// Event listener'lar
function bindEvents() {
  const closeBtn = document.getElementById("closeSettingsModalBtn");
  if (closeBtn) closeBtn.addEventListener("click", closeSettingsModal);
  
  const cancelBtn = document.getElementById("settingsCancelBtn");
  if (cancelBtn) cancelBtn.addEventListener("click", closeSettingsModal);
  
  const overlay = document.querySelector(".settings-modal-overlay");
  if (overlay) overlay.addEventListener("click", closeSettingsModal);
  
  const applyBtn = document.getElementById("settingsApplyBtn");
  if (applyBtn) applyBtn.addEventListener("click", applyChanges);
  
  const themeBtns = document.querySelectorAll(".theme-btn");
  themeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      themeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
  
  const fontSizeSlider = document.getElementById("modalFontSizeSlider");
  const fontSizeValue = document.getElementById("modalFontSizeValue");
  if (fontSizeSlider && fontSizeValue) {
    fontSizeSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value).toFixed(1);
      fontSizeValue.textContent = val + "px";
    });
  }
  
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
        const { deleteAllData } = await import('../../../../sidepanel.js');
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
export async function openSettingsModal() {
  if (!modalElement) {
    modalElement = createSettingsModal();
    document.body.appendChild(modalElement);
    bindEvents();
  }
  await loadCurrentValues();
  modalElement.style.display = "flex";
}

// Modal'ı kapat
export function closeSettingsModal() {
  if (modalElement) {
    modalElement.style.display = "none";
  }
}

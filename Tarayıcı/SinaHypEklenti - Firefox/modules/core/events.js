// modules/core/events.js
import { buttons, inputs } from './dom.js';
import { 
  getCurrentUserType, getCurrentBirimId, getCurrentShowAll,
  setCurrentUserType, setCurrentBirimId, setCurrentShowAll,
  setPendingStorageType,
  saveCurrentUserTypeToStorage, saveCurrentBirimIdToStorage,
  loadNurseShowAllForBirim
} from './state.js';
import { buildSinaUrl, HYP_URLS } from '../lib/config.js';
import { saveNufusForBirim, loadNufusForBirim, loadDataForCurrentBirimWithMerge } from './storage.js';
import { tavanHesapla } from '../lib/calculations.js';
import { updateTable, applyTheme } from '../ui/updaters/index.js';
import { applyKvkkVisibility } from '../ui/updaters/kvkk-updater.js';
import { confirmDialog, messageDialog, showChangelog, closeModal, showAboutDialog } from '../ui/components/index.js';
import { getMonthNumber, isDateValid, getCurrentYearMonth } from '../lib/date-utils.js';
import { saveNurseShowAllForBirim } from '../features/nurse/index.js';

// ========== BUTON EVENTLERİ ==========
export function bindSinaButton(setUserTypeFn, getCurrentAy, getCurrentYil, getDomBirimId) {
  const btn = buttons.sina();
  if (!btn) return;
  
  btn.addEventListener("click", async () => {
    const ayStr = getCurrentAy();
    const yil = getCurrentYil();
    const ayNum = getMonthNumber(ayStr);
    const birimId = getDomBirimId();
    
    console.log("🔍 SİNA butonu tıklandı - DOM değerleri:", {
      ay: ayStr,
      yil: yil,
      birimId: birimId
    });
    
    // ✅ ÖNCE KONTROLLERİ YAP
    if (!ayStr || !yil) {
      await messageDialog("Lütfen Ay ve Yıl seçin!", "Uyarı");
      return;
    }
    
    if (!isDateValid(yil, ayNum, true)) {
      const current = getCurrentYearMonth();
      await messageDialog(`SİNA butonu sadece cari dönem ve öncesi, ${current.year} yılı ${current.month+1}. ay ve öncesi için çalışır.`, "Uyarı");
      return;
    }
    
    if (!birimId) {
      await messageDialog("Lütfen Birim ID girin!", "Uyarı");
      return;
    }
    
    // ✅ KONTROLLER GEÇİLDİ, SPINNER'I GÖSTER
    try {
      chrome.runtime.sendMessage({ action: "showSpinner" });
    } catch (e) {
      console.log("Spinner mesajı gönderilemedi (normal, sidepanel kapalı olabilir)");
    }

    let url;
    const userType = getCurrentUserType();
    if (userType === "nurse") {
      url = buildSinaUrl("nurse", ayStr, birimId, yil);
      setPendingStorageType("nurse");
      chrome.storage.local.set({ pendingStorageType: 'nurse' });  // ← EKLE
    } else {
      url = buildSinaUrl("doctor", ayStr, birimId, yil);
    }
    chrome.tabs.create({ url });
  });
}

export function bindHypButton(getCurrentAy, getCurrentYil, getDomBirimId) {
  const btn = buttons.hyp();
  if (!btn) return;
  
  btn.addEventListener("click", async () => {
    const ayStr = getCurrentAy();
    const yil = getCurrentYil();
    const ayNum = getMonthNumber(ayStr);
    const birimId = getDomBirimId();
    
    // ✅ ORTAK KONTROLLER (HER MOD İÇİN)
    if (!ayStr || !yil) {
      await messageDialog("Lütfen Ay ve Yıl seçin!", "Uyarı");
      return;
    }
    
    if (!birimId) {
      await messageDialog("Lütfen Birim ID girin!", "Uyarı");
      return;
    }
    
    let url;
    const userType = getCurrentUserType();
    
    if (userType === "nurse") {
      // ASÇ modu - SİNA BİRİM
      if (!isDateValid(yil, ayNum, true)) {
        const current = getCurrentYearMonth();
        await messageDialog(`SİNA BİRİM butonu sadece cari dönem ve öncesi, ${current.year} yılı ${current.month+1}. ay ve öncesi için çalışır.`, "Uyarı");
        return;
      }
      url = buildSinaUrl("doctor", ayStr, birimId, yil);
      setCurrentShowAll(true);
      saveNurseShowAllForBirim(birimId, true);
      setPendingStorageType("doctor");
      // ✅ DOĞRUDAN STORAGE'A DA YAZ (GARANTİ)
      chrome.storage.local.set({ pendingStorageType: 'doctor' });
    } else {
      // Doktor modu - HYP
      if (!isDateValid(yil, ayNum, false)) {
        const current = getCurrentYearMonth();
        await messageDialog(`HYP butonu sadece cari dönem, ${current.year} yılı ${current.month+1}. ay için çalışır.`, "Uyarı");
        return;
      }
      url = HYP_URLS.DASHBOARD;
    }
    
    // ✅ TÜM KONTROLLER GEÇİLDİ - SPINNER'I GÖSTER
    try {
      chrome.runtime.sendMessage({ action: "showSpinner" });
    } catch (e) {
      console.log("Spinner mesajı gönderilemedi");
    }
    
    chrome.tabs.create({ url });
  });
}

export function bindDeleteDataButton(deleteAllDataFn) {
  const btn = buttons.deleteData();
  if (btn) btn.addEventListener("click", deleteAllDataFn);
}

export function bindExportDataButton() {
  const btn = buttons.exportData();
  if (btn) {
    btn.addEventListener("click", () => {
      const userType = getCurrentUserType();
      const birimId = getCurrentBirimId();
      exportData(userType, birimId);
    });
  }
}

export function bindRevokeConsentButton(revokeConsentFn) {
  const btn = buttons.revokeConsent();
  if (btn) btn.addEventListener("click", revokeConsentFn);
}

export function bindChangelogButton() {
  const btn = buttons.changelog();
  if (btn) btn.addEventListener("click", showChangelog);
}

export function bindAboutButton() {
  const btn = buttons.about();
  if (btn) btn.addEventListener("click", showAboutDialog);
}

export function bindSettingsButton() {
  const btn = buttons.settings();
  const panel = document.getElementById("settingsPanel");
  if (btn && panel) {
    btn.addEventListener("click", () => {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });
  }
}

export function bindToggleKvkkButton() {
  const btn = buttons.toggleKvkk();
  if (btn) {
    btn.addEventListener("click", () => {
      chrome.storage.local.get(["kvkkHidden"], (res) => {
        const newHide = !(res.kvkkHidden === true);
        chrome.storage.local.set({ kvkkHidden: newHide });
        applyKvkkVisibility(newHide);
      });
    });
  }
}

// ========== INPUT EVENTLERİ ==========

export function bindMonthYearChange(reloadDataByMonthFn, aySelect, yilInput) {
  if (aySelect) {
    aySelect.addEventListener("change", () => {
      reloadDataByMonthFn();
    });
  }
  if (yilInput) {
    yilInput.addEventListener("change", () => {
      reloadDataByMonthFn();
    });
  }
}

export function bindUserTypeChange(setUserTypeFn) {
  const select = inputs.userType();
  if (select) {
    select.addEventListener("change", (e) => {
      setUserTypeFn(e.target.value);
    });
  }
}

export function bindThemeChange() {
  const select = inputs.theme();
  if (select) {
    select.addEventListener("change", (e) => {
      const theme = e.target.value;
      applyTheme(theme);
      chrome.storage.local.set({ themePreference: theme });
      
      const birimId = getCurrentBirimId();
      if (birimId) {
        const userType = getCurrentUserType();
        const showAll = getCurrentShowAll();
        if (userType === "nurse") {
          import('./storage.js').then(({ loadDataForCurrentBirimWithMerge }) => {
            loadDataForCurrentBirimWithMerge(updateTable, userType, birimId, undefined, showAll);
          });
        } else {
          const key = `savedResults_${userType}_${birimId}`;
          chrome.storage.local.get([key], (res) => {
            if (res[key]?.data) updateTable(res[key].data, userType, false, birimId);
          });
        }
      }
    });
  }
}

export function bindBirimIdChange(loadNufusForBirimFn, tavanHesaplaFn, updateHypButtonStateFn, aySelect, yilInput) {
  const input = inputs.birimId();
  if (!input) return;
  
  input.addEventListener("change", (e) => {
    const newBirimId = e.target.value.trim();
    import('./state.js').then(({ setCurrentBirimId, saveCurrentBirimIdToStorage, setCurrentShowAll, loadNurseShowAllForBirim, getCurrentUserType }) => {
      setCurrentBirimId(newBirimId);
      saveCurrentBirimIdToStorage();
      chrome.storage.local.set({ birimId: newBirimId });
      
      // Zaman göstergelerini temizle
      import('./dom.js').then(({ setDomHypTime, setDomSinaTime }) => {
        setDomHypTime("");
        setDomSinaTime("");
      });
      
      loadNufusForBirimFn(newBirimId, tavanHesaplaFn);
      
      const currentAy = aySelect?.value || "";
      const currentYil = parseInt(yilInput?.value || "0");
      const userType = getCurrentUserType();
      
      if (userType === "nurse") {
        loadNurseShowAllForBirim(newBirimId).then((showAll) => {
          setCurrentShowAll(showAll);
          import('./storage.js').then(({ loadDataForCurrentBirimWithMerge }) => {
            loadDataForCurrentBirimWithMerge(updateTable, userType, newBirimId, (hasData) => {
              updateHypButtonStateFn(hasData, userType);
            }, showAll, currentAy, currentYil);
          });
        });
      } else {
        setCurrentShowAll(false);
        import('./storage.js').then(({ loadDataForCurrentBirimWithMerge }) => {
          loadDataForCurrentBirimWithMerge(updateTable, userType, newBirimId, (hasData) => {
            updateHypButtonStateFn(hasData, userType);
          }, false, currentAy, currentYil);
        });
      }
    });
  });
}

export function bindNufusChange(reloadDataByMonthFn) {
  const input = inputs.nufus();
  if (!input) return;
  
  input.addEventListener("change", (e) => {
    const val = e.target.value;
    const birimId = getCurrentBirimId();
    if (birimId) saveNufusForBirim(birimId, val);
    tavanHesapla(val);
    reloadDataByMonthFn();
  });
  
  input.addEventListener("input", (e) => tavanHesapla(e.target.value));
}

// ========== MODAL EVENTLERİ ==========
export function bindModalClose() {
  const closeSpan = document.querySelector("#changelogModal .modal-close");
  if (closeSpan) closeSpan.addEventListener("click", closeModal);
  
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("changelogModal");
    if (event.target === modal) closeModal();
  });
}

// ========== KVKK FOOTER EVENTLERİ ==========
export function bindKvkkFooterToggle() {
  const kvkkFooter = document.getElementById("kvkkFooter");
  const toggleFooterBtn = document.getElementById("toggleKvkkFooterBtn");
  
  if (kvkkFooter && toggleFooterBtn) {
    chrome.storage.local.get(["kvkkFooterHidden"], (res) => {
      kvkkFooter.style.display = res.kvkkFooterHidden === true ? "none" : "flex";
    });
    
    toggleFooterBtn.addEventListener("click", async () => {
      const confirmed = await confirmDialog(
        "KVKK bilgilendirme metni gizlenecektir. Tekrar göstermek için ayarlar panelindeki (⚙️) 'KVKK Bilgilendirmelerini Göster' butonunu kullanabilirsiniz.\n\nDevam etmek istiyor musunuz?",
        "Bilgilendirme Metnini Gizle"
      );
      if (!confirmed) return;
      
      kvkkFooter.style.display = "none";
      chrome.storage.local.set({ kvkkFooterHidden: true });
      applyKvkkVisibility(true);
    });
  }
}

// ========== PANEL KAPATMA EVENTLERİ ==========
export function bindPanelCloseOnWheel() {
  document.addEventListener('wheel', (event) => {
    const settingsPanel = document.getElementById('settingsPanel');
    const advancedDiv = document.getElementById('advancedSettings');
    
    chrome.storage.local.get(["closeOnWheelOutside"], (res) => {
      const closeOnWheel = res.closeOnWheelOutside !== false;
      if (closeOnWheel) {
        if (settingsPanel?.style.display === 'block' && !settingsPanel.contains(event.target)) {
          settingsPanel.style.display = 'none';
        }
        if (advancedDiv?.classList.contains('show') && !advancedDiv.contains(event.target)) {
          advancedDiv.classList.remove('show');
          const toggleBtn = document.getElementById('toggleAdvancedBtn');
          if (toggleBtn) toggleBtn.textContent = '🔧 Gelişmiş Ayarlar';
        }
      }
    });
  });
}

export function bindPanelCloseOnClick() {
  document.addEventListener('click', (event) => {
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsBtn = document.getElementById('btnSettings');
    const advancedDiv = document.getElementById('advancedSettings');
    const toggleBtn = document.getElementById('toggleAdvancedBtn');
    
    chrome.storage.local.get(["closeOnClickOutside"], (res) => {
      const closeOnClick = res.closeOnClickOutside !== false;
      if (closeOnClick) {
        if (settingsPanel?.style.display === 'block' && !settingsPanel.contains(event.target) && event.target !== settingsBtn) {
          settingsPanel.style.display = 'none';
        }
        if (advancedDiv?.classList.contains('show') && !advancedDiv.contains(event.target) && event.target !== toggleBtn) {
          advancedDiv.classList.remove('show');
          if (toggleBtn) toggleBtn.textContent = '🔧 Gelişmiş Ayarlar';
        }
      }
    });
  });
}

// ========== TÜM EVENTLERİ TEK SEFERDE BİNDLE ==========
export function bindAllEvents(
  setUserTypeFn, deleteAllDataFn, revokeConsentFn,
  getCurrentAy, getCurrentYil, getDomBirimId,
  reloadDataByMonthFn, loadNufusForBirimFn, tavanHesaplaFn,
  updateHypButtonStateFn, aySelect, yilInput
) {
  bindSinaButton(setUserTypeFn, getCurrentAy, getCurrentYil, getDomBirimId);
  bindHypButton(getCurrentAy, getCurrentYil, getDomBirimId);
  bindDeleteDataButton(deleteAllDataFn);
  bindExportDataButton();
  bindRevokeConsentButton(revokeConsentFn);
  bindChangelogButton();
  bindAboutButton();
  bindSettingsButton();
  bindToggleKvkkButton();
  bindMonthYearChange(reloadDataByMonthFn, aySelect, yilInput);
  bindUserTypeChange(setUserTypeFn);
  bindThemeChange();
  bindBirimIdChange(loadNufusForBirimFn, tavanHesaplaFn, updateHypButtonStateFn, aySelect, yilInput);
  bindNufusChange(reloadDataByMonthFn);
  bindModalClose();
  bindKvkkFooterToggle();
  bindPanelCloseOnWheel();
  bindPanelCloseOnClick();
}

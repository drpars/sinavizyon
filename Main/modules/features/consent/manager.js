// modules/features/consent/manager.js
import { showConsentModal } from '../../ui/components/modal.js';
import { confirmDialog, messageDialog } from '../../ui/components/dialog.js';

export async function requestConsent() {
  const userConfirmed = await showConsentModal();
  await chrome.storage.local.set({ kvkkConsent: userConfirmed }).catch(console.error);
  return userConfirmed;
}

export async function revokeConsent(updateTableFn, setUIEnabledFn) {
  const confirmed = await confirmDialog(
    "Rızanızı geri çekerseniz tüm verileriniz silinecek ve eklenti veri toplamayı durduracaktır. Devam etmek istiyor musunuz?",
    "Rıza Geri Çekme"
  );
  if (!confirmed) return;
  
  chrome.storage.local.remove(["kvkkConsent", "savedResults", "sinaLastTime", "hypLastTime", "nufus", "birimId", "theme"], () => {
    updateTableFn([]);
    document.getElementById("sinaTime").textContent = "";
    document.getElementById("hypTime").textContent = "";
    document.getElementById("nufus").value = "";
    document.getElementById("birimId").value = "";
    
    const hypBtn = document.getElementById("btnHyp");
    if (hypBtn) hypBtn.disabled = true;
    
    setUIEnabledFn(false);
    messageDialog("Rıza geri çekildi ve tüm veriler silindi.", "İşlem Tamam");
  });
}

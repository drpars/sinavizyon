// modules/ui/components/settings-modal.js
// ============================================================
// Ayarlar Modalı - Ana Entry Point
// ============================================================
// Bu dosya, ayarlar modalı için dışa açılan ana arayüzdür.
// İç implementasyon modal/settings.js içindedir.
import { closeSettingsModal as closeModal, openSettingsModal as openModal } from "./modal/settings.js";

// Ana fonksiyonları export et
export const openSettingsModal = openModal;
export const closeSettingsModal = closeModal;

// İleride eklenecek ek fonksiyonlar için placeholder
export async function loadCurrentSettingsToModal() {
  // Bu fonksiyon modal/settings.js içindeki loadCurrentValues
  // ile aynı işlevi görür. Gerekirse buradan da çağrılabilir.
  console.warn("loadCurrentSettingsToModal: Bu fonksiyon henüz implemente edilmedi.");
}

export async function applySettings() {
  // Bu fonksiyon modal/settings.js içindeki applyChanges
  // ile aynı işlevi görür.
  console.warn("applySettings: Bu fonksiyon henüz implemente edilmedi.");
}

export function bindModalButtons() {
  console.warn("bindModalButtons: Bu fonksiyon henüz implemente edilmedi.");
}

export function bindThemeButtons() {
  console.warn("bindThemeButtons: Bu fonksiyon henüz implemente edilmedi.");
}

// ============================================================
// NOT: Bu dosya geçiş amaçlıdır.
// Doğrudan kullanım için './modal/settings.js' import edilmelidir.
// ============================================================

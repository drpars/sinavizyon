// modules/ui/components/index.js
export { confirmDialog, messageDialog } from './dialog.js';

// Modal'ları yeni yapıdan export et
export {
  showFirstTimeUserTypeModal,
  showAboutDialog,
  showChangelog,
  closeModal,
  showConsentModal,
  requestConsent,
  showWhatsNewModal,
  openSettingsModal,
  closeSettingsModal
} from './modal/index.js';

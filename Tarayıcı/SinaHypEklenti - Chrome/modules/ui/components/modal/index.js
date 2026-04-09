// modules/ui/components/modal/index.js
// ============================================================
// Modal Yönetimi - Ana Entry Point
// ============================================================

// First-time modal
export { showFirstTimeUserTypeModal } from './first-time.js';

// About modal
export { showAboutDialog } from './about.js';

// Changelog modal
export { showChangelog, closeModal } from './changelog.js';

// Consent modal
export { showConsentModal, requestConsent } from './consent.js';

// Whatsnew modal
export { showWhatsNewModal } from './whatsnew.js';

// Settings modal
export { openSettingsModal, closeSettingsModal } from './settings.js';

// Tüm modal'ların tek bir yerden yönetimi
import { showFirstTimeModal } from './first-time.js';
import { showAboutModal } from './about.js';
import { showChangelogModal } from './changelog.js';
import { showConsentModal } from './consent.js';
import { showWhatsNewModal } from './whatsnew.js';
import { showSettingsModal, closeSettingsModal, applySettings } from './settings.js';

export const modalManager = {
  firstTime: showFirstTimeModal,
  about: showAboutModal,
  changelog: showChangelogModal,
  consent: showConsentModal,
  whatsnew: showWhatsNewModal,
  settings: {
    open: showSettingsModal,
    close: closeSettingsModal,
    apply: applySettings
  }
};

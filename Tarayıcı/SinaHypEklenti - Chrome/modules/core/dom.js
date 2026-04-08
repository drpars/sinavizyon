// modules/dom-elements.js (DÜZELTİLMİŞ VERSİYON)
// ============================================================
// Tüm DOM element referansları buradan yönetilir
// ============================================================

// ---------- BUTONLAR ----------
export const buttons = {
  sina: () => document.getElementById("btnSina"),
  hyp: () => document.getElementById("btnHyp"),
  settings: () => document.getElementById("btnSettings"),
  about: () => document.getElementById("btnAbout"),
  deleteData: () => document.getElementById("btnDeleteData"),
  exportData: () => document.getElementById("btnExportData"),
  revokeConsent: () => document.getElementById("btnRevokeConsent"),
  changelog: () => document.getElementById("btnChangelog"),
  toggleKvkk: () => document.getElementById("btnToggleKvkk"),
  toggleKvkkFooter: () => document.getElementById("toggleKvkkFooterBtn"),
  toggleAdvanced: () => document.getElementById("toggleAdvancedBtn"),
};

// ---------- INPUTLAR & SELECTLER ----------
export const inputs = {
  birimId: () => document.getElementById("birimId"),
  nufus: () => document.getElementById("nufus"),
  yil: () => document.getElementById("yil"),
  ay: () => document.getElementById("ay"),
  userType: () => document.getElementById("userTypeSelect"),
  theme: () => document.getElementById("themeSelect"),
  fontSizeSlider: () => document.getElementById("fontSizeSlider"),
  fontToggle: () => document.getElementById("fontToggleCheckbox"),
};

// ---------- TABLO & KONTEYNERLER ----------
export const containers = {
  tableBody: () => document.getElementById("tableBody"),
  tableContainer: () => document.querySelector(".table-container"),
  settingsPanel: () => document.getElementById("settingsPanel"),
  advancedSettings: () => document.getElementById("advancedSettings"),
  fontSettingsContainer: () => document.getElementById("fontSettingsContainer"),
};

// ---------- BİLGİ / DURUM ELEMENTLERİ ----------
export const infoElements = {
  versionBadge: () => document.getElementById("versionBadge"),
  sinaTime: () => document.getElementById("sinaTime"),
  hypTime: () => document.getElementById("hypTime"),
  totalKatsayi: () => document.getElementById("totalKatsayi"),
  tavanKatsayi: () => document.getElementById("tavanKatsayi"),
  khtPercentage: () => document.getElementById("khtPercentage"),
  khtBarFill: () => document.getElementById("khtBarFill"),
  khtDurum: () => document.getElementById("khtDurum"),
  consentWarning: () => document.getElementById("consentWarning"),
  kvkkFooter: () => document.getElementById("kvkkFooter"),
  kvkkSettingsNote: () => document.getElementById("kvkkSettingsNote"),
  fontSizeValue: () => document.getElementById("fontSizeValue"),
};

// ---------- MODAL ELEMENTLERİ ----------
export const modals = {
  changelog: () => document.getElementById("changelogModal"),
  changelogContent: () => document.getElementById("changelogContent"),
  changelogClose: () => document.querySelector("#changelogModal .modal-close"),
  consent: () => document.getElementById("consentModal"),
  consentAccept: () => document.getElementById("consentAcceptBtn"),
  consentReject: () => document.getElementById("consentRejectBtn"),
};

// ---------- KHT BAR MARKALARI ----------
export const khtMarks = () => document.querySelectorAll('.kht-bar-marks span');

// ---------- YARDIMCI FONKSİYONLAR (ÇAKIŞMAYAN İSİMLER) ----------
export function getDomBirimId() {
  const input = inputs.birimId();
  return input?.value?.trim() || "";
}

export function getDomUserType() {
  const select = inputs.userType();
  return select?.value || "doctor";
}

export function getDomAy() {
  const select = inputs.ay();
  return select?.value || "";
}

export function getDomYil() {
  const input = inputs.yil();
  return parseInt(input?.value || "0");
}

export function getDomNufus() {
  const input = inputs.nufus();
  return input?.value || "";
}

export function setDomNufus(value) {
  const input = inputs.nufus();
  if (input) input.value = value;
}

export function setDomBirimId(value) {
  const input = inputs.birimId();
  if (input) input.value = value;
}

export function setDomSinaTime(text) {
  const el = infoElements.sinaTime();
  if (el) el.textContent = text;
}

export function setDomHypTime(text) {
  const el = infoElements.hypTime();
  if (el) el.textContent = text;
}

export function setDomTotalKatsayi(value, color = null) {
  const el = infoElements.totalKatsayi();
  if (el) {
    el.textContent = typeof value === "number" ? value.toFixed(5) : value;
    if (color) el.style.color = color;
  }
}

export function setDomTavanKatsayi(value) {
  const el = infoElements.tavanKatsayi();
  if (el) el.textContent = typeof value === "number" ? value.toFixed(5) : value;
}

export function setDomKhtPercentage(percent) {
  const el = infoElements.khtPercentage();
  if (el) el.textContent = `${percent}%`;
}

export function setDomKhtBarWidth(percent) {
  const el = infoElements.khtBarFill();
  if (el) el.style.width = `${percent}%`;
}

export function setDomKhtDurum(text, color) {
  const el = infoElements.khtDurum();
  if (el) {
    el.textContent = text;
    if (color) el.style.color = color;
  }
}

export function clearDomTableBody() {
  const tbody = containers.tableBody();
  if (tbody) tbody.innerHTML = "";
}

export function showDomSettingsPanel(show) {
  const panel = containers.settingsPanel();
  if (panel) panel.style.display = show ? "block" : "none";
}

export function toggleDomSettingsPanel() {
  const panel = containers.settingsPanel();
  if (panel) panel.style.display = panel.style.display === "block" ? "none" : "block";
}

export function showDomAdvancedSettings(show) {
  const div = containers.advancedSettings();
  if (div) {
    if (show) div.classList.add("show");
    else div.classList.remove("show");
  }
}

export function toggleDomAdvancedSettings() {
  const div = containers.advancedSettings();
  const btn = buttons.toggleAdvanced();
  if (div) {
    const isShow = div.classList.contains("show");
    if (isShow) {
      div.classList.remove("show");
      if (btn) btn.textContent = "🔧 Gelişmiş Ayarlar";
    } else {
      div.classList.add("show");
      if (btn) btn.textContent = "🔧 Gelişmiş Ayarları Gizle";
    }
  }
}

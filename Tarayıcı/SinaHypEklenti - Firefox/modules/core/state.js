// modules/core/state.js
// ============================================================
// Merkezi State Yönetimi
// ============================================================

// ---------- STATE DEĞİŞKENLERİ ----------
let currentUserType = "doctor";
let currentBirimId = "";
let currentShowAll = false;
let pendingStorageType = "nurse";
let pendingShowAll = false;
let fontSettingsActive = false;

// ---------- STATE LISTENER'LAR ----------
const listeners = [];

// ---------- STORAGE BATCH QUEUE ----------
let storageBatchQueue = [];
let storageBatchTimeout = null;

function batchSetStorage(items) {
  storageBatchQueue.push(items);
  
  if (storageBatchTimeout) clearTimeout(storageBatchTimeout);
  
  storageBatchTimeout = setTimeout(() => {
    if (storageBatchQueue.length === 0) return;
    
    const merged = {};
    for (const items of storageBatchQueue) {
      Object.assign(merged, items);
    }
    
    chrome.storage.local.set(merged).catch(console.error);
    storageBatchQueue = [];
    storageBatchTimeout = null;
  }, 100);
}

// ---------- STATE GETTERS ----------
export function getCurrentUserType() {
  return currentUserType;
}

export function getCurrentBirimId() {
  return currentBirimId;
}

export function getCurrentShowAll() {
  return currentShowAll;
}

export function getPendingStorageType() {
  return pendingStorageType;
}

export function getPendingShowAll() {
  return pendingShowAll;
}

export function getFontSettingsActive() {
  return fontSettingsActive;
}

// ---------- STATE SETTERS ----------
export function setCurrentUserType(type, silent = false) {
  currentUserType = type;
  if (!silent) notifyListeners();
}

export function setCurrentBirimId(birimId, silent = false) {
  currentBirimId = birimId;
  if (!silent) notifyListeners();
}

export function setCurrentShowAll(showAll, silent = false) {
  currentShowAll = showAll;
  if (!silent) notifyListeners();
}

export function setPendingStorageType(type, silent = false) {
  pendingStorageType = type;
  if (!silent) notifyListeners();
}

export function setPendingShowAll(showAll, silent = false) {
  pendingShowAll = showAll;
  if (!silent) notifyListeners();
}

export function setFontSettingsActive(active, silent = false) {
  fontSettingsActive = active;
  if (!silent) notifyListeners();
}

// ---------- TOPLU STATE GÜNCELLEME ----------
export function updateState(newState, silent = false) {
  if (newState.currentUserType !== undefined) currentUserType = newState.currentUserType;
  if (newState.currentBirimId !== undefined) currentBirimId = newState.currentBirimId;
  if (newState.currentShowAll !== undefined) currentShowAll = newState.currentShowAll;
  if (newState.pendingStorageType !== undefined) pendingStorageType = newState.pendingStorageType;
  if (newState.pendingShowAll !== undefined) pendingShowAll = newState.pendingShowAll;
  if (newState.fontSettingsActive !== undefined) fontSettingsActive = newState.fontSettingsActive;
  
  if (!silent) notifyListeners();
}

// ---------- STATE RESET ----------
export function resetState() {
  currentUserType = "doctor";
  currentBirimId = "";
  currentShowAll = false;
  pendingStorageType = "nurse";
  pendingShowAll = false;
  fontSettingsActive = false;
  notifyListeners();
}

// ---------- STATE LISTENER SİSTEMİ ----------
export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
}

function notifyListeners() {
  const state = {
    currentUserType,
    currentBirimId,
    currentShowAll,
    pendingStorageType,
    pendingShowAll,
    fontSettingsActive
  };
  listeners.forEach(listener => listener(state));
}

// ---------- STORAGE'DAN STATE YÜKLEME ----------
export async function loadStateFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["userType", "birimId", "fontSettingsActive"], (res) => {
      if (res.userType) currentUserType = res.userType;
      if (res.birimId) currentBirimId = res.birimId;
      if (res.fontSettingsActive !== undefined) fontSettingsActive = res.fontSettingsActive;
      resolve({
        currentUserType,
        currentBirimId,
        fontSettingsActive
      });
    });
  });
}

// ---------- STATE'İ STORAGE'A KAYDETME (BATCH'Lİ) ----------
export function saveCurrentUserTypeToStorage() {
  batchSetStorage({ userType: currentUserType });
}

export function saveCurrentBirimIdToStorage() {
  batchSetStorage({ birimId: currentBirimId });
}

export function saveFontSettingsActiveToStorage() {
  batchSetStorage({ fontSettingsActive });
}

// ---------- BİRİM BAZLI SHOWALL YÖNETİMİ ----------
export async function loadNurseShowAllForBirim(birimId) {
  return new Promise((resolve) => {
    if (!birimId) {
      currentShowAll = false;
      resolve(false);
      return;
    }
    chrome.storage.local.get([`nurseShowAll_${birimId}`], (res) => {
      const showAll = res[`nurseShowAll_${birimId}`] === true;
      currentShowAll = showAll;
      resolve(showAll);
    });
  });
}

export function saveNurseShowAllForBirim(birimId, showAll) {
  if (!birimId) return;
  currentShowAll = showAll;
  batchSetStorage({ [`nurseShowAll_${birimId}`]: showAll });
}

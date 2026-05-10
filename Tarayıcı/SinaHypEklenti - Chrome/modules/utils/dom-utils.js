// modules/utils/dom-utils.js
// Merkezi DOM yardımcı fonksiyonları

export function safeGetElement(id) {
  return document.getElementById(id);
}

export function setInputValue(id, value) {
  const el = safeGetElement(id);
  if (el) el.value = value;
}

export function getInputValue(id, defaultValue = "") {
  const el = safeGetElement(id);
  return el?.value || defaultValue;
}

export function setElementText(id, text) {
  const el = safeGetElement(id);
  if (el) el.textContent = text;
}

export function getElementText(id, defaultValue = "") {
  const el = safeGetElement(id);
  return el?.textContent || defaultValue;
}

export function showElement(id) {
  const el = safeGetElement(id);
  if (el) el.style.display = "block";
}

export function hideElement(id) {
  const el = safeGetElement(id);
  if (el) el.style.display = "none";
}

export function toggleElement(id) {
  const el = safeGetElement(id);
  if (el) el.style.display = el.style.display === "none" ? "block" : "none";
}

export function addClass(id, className) {
  const el = safeGetElement(id);
  if (el) el.classList.add(className);
}

export function removeClass(id, className) {
  const el = safeGetElement(id);
  if (el) el.classList.remove(className);
}

export function hasClass(id, className) {
  const el = safeGetElement(id);
  return el ? el.classList.contains(className) : false;
}

/**
 * Bir URL'yi tek sekmede açar. URL zaten açıksa o sekmeyi aktif edip yeniler,
 * açık değilse yeni sekme oluşturur.
 *
 * @param {string} url - Açılacak URL (tam veya extension URL'si)
 * @param {boolean} [reload=true] - Mevcut sekmeyi yenile
 */
export function createOrFocusTab(url, reload = true) {
  chrome.tabs.query({ url: url }, (tabs) => {
    if (tabs.length > 0) {
      // Mevcut sekmeyi aktif et
      const tab = tabs[0];
      chrome.tabs.update(tab.id, { active: true });
      if (reload) {
        chrome.tabs.reload(tab.id);
      }
    } else {
      // Yeni sekme aç
      chrome.tabs.create({ url: url });
    }
  });
}

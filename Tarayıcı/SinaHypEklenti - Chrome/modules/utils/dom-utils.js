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
  // URL'den path kısmını al (query/hash hariç) - extension URL'leri için
  const urlObj = new URL(url);
  const pathOnly = urlObj.origin + urlObj.pathname;

  chrome.tabs.query({}, (allTabs) => {
    // Aynı path'e sahip açık bir sekme var mı?
    const existingTab = allTabs.find((tab) => {
      try {
        const tabUrl = new URL(tab.url || "");
        return tabUrl.origin === urlObj.origin && tabUrl.pathname === urlObj.pathname;
      } catch {
        return false;
      }
    });

    if (existingTab) {
      // Mevcut sekmeyi aktif et
      chrome.tabs.update(existingTab.id, { active: true });
      if (reload) {
        chrome.tabs.reload(existingTab.id);
      }
    } else {
      // Yeni sekme aç
      chrome.tabs.create({ url: url });
    }
  });
}

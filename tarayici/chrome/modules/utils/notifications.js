// modules/utils/notifications.js
// Bildirim sistemi (toast, alert, banner) - v2.0.4

let activeToast = null;
let toastTimeout = null;

function createToastElement(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = "toast-notification";

  let icon = "✅";
  if (type === "error") {
    icon = "❌";
    toast.classList.add("toast-error");
  } else if (type === "warning") {
    icon = "⚠️";
    toast.classList.add("toast-warning");
  }

  // ✅ innerHTML yerine güvenli DOM manipülasyonu
  const iconSpan = document.createElement("span");
  iconSpan.className = "toast-icon";
  iconSpan.textContent = icon;

  const messageSpan = document.createElement("span");
  messageSpan.className = "toast-message";
  messageSpan.textContent = message;

  toast.appendChild(iconSpan);
  toast.appendChild(messageSpan);

  return toast;
}

function clearActiveToast() {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  if (activeToast && activeToast.parentNode) {
    activeToast.classList.remove("show");
    setTimeout(() => {
      if (activeToast && activeToast.parentNode) {
        activeToast.parentNode.removeChild(activeToast);
      }
      activeToast = null;
    }, 200);
  } else {
    activeToast = null;
  }
}

export function showToast(message, duration = 2500) {
  clearActiveToast();

  const toast = createToastElement(message);
  document.body.appendChild(toast);
  activeToast = toast;

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  toastTimeout = setTimeout(() => {
    if (activeToast === toast) {
      toast.classList.remove("show");
      toastTimeout = setTimeout(() => {
        if (toast.parentNode) toast.remove();
        if (activeToast === toast) activeToast = null;
        toastTimeout = null;
      }, 200);
    }
  }, duration);
}

/**
 * Yeni özellik işaretçisi: Badge + pulse glow.
 * featureId bazlı storage'da "görüldü" işareti tutar.
 * Kullanıcı tıkladığında veya expireVersion aşılınca kaybolur.
 *
 * @param {HTMLElement} element - Hedef buton/öğe
 * @param {string} featureId - Benzersiz özellik ID'si (örn. "dashboard-btn")
 * @param {string} expireVersion - Hangi sürümden sonra gösterilmeyecek (örn. "2.2.5")
 */
export function markNewFeature(element, featureId, expireVersion) {
  if (!element || !featureId) return;

  const storageKey = `newFeature_${featureId}`;

  chrome.storage.local.get([storageKey], (res) => {
    // Daha önce görüldüyse hiç gösterme
    if (res[storageKey] === true) return;

    // Sürüm kontrolü: mevcut sürüm > expireVersion ise gösterme
    const manifest = chrome.runtime.getManifest();
    const currentVer = manifest.version;
    if (compareVersions(currentVer, expireVersion) > 0) return;

    // Element'i wrapper içine al
    const wrapper = document.createElement("span");
    wrapper.className = "new-feature-wrapper";
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);

    // Badge ekle
    const badge = document.createElement("span");
    badge.className = "new-feature-badge";
    badge.textContent = "YENİ";
    wrapper.appendChild(badge);

    // İlk 3 pulse glow animasyonu
    element.classList.add("new-feature-glow");
    element.addEventListener(
      "animationend",
      () => {
        element.classList.remove("new-feature-glow");
      },
      { once: true }
    );

    // Kullanıcı tıklayınca badge'i kaldır ve görüldü olarak işaretle
    const dismiss = () => {
      if (badge.parentNode) badge.remove();
      element.classList.remove("new-feature-glow");
      chrome.storage.local.set({ [storageKey]: true });
      element.removeEventListener("click", dismiss);
    };

    element.addEventListener("click", dismiss);
  });
}

/**
 * Semantik sürüm karşılaştırma: a > b → 1, a < b → -1, eşit → 0
 */
function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

export function showErrorToast(message, duration = 3500) {
  clearActiveToast();

  const toast = createToastElement(message, "error");
  document.body.appendChild(toast);
  activeToast = toast;

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  toastTimeout = setTimeout(() => {
    if (activeToast === toast) {
      toast.classList.remove("show");
      toastTimeout = setTimeout(() => {
        if (toast.parentNode) toast.remove();
        if (activeToast === toast) activeToast = null;
        toastTimeout = null;
      }, 200);
    }
  }, duration);
}

export function showWarningToast(message, duration = 3500) {
  clearActiveToast();

  const toast = createToastElement(message, "warning");
  document.body.appendChild(toast);
  activeToast = toast;

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  toastTimeout = setTimeout(() => {
    if (activeToast === toast) {
      toast.classList.remove("show");
      toastTimeout = setTimeout(() => {
        if (toast.parentNode) toast.remove();
        if (activeToast === toast) activeToast = null;
        toastTimeout = null;
      }, 200);
    }
  }, duration);
}

// modules/utils/notifications.js
// Bildirim sistemi (toast, alert, banner) - v2.0.3

let activeToast = null;
let toastTimeout = null;

function createToastElement(message, type = 'success') {
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  
  let icon = '✅';
  if (type === 'error') {
    icon = '❌';
    toast.classList.add('toast-error');
  } else if (type === 'warning') {
    icon = '⚠️';
    toast.classList.add('toast-warning');
  }
  
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;
  return toast;
}

function clearActiveToast() {
  // Mevcut timeout'u temizle
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
  
  // Aktif toast'ı kaldır
  if (activeToast && activeToast.parentNode) {
    activeToast.classList.remove('show');
    setTimeout(() => {
      if (activeToast && activeToast.parentNode) {
        activeToast.parentNode.removeChild(activeToast);
      }
      activeToast = null;
    }, 200); // CSS transition süresi
  } else {
    activeToast = null;
  }
}

export function showToast(message, duration = 2500) {
  // Eski toast'ı temizle
  clearActiveToast();
  
  // Yeni toast oluştur
  const toast = createToastElement(message);
  document.body.appendChild(toast);
  activeToast = toast;
  
  // Göster (requestAnimationFrame ile smooth animasyon)
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  // Belirtilen süre sonra kaldır
  toastTimeout = setTimeout(() => {
    if (activeToast === toast) {
      toast.classList.remove('show');
      toastTimeout = setTimeout(() => {
        if (toast.parentNode) toast.remove();
        if (activeToast === toast) activeToast = null;
        toastTimeout = null;
      }, 200);
    }
  }, duration);
}

export function showErrorToast(message, duration = 3500) {
  clearActiveToast();
  
  const toast = createToastElement(message, 'error');
  document.body.appendChild(toast);
  activeToast = toast;
  
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  toastTimeout = setTimeout(() => {
    if (activeToast === toast) {
      toast.classList.remove('show');
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
  
  const toast = createToastElement(message, 'warning');
  document.body.appendChild(toast);
  activeToast = toast;
  
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  toastTimeout = setTimeout(() => {
    if (activeToast === toast) {
      toast.classList.remove('show');
      toastTimeout = setTimeout(() => {
        if (toast.parentNode) toast.remove();
        if (activeToast === toast) activeToast = null;
        toastTimeout = null;
      }, 200);
    }
  }, duration);
}

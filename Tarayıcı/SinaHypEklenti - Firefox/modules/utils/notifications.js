// modules/utils/notifications.js
// Bildirim sistemi (toast, alert, banner)

let activeToast = null;

function createToastElement(message) {
  const toast = document.createElement("div");
  toast.className = "toast-notification";
    toast.innerHTML = `
    <span class="toast-icon">✅</span>
    <span class="toast-message">${message}</span>
  `;
  return toast;
}

function animateToast(toast, duration) {
  setTimeout(() => toast.classList.add("show"), 10);
  
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
      if (activeToast === toast) activeToast = null;
    }, 300);
  }, duration);
}

export function showToast(message, duration = 3000) {
  // Eski toast varsa kaldır
  if (activeToast && activeToast.parentNode) {
    activeToast.classList.remove("show");
    setTimeout(() => {
      if (activeToast && activeToast.parentNode) {
        activeToast.parentNode.removeChild(activeToast);
      }
      activeToast = null;
      showToast(message, duration);
    }, 300);
    return;
  }
  
  const toast = createToastElement(message);
  document.body.appendChild(toast);
  activeToast = toast;
  animateToast(toast, duration);
}

export function showErrorToast(message, duration = 4000) {
  const toast = document.createElement("div");
  toast.className = "toast-notification toast-error";
  toast.innerHTML = `
    <span class="toast-icon">❌</span>
    <span class="toast-message">${message}</span>
  `;
  document.body.appendChild(toast);
  activeToast = toast;
  
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function showWarningToast(message, duration = 3500) {
  const toast = document.createElement("div");
  toast.className = "toast-notification toast-warning";
  toast.innerHTML = `
    <span class="toast-icon">⚠️</span>
    <span class="toast-message">${message}</span>
  `;
  document.body.appendChild(toast);
  activeToast = toast;
  
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

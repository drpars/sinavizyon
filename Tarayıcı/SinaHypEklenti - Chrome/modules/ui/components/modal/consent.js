// modules/ui/components/modal/consent.js
// ============================================================
// KVKK Rıza Modalı
// ============================================================

export function showConsentModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById("consentModal");
    const acceptBtn = document.getElementById("consentAcceptBtn");
    const rejectBtn = document.getElementById("consentRejectBtn");

    if (!modal || !acceptBtn || !rejectBtn) {
      const userConfirmed = confirm(
        "🔒 KVKK Aydınlatma ve Rıza\n\n" +
          "Bu eklenti, SİNA ve HYP sistemlerinden aldığınız performans verilerini yerel olarak saklar.\n\n" +
          "✓ Verileriniz yalnızca sizin cihazınızda tutulur\n" +
          "✓ Hiçbir sunucuya gönderilmez\n" +
          "✓ İstediğiniz zaman silebilir veya dışa aktarabilirsiniz\n" +
          "✓ Veriler 90 gün sonra otomatik silinir\n\n" +
          "Bu koşulları kabul ediyor musunuz?"
      );
      resolve(userConfirmed);
      return;
    }

    modal.style.display = "flex";

    const onAccept = () => {
      modal.style.display = "none";
      cleanup();
      resolve(true);
    };
    const onReject = () => {
      modal.style.display = "none";
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      acceptBtn.removeEventListener("click", onAccept);
      rejectBtn.removeEventListener("click", onReject);
    };
    acceptBtn.addEventListener("click", onAccept);
    rejectBtn.addEventListener("click", onReject);
  });
}

export async function requestConsent() {
  const userConfirmed = await showConsentModal();
  await chrome.storage.local.set({ kvkkConsent: userConfirmed }).catch(console.error);
  return userConfirmed;
}

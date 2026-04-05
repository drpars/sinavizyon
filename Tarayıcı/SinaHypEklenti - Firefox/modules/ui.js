// modules/ui.js
import { buildDoctorTable, buildNurseTable, createTableRow } from './ui-table.js';
import { updateKHTBar, applyTheme, applyKvkkVisibility, setUIEnabled } from './ui-helpers.js';

export { applyTheme, applyKvkkVisibility, setUIEnabled };

export function updateTable(data, userType = "doctor", showAll = false, birimId = "") {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  // ASÇ modu
  if (userType === "nurse") {
    if (!data || data.length === 0) return;
    const { asçBasari, asçItems, doctorItems } = buildNurseTable(data, showAll, updateKHTBar);
    const katsayiElement = document.getElementById("totalKatsayi");
    katsayiElement.textContent = asçBasari.toFixed(5);
    
    // ASÇ TAVAN KATSAYISI = DOKTOR BAŞARI KATSAYISI
    if (birimId) {
      const doctorKey = `savedResults_doctor_${birimId}`;
      chrome.storage.local.get([doctorKey], (res) => {
        const doctorData = res[doctorKey]?.data || [];
        if (doctorData.length > 0) {
          let doctorToplam = 1.0;
          const surecCarpan = parseFloat(document.getElementById("surecYonetimi")?.value) || 1.03;
          doctorData.forEach(item => {
            const ger = parseFloat(item.gereken) || 0;
            const yap = parseFloat(item.yapilan) || 0;
            const dev = parseFloat(item.devreden) || 0;
            doctorToplam *= katsayiHesapla(item.ad, ger, yap, dev, "doctor");
          });
          const doctorBasari = doctorToplam * surecCarpan;
          const tavanElement = document.getElementById("tavanKatsayi");
          tavanElement.textContent = doctorBasari.toFixed(5);
          // renk karşılaştırması
          const kosul1 = asçBasari >= 1.0;
          const kosul2 = asçBasari >= (doctorBasari * 0.75);
          katsayiElement.style.color = (kosul1 && kosul2) ? "var(--green)" : "var(--red)";
        } else {
          const tavanElement = document.getElementById("tavanKatsayi");
          tavanElement.textContent = "1.00000";
          const kosul1 = asçBasari >= 1.0;
          const kosul2 = asçBasari >= 0.75;
          katsayiElement.style.color = (kosul1 && kosul2) ? "var(--green)" : "var(--red)";
        }
      });
    } else {
      const tavanElement = document.getElementById("tavanKatsayi");
      tavanElement.textContent = "1.00000";
      const kosul1 = asçBasari >= 1.0;
      const kosul2 = asçBasari >= 0.75;
      katsayiElement.style.color = (kosul1 && kosul2) ? "var(--green)" : "var(--red)";
    }
    return;
  }
  
  // Doktor modu
  const surecCarpan = parseFloat(document.getElementById("surecYonetimi")?.value) || 1.03;
  const finalSonuc = buildDoctorTable(data, surecCarpan, updateKHTBar);
  const katsayiElement = document.getElementById("totalKatsayi");
  const tavanElement = document.getElementById("tavanKatsayi");
  if (katsayiElement && tavanElement) {
    katsayiElement.textContent = finalSonuc.toFixed(5);
    const tavanDeger = parseFloat(tavanElement.textContent) || 0;
    katsayiElement.style.color = (finalSonuc >= tavanDeger) ? "var(--green)" : "var(--red)";
  }
}

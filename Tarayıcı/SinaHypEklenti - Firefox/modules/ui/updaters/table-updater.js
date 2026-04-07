// modules/ui/updaters/table-updater.js
import { buildDoctorTable, buildNurseTable } from '../table/index.js';
import { updateKHTBar } from './kht-updater.js';
import { calculateDoctorKatsayi } from '../../features/doctor/calculator.js';

export function updateTable(data, userType = "doctor", showAll = false, birimId = "") {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  // ASÇ modu
  if (userType === "nurse") {
    if (!data || data.length === 0) {
      const tbody = document.getElementById("tableBody");
      if (tbody) tbody.innerHTML = "";
      const katsayiElement = document.getElementById("totalKatsayi");
      if (katsayiElement) katsayiElement.textContent = "1.00000";
      updateKHTBar([], userType);
      return;
    }
    
    const { asçBasari } = buildNurseTable(data, showAll, updateKHTBar);
    const katsayiElement = document.getElementById("totalKatsayi");
    katsayiElement.textContent = asçBasari.toFixed(5);
    
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
            doctorToplam *= calculateDoctorKatsayi(item.ad, ger, yap, dev);
          });
          const doctorBasari = doctorToplam * surecCarpan;
          const tavanElement = document.getElementById("tavanKatsayi");
          tavanElement.textContent = doctorBasari.toFixed(5);
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
  if (!data || data.length === 0) {
    const tbody = document.getElementById("tableBody");
    if (tbody) tbody.innerHTML = "";
    const katsayiElement = document.getElementById("totalKatsayi");
    if (katsayiElement) katsayiElement.textContent = "1.03000";
    updateKHTBar([], userType);
    return;
  }
  
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

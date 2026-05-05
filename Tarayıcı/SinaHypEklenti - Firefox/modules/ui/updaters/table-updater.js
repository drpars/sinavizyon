// modules/ui/updaters/table-updater.js
import { updateKHTBar } from "./kht-updater.js";

import { calculateDoctorKatsayi } from "../../features/doctor/calculator.js";
import { getSurecKatsayisi, SUREC_KATSAYISI } from "../../lib/constants.js";
import { buildDoctorTable, buildNurseTable } from "../table/index.js";

export function updateTable(data, userType = "doctor", showAll = false, birimId = "", ay = null, yil = null) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  console.log("📊 updateTable çağrıldı:", { userType, showAll, dataLength: data?.length, birimId, ay, yil });

  // ASÇ modu
  if (userType === "nurse") {
    if (!data || data.length === 0) {
      const katsayiElement = document.getElementById("totalKatsayi");
      if (katsayiElement) katsayiElement.textContent = "1.00000";
      updateKHTBar([], userType);
      return;
    }

    const { asçBasari } = buildNurseTable(data, showAll, updateKHTBar, ay, yil);
    const katsayiElement = document.getElementById("totalKatsayi");
    katsayiElement.textContent = asçBasari.toFixed(5);

    if (birimId) {
      const doctorKey = `savedResults_doctor_${birimId}`;
      chrome.storage.local.get([doctorKey], (res) => {
        const doctorData = res[doctorKey]?.data || [];
        let doctorBasari = 1.0;
        let hasDoctorData = false;

        if (doctorData.length > 0) {
          hasDoctorData = true;
          let doctorToplam = 1.0;
          doctorData.forEach((item) => {
            const ger = parseFloat(item.gereken) || 0;
            const yap = parseFloat(item.yapilan) || 0;
            const dev = parseFloat(item.devreden) || 0;
            doctorToplam *= calculateDoctorKatsayi(item.ad, ger, yap, dev);
          });
          doctorBasari = doctorToplam * getSurecKatsayisi(ay, yil);
        }

        const nufusKey = `nufus_${birimId}`;
        chrome.storage.local.get([nufusKey], (nufusRes) => {
          const nufus = parseFloat(nufusRes[nufusKey]) || 0;
          let doktorTavan = 1.0;
          if (nufus > 0) {
            doktorTavan = Math.min(1.5, Math.max(1.0, 4000 / nufus));
          }

          const tavanElement = document.getElementById("tavanKatsayi");
          const kosul1 = asçBasari >= 1.0;
          const kosul2 = hasDoctorData ? asçBasari >= doctorBasari * 0.75 : asçBasari >= 0.75;

          let finalAsçBasari = asçBasari;

          if (kosul1 && kosul2 && hasDoctorData) {
            if (doctorBasari > doktorTavan) {
              finalAsçBasari = doktorTavan;
            } else {
              finalAsçBasari = doctorBasari;
            }
          }

          katsayiElement.textContent = finalAsçBasari.toFixed(5);
          if (tavanElement) {
            tavanElement.textContent = hasDoctorData ? doctorBasari.toFixed(5) : "1.00000";
          }
          katsayiElement.style.color = kosul1 && kosul2 ? "var(--green)" : "var(--red)";
        });
      });
    } else {
      const tavanElement = document.getElementById("tavanKatsayi");
      tavanElement.textContent = "1.00000";
      const kosul1 = asçBasari >= 1.0;
      const kosul2 = asçBasari >= 0.75;
      katsayiElement.style.color = kosul1 && kosul2 ? "var(--green)" : "var(--red)";
    }
    return;
  }

  // Doktor modu
  if (!data || data.length === 0) {
    const katsayiElement = document.getElementById("totalKatsayi");
    if (katsayiElement) katsayiElement.textContent = "1.03000";
    updateKHTBar([], userType);
    return;
  }

  const finalSonuc = buildDoctorTable(data, updateKHTBar, ay, yil);
  const katsayiElement = document.getElementById("totalKatsayi");
  const tavanElement = document.getElementById("tavanKatsayi");
  if (katsayiElement && tavanElement) {
    katsayiElement.textContent = finalSonuc.toFixed(5);
    const tavanDeger = parseFloat(tavanElement.textContent) || 0;
    katsayiElement.style.color = finalSonuc >= tavanDeger ? "var(--green)" : "var(--red)";
  }
}

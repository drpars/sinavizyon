// modules/ui/updaters/table-updater.js
import { updateKHTBar } from "./kht-updater.js";

import { calculateDoctorKatsayi } from "../../features/doctor/calculator.js";
import { SUREC_KATSAYISI } from "../../lib/constants.js";
import { buildDoctorTable, buildNurseTable } from "../table/index.js";

export function updateTable(data, userType = "doctor", showAll = false, birimId = "") {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  console.log("📊 updateTable çağrıldı:", { userType, showAll, dataLength: data?.length, birimId });

  // ASÇ modu
  if (userType === "nurse") {
    if (!data || data.length === 0) {
      console.log("⚠️ ASÇ: Veri yok, tablo temizleniyor");
      const katsayiElement = document.getElementById("totalKatsayi");
      if (katsayiElement) katsayiElement.textContent = "1.00000";
      updateKHTBar([], userType);
      return;
    }

    console.log("📊 ASÇ: buildNurseTable çağrılıyor, data length:", data.length);
    const { asçBasari } = buildNurseTable(data, showAll, updateKHTBar);
    console.log("📊 ASÇ: asçBasari:", asçBasari);

    const katsayiElement = document.getElementById("totalKatsayi");
    katsayiElement.textContent = asçBasari.toFixed(5);

    if (birimId) {
      const doctorKey = `savedResults_doctor_${birimId}`;
      chrome.storage.local.get([doctorKey], (res) => {
        const doctorData = res[doctorKey]?.data || [];

        // Doktor başarı katsayısını hesapla
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
          doctorBasari = doctorToplam * SUREC_KATSAYISI;
        }

        // Doktor tavan katsayısını hesapla (nüfustan)
        const nufusKey = `nufus_${birimId}`;
        chrome.storage.local.get([nufusKey], (nufusRes) => {
          const nufus = parseFloat(nufusRes[nufusKey]) || 0;
          let doktorTavan = 1.0;
          if (nufus > 0) {
            doktorTavan = Math.min(1.5, Math.max(1.0, 4000 / nufus));
          }

          const tavanElement = document.getElementById("tavanKatsayi");

          // Temel koşullar
          const kosul1 = asçBasari >= 1.0;
          const kosul2 = hasDoctorData ? asçBasari >= doctorBasari * 0.75 : asçBasari >= 0.75;

          let finalAsçBasari = asçBasari;

          if (kosul1 && kosul2 && hasDoctorData) {
            // Doktor verisi varsa ve koşullar sağlanıyorsa
            if (doctorBasari > doktorTavan) {
              // Doktor tavanı aşmış → ASÇ tavan ile sınırla
              finalAsçBasari = doktorTavan;
            } else {
              // Normal eşitleme
              finalAsçBasari = doctorBasari;
            }
          }
          // Doktor verisi yoksa: asçBasari kendi değerinde kalır (0.902 durumu yok)

          // Görüntüleme
          katsayiElement.textContent = finalAsçBasari.toFixed(5);
          if (tavanElement) {
            tavanElement.textContent = hasDoctorData ? doctorBasari.toFixed(5) : "1.00000";
          }

          // Renk: koşullar sağlanıyorsa yeşil
          const isGreen = kosul1 && kosul2;
          katsayiElement.style.color = isGreen ? "var(--green)" : "var(--red)";
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
    const tbody = document.getElementById("tableBody");
    if (tbody) tbody.innerHTML = "";
    const katsayiElement = document.getElementById("totalKatsayi");
    if (katsayiElement) katsayiElement.textContent = "1.03000";
    updateKHTBar([], userType);
    return;
  }

  const finalSonuc = buildDoctorTable(data, updateKHTBar);
  const katsayiElement = document.getElementById("totalKatsayi");
  const tavanElement = document.getElementById("tavanKatsayi");
  if (katsayiElement && tavanElement) {
    katsayiElement.textContent = finalSonuc.toFixed(5);
    const tavanDeger = parseFloat(tavanElement.textContent) || 0;
    katsayiElement.style.color = finalSonuc >= tavanDeger ? "var(--green)" : "var(--red)";
  }
}

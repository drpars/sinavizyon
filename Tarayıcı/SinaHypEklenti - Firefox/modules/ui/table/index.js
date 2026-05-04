// modules/ui/table/index.js
import { calculateDoctorKatsayi } from "../../features/doctor/calculator.js";
import { calculateNurseKatsayi } from "../../features/nurse/calculator.js";
import {
  PASIF_ISLEMLER_NORMALIZED,
  SUREC_KATSAYISI,
  getKatsayiMap,
  getNurseKatsayiMap,
  nurseFilterListNormalized,
} from "../../lib/constants.js";
import { normalizeText } from "../../utils/text-utils.js";

// ========== ORTAK YARDIMCILAR ==========

function createGroupHeader(grupAdi) {
  const headerRow = document.createElement("tr");
  const headerCell = document.createElement("td");
  headerCell.colSpan = 5;
  headerCell.textContent = grupAdi;
  headerCell.className = "category-header";

  const isDark = document.body.classList.contains("dark-mode");
  const colors = {
    "KANSER TARAMALARI": isDark ? "var(--orange)" : "#ed921b",
    "DİĞER / PASİF": isDark ? "#565f89" : "#78909c",
    İZLEMLER: isDark ? "var(--green)" : "#1eb482",
    TARAMALAR: isDark ? "var(--blue)" : "#1976d2",
  };

  headerCell.style.backgroundColor = colors[grupAdi] || colors["TARAMALAR"];
  headerCell.style.color = "#ffffff";
  headerRow.appendChild(headerCell);
  return headerRow;
}

function groupData(data, isPasifCheck) {
  const gruplar = {
    TARAMALAR: [],
    İZLEMLER: [],
    "KANSER TARAMALARI": [],
    "DİĞER / PASİF": [],
  };

  data.forEach((item) => {
    const ad = normalizeText(item.ad);
    const isPasif = isPasifCheck(ad);

    if (isPasif) gruplar["DİĞER / PASİF"].push(item);
    else if (ad.includes("KANSER")) gruplar["KANSER TARAMALARI"].push(item);
    else if (ad.includes("TARAMASI")) gruplar["TARAMALAR"].push(item);
    else if (ad.includes("IZLEM")) gruplar["İZLEMLER"].push(item);
    else gruplar["TARAMALAR"].push(item);
  });

  return gruplar;
}

export function createTableRow(item, grupAdi = "") {
  const ger = parseFloat(item.gereken) || 0;
  const yap = parseFloat(item.yapilan) || 0;
  const dev = parseFloat(item.devreden) || 0;
  const etkiliYapilan = yap >= ger * 0.1 ? yap + dev : yap;
  const oranYuzde = ger > 0 ? (etkiliYapilan / ger) * 100 : 0;
  const isPasif = grupAdi === "DİĞER / PASİF";

  const isSuccess = oranYuzde >= 90;
  const tr = document.createElement("tr");
  if (!isPasif) tr.className = isSuccess ? "status-done" : "status-fail";

  const tdAd = document.createElement("td");
  tdAd.className = "row-title";
  const adSpan = document.createElement("span");
  adSpan.textContent = item.ad;
  tdAd.appendChild(adSpan);
  if (isPasif) {
    const smallP = document.createElement("small");
    smallP.textContent = " (P)";
    tdAd.appendChild(smallP);
  }
  const br = document.createElement("br");
  tdAd.appendChild(br);
  const smallPercent = document.createElement("small");
  smallPercent.textContent = `%${oranYuzde.toFixed(1)}`;
  tdAd.appendChild(smallPercent);
  tr.appendChild(tdAd);

  const tdGereken = document.createElement("td");
  tdGereken.textContent = item.gereken;
  tr.appendChild(tdGereken);

  const tdYapilan = document.createElement("td");
  tdYapilan.textContent = item.yapilan;
  tr.appendChild(tdYapilan);

  const tdDevreden = document.createElement("td");
  tdDevreden.textContent = item.devreden;
  tr.appendChild(tdDevreden);

  const tdDurum = document.createElement("td");
  tdDurum.textContent = isSuccess ? "TAMAM" : "EKSİK";
  tdDurum.style.color = isSuccess ? "var(--green)" : "var(--red)";
  tdDurum.style.fontWeight = "bold";
  tr.appendChild(tdDurum);

  return tr;
}

export function buildDoctorTable(data, updateKHTBarFn, ay = null, yil = null) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return { toplamCarpim: 1.0 };

  const katsayiMap = ay && yil ? getKatsayiMap(ay, yil) : null;
  const katsayiMapNorm = katsayiMap ? new Map() : null;
  if (katsayiMap) {
    for (let [anahtar, deger] of katsayiMap.entries()) {
      katsayiMapNorm.set(normalizeText(anahtar), deger);
    }
  }

  const fragment = document.createDocumentFragment();
  let toplamCarpim = 1.0;

  const gruplar = groupData(data, (ad) => PASIF_ISLEMLER_NORMALIZED.some((p) => ad.includes(p)));

  Object.keys(gruplar).forEach((grupAdi) => {
    const items = gruplar[grupAdi];
    if (items.length === 0) return;

    fragment.appendChild(createGroupHeader(grupAdi));

    items.forEach((item) => {
      const ger = parseFloat(item.gereken) || 0;
      const yap = parseFloat(item.yapilan) || 0;
      const dev = parseFloat(item.devreden) || 0;
      const isPasif = grupAdi === "DİĞER / PASİF";

      if (!isPasif) toplamCarpim *= calculateDoctorKatsayi(item.ad, ger, yap, dev, katsayiMapNorm);

      fragment.appendChild(createTableRow(item, grupAdi));
    });
  });

  tbody.innerHTML = "";
  tbody.appendChild(fragment);

  const finalSonuc = toplamCarpim * SUREC_KATSAYISI;
  if (updateKHTBarFn) updateKHTBarFn(data, "doctor");
  return finalSonuc;
}

export function buildNurseTable(data, showAll, updateKHTBarFn, ay = null, yil = null) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return { asçBasari: 1.0, asçItems: [], doctorItems: [] };

  const nurseKatsayiMap = ay && yil ? getNurseKatsayiMap(ay, yil) : null;
  const nurseMapNorm = nurseKatsayiMap ? new Map() : null;
  if (nurseKatsayiMap) {
    for (let [anahtar, deger] of nurseKatsayiMap.entries()) {
      nurseMapNorm.set(normalizeText(anahtar), deger);
    }
  }

  const fragment = document.createDocumentFragment();

  const vitalNormalItems = [];
  const vitalTekilItems = [];
  const otherNurseItems = [];

  data.forEach((item) => {
    const ad = normalizeText(item.ad);
    if (ad.includes(normalizeText("VİTAL BULGU ASÇ TEKİL"))) {
      vitalTekilItems.push(item);
    } else if (ad.includes(normalizeText("VİTAL BULGU ASÇ"))) {
      vitalNormalItems.push(item);
    } else if (nurseFilterListNormalized.some((filter) => ad.includes(filter))) {
      otherNurseItems.push(item);
    }
  });

  let selectedVitalItems = [...vitalNormalItems];
  let useTekilInstead = false;

  if (vitalNormalItems.length > 0 && vitalTekilItems.length > 0) {
    let normalKatsayi = 1.0;
    let tekilKatsayi = 1.0;

    vitalNormalItems.forEach((item) => {
      const ger = parseFloat(item.gereken) || 0;
      const yap = parseFloat(item.yapilan) || 0;
      const dev = parseFloat(item.devreden) || 0;
      normalKatsayi *= calculateNurseKatsayi(item.ad, ger, yap, dev, nurseMapNorm);
    });

    vitalTekilItems.forEach((item) => {
      const ger = parseFloat(item.gereken) || 0;
      const yap = parseFloat(item.yapilan) || 0;
      const dev = parseFloat(item.devreden) || 0;
      tekilKatsayi *= calculateNurseKatsayi(item.ad, ger, yap, dev, nurseMapNorm);
    });

    if (tekilKatsayi > normalKatsayi) {
      useTekilInstead = true;
      selectedVitalItems = [...vitalTekilItems];
    }
  } else if (vitalTekilItems.length > 0) {
    selectedVitalItems = [...vitalTekilItems];
    useTekilInstead = true;
  }

  const asçItems = [...selectedVitalItems, ...otherNurseItems];

  const doctorItems = showAll
    ? data.filter((item) => {
        const ad = normalizeText(item.ad);
        return !nurseFilterListNormalized.some((filter) => ad.includes(filter));
      })
    : [];

  // ASÇ başlık ve satırlar
  if (asçItems.length > 0) {
    const headerRow = document.createElement("tr");
    const headerCell = document.createElement("td");
    headerCell.colSpan = 5;
    headerCell.textContent = useTekilInstead ? "ASÇ İŞLEMLERİ (TEKİL)" : "ASÇ İŞLEMLERİ";
    headerCell.className = "category-header";
    headerCell.style.backgroundColor = document.body.classList.contains("dark-mode") ? "var(--blue)" : "#1eb482";
    headerCell.style.color = "#ffffff";
    headerRow.appendChild(headerCell);
    fragment.appendChild(headerRow);

    asçItems.forEach((item) => {
      fragment.appendChild(createTableRow(item));
    });
  }

  // Doktor grupları
  if (doctorItems.length > 0) {
    const gruplar = groupData(doctorItems, (ad) => PASIF_ISLEMLER_NORMALIZED.some((p) => ad.includes(p)));

    Object.keys(gruplar).forEach((grupAdi) => {
      const items = gruplar[grupAdi];
      if (items.length === 0) return;

      fragment.appendChild(createGroupHeader(grupAdi));

      items.forEach((item) => {
        fragment.appendChild(createTableRow(item, grupAdi));
      });
    });
  }

  tbody.innerHTML = "";
  tbody.appendChild(fragment);

  let khtData = showAll ? data : asçItems;
  if (updateKHTBarFn) updateKHTBarFn(khtData, "nurse");

  let toplamCarpim = 1.0;
  asçItems.forEach((item) => {
    const ger = parseFloat(item.gereken) || 0;
    const yap = parseFloat(item.yapilan) || 0;
    const dev = parseFloat(item.devreden) || 0;
    toplamCarpim *= calculateNurseKatsayi(item.ad, ger, yap, dev, nurseMapNorm);
  });

  return { asçBasari: toplamCarpim, asçItems, doctorItems };
}

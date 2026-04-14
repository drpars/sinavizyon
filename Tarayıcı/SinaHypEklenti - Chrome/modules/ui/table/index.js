// modules/ui/table/index.js
import { calculateDoctorKatsayi } from '../../features/doctor/calculator.js';
import { calculateNurseKatsayi } from '../../features/nurse/calculator.js';
import { nurseFilterList } from '../../lib/constants.js';
import { 
  nurseFilterListNormalized, 
  PASIF_ISLEMLER_NORMALIZED,
  SUREC_KATSAYISI 
} from '../../lib/constants.js';
import { normalizeText } from '../../utils/text-utils.js';


// Yardımcı fonksiyon: tablo satırı oluştur (doktor/ASÇ ortak)
export function createTableRow(item, grupAdi = "") {
  const ger = parseFloat(item.gereken) || 0;
  const yap = parseFloat(item.yapilan) || 0;
  const dev = parseFloat(item.devreden) || 0;
  const etkiliYapilan = yap >= ger * 0.1 ? (yap + dev) : yap;
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

// Doktor modu için tabloyu oluştur (katsayı hesaplaması yapmaz, sadece görsel)
export function buildDoctorTable(data, updateKHTBarFn) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return { toplamCarpim: 1.0 };

  const fragment = document.createDocumentFragment();
  
  let toplamCarpim = 1.0;
  const gruplar = {
    TARAMALAR: [],
    İZLEMLER: [],
    "KANSER TARAMALARI": [],
    "DİĞER / PASİF": [],
  };

  data.forEach((item) => {
    const ad = normalizeText(item.ad);
    const isPasif = PASIF_ISLEMLER_NORMALIZED.some((p) => ad.includes(p));
    
    if (isPasif) gruplar["DİĞER / PASİF"].push(item);
    else if (ad.includes("TARAMASI") && !ad.includes("KANSER")) gruplar["TARAMALAR"].push(item);
    else if (ad.includes("IZLEM")) gruplar["İZLEMLER"].push(item);
    else if (ad.includes("KANSER")) gruplar["KANSER TARAMALARI"].push(item);
    else gruplar["TARAMALAR"].push(item);
  });

  Object.keys(gruplar).forEach((grupAdi) => {
    const items = gruplar[grupAdi];
    if (items.length === 0) return;

    const headerRow = document.createElement("tr");
    const headerCell = document.createElement("td");
    headerCell.colSpan = 5;
    headerCell.textContent = grupAdi;
    headerCell.className = "category-header";
    let grupRengi = "";
    if (document.body.classList.contains("dark-mode")) {
      if (grupAdi === "KANSER TARAMALARI") grupRengi = "var(--orange)";
      else if (grupAdi === "DİĞER / PASİF") grupRengi = "#565f89";
      else if (grupAdi === "İZLEMLER") grupRengi = "var(--green)";
      else grupRengi = "var(--blue)";  // TARAMALAR
    } else {
      if (grupAdi === "KANSER TARAMALARI") grupRengi = "#ed921b";
      else if (grupAdi === "DİĞER / PASİF") grupRengi = "#78909c";
      else if (grupAdi === "İZLEMLER") grupRengi = "#1eb482";
      else grupRengi = "#1976d2";  // TARAMALAR - Mavi
    }
    headerCell.style.backgroundColor = grupRengi;
    headerCell.style.color = "#ffffff";
    headerRow.appendChild(headerCell);
    // ✅ fragment'e ekle
    fragment.appendChild(headerRow);

    items.forEach((item) => {
      const ger = parseFloat(item.gereken) || 0;
      const yap = parseFloat(item.yapilan) || 0;
      const dev = parseFloat(item.devreden) || 0;
      const etkiliYapilan = yap >= ger * 0.1 ? (yap + dev) : yap;
      const oranYuzde = ger > 0 ? (etkiliYapilan / ger) * 100 : 0;
      const isPasif = grupAdi === "DİĞER / PASİF";

      if (!isPasif) toplamCarpim *= calculateDoctorKatsayi(item.ad, ger, yap, dev);

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

      // ✅ fragment'e ekle
      fragment.appendChild(tr);
    });
  });

  // ✅ Tek seferde DOM'a ekle
  tbody.innerHTML = "";
  tbody.appendChild(fragment);
  
  const finalSonuc = toplamCarpim * SUREC_KATSAYISI;
  if (updateKHTBarFn) updateKHTBarFn(data, "doctor");
  return finalSonuc;
}

// ASÇ modu için tabloyu oluştur (katsayı hesaplamaz, sadece görsel)
export function buildNurseTable(data, showAll, updateKHTBarFn) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return { asçBasari: 1.0, asçItems: [], doctorItems: [] };

  const fragment = document.createDocumentFragment();

  // ========== VİTAL BULGU AYIRMA (TEKİL vs DİĞERİ) ==========
  const vitalNormalItems = [];
  const vitalTekilItems = [];
  const otherNurseItems = [];

  data.forEach(item => {
    const ad = normalizeText(item.ad);
    if (ad.includes(normalizeText("VİTAL BULGU ASÇ TEKİL"))) {
      vitalTekilItems.push(item);
    } else if (ad.includes(normalizeText("VİTAL BULGU ASÇ"))) {
      vitalNormalItems.push(item);
    } else if (nurseFilterListNormalized.some(filter => ad.includes(filter))) {
      otherNurseItems.push(item);
    }
  });

  // ========== KATSAYI KARŞILAŞTIRMASI ==========
  let selectedVitalItems = [...vitalNormalItems];
  let useTekilInstead = false;
  
  if (vitalNormalItems.length > 0 && vitalTekilItems.length > 0) {
    let normalKatsayi = 1.0;
    let tekilKatsayi = 1.0;
    
    vitalNormalItems.forEach(item => {
      const ger = parseFloat(item.gereken) || 0;
      const yap = parseFloat(item.yapilan) || 0;
      const dev = parseFloat(item.devreden) || 0;
      normalKatsayi *= calculateNurseKatsayi(item.ad, ger, yap, dev);
    });
    
    vitalTekilItems.forEach(item => {
      const ger = parseFloat(item.gereken) || 0;
      const yap = parseFloat(item.yapilan) || 0;
      const dev = parseFloat(item.devreden) || 0;
      tekilKatsayi *= calculateNurseKatsayi(item.ad, ger, yap, dev);
    });
    
    console.log("📊 Vital Karşılaştırma:", { normalKatsayi, tekilKatsayi });
    
    if (tekilKatsayi > normalKatsayi) {
      useTekilInstead = true;
      selectedVitalItems = [...vitalTekilItems];
      console.log("✅ TEKİL seçildi (katsayısı daha yüksek)");
    } else {
      console.log("✅ Normal Vital seçildi (katsayısı daha yüksek veya eşit)");
    }
  } else if (vitalTekilItems.length > 0) {
    selectedVitalItems = [...vitalTekilItems];
    useTekilInstead = true;
    console.log("✅ Sadece TEKİL var, onu kullan");
  }

  // ========== ASÇ İŞLEMLERİ ==========
  const asçItems = [...selectedVitalItems, ...otherNurseItems];
  
  console.log("📊 ASÇ İşlemleri:", {
    selectedVitalCount: selectedVitalItems.length,
    otherNurseCount: otherNurseItems.length,
    totalAsçCount: asçItems.length,
    useTekilInstead
  });

  // ========== DOKTOR İŞLEMLERİ (showAll true ise) ==========
  const doctorItems = showAll ? data.filter(item => {
    const ad = normalizeText(item.ad);
    return !nurseFilterListNormalized.some(filter => ad.includes(filter));
  }) : [];
  
  console.log("📊 DOKTOR İşlemleri:", { doctorItemsCount: doctorItems.length });
  
  // ========== TABLO OLUŞTURMA ==========
  
  // ASÇ başlığı
  if (asçItems.length > 0) {
    const headerRow = document.createElement("tr");
    const headerCell = document.createElement("td");
    headerCell.colSpan = 5;
    headerCell.textContent = useTekilInstead ? "ASÇ İŞLEMLERİ (TEKİL)" : "ASÇ İŞLEMLERİ";
    headerCell.className = "category-header";
    if (document.body.classList.contains("dark-mode")) {
      headerCell.style.backgroundColor = "var(--blue)";
    } else {
      headerCell.style.backgroundColor = "#1eb482";
    }
    headerCell.style.color = "#ffffff";
    headerRow.appendChild(headerCell);
    fragment.appendChild(headerRow);
    
    asçItems.forEach((item) => {
      const tr = createTableRow(item);
      fragment.appendChild(tr);
    });
  }
  
  // DOKTOR GRUPLARI
  if (doctorItems.length > 0) {
    const gruplar = {
      TARAMALAR: [],
      İZLEMLER: [],
      "KANSER TARAMALARI": [],
      "DİĞER / PASİF": [],
    };
    
    doctorItems.forEach((item) => {
      const ad = item.ad.toUpperCase();
      const isPasif = ["İNME", "BÖBREK", "BOBREK", "KORONERARTER"].some((p) => ad.includes(p));
      if (isPasif) gruplar["DİĞER / PASİF"].push(item);
      else if (ad.includes("TARAMASI") && !ad.includes("KANSER")) gruplar["TARAMALAR"].push(item);
      else if (ad.includes("İZLEM")) gruplar["İZLEMLER"].push(item);
      else if (ad.includes("KANSER")) gruplar["KANSER TARAMALARI"].push(item);
      else gruplar["TARAMALAR"].push(item);
    });
    
    Object.keys(gruplar).forEach((grupAdi) => {
      const items = gruplar[grupAdi];
      if (items.length === 0) return;
      
      const headerRow = document.createElement("tr");
      const headerCell = document.createElement("td");
      headerCell.colSpan = 5;
      headerCell.textContent = grupAdi;
      headerCell.className = "category-header";
      let grupRengi = "";
      if (document.body.classList.contains("dark-mode")) {
        if (grupAdi === "KANSER TARAMALARI") grupRengi = "var(--orange)";
        else if (grupAdi === "DİĞER / PASİF") grupRengi = "#78909c";
        else if (grupAdi === "İZLEMLER") grupRengi = "var(--blue)";
        else grupRengi = "var(--blue)";
      } else {
        if (grupAdi === "KANSER TARAMALARI") grupRengi = "#ed921b";
        else if (grupAdi === "DİĞER / PASİF") grupRengi = "#78909c";
        else if (grupAdi === "İZLEMLER") grupRengi = "#1eb482";
        else grupRengi = "#1976d2";
      }
      headerCell.style.backgroundColor = grupRengi;
      headerCell.style.color = "#ffffff";
      headerRow.appendChild(headerCell);
      fragment.appendChild(headerRow);
      
      items.forEach((item) => {
        const tr = createTableRow(item, grupAdi);
        fragment.appendChild(tr);
      });
    });
  }

  // Tabloyu DOM'a ekle
  tbody.innerHTML = "";
  tbody.appendChild(fragment);

  // KHT bar güncelleme
  let khtData;
  if (showAll) {
    khtData = data;
  } else {
    khtData = asçItems;
  }
  if (updateKHTBarFn) updateKHTBarFn(khtData, "nurse");

  // ASÇ başarı katsayısı hesapla
  let toplamCarpim = 1.0;
  asçItems.forEach((item) => {
    const ger = parseFloat(item.gereken) || 0;
    const yap = parseFloat(item.yapilan) || 0;
    const dev = parseFloat(item.devreden) || 0;
    toplamCarpim *= calculateNurseKatsayi(item.ad, ger, yap, dev);
  });
  const asçBasari = toplamCarpim;
  
  console.log("📊 asçBasari hesaplandı:", asçBasari);
  
  return { asçBasari, asçItems, doctorItems };
}

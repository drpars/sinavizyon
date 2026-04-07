// modules/ui/table/index.js
import { calculateDoctorKatsayi } from '../../features/doctor/calculator.js';
import { calculateNurseKatsayi } from '../../features/nurse/calculator.js';
import { nurseFilterList } from '../../lib/constants.js';


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
export function buildDoctorTable(data, surecCarpan, updateKHTBarFn) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return { toplamCarpim: 1.0 };

  let toplamCarpim = 1.0;
  const gruplar = {
    TARAMALAR: [],
    İZLEMLER: [],
    "KANSER TARAMALARI": [],
    "DİĞER / PASİF": [],
  };

  data.forEach((item) => {
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
    tbody.appendChild(headerRow);

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

      tbody.appendChild(tr);
    });
  });

  const finalSonuc = toplamCarpim * surecCarpan;
  // KHT bar güncelleme
  if (updateKHTBarFn) updateKHTBarFn(data, "doctor");
  return finalSonuc;
}

// ASÇ modu için tabloyu oluştur (katsayı hesaplamaz, sadece görsel)
export function buildNurseTable(data, showAll, updateKHTBarFn) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return { asçBasari: 1.0, asçItems: [], doctorItems: [] };

  // ASÇ İŞLEMLERİ grubu (TEKİL hesaplamaya dahil edilmez)
  const asçItems = data.filter(item => {
    const ad = item.ad.toUpperCase();
    if (ad.includes("VİTAL BULGU ASÇ TEKİL")) return false;
    return nurseFilterList.some(filter => ad.includes(filter.toUpperCase()));
  });
  
  // TEKİL işlemi tabloda gösterilsin ama hesaplamaya girmesin
  const tekilItems = data.filter(item => {
    const ad = item.ad.toUpperCase();
    return ad.includes("VİTAL BULGU ASÇ TEKİL");
  });
  
  // Doktor işlemleri (showAll true ise gösterilir)
  const doctorItems = showAll ? data.filter(item => {
    const ad = item.ad.toUpperCase();
    return !nurseFilterList.some(filter => ad.includes(filter.toUpperCase())) &&
           !ad.includes("VİTAL BULGU ASÇ TEKİL");
  }) : [];
  
  // ASÇ İŞLEMLERİ başlığı
  const allAsçItems = [...asçItems, ...tekilItems];
  if (allAsçItems.length > 0) {
    const headerRow = document.createElement("tr");
    const headerCell = document.createElement("td");
    headerCell.colSpan = 5;
    headerCell.textContent = "ASÇ İŞLEMLERİ";
    headerCell.className = "category-header";
    if (document.body.classList.contains("dark-mode")) {
      headerCell.style.backgroundColor = "var(--blue)";
    } else {
      headerCell.style.backgroundColor = "#1eb482";
    }
    headerCell.style.color = "#ffffff";
    headerRow.appendChild(headerCell);
    tbody.appendChild(headerRow);
    
    allAsçItems.forEach((item) => {
      const tr = createTableRow(item);
      tbody.appendChild(tr);
    });
  }
  
  // DOKTOR GRUPLARI (sadece showAll true ise)
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
      tbody.appendChild(headerRow);
      
      items.forEach((item) => {
        const tr = createTableRow(item, grupAdi);
        tbody.appendChild(tr);
      });
    });
  }

  // KHT bar'ı güncelle
  let khtData;
  if (showAll) {
    khtData = data;
  } else {
    khtData = data.filter(item => {
      const ad = item.ad.toUpperCase();
      if (ad.includes("VİTAL BULGU ASÇ TEKİL")) return false;
      return nurseFilterList.some(filter => ad.includes(filter.toUpperCase()));
    });
  }
  if (updateKHTBarFn) updateKHTBarFn(khtData, "nurse");

  // ASÇ başarı katsayısı hesapla (sadece asçItems üzerinden)
  let toplamCarpim = 1.0;
  asçItems.forEach((item) => {
    const ger = parseFloat(item.gereken) || 0;
    const yap = parseFloat(item.yapilan) || 0;
    const dev = parseFloat(item.devreden) || 0;
    toplamCarpim *= calculateNurseKatsayi(item.ad, ger, yap, dev);
  });
  const asçBasari = toplamCarpim;
  
  return { asçBasari, asçItems, doctorItems };
}

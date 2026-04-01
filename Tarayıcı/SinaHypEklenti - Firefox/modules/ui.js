import { calculateKHTPerformance, katsayiHesapla } from './calculations.js';
import { nurseFilterList } from './constants.js';

export function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// Yardımcı fonksiyon: tablo satırı oluştur
function createTableRow(item, grupAdi = "") {
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

export function updateTable(data, userType = "doctor", showAll = false, birimId = "") {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  // ========== ASÇ MODU ==========
  if (userType === "nurse") {
    if (!data || data.length === 0) return;
    
    // ASÇ İŞLEMLERİ grubu (TEKİL hesaplamaya dahil edilmez)
    const asçItems = data.filter(item => {
      const ad = item.ad.toUpperCase();
      // TEKİL hesaplamaya dahil edilmez (tabloda gösterilir, ama katsayı/KHT'ye girmez)
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
    
    // ASÇ İŞLEMLERİ başlığı (asçItems + tekilItems)
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
      
      // ASÇ işlemlerini satır olarak ekle (TEKİL de dahil)
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
    
    // KHT bar'ı güncelle (showAll true ise tüm veriler, değilse sadece ASÇ işlemleri (TEKİL hariç))
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
    updateKHTBar(khtData, userType);
    
    // ========== ASÇ BAŞARI KATSAYISI HESAPLAMA ==========
    let toplamCarpim = 1.0;
    asçItems.forEach((item) => {
      const ger = parseFloat(item.gereken) || 0;
      const yap = parseFloat(item.yapilan) || 0;
      const dev = parseFloat(item.devreden) || 0;
      toplamCarpim *= katsayiHesapla(item.ad, ger, yap, dev, userType);
    });
    const asçBasari = toplamCarpim;
    const katsayiElement = document.getElementById("totalKatsayi");
    katsayiElement.textContent = asçBasari.toFixed(5);
    
    // ========== ASÇ TAVAN KATSAYISI = DOKTOR BAŞARI KATSAYISI ==========
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
          
          // Renk karşılaştırması
          if (asçBasari >= doctorBasari) {
            katsayiElement.style.color = "var(--green)";
          } else {
            katsayiElement.style.color = "var(--red)";
          }
        } else {
          const tavanElement = document.getElementById("tavanKatsayi");
          tavanElement.textContent = "1.00000";
          // Renk karşılaştırması: doktor verisi yoksa tavan 1.0
          if (asçBasari >= 1.0) {
            katsayiElement.style.color = "var(--green)";
          } else {
            katsayiElement.style.color = "var(--red)";
          }
        }
      });
    } else {
      // Birim ID yoksa tavan 1.0
      const tavanElement = document.getElementById("tavanKatsayi");
      tavanElement.textContent = "1.00000";
      if (asçBasari >= 1.0) {
        katsayiElement.style.color = "var(--green)";
      } else {
        katsayiElement.style.color = "var(--red)";
      }
    }
    
    return;
  }
  
  // ========== DOKTOR MODU (süreç yönetimi çarpanı var) ==========
  let toplamCarpim = 1.0;
  const surecCarpan = parseFloat(document.getElementById("surecYonetimi")?.value) || 1.03;

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

      if (!isPasif) toplamCarpim *= katsayiHesapla(item.ad, ger, yap, dev, userType);

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
  const katsayiElement = document.getElementById("totalKatsayi");
  const tavanElement = document.getElementById("tavanKatsayi");
  if (katsayiElement && tavanElement) {
    katsayiElement.textContent = finalSonuc.toFixed(5);
    const tavanDeger = parseFloat(tavanElement.textContent) || 0;
    if (finalSonuc >= tavanDeger) {
      katsayiElement.style.color = "var(--green)";
    } else {
      katsayiElement.style.color = "var(--red)";
    }
  }

  // KHT bar'ı güncelle
  updateKHTBar(data, userType);
}

export function updateKHTBar(data, userType = "doctor") {
  const kht = calculateKHTPerformance(data, userType);
  const percent = kht.percentage;
  const percentElem = document.getElementById('khtPercentage');
  const barFill = document.getElementById('khtBarFill');
  const khtDurumElem = document.getElementById('khtDurum');
  if (percentElem) percentElem.innerText = percent + '%';
  if (barFill) barFill.style.width = percent + '%';
  if (khtDurumElem) {
    khtDurumElem.innerText = percent >= 70 ? 'TAMAM' : 'EKSİK';
    khtDurumElem.style.color = percent >= 70 ? 'var(--green)' : 'var(--red)';
  }
  const marks = document.querySelectorAll('.kht-bar-marks span');
  if (marks.length >= 4) {
    const mark40 = marks[1];
    const mark70 = marks[2];
    if (mark40) mark40.innerHTML = percent >= 40 ? '40% ✓' : '40%';
    if (mark70) mark70.innerHTML = percent >= 70 ? '70% ✓' : '70%';
  }
}

export function applyTheme(theme) {
  if (theme === "dark") document.body.classList.add("dark-mode");
  else document.body.classList.remove("dark-mode");
}

export function applyKvkkVisibility(hide) {
  const settingsNote = document.getElementById("kvkkSettingsNote");
  const footer = document.getElementById("kvkkFooter");
  const toggleBtn = document.getElementById("btnToggleKvkk");
  
  if (settingsNote) settingsNote.style.display = hide ? "none" : "block";
  if (footer) footer.style.display = hide ? "none" : "flex";
  if (toggleBtn) {
    toggleBtn.textContent = hide ? "🔓 KVKK Bilgilendirmelerini Göster" : "🔒 KVKK Bilgilendirmelerini Gizle";
  }
  
  chrome.storage.local.set({ kvkkHidden: hide, kvkkFooterHidden: hide });
}

export function setUIEnabled(enabled) {
  const buttons = ["btnSina", "btnHyp", "btnDeleteData", "btnExportData", "btnRevokeConsent", "btnChangelog"];
  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = !enabled;
  });
  const inputs = ["ay", "yil", "birimId", "nufus", "surecYonetimi"];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = !enabled;
  });
}

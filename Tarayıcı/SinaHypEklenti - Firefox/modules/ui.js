import { calculateKHTPerformance, katsayiHesapla, getEffectiveYapilan } from './calculations.js';

export function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

export function updateTable(data) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

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

      // Etkin yapılan miktarını hesapla (devreden %10 koşulu ile)
      // const etkiliYapilan = getEffectiveYapilan(ger, yap, dev); // tablodaki oranlar 100%'ü geçmez.
      const etkiliYapilan = yap >= ger * 0.1 ? (yap + dev) : yap; // tablodaki oranlar 100%'ü geçer.
      const oranYuzde = ger > 0 ? (etkiliYapilan / ger) * 100 : 0;
      const isPasif = grupAdi === "DİĞER / PASİF";

      if (!isPasif) toplamCarpim *= katsayiHesapla(item.ad, ger, yap, dev);

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
  updateKHTBar(data);
}

export function updateKHTBar(data) {
  const kht = calculateKHTPerformance(data);
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
  
  // Storage'ı güncelle
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

// dashboard.js
const STORAGE_PREFIX = "savedResults_doctor_";

// Storage'dan veri ve ayarları oku
chrome.storage.local.get(["themePreference", "birimId", "userType"], async (settings) => {
  const theme = settings.themePreference || "light";
  if (theme === "dark") document.body.classList.add("dark-mode");

  const birimId = settings.birimId;
  const userType = settings.userType || "doctor";

  if (birimId) {
    const key = `${STORAGE_PREFIX}${birimId}`;
    chrome.storage.local.get([key], (res) => {
      const data = res[key];
      renderDashboard(data, birimId); // ← birimId'yi geç
    });
  }
});

function renderDashboard(record, birimId) {
  if (!record?.data) {
    document.getElementById("dashboardCards").innerHTML = "<p>Veri bulunamadı.</p>";
    return;
  }

  const { data, ay, yil } = record;

  // Header
  document.getElementById("ayYil").textContent = `${ay} ${yil}`;
  // sonGuncelleme satırını SİL:

  renderCards(data, birimId, ay, yil);
  renderTables(data, ay, yil);

  // SİNA ve HYP zamanlarını al
  chrome.storage.local.get(["sinaLastTime_doctor_" + birimId, "hypLastTime_doctor_" + birimId], (res) => {
    document.getElementById("sinaTime").textContent = res["sinaLastTime_doctor_" + birimId]?.data || "-";
    document.getElementById("hypTime").textContent = res["hypLastTime_doctor_" + birimId]?.data || "-";
  });
}

async function renderCards(data, birimId, ay, yil) {
  // ← parametre ekle
  const container = document.getElementById("dashboardCards");
  if (!container) return;

  // KHT yüzdesi
  const kht = calculateKHT(data);
  const currentKatsayi = await calculateToplamKatsayi(data, ay, yil); // ← ay, yil geç

  // Nüfus ve tavan
  const nufusKey = `nufus_${birimId}`;

  chrome.storage.local.get([nufusKey], (res) => {
    const nufus = parseFloat(res[nufusKey]) || 0;
    const tavan = nufus > 0 ? Math.min(1.5, Math.max(1.0, 4000 / nufus)) : 1.0;

    container.innerHTML = `
      <div class="card card-kht" style="grid-column: span 2;">
        <div class="kht-header">
          <span>KHT YÜZDESİ</span>
          <span>${kht.percentage}%</span>
        </div>
        <div class="kht-bar-container">
          <div class="kht-bar-bg">
            <div class="kht-bar-fill" style="width: ${kht.percentage}%; background: ${kht.percentage < 40 ? "var(--dred)" : kht.percentage < 70 ? "var(--dorange)" : "var(--dgreen)"};"></div>
          </div>
          <div class="kht-bar-marks">
            <span style="left: 0%">0%</span>
            <span style="left: 40%">40%</span>
            <span style="left: 70%">70%</span>
            <span style="left: 100%">100%</span>
          </div>
        </div>
        <div class="kht-target-info">
          <span>Yapılan: <strong>${kht.totalYapilan}</strong></span>
          <span>Hedef: <strong>${kht.totalHedef}</strong></span>
        </div>
      </div>
      <div class="card card-basari">
        <div class="card-label">BAŞARI KATSAYISI</div>
        <div class="card-value">${currentKatsayi.toFixed(5)}</div>
        <div class="card-sub ${currentKatsayi >= tavan ? "success" : "warning"}">
          ${currentKatsayi >= tavan ? "✅ Tavan Aşıldı" : "⚠️ Tavan Altında"}
        </div>
      </div>
      <div class="card card-tavan">
        <div class="card-label">TAVAN KATSAYISI</div>
        <div class="card-value">${tavan.toFixed(5)}</div>
        <div class="card-sub">Nüfus: ${nufus}</div>
      </div>
    `;
  });
}

function calculateKHT(data) {
  let toplamHedef = 0;
  let toplamYapilan = 0;

  const khtIslemleri = ["DIYABET TARAMASI", "HIPERTANSIYON TARAMASI", "KVR TARAMASI", "OBEZITE TARAMASI"];

  data.forEach((item) => {
    const ad = normalizeText(item.ad);
    if (khtIslemleri.some((k) => ad.includes(normalizeText(k)))) {
      toplamHedef += parseFloat(item.gereken) || 0;
      const yap = parseFloat(item.yapilan) || 0;
      const dev = parseFloat(item.devreden) || 0;
      toplamYapilan += getEffectiveYapilan(parseFloat(item.gereken), yap, dev);
    }
  });

  const percentage = toplamHedef > 0 ? Math.round((toplamYapilan / toplamHedef) * 100) : 0;
  return { percentage, totalYapilan: toplamYapilan, totalHedef: toplamHedef };
}

// normalizeText ve getEffectiveYapilan'ı dashboard.js'e de ekle (veya import et)
function normalizeText(text) {
  if (!text || typeof text !== "string") return "";
  const trMap = {
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    I: "i",
    i: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ü: "u",
    Ü: "u",
  };
  let result = text;
  for (const [tr, en] of Object.entries(trMap)) result = result.replaceAll(tr, en);
  return result.replace(/\s+/g, " ").trim().toUpperCase();
}

function getEffectiveYapilan(gereken, yapilan, devreden) {
  if (gereken <= 0) return yapilan;
  const oran = (yapilan / gereken) * 100;
  if (oran >= 10) {
    const toplam = yapilan + devreden;
    return toplam >= gereken ? gereken : toplam;
  }
  return yapilan;
}

async function calculateToplamKatsayi(data, ay, yil) {
  try {
    const constants = await import(chrome.runtime.getURL("modules/lib/constants.js"));
    const { calculateDoctorKatsayi } = await import(chrome.runtime.getURL("modules/features/doctor/calculator.js"));
    const { normalizeText } = await import(chrome.runtime.getURL("modules/utils/text-utils.js"));
    const { getPasifIslemler } = constants;

    const katsayiMap = constants.getKatsayiMap(ay, yil);
    const mapNorm = new Map();
    for (let [k, v] of katsayiMap.entries()) mapNorm.set(normalizeText(k), v);

    const pasifListe = ay && yil ? getPasifIslemler(ay, yil) : [];

    let toplamCarpim = 1.0;
    data.forEach((item) => {
      const ad = normalizeText(item.ad);
      const isPasif = pasifListe.some((p) => ad.includes(p));
      if (!isPasif) {
        const ger = parseFloat(item.gereken) || 0;
        const yap = parseFloat(item.yapilan) || 0;
        const dev = parseFloat(item.devreden) || 0;
        toplamCarpim *= calculateDoctorKatsayi(item.ad, ger, yap, dev, mapNorm);
      }
    });

    return toplamCarpim;
  } catch (e) {
    console.error("Katsayı hesaplama hatası:", e);
    return 1.0;
  }
}

async function renderTables(data, ay, yil) {
  const izlemlerSection = document.getElementById("izlemlerSection");
  const taramalarSection = document.getElementById("taramalarSection");
  const kanserSection = document.getElementById("kanserSection");

  if (!izlemlerSection || !taramalarSection || !kanserSection) return;

  const izlemler = [];
  const taramalar = [];
  const kanserler = [];

  data.forEach((item) => {
    const ad = normalizeText(item.ad);
    if (ad.includes("KANSER")) {
      kanserler.push(item);
    } else if (ad.includes("TARAMASI")) {
      taramalar.push(item);
    } else if (ad.includes("IZLEM")) {
      izlemler.push(item);
    }
  });

  izlemlerSection.innerHTML = await createTableSection('İZLEMLER', izlemler, '#10b981', 'fas fa-heartbeat', ay, yil);
  taramalarSection.innerHTML = await createTableSection('TARAMALAR', taramalar, '#3b82f6', 'fas fa-search', ay, yil);
  kanserSection.innerHTML = await createTableSection('KANSER TARAMALARI', kanserler, '#f59e0b', 'fas fa-ribbon', ay, yil);
}

async function createTableSection(title, items, color, icon, ay, yil) {
  if (items.length === 0) return '';

  // Katsayı map'ini al
  let katsayiMapNorm = null;
  try {
    const constants = await import(chrome.runtime.getURL('modules/lib/constants.js'));
    const { normalizeText } = await import(chrome.runtime.getURL('modules/utils/text-utils.js'));
    const katsayiMap = constants.getKatsayiMap(ay, yil);
    katsayiMapNorm = new Map();
    for (let [k, v] of katsayiMap.entries()) katsayiMapNorm.set(normalizeText(k), v);
  } catch (e) {
    console.error('Map yüklenemedi:', e);
  }

  let rows = '';
  items.forEach(item => {
    const ger = parseFloat(item.gereken) || 0;
    const yap = parseFloat(item.yapilan) || 0;
    const dev = parseFloat(item.devreden) || 0;
    const etkiliYapilan = getEffectiveYapilan(ger, yap, dev);
    const oran = ger > 0 ? Math.round((etkiliYapilan / ger) * 100) : 0;
    const isDone = etkiliYapilan >= Math.ceil(ger * 0.9);

    // İşlemin kendi oranlarını bul
    let asgariOran = 40;
    let azamiOran = 90;
    if (katsayiMapNorm) {
      const ad = normalizeText(item.ad);
      for (let [anahtar, k] of katsayiMapNorm.entries()) {
        if (ad.includes(anahtar)) {
          asgariOran = k.asgariOran;
          azamiOran = k.azamiOran;
          break;
        }
      }
    }

    const asgariHedef = Math.ceil(ger * asgariOran / 100);
    const azamiHedef = Math.ceil(ger * azamiOran / 100);
    const asgariKalan = Math.max(0, asgariHedef - etkiliYapilan);
    const azamiKalan = Math.max(0, azamiHedef - etkiliYapilan);

    rows += `
      <tr class="${isDone ? 'row-done' : ''}">
        <td class="disease-name">${item.ad}</td>
        <td>${ger}</td>
        <td>${yap}</td>
        <td>${dev}</td>
        <td>%${oran}</td>
        <td class="${asgariKalan === 0 ? 'done' : 'remain'}">%${asgariOran}: ${asgariKalan === 0 ? '✓' : '+' + asgariKalan}</td>
        <td class="${azamiKalan === 0 ? 'done' : 'remain'}">%${azamiOran}: ${azamiKalan === 0 ? '✓' : '+' + azamiKalan}</td>
        <td class="${isDone ? 'done' : 'remain'}">${isDone ? '✓' : Math.max(0, azamiHedef - etkiliYapilan)}</td>
      </tr>
    `;
  });

  return `
    <div class="table-section-header" style="background: linear-gradient(135deg, ${color}, ${color}dd);">
      <span>${title} (${items.length})</span>
    </div>
    <div class="table-section-body">
      <table class="dash-table">
        <thead>
          <tr>
            <th style="text-align:left">HASTALIK</th>
            <th>GEREKEN</th>
            <th>YAPILAN</th>
            <th>DEVREDEN</th>
            <th>YÜZDE</th>
            <th>MIN. KALAN</th>
            <th>MAKS. KALAN</th>
            <th>KALAN</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// Yenile tusu
document.getElementById('btnRefresh').addEventListener('click', (e) => {
  e.stopPropagation();  // ← modalı engelle
  
  chrome.storage.local.get(['birimId'], (settings) => {
    const birimId = settings.birimId;
    if (birimId) {
      const key = `savedResults_doctor_${birimId}`;
      chrome.storage.local.get([key], (res) => {
        renderDashboard(res[key], birimId);
      });
    }
  });
});

// About Modal
document.querySelector('.dashboard-header').addEventListener('click', () => {
  const modal = document.getElementById('aboutModal');
  modal.classList.add('show');
});

document.getElementById('aboutModalClose').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('aboutModal').classList.remove('show');
});

document.getElementById('aboutModal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('show');
});

// ESC ile kapat
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('aboutModal').classList.remove('show');
  }
});

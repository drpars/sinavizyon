// modules/ui/components/modal/simulator.js
// ============================================================
// Performans Simülasyonu Modalı - "Ne Yapmalıyım?" (v2.3.0 Redesign)
// ============================================================
import { getDomAy, getDomYil } from "../../../core/dom.js";
import { analyzeAllItems, calculateCurrentKatsayi, calculateSmartStrategy } from "../../../features/doctor/strategy.js";
import { getKatsayiMap, getPasifIslemler, getSurecKatsayisi } from "../../../lib/constants.js";
import { normalizeText } from "../../../utils/text-utils.js";

let currentData = [];
let currentTavanKatsayi = 1.0;
let simulatorModal = null;
let sliderStates = new Map();

function createSimulatorModal() {
  const modal = document.createElement("div");
  modal.id = "simulatorModal";
  modal.className = "simulator-modal";
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="simulator-modal-overlay"></div>
    <div class="simulator-modal-container">
      <div class="simulator-header-bar">
        <div class="header-katsayi-row">
          <span class="header-katsayi-label">Mevcut Katsayı</span>
          <span class="header-katsayi-value" id="simCurrentKatsayi">1.00000</span>
          <span class="header-katsayi-arrow">→</span>
          <span class="header-katsayi-label">Tavan</span>
          <span class="header-katsayi-value header-tavan-value" id="simTavanKatsayi">1.00000</span>
        </div>
        <button class="simulator-modal-close" id="closeSimulatorModalBtn">&times;</button>
      </div>

      <div class="simulator-modal-body scrollbar-custom">
        <!-- Öneri Barı (tek satır) -->
        <div class="simulator-suggestion-bar" id="simSuggestionBar">
          <span class="suggestion-bar-icon">💡</span>
          <span class="suggestion-bar-text" id="simSuggestionText">Hesaplanıyor...</span>
          <button class="suggestion-bar-detail" id="openSuggestionDetailBtn">Detay</button>
          <button class="suggestion-bar-apply" id="applySuggestionBtn">Uygula</button>
        </div>

        <!-- Slider Listesi (maksimum alan) -->
        <div class="simulator-sliders-container">
          <div class="sliders-list scrollbar-custom" id="simSlidersList">
          </div>
        </div>

        <!-- Floating Sonuç Badge (sağ alt) -->
        <div class="simulator-result-float" id="simResultFloat">
          <span class="result-float-value" id="simResultFloatValue">1.00000</span>
        </div>
      </div>

      <div class="simulator-modal-footer">
        <button class="simulator-footer-btn simulator-footer-btn-secondary" id="resetSimulationBtn">🔄 Sıfırla</button>
        <button class="simulator-footer-btn simulator-footer-btn-primary" id="closeSimulatorBtn">Kapat</button>
      </div>
    </div>
  `;

  return modal;
}

// Modal'ı göster
export function showSimulatorModal(data, tavanKatsayi) {
  currentData = JSON.parse(JSON.stringify(data));
  currentTavanKatsayi = tavanKatsayi;

  if (!simulatorModal) {
    simulatorModal = createSimulatorModal();
    document.body.appendChild(simulatorModal);
    bindSimulatorEvents();
  }

  sliderStates.clear();

  updateSlidersList();
  updateStatusBar();
  updateSuggestionBar();
  updateResultBadge();

  simulatorModal.style.display = "flex";
}

// Modal'ı kapat
export function closeSimulatorModal() {
  if (simulatorModal) {
    simulatorModal.style.display = "none";
  }
}

// Event listener'ları bağla
function bindSimulatorEvents() {
  const closeBtn = document.getElementById("closeSimulatorModalBtn");
  const closeFooterBtn = document.getElementById("closeSimulatorBtn");
  const overlay = simulatorModal.querySelector(".simulator-modal-overlay");
  const resetBtn = document.getElementById("resetSimulationBtn");
  const applySuggestionBtn = document.getElementById("applySuggestionBtn");
  const detailBtn = document.getElementById("openSuggestionDetailBtn");

  closeBtn?.addEventListener("click", closeSimulatorModal);
  closeFooterBtn?.addEventListener("click", closeSimulatorModal);
  overlay?.addEventListener("click", closeSimulatorModal);

  resetBtn?.addEventListener("click", () => {
    sliderStates.clear();
    updateSlidersList();
    updateStatusBar();
    updateSuggestionBar();
    updateResultBadge();
  });

  applySuggestionBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    applySmartSuggestion();
  });

  detailBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    openSuggestionPopup();
  });
}

// Akıllı öneriyi uygula
function applySmartSuggestion() {
  const mapNorm = getKatsayiMapNorm();
  const strategy = calculateSmartStrategy(currentData, currentTavanKatsayi, mapNorm);

  if (strategy.type === "single" && strategy.strategy) {
    const item = currentData.find((d) => d.ad === strategy.strategy.islem);
    if (item) {
      sliderStates.set(strategy.strategy.islem, strategy.strategy.targetYapilan);
    }
  } else if (strategy.type === "combination" && strategy.strategy.steps) {
    strategy.strategy.steps.forEach((step) => {
      sliderStates.set(step.islem, step.targetYapilan);
    });
  }

  updateSlidersList();
  updateStatusBar();
  updateSuggestionBar();
  updateResultBadge();
}

function updateSimulatorUI() {
  updateStatusBar();
  updateSuggestionBar();
  updateResultBadge();
}

// Yardımcı: map oluştur
function getKatsayiMapNorm() {
  const ay = getDomAy();
  const yil = getDomYil();
  const map = getKatsayiMap(ay, yil);
  const norm = new Map();
  for (let [k, v] of map.entries()) norm.set(normalizeText(k), v);
  return norm;
}

function getPasifListe() {
  const ay = getDomAy();
  const yil = getDomYil();
  return getPasifIslemler(ay, yil);
}

// ========== YENİ FONKSİYONLAR ==========

// Header katsayı barını güncelle
function updateStatusBar() {
  const mapNorm = getKatsayiMapNorm();
  const surecKatsayisi = getSurecKatsayisi(getDomAy(), getDomYil());
  const currentKatsayi = calculateCurrentKatsayi(currentData, mapNorm, surecKatsayisi);

  const currentEl = document.getElementById("simCurrentKatsayi");
  const tavanEl = document.getElementById("simTavanKatsayi");

  if (currentEl) currentEl.textContent = currentKatsayi.toFixed(5);
  if (tavanEl) tavanEl.textContent = currentTavanKatsayi.toFixed(5);

  // Tavan aşıldıysa yeşil renklendir
  if (currentEl && tavanEl) {
    const reached = currentKatsayi >= currentTavanKatsayi;
    currentEl.style.color = reached ? "var(--green)" : "";
    tavanEl.style.color = reached ? "var(--green)" : "";
  }
}

// Öneri barını güncelle (tek satır)
function updateSuggestionBar() {
  const mapNorm = getKatsayiMapNorm();
  const strategy = calculateSmartStrategy(currentData, currentTavanKatsayi, mapNorm);
  const textEl = document.getElementById("simSuggestionText");
  const barEl = document.getElementById("simSuggestionBar");
  const applyBtn = document.getElementById("applySuggestionBtn");

  if (!textEl) return;

  if (strategy.reached && strategy.message) {
    textEl.textContent = "🎉 Tavan katsayısına ulaşıldı!";
    if (applyBtn) applyBtn.style.display = "none";
    barEl?.classList.add("suggestion-bar-success");
  } else if (strategy.type === "single" && strategy.strategy) {
    const s = strategy.strategy;
    textEl.textContent = `+${s.needed} ${s.islem}`;
    if (applyBtn) applyBtn.style.display = "";
    barEl?.classList.remove("suggestion-bar-success");
  } else if (strategy.type === "combination" && strategy.strategy.steps && strategy.strategy.steps.length > 0) {
    const totalNeeded = strategy.strategy.totalNeeded;
    const stepsCount = strategy.strategy.steps.length;
    const reached = strategy.strategy.reached;
    textEl.textContent = reached
      ? `+${totalNeeded} toplam (${stepsCount} işlem)`
      : `+${totalNeeded} toplam — Tavana ulaşılamaz`;
    if (applyBtn) applyBtn.style.display = "";
    barEl?.classList.remove("suggestion-bar-success");
  } else {
    textEl.textContent = "Tavana ulaşılamıyor";
    if (applyBtn) applyBtn.style.display = "none";
    barEl?.classList.remove("suggestion-bar-success");
  }
}

// Öneri popup'ını aç (detaylı görünüm)
async function openSuggestionPopup() {
  const mapNorm = getKatsayiMapNorm();
  const strategy = calculateSmartStrategy(currentData, currentTavanKatsayi, mapNorm);
  const { messageDialog } = await import("../../../ui/components/index.js");

  if (strategy.reached && strategy.message) {
    await messageDialog(strategy.message, "Akıllı Öneri");
    return;
  }

  let content = "";
  if (strategy.type === "single" && strategy.strategy) {
    const s = strategy.strategy;
    const mevcutYuzde = Math.round((s.currentYapilan / s.gereken) * 100);
    const hedefYuzde = Math.round((s.targetYapilan / s.gereken) * 100);
    content = `⭐ ${s.islem}\n\nMevcut: ${s.currentYapilan} / ${s.gereken} (%${mevcutYuzde})\nHedef:  ${s.targetYapilan} / ${s.gereken} (%${hedefYuzde})\n\n📌 Yapılması Gereken: +${s.needed} adet\n✅ Ulaşılırsa Katsayı: ${s.newKatsayi.toFixed(5)} (≥ ${currentTavanKatsayi.toFixed(5)})`;
  } else if (strategy.type === "combination" && strategy.strategy.steps && strategy.strategy.steps.length > 0) {
    const steps = strategy.strategy.steps.map((s, i) => `  ${i + 1}. ${s.islem}: +${s.needed}`).join("\n");
    const finalKatsayi = strategy.strategy.finalKatsayi;
    const reached = strategy.strategy.reached;
    content = `${steps}\n\n📊 Toplam: +${strategy.strategy.totalNeeded} adet\n${reached ? "✅" : "⚠️"} Ulaşılacak Katsayı: ${finalKatsayi.toFixed(5)}`;
  } else {
    content = `Mevcut hedeflerle tavan katsayısına ulaşılamıyor.\n\nMevcut: ${strategy.currentKatsayi.toFixed(5)}\nHedef:  ${strategy.tavanKatsayi.toFixed(5)}`;
  }

  await messageDialog(content, "Akıllı Öneri Detayı");
}

// Floating sonuç badge'ini güncelle
function updateResultBadge() {
  const floatEl = document.getElementById("simResultFloat");
  const valueEl = document.getElementById("simResultFloatValue");
  if (!floatEl || !valueEl) return;

  const mapNorm = getKatsayiMapNorm();
  let simData = JSON.parse(JSON.stringify(currentData));
  sliderStates.forEach((value, islemAdi) => {
    const item = simData.find((d) => d.ad === islemAdi);
    if (item) item.yapilan = value;
  });

  const simKatsayi = calculateCurrentKatsayi(simData, mapNorm);
  const reached = simKatsayi >= currentTavanKatsayi;

  valueEl.textContent = simKatsayi.toFixed(5);

  if (reached) {
    floatEl.classList.add("result-float-success");
  } else {
    floatEl.classList.remove("result-float-success");
  }
}

// Slider listesini oluştur
function updateSlidersList() {
  const container = document.getElementById("simSlidersList");
  if (!container) return;

  const mapNorm = getKatsayiMapNorm();
  const items = analyzeAllItems(currentData, mapNorm, getPasifListe());

  container.innerHTML = "";

  items.forEach((item) => {
    const etkiliYapilan = item.yapilan;
    const currentValue = sliderStates.get(item.ad) ?? etkiliYapilan;
    const maxValue = item.maxYapilan;
    const remaining = maxValue - currentValue;
    const percentage = (currentValue / item.gereken) * 100;

    const sliderItem = document.createElement("div");
    sliderItem.className = "slider-item";
    sliderItem.dataset.islem = item.ad;

    let groupEn = item.groupEn;
    if (!groupEn) {
      groupEn = item.group.replace(/İ/g, "I").replace(/ı/g, "i").toLowerCase();
    }

    const groupClass = `priority-${groupEn}`;
    sliderItem.classList.add(groupClass);

    sliderItem.innerHTML = `
      <div class="slider-header">
        <div class="slider-title">
          <span class="slider-icon">${getGroupIcon(item.group)}</span>
          <span class="slider-islem">${item.ad}</span>
          ${remaining > 0 ? `<span class="slider-badge needed">+${remaining}</span>` : '<span class="slider-badge complete">✓</span>'}
        </div>
        <div class="slider-stats">
          <span>${currentValue} / ${item.gereken}</span>
          <span class="slider-percentage">%${Math.round(percentage)}</span>
        </div>
      </div>

      <div class="slider-control">
        <input type="range"
               class="sim-slider"
               min="${etkiliYapilan}"
               max="${maxValue}"
               value="${currentValue}"
               step="1"
               data-islem="${item.ad}">
        <button class="slider-max-btn" data-islem="${item.ad}" data-max="${maxValue}">${remaining > 0 ? `+${remaining}` : "✓"}</button>
      </div>
    `;

    container.appendChild(sliderItem);

    const slider = sliderItem.querySelector(".sim-slider");
    const maxBtn = sliderItem.querySelector(".slider-max-btn");

    // Slider event listener
    slider.addEventListener("input", (e) => {
      const newValue = parseInt(e.target.value);

      if (newValue === etkiliYapilan) {
        sliderStates.delete(item.ad);
      } else {
        sliderStates.set(item.ad, newValue);
      }

      const newRemaining = maxValue - newValue;

      const maxBtn = sliderItem.querySelector(".slider-max-btn");
      if (maxBtn) {
        maxBtn.textContent = newRemaining > 0 ? `+${newRemaining}` : "✓";
      }

      const badge = sliderItem.querySelector(".slider-badge");
      if (badge) {
        badge.textContent = newRemaining > 0 ? `+${newRemaining}` : "✓";
        badge.className = newRemaining > 0 ? "slider-badge needed" : "slider-badge complete";
      }

      const statsSpan = sliderItem.querySelector(".slider-stats span:first-child");
      if (statsSpan) {
        statsSpan.textContent = `${newValue} / ${item.gereken}`;
      }

      const percentSpan = sliderItem.querySelector(".slider-percentage");
      if (percentSpan) {
        const newPercentage = (newValue / item.gereken) * 100;
        percentSpan.textContent = `%${Math.round(newPercentage)}`;
      }

      updateStatusBar();
      updateResultBadge();
      updateSuggestionBar();
    });

    // Max butonu event listener
    maxBtn.addEventListener("click", () => {
      slider.value = maxValue;
      sliderStates.set(item.ad, maxValue);

      maxBtn.textContent = "✓";
      const badge = sliderItem.querySelector(".slider-badge");
      if (badge) {
        badge.textContent = "✓";
        badge.className = "slider-badge complete";
      }

      const statsSpan = sliderItem.querySelector(".slider-stats span:first-child");
      if (statsSpan) {
        statsSpan.textContent = `${maxValue} / ${item.gereken}`;
      }
      const percentSpan = sliderItem.querySelector(".slider-percentage");
      if (percentSpan) {
        const maxPercentage = (maxValue / item.gereken) * 100;
        percentSpan.textContent = `%${Math.round(maxPercentage)}`;
      }

      updateSimulatorUI();
    });
  });
}

// Grup ikonunu döndür
function getGroupIcon(group) {
  const icons = {
    Tarama: "🔍",
    İzlem: "📋",
    Kanser: "🎗️",
    Diğer: "📌",
  };
  return icons[group] || "📌";
}

// ESC tuşu ile kapat
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && simulatorModal?.style.display === "flex") {
    closeSimulatorModal();
  }
});

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
        <span class="header-katsayi-value" id="simHeaderKatsayi">1.00000</span>
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
      </div>

      <div class="simulator-modal-footer">
        <button class="simulator-footer-btn simulator-footer-btn-secondary" id="resetSimulationBtn">
          <img src="icons/reset.png" class="btn-icon" alt=""> Sıfırla
        </button>
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
  updateHeaderKatsayi();
  updateSuggestionBar();

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
    updateHeaderKatsayi();
    updateSuggestionBar();
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
  updateHeaderKatsayi();
  updateSuggestionBar();
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

// Header katsayısını güncelle (sadece simüle katsayı)
function updateHeaderKatsayi() {
  const mapNorm = getKatsayiMapNorm();
  let simData = JSON.parse(JSON.stringify(currentData));
  sliderStates.forEach((value, islemAdi) => {
    const item = simData.find((d) => d.ad === islemAdi);
    if (item) item.yapilan = value;
  });

  const simKatsayi = calculateCurrentKatsayi(simData, mapNorm);
  const reached = simKatsayi >= currentTavanKatsayi;

  const el = document.getElementById("simHeaderKatsayi");
  if (el) {
    el.textContent = simKatsayi.toFixed(5);
    el.style.color = reached ? "var(--green)" : "";
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

// Öneri popup'ını aç (modal içi inline overlay)
function openSuggestionPopup() {
  const mapNorm = getKatsayiMapNorm();
  const strategy = calculateSmartStrategy(currentData, currentTavanKatsayi, mapNorm);

  // Eski popup varsa kaldır
  document.getElementById("suggestionPopupOverlay")?.remove();

  if (strategy.reached && strategy.message) {
    showInlinePopup("🎉", strategy.message, false);
    return;
  }

  let title = "💡 Akıllı Öneri";
  let content = "";

  if (strategy.type === "single" && strategy.strategy) {
    const s = strategy.strategy;
    const mevcutYuzde = Math.round((s.currentYapilan / s.gereken) * 100);
    const hedefYuzde = Math.round((s.targetYapilan / s.gereken) * 100);
    content = `⭐ ${s.islem}\n\nMevcut: ${s.currentYapilan} / ${s.gereken} (%${mevcutYuzde})\nHedef:  ${s.targetYapilan} / ${s.gereken} (%${hedefYuzde})\n\n📌 Yapılması Gereken: +${s.needed} adet\n✅ Ulaşılırsa Katsayı: ${s.newKatsayi.toFixed(5)}`;
  } else if (strategy.type === "combination" && strategy.strategy.steps && strategy.strategy.steps.length > 0) {
    const steps = strategy.strategy.steps.map((s, i) => `  ${i + 1}. ${s.islem}: +${s.needed}`).join("\n");
    const finalKatsayi = strategy.strategy.finalKatsayi;
    const reached = strategy.strategy.reached;
    content = `${steps}\n\n📊 Toplam: +${strategy.strategy.totalNeeded} adet\n${reached ? "✅" : "⚠️"} Ulaşılacak Katsayı: ${finalKatsayi.toFixed(5)}`;
  } else {
    content = `Mevcut hedeflerle tavan katsayısına ulaşılamıyor.\n\nMevcut: ${strategy.currentKatsayi.toFixed(5)}\nHedef:  ${strategy.tavanKatsayi.toFixed(5)}`;
  }

  showInlinePopup(title, content, true);
}

// Modal içi inline popup (overlay + card)
function showInlinePopup(title, body, showApply) {
  const overlay = document.createElement("div");
  overlay.id = "suggestionPopupOverlay";
  overlay.className = "suggestion-popup-overlay";
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.innerHTML = `
    <div class="suggestion-popup-card">
      <div class="suggestion-popup-title">${title}</div>
      <div class="suggestion-popup-body">${body.replace(/\n/g, "<br>")}</div>
      <div class="suggestion-popup-footer">
        ${showApply ? '<button class="suggestion-popup-btn primary" id="popupApplyBtn">Uygula</button>' : ""}
        <button class="suggestion-popup-btn" id="popupCloseBtn">Kapat</button>
      </div>
    </div>
  `;

  simulatorModal.appendChild(overlay);

  overlay.querySelector("#popupCloseBtn")?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#popupApplyBtn")?.addEventListener("click", () => {
    applySmartSuggestion();
    overlay.remove();
  });
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

      updateHeaderKatsayi();
      updateSuggestionBar();
    });

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

      updateHeaderKatsayi();
      updateSuggestionBar();
    });
  });
}

function getGroupIcon(group) {
  const icons = {
    Tarama: "🔍",
    İzlem: "📋",
    Kanser: "🎗️",
    Diğer: "📌",
  };
  return icons[group] || "📌";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const popup = document.getElementById("suggestionPopupOverlay");
    if (popup) { popup.remove(); return; }
    if (simulatorModal?.style.display === "flex") closeSimulatorModal();
  }
});

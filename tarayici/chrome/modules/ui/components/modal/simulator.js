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
        <span class="header-spacer"></span>
        <span class="header-katsayi-value" id="simHeaderKatsayi">1.00000</span>
        <span class="header-spacer"></span>
      </div>

      <div class="simulator-modal-body scrollbar-custom">
        <div class="simulator-suggestion-bar" id="simSuggestionBar">
          <span class="suggestion-bar-icon">💡</span>
          <span class="suggestion-bar-text" id="simSuggestionText">Hesaplanıyor...</span>
          <button class="suggestion-bar-apply" id="applySuggestionBtn">Uygula</button>
        </div>

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

export function closeSimulatorModal() {
  if (simulatorModal) {
    simulatorModal.style.display = "none";
  }
}

function bindSimulatorEvents() {
  const closeFooterBtn = document.getElementById("closeSimulatorBtn");
  const overlay = simulatorModal.querySelector(".simulator-modal-overlay");
  const resetBtn = document.getElementById("resetSimulationBtn");
  const applySuggestionBtn = document.getElementById("applySuggestionBtn");
  const suggestionBar = document.getElementById("simSuggestionBar");

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

  suggestionBar?.addEventListener("click", (e) => {
    if (e.target === applySuggestionBtn || applySuggestionBtn?.contains(e.target)) return;
    openSuggestionPopup();
  });
}

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

// ========== HEADER ==========

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
    el.style.color = reached ? "var(--green)" : "var(--red)";
    el.style.textShadow = reached
      ? "0 0 10px rgba(30, 180, 130, 0.4)"
      : "0 0 10px rgba(237, 146, 27, 0.35)";
  }
}

// ========== ÖNERİ BARI ==========

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

// ========== INLINE POPUP ==========

function openSuggestionPopup() {
  const mapNorm = getKatsayiMapNorm();
  const strategy = calculateSmartStrategy(currentData, currentTavanKatsayi, mapNorm);

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

function showInlinePopup(title, body, showApply) {
  // Eski overlay'i temizle
  document.getElementById("suggestionPopupOverlay")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "suggestionPopupOverlay";
  overlay.className = "suggestion-popup-overlay";
  
  // Holografik parçacık efekti için canvas
  const canvas = document.createElement("canvas");
  canvas.className = "holographic-particles";
  
  // Ana kart - 3D perspektifli
  const card = document.createElement("div");
  card.className = "suggestion-popup-card holographic-card";
  
  // Strateji tipine göre dinamik içerik
  const strategyEmoji = getStrategyEmoji(body);
  const animationClass = getAnimationClass(body);
  
  card.innerHTML = `
    <div class="holographic-scan-line"></div>
    <div class="holographic-glare"></div>
    
    <div class="popup-header-glow">
      <div class="holographic-avatar ${animationClass}">
        <div class="avatar-core">${strategyEmoji}</div>
        <div class="avatar-rings">
          <div class="ring ring-1"></div>
          <div class="ring ring-2"></div>
          <div class="ring ring-3"></div>
        </div>
      </div>
      <div class="suggestion-popup-title typewriter">${title}</div>
    </div>
    
    <div class="suggestion-popup-body interactive-strategy">
      ${formatStrategyBody(body, showApply)}
    </div>
    
    <div class="suggestion-popup-footer futuristic-controls">
      ${showApply ? `
        <button class="suggestion-popup-btn primary pulse-glow" id="popupApplyBtn">
          <span class="btn-icon-wrapper">
            <span class="icon-sparkle">✨</span>
            <span class="btn-text">Uygula</span>
          </span>
          <div class="btn-particle-burst"></div>
        </button>
      ` : `
        <div class="completion-celebration">
          <span class="celebration-text">🎉 Mükemmel!</span>
        </div>
      `}
      <button class="suggestion-popup-btn secondary-ghost" id="popupCloseBtn">
        <span class="close-icon">✕</span>
      </button>
    </div>
    
    <div class="data-streams">
      <div class="data-stream stream-left"></div>
      <div class="data-stream stream-right"></div>
    </div>
  `;

  overlay.appendChild(canvas);
  overlay.appendChild(card);

  simulatorModal.appendChild(overlay);

  // Parçacık animasyonunu başlat
  const animId = initHolographicParticles(canvas);
  overlay._particleAnimId = animId;
  overlay._particleCanvas = canvas;

  // Mouse takibi ile 3D kart efekti
  initParallaxTilt(card);
  
  // Event listeners
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      animateOut(overlay);
    }
  });

  overlay.querySelector("#popupCloseBtn")?.addEventListener("click", () => {
    animateOut(overlay);
  });
  
  overlay.querySelector("#popupApplyBtn")?.addEventListener("click", () => {
    // Apply butonuna basınca partikül patlaması
    createBurstEffect(overlay.querySelector("#popupApplyBtn"));
    
    setTimeout(() => {
      applySmartSuggestion();
      animateOut(overlay, true);
    }, 400);
  });

  // Giriş animasyonu
  requestAnimationFrame(() => {
    overlay.classList.add("active");
    card.classList.add("active");
  });
}

// Yardımcı fonksiyonlar
function getStrategyEmoji(body) {
  if (body.includes("ulaşılamıyor")) return "🔬";
  if (body.includes("Tavana ulaşılamaz")) return "📊";
  if (body.includes("Ulaşılacak")) return "🎯";
  return "💡";
}

function getAnimationClass(body) {
  if (body.includes("ulaşılamıyor")) return "warning-pulse";
  if (body.includes("Tavana ulaşılamaz")) return "analyzing-spin";
  return "success-glow";
}

function formatStrategyBody(body, showApply) {
  // Sayıları ve önemli verileri vurgula
  return body
    .replace(/(\+(\d+))/g, '<span class="highlight-number">$1</span>')
    .replace(/(%\d+)/g, '<span class="highlight-percentage">$1</span>')
    .replace(/(\d+\.\d{5})/g, '<span class="highlight-katsayi">$1</span>')
    .replace(/\n/g, "<br>");
}

function initHolographicParticles(canvas) {
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const particles = Array.from({ length: 20 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speedX: (Math.random() - 0.5) * 0.5,
    speedY: (Math.random() - 0.5) * 0.5,
    opacity: Math.random() * 0.5 + 0.2,
    color: `hsl(${Math.random() * 60 + 200}, 100%, 70%)`
  }));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      
      if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
      if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      
      // Bağlantı çizgileri
      particles.forEach(p2 => {
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(100, 200, 255, ${0.1 * (1 - dist/100)})`;
          ctx.stroke();
        }
      });
    });
    
    ctx.globalAlpha = 1;
    return requestAnimationFrame(animate);
  }

  return animate();
}

function initParallaxTilt(card) {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / centerY * -10;
    const rotateY = (x - centerX) / centerX * 10;
    
    card.style.transform = `
      perspective(1000px) 
      rotateX(${rotateX}deg) 
      rotateY(${rotateY}deg) 
      scale(1.02)
    `;
  });
  
  card.addEventListener("mouseleave", () => {
    card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
  });
}

function createBurstEffect(element) {
  const burst = element.querySelector(".btn-particle-burst");
  if (!burst) return;
  
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement("div");
    particle.className = "burst-particle";
    const angle = (i / 12) * Math.PI * 2;
    const velocity = 50 + Math.random() * 30;
    
    particle.style.setProperty("--tx", Math.cos(angle) * velocity + "px");
    particle.style.setProperty("--ty", Math.sin(angle) * velocity + "px");
    particle.style.background = `hsl(${Math.random() * 60 + 200}, 100%, 60%)`;
    
    burst.appendChild(particle);
    setTimeout(() => particle.remove(), 600);
  }
}

function animateOut(element, success = false) {
  // Canvas animasyonunu durdur
  if (element._particleAnimId) {
    cancelAnimationFrame(element._particleAnimId);
  }

  element.style.opacity = "0";
  element.style.transform = "scale(0.9)";
  if (success) {
    element.querySelector(".suggestion-popup-card").style.transform = 
      "perspective(1000px) rotateY(15deg) translateX(50px)";
  }
  
  setTimeout(() => element.remove(), 300);
}

// ========== SLIDER LİSTESİ ==========

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

    sliderItem.classList.add(`priority-${groupEn}`);

    sliderItem.innerHTML = `
      <div class="slider-header">
        <div class="slider-title">
          <span class="slider-icon">${getGroupIcon(item.group)}</span>
          <span class="slider-islem">${item.ad}</span>
          ${currentValue > etkiliYapilan
            ? `<span class="slider-badge added">+${currentValue - etkiliYapilan}</span>`
            : '<span class="slider-badge complete">+0</span>'}
        </div>
        <div class="slider-stats">
          <span>${currentValue} / ${item.gereken}</span>
          <span class="slider-percentage">%${Math.round(percentage)}</span>
        </div>
      </div>
      <div class="slider-control">
        <input type="range" class="sim-slider"
               min="${etkiliYapilan}" max="${maxValue}" value="${currentValue}" step="1"
               data-islem="${item.ad}">
        <button class="slider-max-btn" data-islem="${item.ad}" data-max="${maxValue}">${remaining > 0 ? `+${remaining}` : "✓"}</button>
      </div>
    `;

    container.appendChild(sliderItem);

    const slider = sliderItem.querySelector(".sim-slider");
    const maxBtn = sliderItem.querySelector(".slider-max-btn");

    slider.addEventListener("input", (e) => {
      const newValue = parseInt(e.target.value);
      if (newValue === etkiliYapilan) sliderStates.delete(item.ad);
      else sliderStates.set(item.ad, newValue);

      const rem = maxValue - newValue;
      const mb = sliderItem.querySelector(".slider-max-btn");
      if (mb) mb.textContent = rem > 0 ? `+${rem}` : "✓";

      const added = newValue - etkiliYapilan;
      const badge = sliderItem.querySelector(".slider-badge");
      if (badge) {
        badge.textContent = `+${added}`;
        badge.className = added > 0 ? "slider-badge added" : "slider-badge complete";
      }

      const stats = sliderItem.querySelector(".slider-stats span:first-child");
      if (stats) stats.textContent = `${newValue} / ${item.gereken}`;

      const pct = sliderItem.querySelector(".slider-percentage");
      if (pct) pct.textContent = `%${Math.round((newValue / item.gereken) * 100)}`;

      updateHeaderKatsayi();
      updateSuggestionBar();
    });

    maxBtn.addEventListener("click", () => {
      slider.value = maxValue;
      sliderStates.set(item.ad, maxValue);

      maxBtn.textContent = "✓";
      const maxAdded = maxValue - etkiliYapilan;
      const badge = sliderItem.querySelector(".slider-badge");
      if (badge) {
        badge.textContent = `+${maxAdded}`;
        badge.className = maxAdded > 0 ? "slider-badge added" : "slider-badge complete";
      }

      const stats = sliderItem.querySelector(".slider-stats span:first-child");
      if (stats) stats.textContent = `${maxValue} / ${item.gereken}`;

      const pct = sliderItem.querySelector(".slider-percentage");
      if (pct) pct.textContent = `%${Math.round((maxValue / item.gereken) * 100)}`;

      updateHeaderKatsayi();
      updateSuggestionBar();
    });
  });
}

function getGroupIcon(group) {
  const iconMap = {
    Tarama: "icons/screening.png",
    İzlem: "icons/monitoring.png",
    Kanser: "icons/cancer.png",
    Diğer: "icons/other.png",
  };
  const src = iconMap[group] || "icons/other.png";
  return `<img src="${src}" class="slider-group-icon" alt="">`;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const popup = document.getElementById("suggestionPopupOverlay");
    if (popup) { popup.remove(); return; }
    if (simulatorModal?.style.display === "flex") closeSimulatorModal();
  }
});
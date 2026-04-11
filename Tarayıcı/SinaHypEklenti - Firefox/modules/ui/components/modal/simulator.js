// modules/ui/components/modal/simulator.js
// ============================================================
// Performans Simülasyonu Modalı - "Ne Yapmalıyım?"
// ============================================================

import { 
  calculateCurrentKatsayi, 
  calculateSmartStrategy, 
  analyzeAllItems
} from '../../../features/doctor/strategy.js';

let currentData = [];
let currentTavanKatsayi = 1.0;
let simulatorModal = null;
let sliderStates = new Map();

// Modal'ı oluştur
function createSimulatorModal() {
  const modal = document.createElement('div');
  modal.id = 'simulatorModal';
  modal.className = 'simulator-modal';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="simulator-modal-overlay"></div>
    <div class="simulator-modal-container">
      <div class="simulator-modal-header">
        <div class="simulator-modal-icon">🎯</div>
        <h2 class="simulator-modal-title">Performans Simülasyonu</h2>
        <button class="simulator-modal-close" id="closeSimulatorModalBtn">&times;</button>
      </div>
      
      <div class="simulator-modal-body scrollbar-custom">
        
        <!-- 1. AKILLI ÖNERİ (En Üstte - Sabit Değil, İçerik Değişir) -->
        <div class="simulator-suggestion-card" id="simSuggestionCard">
          <div class="suggestion-header">
            <span>💡 AKILLI ÖNERİ</span>
            <button class="suggestion-apply-btn" id="applySuggestionBtn">Öneriyi Uygula</button>
          </div>
          <div class="suggestion-content" id="simSuggestionContent">
            <!-- Dinamik içerik -->
          </div>
        </div>
        
        <!-- 2. SİMÜLASYON SONUCU (Sabit - Sticky) -->
        <div class="simulator-result-card" id="simResultCard">
          <div class="result-header">
            <span>🏆 SİMÜLASYON SONUCU</span>
          </div>
          <div class="result-content" id="simResultContent">
            <!-- Dinamik içerik -->
          </div>
        </div>
        
        <!-- 3. SLIDER'LAR (En Altta - Scroll Edilebilir) -->
        <div class="simulator-sliders-container">
          <h3 class="sliders-title">🎮 Değerleri değiştir, anında gör!</h3>
          <div class="sliders-list scrollbar-custom" id="simSlidersList">
            <!-- Dinamik slider'lar -->
          </div>
        </div>
        
      </div>
      
      <div class="simulator-modal-footer">
        <button class="simulator-footer-btn simulator-footer-btn-secondary" id="resetSimulationBtn">
          🔄 Sıfırla
        </button>
        <button class="simulator-footer-btn simulator-footer-btn-primary" id="closeSimulatorBtn">
          Kapat
        </button>
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
  
  // ✅ İLK AÇILIŞTA SLIDER'LARI OLUŞTUR
  updateSlidersList();
  
  // Diğer UI'ları güncelle
  updateStatusCard();
  updateSuggestionCard();
  updateResultCard();
  
  simulatorModal.style.display = 'flex';
}

// Modal'ı kapat
export function closeSimulatorModal() {
  if (simulatorModal) {
    simulatorModal.style.display = 'none';
  }
}

// Event listener'ları bağla
function bindSimulatorEvents() {
  const closeBtn = document.getElementById('closeSimulatorModalBtn');
  const closeFooterBtn = document.getElementById('closeSimulatorBtn');
  const overlay = simulatorModal.querySelector('.simulator-modal-overlay');
  const resetBtn = document.getElementById('resetSimulationBtn');
  const applySuggestionBtn = document.getElementById('applySuggestionBtn');
  
  closeBtn?.addEventListener('click', closeSimulatorModal);
  closeFooterBtn?.addEventListener('click', closeSimulatorModal);
  overlay?.addEventListener('click', closeSimulatorModal);
  
  resetBtn?.addEventListener('click', () => {
    sliderStates.clear();
    updateSlidersList();  // ✅ Sıfırlayınca yeniden oluştur
    updateStatusCard();
    updateSuggestionCard();
    updateResultCard();
  });
  
  applySuggestionBtn?.addEventListener('click', applySmartSuggestion);
}

// Akıllı öneriyi uygula
function applySmartSuggestion() {
  const strategy = calculateSmartStrategy(currentData, currentTavanKatsayi);
  
  if (strategy.type === 'single' && strategy.strategy) {
    const item = currentData.find(d => d.ad === strategy.strategy.islem);
    if (item) {
      sliderStates.set(strategy.strategy.islem, strategy.strategy.targetYapilan);
    }
  } else if (strategy.type === 'combination' && strategy.strategy.steps) {
    strategy.strategy.steps.forEach(step => {
      sliderStates.set(step.islem, step.targetYapilan);
    });
  }
  
  // ✅ Öneri uygulanınca slider'ları yeniden oluştur
  updateSlidersList();
  updateStatusCard();
  updateSuggestionCard();
  updateResultCard();
}

// Tüm UI'ı güncelle
function updateSimulatorUI() {
  updateStatusCard();
  updateSuggestionCard();
  // updateSlidersList();
  updateResultCard();
}

// Mevcut durum kartını güncelle
function updateStatusCard() {
  const currentKatsayi = calculateCurrentKatsayi(currentData);
  const fark = currentTavanKatsayi - currentKatsayi;
  
  const currentEl = document.getElementById('simCurrentKatsayi');
  const tavanEl = document.getElementById('simTavanKatsayi');
  const farkEl = document.getElementById('simFark');
  
  if (currentEl) currentEl.textContent = currentKatsayi.toFixed(5);
  if (tavanEl) tavanEl.textContent = currentTavanKatsayi.toFixed(5);
  if (farkEl) {
    farkEl.textContent = fark > 0 ? fark.toFixed(5) : '0.00000 ✓';
    farkEl.style.color = fark <= 0 ? 'var(--green)' : 'var(--orange)';
  }

  // Fark elementi varsa gizle veya kaldır
  const farkRow = document.querySelector('.status-row:last-child');
  if (farkRow && farkRow.querySelector('#simFark')) {
    farkRow.style.display = 'none';
  }
}

// Akıllı öneri kartını güncelle
function updateSuggestionCard() {
  const strategy = calculateSmartStrategy(currentData, currentTavanKatsayi);
  const contentEl = document.getElementById('simSuggestionContent');
  const cardEl = document.getElementById('simSuggestionCard');
  
  if (!contentEl) return;
  
  if (strategy.reached && strategy.message) {
    contentEl.innerHTML = `
      <div class="suggestion-success">
        <span class="success-icon">🎉</span>
        <span class="success-text">${strategy.message}</span>
      </div>
    `;
    if (cardEl) cardEl.style.display = 'block';
    return;
  }
  
  if (strategy.type === 'single' && strategy.strategy) {
    const s = strategy.strategy;
    contentEl.innerHTML = `
      <div class="suggestion-single">
        <div class="suggestion-islem">⭐ ${s.islem}</div>
        <div class="suggestion-details">
          <div class="detail-row">
            <span>Mevcut:</span>
            <span>${s.currentYapilan} / ${s.gereken} (%${Math.round(s.currentYapilan/s.gereken*100)})</span>
          </div>
          <div class="detail-row">
            <span>Hedef:</span>
            <span>${s.targetYapilan} / ${s.gereken} (%${Math.round(s.targetYapilan/s.gereken*100)})</span>
          </div>
          <div class="detail-row highlight">
            <span>📌 Yapılması Gereken:</span>
            <span>+${s.needed} adet</span>
          </div>
          <div class="detail-row success">
            <span>✅ Ulaşılırsa Katsayı:</span>
            <span>${s.newKatsayi.toFixed(5)} (≥ ${currentTavanKatsayi.toFixed(5)})</span>
          </div>
        </div>
      </div>
    `;
  } else if (strategy.type === 'combination' && strategy.strategy.steps) {
    const steps = strategy.strategy.steps;
    const totalNeeded = strategy.strategy.totalNeeded;
    const finalKatsayi = strategy.strategy.finalKatsayi;
    const reached = strategy.strategy.reached;
    
    let stepsHtml = '';
    steps.forEach((step, index) => {
      stepsHtml += `
        <div class="combination-step">
          <span class="step-number">${index + 1}.</span>
          <span class="step-islem">${step.islem}</span>
          <span class="step-needed">+${step.needed}</span>
        </div>
      `;
    });
    
    contentEl.innerHTML = `
      <div class="suggestion-combination">
        <div class="combination-steps">
          ${stepsHtml}
        </div>
        <div class="combination-summary">
          <div class="detail-row">
            <span>📊 Toplam Yapılacak:</span>
            <span>+${totalNeeded} adet</span>
          </div>
          <div class="detail-row ${reached ? 'success' : 'warning'}">
            <span>${reached ? '✅' : '⚠️'} Ulaşılırsa Katsayı:</span>
            <span>${finalKatsayi.toFixed(5)} ${reached ? '✓' : ''}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  if (cardEl) cardEl.style.display = 'block';
}

// Slider listesini oluştur
function updateSlidersList() {
  const container = document.getElementById('simSlidersList');
  if (!container) return;
  
  const items = analyzeAllItems(currentData);
  
  container.innerHTML = '';
  
  items.forEach(item => {
    const etkiliYapilan = item.yapilan;  // analyzeAllItems'ten gelen etkili yapılan
    const currentValue = sliderStates.get(item.ad) ?? etkiliYapilan;
    const maxValue = item.maxYapilan;
    const remaining = maxValue - currentValue;
    const percentage = (currentValue / item.gereken) * 100;
    
    const sliderItem = document.createElement('div');
    sliderItem.className = 'slider-item';
    sliderItem.dataset.islem = item.ad;
    
    const groupClass = `priority-${item.group.toLowerCase()}`;
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
        <button class="slider-max-btn" data-islem="${item.ad}" data-max="${maxValue}">${remaining > 0 ? `+${remaining}` : '✓'}</button>
      </div>
    `;
    
    container.appendChild(sliderItem);
    
    const slider = sliderItem.querySelector('.sim-slider');
    const maxBtn = sliderItem.querySelector('.slider-max-btn');
    
    // Slider event listener
    slider.addEventListener('input', (e) => {
      const newValue = parseInt(e.target.value);
      sliderStates.set(item.ad, newValue);
      
      // ✅ Sadece bu slider'ın bağlı olduğu elementleri güncelle
      const newRemaining = maxValue - newValue;
      
      // Buton metnini güncelle
      const maxBtn = sliderItem.querySelector('.slider-max-btn');
      if (maxBtn) {
        maxBtn.textContent = newRemaining > 0 ? `+${newRemaining}` : '✓';
      }
      
      // Badge'i güncelle
      const badge = sliderItem.querySelector('.slider-badge');
      if (badge) {
        badge.textContent = newRemaining > 0 ? `+${newRemaining}` : '✓';
        badge.className = newRemaining > 0 ? 'slider-badge needed' : 'slider-badge complete';
      }
      
      // İstatistikleri güncelle
      const statsSpan = sliderItem.querySelector('.slider-stats span:first-child');
      if (statsSpan) {
        statsSpan.textContent = `${newValue} / ${item.gereken}`;
      }
      
      const percentSpan = sliderItem.querySelector('.slider-percentage');
      if (percentSpan) {
        const newPercentage = (newValue / item.gereken) * 100;
        percentSpan.textContent = `%${Math.round(newPercentage)}`;
      }
      
      // ✅ Sonuç kartını ve durum kartını güncelle (slider listesini DEĞİL!)
      updateStatusCard();
      updateResultCard();
      
      // Akıllı öneri kartını güncelle (opsiyonel, performans için throttle edilebilir)
      updateSuggestionCard();
    });
    
    // Max butonu event listener
    maxBtn.addEventListener('click', () => {
      slider.value = maxValue;
      sliderStates.set(item.ad, maxValue);
      
      // Buton ve badge'i güncelle
      maxBtn.textContent = '✓';
      const badge = sliderItem.querySelector('.slider-badge');
      if (badge) {
        badge.textContent = '✓';
        badge.className = 'slider-badge complete';
      }
      
      // İstatistikleri güncelle
      const statsSpan = sliderItem.querySelector('.slider-stats span:first-child');
      if (statsSpan) {
        statsSpan.textContent = `${maxValue} / ${item.gereken}`;
      }
      const percentSpan = sliderItem.querySelector('.slider-percentage');
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
    'Tarama': '🔍',
    'İzlem': '📋',
    'Kanser': '🎗️',
    'Diğer': '📌'
  };
  return icons[group] || '📌';
}

// Sonuç kartını güncelle
function updateResultCard() {
  const contentEl = document.getElementById('simResultContent');
  if (!contentEl) return;
  
  // Slider'lardaki değerlerle simüle edilmiş data'yı oluştur
  let simData = JSON.parse(JSON.stringify(currentData));
  
  sliderStates.forEach((value, islemAdi) => {
    const item = simData.find(d => d.ad === islemAdi);
    if (item) {
      item.yapilan = value;
    }
  });
  
  const simKatsayi = calculateCurrentKatsayi(simData);
  const reached = simKatsayi >= currentTavanKatsayi;
  const totalEkYapilan = Array.from(sliderStates.entries()).reduce((sum, [islem, value]) => {
    const original = currentData.find(d => d.ad === islem);
    return sum + Math.max(0, value - (original?.yapilan || 0));
  }, 0);
  
  contentEl.innerHTML = `
    <div class="result-main ${reached ? 'success' : ''}">
      <div class="result-katsayi">
        <span class="result-label">Simüle Edilen Katsayı</span>
        <span class="result-value">${simKatsayi.toFixed(5)}</span>
      </div>
      <div class="result-status">
        ${reached ? 
          '<span class="status-success">🎉 TAVAN KATSAYISINA ULAŞILDI!</span>' : 
          '<span class="status-progress">⚠️ Henüz tavan katsayısına ulaşılamadı</span>'
        }
      </div>
      ${totalEkYapilan > 0 ? `
        <div class="result-total">
          <span>Toplam Ek Yapılan:</span>
          <span class="total-value">+${totalEkYapilan} adet</span>
        </div>
      ` : ''}
    </div>
  `;
}

// ESC tuşu ile kapat
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && simulatorModal?.style.display === 'flex') {
    closeSimulatorModal();
  }
});

// modules/features/doctor/strategy.js
// ============================================================
// Performans Simülasyonu ve Strateji Hesaplama
// ============================================================

import { 
  katsayiMapNormalized, 
  SUREC_KATSAYISI, 
  PRIORITY_ORDER_NORMALIZED,
  PASIF_ISLEMLER_NORMALIZED 
} from '../../lib/constants.js';
import { getEffectiveYapilan } from '../../lib/calculations.js';
import { calculateDoctorKatsayi } from './calculator.js';
import { normalizeText } from '../../utils/text-utils.js';


// ============================================================
// ZORLUK KATSAYILARI (v2.1.3)
// ============================================================
const ZORLUK_LISTESI = new Map([
  ["DİYABET TARAMASI", 3],
  ["HİPERTANSİYON TARAMASI", 1],
  ["OBEZİTE TARAMASI", 1],
  ["KVR TARAMASI", 4],
  ["KVR İZLEMİ", 2],
  ["DİYABET İZLEMİ", 6],
  ["HİPERTANSİYON İZLEM", 3],
  ["YAŞLI SAĞLIĞI İZLEMİ", 5],
  ["OBEZİTE İZLEMİ", 8],
  ["KANSER KOLOREKTAL TARAMASI", 7],
  ["KANSER MAMOGRAFİ TARAMASI", 10],
  ["KANSER SERVİKS TARAMASI", 10]
]);

/**
 * Bir işlemin zorluk puanını döndürür.
 * @param {string} islemAdi İşlemin adı
 * @returns {number} Zorluk puanı (1-10, bulunamazsa 5)
 */
function getZorlukPuani(islemAdi) {
  const normalizedAd = normalizeText(islemAdi);
  for (const [key, value] of ZORLUK_LISTESI.entries()) {
    if (normalizedAd.includes(normalizeText(key))) {
      return value;
    }
  }
  return 5; // Listede yoksa orta zorluk (5) varsay
}




// Öncelik sıralaması - Taramalar > İzlemler > Kanser
const PRIORITY_ORDER = [
  // 1. Öncelik: Taramalar (en yüksek katsayı potansiyeli)
  'HİPERTANSİYON TARAMASI',
  'OBEZİTE TARAMASI',
  'DİYABET TARAMASI',
  'KVR TARAMASI',
  
  // 2. Öncelik: İzlemler
  'HİPERTANSİYON İZLEM',
  'DİYABET İZLEM',
  'KVR İZLEM',
  'OBEZİTE İZLEM',

  // 3. Öncelik: Kanser Taramaları
  'KANSER KOLOREKTAL',
  'KANSER MAMOGRAFİ',
  'KANSER SERVİKS'
];

// Pasif işlemler (katsayı hesaplamasına dahil edilmez)
const PASIF_ISLEMLER = ['İNME', 'BÖBREK', 'BOBREK', 'KORONERARTER', 'KORONER'];

// İşlem adlarını normalize et
function normalizeIslemAdi(ad) {
  return normalizeText(ad);
}

// İşlemin aktif olup olmadığını kontrol et (pasif değilse aktif)
function isAktifIslem(islemAdi) {
  const ad = normalizeText(islemAdi);
  return !PASIF_ISLEMLER_NORMALIZED.some(pasif => ad.includes(pasif));
}

// İşlemin hangi öncelik grubunda olduğunu bul
function getPriorityGroup(islemAdi) {
  const ad = normalizeText(islemAdi);
  
  const index = PRIORITY_ORDER_NORMALIZED.findIndex(item => ad.includes(item));
  
  if (index === -1) return { group: 'Tarama', priority: 1, groupEn: 'tarama' };
  
  let group, groupEn;
  if (index < 4) { group = 'Tarama'; groupEn = 'tarama'; }
  else if (index < 8) { group = 'İzlem'; groupEn = 'izlem'; }
  else { group = 'Kanser'; groupEn = 'kanser'; }
  
  return { group, groupEn, priority: index < 4 ? 1 : index < 8 ? 2 : 3 };
}

// Mevcut toplam katsayıyı hesapla (sadece aktif işlemler)
export function calculateCurrentKatsayi(data) {
  if (!data || data.length === 0) return 1.0;
  
  let toplamCarpim = 1.0;
  
  data.forEach(item => {
    if (isAktifIslem(item.ad)) {
      const ger = parseFloat(item.gereken) || 0;
      const yap = parseFloat(item.yapilan) || 0;
      const dev = parseFloat(item.devreden) || 0;
      toplamCarpim *= calculateDoctorKatsayi(item.ad, ger, yap, dev);
    }
  });
  
  return toplamCarpim * SUREC_KATSAYISI;
}

// Tek bir işlemi değiştirerek simülasyon yap
export function simulateSingleChange(data, islemAdi, newYapilan) {
  const simData = data.map(item => {
    const itemAd = normalizeIslemAdi(item.ad);
    const targetAd = normalizeIslemAdi(islemAdi);
    
    if (itemAd.includes(targetAd) || targetAd.includes(itemAd)) {
      return { ...item, yapilan: newYapilan };
    }
    return { ...item };
  });
  
  return {
    data: simData,
    katsayi: calculateCurrentKatsayi(simData)
  };
}

// Bir işlem için maksimum katsayıya ulaşmak için gereken yapılan sayısı
export function getMaxYapilanForIslem(item) {
  const ad = normalizeText(item.ad);
  const gereken = parseFloat(item.gereken) || 0;
  
  let azamiOran = 90; // Varsayılan
  
  for (let [anahtar, k] of katsayiMapNormalized.entries()) {
    if (ad.includes(anahtar)) {
      azamiOran = k.azamiOran;
      break;
    }
  }
  
  return Math.ceil(gereken * azamiOran / 100);
}

// Bir işlemi maksimuma çekmek için gereken ek yapılan
export function getNeededForMax(item) {
  const maxYapilan = getMaxYapilanForIslem(item);
  const gereken = parseFloat(item.gereken) || 0;
  const yapilan = parseFloat(item.yapilan) || 0;
  const devreden = parseFloat(item.devreden) || 0;
  
  // ✅ Etkili yapılan'ı kullan
  const etkiliYapilan = getEffectiveYapilan(gereken, yapilan, devreden);
  
  return Math.max(0, maxYapilan - etkiliYapilan);
}

// Akıllı öneri - en az işlemle tavan katsayısına ulaş
export function calculateSmartStrategy(data, tavanKatsayi) {
  const currentKatsayi = calculateCurrentKatsayi(data);
  
  // Zaten ulaşılmış mı?
  if (currentKatsayi >= tavanKatsayi) {
    return {
      reached: true,
      message: '🎉 Tavan katsayısına zaten ulaşılmış!',
      currentKatsayi,
      tavanKatsayi
    };
  }
  
  // Sadece aktif işlemleri filtrele
  const aktifItems = data.filter(item => isAktifIslem(item.ad));
  
  const strategies = [];
  
  // Her aktif işlem için tek başına maksimuma çekme stratejisi
  for (const item of aktifItems) {
    const needed = getNeededForMax(item);
    if (needed === 0) continue;
    
    const maxYapilan = getMaxYapilanForIslem(item);
    const simResult = simulateSingleChange(data, item.ad, maxYapilan);
    const priority = getPriorityGroup(item.ad);
    
    strategies.push({
      type: 'single',
      islem: item.ad,
      currentYapilan: parseFloat(item.yapilan) || 0,
      targetYapilan: maxYapilan,
      needed: needed,
      gereken: parseFloat(item.gereken) || 0,
      newKatsayi: simResult.katsayi,
      improvement: simResult.katsayi - currentKatsayi,
      reached: simResult.katsayi >= tavanKatsayi,
      priority: priority.priority,
      group: priority.group
    });
  }
  
  // Tek başına ulaşanları filtrele
  const singleSuccess = strategies.filter(s => s.reached);
  
  if (singleSuccess.length > 0) {
    // En az işlemle ve EN KOLAY olanı bul
    singleSuccess.sort((a, b) => {
      // 1. Öncelik: Daha az işlem
      if (a.needed !== b.needed) return a.needed - b.needed;
      // 2. Öncelik: Daha kolay işlem
      return getZorlukPuani(a.islem) - getZorlukPuani(b.islem);
    });
    const best = singleSuccess[0];
    
    return {
      reached: true,
      type: 'single',
      strategy: best,
      currentKatsayi,
      tavanKatsayi,
      allStrategies: strategies.sort((a, b) => b.improvement - a.improvement)
    };
  }
  
  // Tek başına yetmezse - kombinasyon stratejisi
  const combinationStrategy = calculateCombinationStrategy(data, tavanKatsayi, currentKatsayi);
  
  return {
    reached: combinationStrategy.reached,
    type: 'combination',
    strategy: combinationStrategy,
    currentKatsayi,
    tavanKatsayi,
    allStrategies: strategies.sort((a, b) => b.improvement - a.improvement)
  };
}

// Kombinasyon stratejisi - birden fazla işlemi maksimuma çek
function calculateCombinationStrategy(data, tavanKatsayi, currentKatsayi) {
  // Sadece aktif işlemleri al ve ZORLUK PUANINA göre sırala (En kolaydan en zora)
  const sortedItems = [...data]
    .filter(item => isAktifIslem(item.ad))
    .sort((a, b) => {
      // 1. Öncelik: Zorluk Puanı (Düşük olan daha kolay, önce gelsin)
      const zorlukA = getZorlukPuani(a.ad);
      const zorlukB = getZorlukPuani(b.ad);
      if (zorlukA !== zorlukB) return zorlukA - zorlukB;
      
      // 2. Öncelik: Aynı zorlukta, daha az işlem gerektiren önce gelsin
      return getNeededForMax(a) - getNeededForMax(b);
    });
  
  const steps = [];
  let simData = [...data];
  let simKatsayi = currentKatsayi;
  
  for (const item of sortedItems) {
    if (simKatsayi >= tavanKatsayi) break;
    
    const needed = getNeededForMax(item);
    if (needed === 0) continue;
    
    const maxYapilan = getMaxYapilanForIslem(item);
    const result = simulateSingleChange(simData, item.ad, maxYapilan);
    
    const orderIndex = PRIORITY_ORDER.findIndex(p => 
      normalizeIslemAdi(item.ad).includes(p)
    );
    
    steps.push({
      islem: item.ad,
      currentYapilan: parseFloat(item.yapilan) || 0,
      targetYapilan: maxYapilan,
      needed: needed,
      gereken: parseFloat(item.gereken) || 0,
      newKatsayi: result.katsayi,
      orderIndex: orderIndex >= 0 ? orderIndex : 999
    });
    
    simData = result.data;
    simKatsayi = result.katsayi;
  }
  
  const totalNeeded = steps.reduce((sum, s) => sum + s.needed, 0);
  
  return {
    reached: simKatsayi >= tavanKatsayi,
    steps: steps,
    finalKatsayi: simKatsayi,
    totalNeeded: totalNeeded
  };
}

// Tüm işlemlerin mevcut durumunu analiz et (sadece aktif işlemler)
export function analyzeAllItems(data) {
  return data
    .filter(item => isAktifIslem(item.ad))
    .map(item => {
      const gereken = parseFloat(item.gereken) || 0;
      const yapilan = parseFloat(item.yapilan) || 0;
      const devreden = parseFloat(item.devreden) || 0;
      
      const etkiliYapilan = getEffectiveYapilan(gereken, yapilan, devreden);
      const maxYapilan = getMaxYapilanForIslem(item);
      const needed = Math.max(0, maxYapilan - etkiliYapilan);
      const priority = getPriorityGroup(item.ad);
      const currentOran = gereken > 0 ? (etkiliYapilan / gereken) * 100 : 0;
      
      const ad = normalizeText(item.ad);
      const orderIndex = PRIORITY_ORDER_NORMALIZED.findIndex(p => ad.includes(p));
      
      return {
        ad: item.ad,
        gereken: gereken,
        yapilan: etkiliYapilan,
        devreden: devreden,
        maxYapilan: maxYapilan,
        needed: needed,
        currentOran: Math.round(currentOran * 10) / 10,
        isComplete: needed === 0,
        priority: priority.priority,
        group: priority.group,
        groupEn: priority.groupEn,
        orderIndex: orderIndex >= 0 ? orderIndex : 999
      };
    })
    .filter(item => !item.isComplete)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

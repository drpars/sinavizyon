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
// ZORLUK KATSAYILARI (v2.1.4 - Hibrit: Statik + Dinamik)
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
 * Hibrit Zorluk Puanı Hesaplama (Statik Liste + Dinamik Durum)
 * @param {string} islemAdi İşlemin adı
 * @param {object} itemOpsiyonel İşlem verisi (dinamik hesaplama için)
 * @returns {number} Zorluk puanı (1-10)
 */
function getZorlukPuani(islemAdi, item = null) {
  // 1. Temel Zorluk (statik listeden)
  const normalizedAd = normalizeText(islemAdi);
  let baseZorluk = 5; // Varsayılan orta zorluk
  
  for (const [key, value] of ZORLUK_LISTESI.entries()) {
    if (normalizedAd.includes(normalizeText(key))) {
      baseZorluk = value;
      break;
    }
  }
  
  // 2. Eğer item verisi varsa, dinamik ayarlama yap
  if (item) {
    const gereken = parseFloat(item.gereken) || 1;
    const yapilan = parseFloat(item.yapilan) || 0;
    const devreden = parseFloat(item.devreden) || 0;
    const etkiliYapilan = getEffectiveYapilan(gereken, yapilan, devreden);
    
    // Tamamlanma oranı (%0 - %100)
    const tamamlanmaOrani = (etkiliYapilan / gereken) * 100;
    
    // Oran düşükse zorluk artar (çarpan > 1), yüksekse azalır (çarpan < 1)
    // Formül: %0'da 1.5x, %50'de 1.0x, %100'de 0.5x
    const durumCarpari = 1.5 - (tamamlanmaOrani / 100);
    
    // Devreden varsa biraz kolaylaştır (-0.5 puan etkisi)
    const devredenIndirimi = devreden > 0 ? -0.5 : 0;
    
    // Final puanı hesapla
    let finalPuani = (baseZorluk * durumCarpari) + devredenIndirimi;
    
    // 1-10 arası sınırla
    return Math.max(1, Math.min(10, Math.round(finalPuani)));
  }
  
  // 3. Item verisi yoksa, sadece statik puanı döndür
  return baseZorluk;
}

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

/**
 * Bir işlemi, tavan katsayısına ulaşmak için GEREKEN MİNİMUM yapılan sayısına çeker.
 * Maksimuma çekmek yerine, sadece hedefe ulaştıracak kadarını hesaplar.
 * @param {Array} data Tüm veri
 * @param {object} item Hedef işlem
 * @param {number} tavanKatsayi Ulaşılması gereken tavan
 * @param {number} currentKatsayi Mevcut başarı katsayısı
 * @returns {object} { needed: 0, targetYapilan: 0, newKatsayi: 0 }
 */
function findMinimalYapilanForTavan(data, item, tavanKatsayi, currentKatsayi) {
  const currentYapilan = parseFloat(item.yapilan) || 0;
  const maxYapilan = getMaxYapilanForIslem(item);
  
  // Eğer mevcut haliyle zaten hedefe ulaşılıyorsa veya maksimum bile yetmiyorsa
  if (currentKatsayi >= tavanKatsayi) {
    return { needed: 0, targetYapilan: currentYapilan, newKatsayi: currentKatsayi };
  }

  let low = currentYapilan;
  let high = maxYapilan;
  let bestYapilan = maxYapilan; // Varsayılan olarak maksimumu al

  // Binary Search ile tam hedefi bul
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const simResult = simulateSingleChange(data, item.ad, mid);
    
    if (simResult.katsayi >= tavanKatsayi) {
      bestYapilan = mid; // Hedefe ulaştı, daha da azaltmayı dene
      high = mid - 1;
    } else {
      low = mid + 1; // Yetmedi, artırmak gerek
    }
  }

  const finalSim = simulateSingleChange(data, item.ad, bestYapilan);
  return {
    needed: Math.max(0, bestYapilan - currentYapilan),
    targetYapilan: bestYapilan,
    newKatsayi: finalSim.katsayi
  };
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
    
    // ESKİ: const maxYapilan = getMaxYapilanForIslem(item);
    // ESKİ: const simResult = simulateSingleChange(data, item.ad, maxYapilan);
    
    // YENİ: Minimal hedefi bul
    const optimal = findMinimalYapilanForTavan(data, item, tavanKatsayi, currentKatsayi);
    
    if (optimal.needed === 0) continue; // Bu işlemle hedefe ulaşılamıyorsa atla

    const priority = getPriorityGroup(item.ad);
    
    strategies.push({
      type: 'single',
      islem: item.ad,
      currentYapilan: parseFloat(item.yapilan) || 0,
      targetYapilan: optimal.targetYapilan,
      needed: optimal.needed,
      gereken: parseFloat(item.gereken) || 0,
      newKatsayi: optimal.newKatsayi,
      improvement: optimal.newKatsayi - currentKatsayi,
      reached: optimal.newKatsayi >= tavanKatsayi,
      priority: priority.priority,
      group: priority.group
    });
  }
  
  // Tek başına ulaşanları filtrele
  const singleSuccess = strategies.filter(s => s.reached);
  
  if (singleSuccess.length > 0) {
    // En az işlemle ve EN KOLAY olanı bul
    singleSuccess.sort((a, b) => {
      if (a.needed !== b.needed) return a.needed - b.needed;
      // ✅ Hibrit zorluk puanını kullan (item verisiyle birlikte)
      const itemA = data.find(d => d.ad === a.islem);
      const itemB = data.find(d => d.ad === b.islem);
      return getZorlukPuani(a.islem, itemA) - getZorlukPuani(b.islem, itemB);
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
  // Sadece aktif işlemleri al, ZORLUK PUANINA göre sırala ve TAMAMLANMAMIŞ olanları filtrele
  const sortedItems = [...data]
    .filter(item => isAktifIslem(item.ad))
    .filter(item => {
      const needed = getNeededForMax(item);
      return needed > 0;
    })
    .sort((a, b) => {
      // ✅ Hibrit zorluk puanını kullan (item verisiyle birlikte)
      const zorlukA = getZorlukPuani(a.ad, a);
      const zorlukB = getZorlukPuani(b.ad, b);
      if (zorlukA !== zorlukB) return zorlukA - zorlukB;
      return getNeededForMax(a) - getNeededForMax(b);
    });
  
  const steps = [];
  let simData = [...data];
  let simKatsayi = currentKatsayi;
  
  for (const item of sortedItems) {
    if (simKatsayi >= tavanKatsayi) break;
    
    // Kalan fark için bu işlemden ne kadar gerektiğini hesapla
    const optimal = findMinimalYapilanForTavan(simData, item, tavanKatsayi, simKatsayi);
    
    if (optimal.needed === 0) continue;

    const result = simulateSingleChange(simData, item.ad, optimal.targetYapilan);
    
    steps.push({
      islem: item.ad,
      currentYapilan: parseFloat(item.yapilan) || 0,
      targetYapilan: optimal.targetYapilan,
      needed: optimal.needed,
      gereken: parseFloat(item.gereken) || 0,
      newKatsayi: result.katsayi
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
        orderIndex: orderIndex >= 0 ? orderIndex : 999,
        zorlukPuani: getZorlukPuani(item.ad, item)
      };
    })
    .filter(item => !item.isComplete)
    .sort((a, b) => {
      // ✅ Hibrit zorluk puanına göre sırala
      if (a.zorlukPuani !== b.zorlukPuani) {
        return a.zorlukPuani - b.zorlukPuani;
      }
      return a.needed - b.needed;
    });
}

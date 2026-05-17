// modules/features/doctor/strategy.js
import { calculateDoctorKatsayi } from "./calculator.js";

import { getEffectiveYapilan } from "../../lib/calculations.js";
import {
  PASIF_ISLEMLER_NORMALIZED,
  PRIORITY_ORDER_NORMALIZED,
  SUREC_KATSAYISI,
  getPasifIslemler,
  getSurecKatsayisi,
  katsayiMapNormalized,
} from "../../lib/constants.js";
import { normalizeText } from "../../utils/text-utils.js";

// ============================================================
// ZORLUK KATSAYILARI
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
  ["KANSER SERVİKS TARAMASI", 10],
  ["KORONERARTER İZLEMİ", 4],
  ["KRONİK BOBREK İZLEMİ", 5],
  ["İNME İZLEMİ", 4],
]);

function getZorlukPuani(islemAdi, item = null) {
  const normalizedAd = normalizeText(islemAdi);
  let baseZorluk = 5;

  for (const [key, value] of ZORLUK_LISTESI.entries()) {
    if (normalizedAd.includes(normalizeText(key))) {
      baseZorluk = value;
      break;
    }
  }

  if (item) {
    const gereken = parseFloat(item.gereken) || 1;
    const yapilan = parseFloat(item.yapilan) || 0;
    const devreden = parseFloat(item.devreden) || 0;
    const etkiliYapilan = getEffectiveYapilan(gereken, yapilan, devreden);
    const tamamlanmaOrani = (etkiliYapilan / gereken) * 100;
    const durumCarpari = 1.5 - tamamlanmaOrani / 100;
    const devredenIndirimi = devreden > 0 ? -0.5 : 0;
    let finalPuani = baseZorluk * durumCarpari + devredenIndirimi;
    return Math.max(1, Math.min(10, Math.round(finalPuani)));
  }

  return baseZorluk;
}

function normalizeIslemAdi(ad) {
  return normalizeText(ad);
}

function isAktifIslem(islemAdi, ay = null, yil = null) {
  const ad = normalizeText(islemAdi);
  const pasifListe = ay && yil ? getPasifIslemler(ay, yil) : PASIF_ISLEMLER_NORMALIZED;
  return !pasifListe.some((pasif) => ad.includes(pasif));
}

function getPriorityGroup(islemAdi) {
  const ad = normalizeText(islemAdi);
  const index = PRIORITY_ORDER_NORMALIZED.findIndex((item) => ad.includes(item));
  if (index === -1) return { group: "İzlem", priority: 2, groupEn: "izlem" };

  let group, groupEn;
  if (index < 4) {
    group = "Tarama";
    groupEn = "tarama";
  } else if (index < 8) {
    group = "İzlem";
    groupEn = "izlem";
  } else {
    group = "Kanser";
    groupEn = "kanser";
  }

  return { group, groupEn, priority: index < 4 ? 1 : index < 8 ? 2 : 3 };
}

// ✅ Map parametresi eklendi
export function calculateCurrentKatsayi(data, katsayiMapNorm = null, surecKatsayisi = null) {
  if (!data || data.length === 0) return 1.0;
  let toplamCarpim = 1.0;
  data.forEach((item) => {
    if (isAktifIslem(item.ad)) {
      const ger = parseFloat(item.gereken) || 0;
      const yap = parseFloat(item.yapilan) || 0;
      const dev = parseFloat(item.devreden) || 0;
      toplamCarpim *= calculateDoctorKatsayi(item.ad, ger, yap, dev, katsayiMapNorm);
    }
  });
  const sk = surecKatsayisi ?? SUREC_KATSAYISI;
  return toplamCarpim * sk;
}

// ✅ Map parametresi eklendi
export function simulateSingleChange(data, islemAdi, newYapilan, katsayiMapNorm = null) {
  const simData = data.map((item) => {
    const itemAd = normalizeIslemAdi(item.ad);
    const targetAd = normalizeIslemAdi(islemAdi);
    if (itemAd.includes(targetAd) || targetAd.includes(itemAd)) {
      return { ...item, yapilan: newYapilan };
    }
    return { ...item };
  });
  return {
    data: simData,
    katsayi: calculateCurrentKatsayi(simData, katsayiMapNorm),
  };
}

export function getMaxYapilanForIslem(item, katsayiMapNorm = null) {
  const ad = normalizeText(item.ad);
  const gereken = parseFloat(item.gereken) || 0;
  const map = katsayiMapNorm || katsayiMapNormalized;
  let azamiOran = 90;
  for (let [anahtar, k] of map.entries()) {
    if (ad.includes(anahtar)) {
      azamiOran = k.azamiOran;
      break;
    }
  }
  return Math.ceil((gereken * azamiOran) / 100);
}

export function getNeededForMax(item, katsayiMapNorm = null) {
  const maxYapilan = getMaxYapilanForIslem(item, katsayiMapNorm);
  const gereken = parseFloat(item.gereken) || 0;
  const yapilan = parseFloat(item.yapilan) || 0;
  const devreden = parseFloat(item.devreden) || 0;
  const etkiliYapilan = getEffectiveYapilan(gereken, yapilan, devreden);
  return Math.max(0, maxYapilan - etkiliYapilan);
}

function findMinimalYapilanForTavan(data, item, tavanKatsayi, currentKatsayi, katsayiMapNorm = null) {
  const currentYapilan = parseFloat(item.yapilan) || 0;
  const maxYapilan = getMaxYapilanForIslem(item, katsayiMapNorm);

  if (currentKatsayi >= tavanKatsayi) {
    return { needed: 0, targetYapilan: currentYapilan, newKatsayi: currentKatsayi };
  }

  const maxSim = simulateSingleChange(data, item.ad, maxYapilan, katsayiMapNorm);
  if (maxSim.katsayi < tavanKatsayi) {
    return { needed: 0, targetYapilan: currentYapilan, newKatsayi: maxSim.katsayi };
  }

  let low = currentYapilan;
  let high = maxYapilan;
  let bestYapilan = maxYapilan;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const simResult = simulateSingleChange(data, item.ad, mid, katsayiMapNorm);
    if (simResult.katsayi >= tavanKatsayi) {
      bestYapilan = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  const finalSim = simulateSingleChange(data, item.ad, bestYapilan, katsayiMapNorm);
  return {
    needed: Math.max(0, bestYapilan - currentYapilan),
    targetYapilan: bestYapilan,
    newKatsayi: finalSim.katsayi,
  };
}

// ✅ Map parametresi eklendi
export function calculateSmartStrategy(data, tavanKatsayi, katsayiMapNorm = null) {
  const currentKatsayi = calculateCurrentKatsayi(data, katsayiMapNorm);

  if (currentKatsayi >= tavanKatsayi) {
    return { reached: true, message: "🎉 Tavan katsayısına zaten ulaşılmış!", currentKatsayi, tavanKatsayi };
  }

  const aktifItems = data.filter((item) => isAktifIslem(item.ad));
  const strategies = [];

  for (const item of aktifItems) {
    const needed = getNeededForMax(item, katsayiMapNorm);
    if (needed === 0) continue;

    const optimal = findMinimalYapilanForTavan(data, item, tavanKatsayi, currentKatsayi, katsayiMapNorm);
    if (optimal.needed === 0) continue;

    const priority = getPriorityGroup(item.ad);
    strategies.push({
      type: "single",
      islem: item.ad,
      currentYapilan: parseFloat(item.yapilan) || 0,
      targetYapilan: optimal.targetYapilan,
      needed: optimal.needed,
      gereken: parseFloat(item.gereken) || 0,
      newKatsayi: optimal.newKatsayi,
      improvement: optimal.newKatsayi - currentKatsayi,
      reached: optimal.newKatsayi >= tavanKatsayi,
      priority: priority.priority,
      group: priority.group,
    });
  }

  const singleSuccess = strategies.filter((s) => s.reached);

  if (singleSuccess.length > 0) {
    singleSuccess.sort((a, b) => {
      if (a.needed !== b.needed) return a.needed - b.needed;
      const itemA = data.find((d) => d.ad === a.islem);
      const itemB = data.find((d) => d.ad === b.islem);
      return getZorlukPuani(a.islem, itemA) - getZorlukPuani(b.islem, itemB);
    });
    const best = singleSuccess[0];
    return {
      reached: true,
      type: "single",
      strategy: best,
      currentKatsayi,
      tavanKatsayi,
      allStrategies: strategies.sort((a, b) => b.improvement - a.improvement),
    };
  }

  const combinationStrategy = calculateCombinationStrategy(data, tavanKatsayi, currentKatsayi, katsayiMapNorm);
  return {
    reached: combinationStrategy.reached,
    type: "combination",
    strategy: combinationStrategy,
    currentKatsayi,
    tavanKatsayi,
    allStrategies: strategies.sort((a, b) => b.improvement - a.improvement),
  };
}

function calculateCombinationStrategy(data, tavanKatsayi, currentKatsayi, katsayiMapNorm = null) {
  // Zorluk puanına göre sırala (en kolay önce), eşitlikte mevcut yapılana göre
  const sortedItems = [...data]
    .filter((item) => isAktifIslem(item.ad))
    .sort((a, b) => {
      const zorlukA = getZorlukPuani(a.ad, a);
      const zorlukB = getZorlukPuani(b.ad, b);
      if (zorlukA !== zorlukB) return zorlukA - zorlukB;  // en kolay önce
      return (parseFloat(a.yapilan) || 0) - (parseFloat(b.yapilan) || 0);
    });

  const steps = [];
  let simData = JSON.parse(JSON.stringify(data));  // derin kopya
  let simKatsayi = currentKatsayi;

  for (const item of sortedItems) {
    if (simKatsayi >= tavanKatsayi) break;

    const currentYapilan = parseFloat(item.yapilan) || 0;
    const maxYapilan = getMaxYapilanForIslem(item, katsayiMapNorm);

    if (currentYapilan >= maxYapilan) continue;

    // Binary search ile tavana ulaşmak için gereken minimum yapılanı bul
    let low = currentYapilan;
    let high = maxYapilan;
    let bestYapilan = maxYapilan;

    // Önce max'ın tavana ulaşıp ulaşmadığını kontrol et
    const maxSim = simulateSingleChange(simData, item.ad, maxYapilan, katsayiMapNorm);
    if (maxSim.katsayi < tavanKatsayi) {
      // Bu işlem max'ta bile tavana ulaşamıyor, yine de max'a çek (ilerleme kaydet)
      const needed = maxYapilan - currentYapilan;
      steps.push({
        islem: item.ad,
        currentYapilan: currentYapilan,
        targetYapilan: maxYapilan,
        needed: needed,
        gereken: parseFloat(item.gereken) || 0,
        newKatsayi: maxSim.katsayi,
      });
      simData = maxSim.data;
      simKatsayi = maxSim.katsayi;
      continue;
    }

    // Binary search: tavana ulaşan en küçük yapılanı bul
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midSim = simulateSingleChange(simData, item.ad, mid, katsayiMapNorm);
      if (midSim.katsayi >= tavanKatsayi) {
        bestYapilan = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    const result = simulateSingleChange(simData, item.ad, bestYapilan, katsayiMapNorm);
    const needed = bestYapilan - currentYapilan;

    steps.push({
      islem: item.ad,
      currentYapilan: currentYapilan,
      targetYapilan: bestYapilan,
      needed: needed,
      gereken: parseFloat(item.gereken) || 0,
      newKatsayi: result.katsayi,
    });

    simData = result.data;
    simKatsayi = result.katsayi;
  }

  return {
    reached: simKatsayi >= tavanKatsayi,
    steps,
    finalKatsayi: simKatsayi,
    totalNeeded: steps.reduce((sum, s) => sum + s.needed, 0),
  };
}

// ✅ Map parametresi eklendi
export function analyzeAllItems(data, katsayiMapNorm = null, pasifListe = null) {
  const pListe = pasifListe || PASIF_ISLEMLER_NORMALIZED;
  return data
    .filter((item) => !pListe.some((p) => normalizeText(item.ad).includes(p)))
    .map((item) => {
      const gereken = parseFloat(item.gereken) || 0;
      const yapilan = parseFloat(item.yapilan) || 0;
      const devreden = parseFloat(item.devreden) || 0;
      const etkiliYapilan = getEffectiveYapilan(gereken, yapilan, devreden);
      const maxYapilan = getMaxYapilanForIslem(item, katsayiMapNorm);
      const needed = Math.max(0, maxYapilan - etkiliYapilan);
      const priority = getPriorityGroup(item.ad);
      const currentOran = gereken > 0 ? (etkiliYapilan / gereken) * 100 : 0;
      const ad = normalizeText(item.ad);
      const orderIndex = PRIORITY_ORDER_NORMALIZED.findIndex((p) => ad.includes(p));

      return {
        ad: item.ad,
        gereken,
        yapilan: etkiliYapilan,
        devreden,
        maxYapilan,
        needed,
        currentOran: Math.round(currentOran * 10) / 10,
        isComplete: needed === 0,
        priority: priority.priority,
        group: priority.group,
        groupEn: priority.groupEn,
        orderIndex: orderIndex >= 0 ? orderIndex : 999,
        zorlukPuani: getZorlukPuani(item.ad, item),
      };
    })
    .filter((item) => !item.isComplete)
    .sort((a, b) => {
      if (a.zorlukPuani !== b.zorlukPuani) return a.zorlukPuani - b.zorlukPuani;
      return a.needed - b.needed;
    });
}
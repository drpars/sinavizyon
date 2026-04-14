// modules/features/nurse/calculator.js - doğru versiyon
import { katsayiMapNurse, katsayiMapNurseNormalized } from '../../lib/constants.js';
import { getEffectiveYapilan } from '../../lib/calculations.js';
import { normalizeText } from '../../utils/text-utils.js';

// Cache Map
const katsayiCache = new Map();

export function calculateNurseKatsayi(islemAdi, gereken, yapilan, devreden) {
  const cacheKey = `${islemAdi}|${gereken}|${yapilan}|${devreden}`;
  
  if (katsayiCache.has(cacheKey)) {
    return katsayiCache.get(cacheKey);
  }
  
  const ad = normalizeText(islemAdi);
  const etkiliYapilan = getEffectiveYapilan(gereken, yapilan, devreden);
  const oranYuzde = gereken > 0 ? (etkiliYapilan / gereken) * 100 : 0;
  
  let sonuc = 1.0;
  
  // ✅ Normalize map'i kullan
  for (let [anahtar, k] of katsayiMapNurseNormalized.entries()) {
    if (ad.includes(anahtar)) {
      if (oranYuzde < k.asgariOran) {
        sonuc = k.asgariKatsayi;
        break;
      }
      if (oranYuzde >= k.azamiOran) {
        sonuc = k.azamiKatsayi;
        break;
      }
      const artis = ((k.azamiKatsayi - 1) / (k.azamiOran - k.asgariOran)) * (oranYuzde - k.asgariOran);
      sonuc = 1 + artis;
      break;
    }
  }
  
  if (katsayiCache.size > 1000) {
    const firstKey = katsayiCache.keys().next().value;
    katsayiCache.delete(firstKey);
  }
  katsayiCache.set(cacheKey, sonuc);
  
  return sonuc;
}

export function calculateNurseKHT(data) {
  if (!data || data.length === 0) {
    return { percentage: 0, neededFor40: 0, neededFor70: 0, totalHedef: 0, totalYapilan: 0 };
  }
  
  let toplamHedef = 0;
  let toplamEtkiliYapilan = 0;
  
  data.forEach(item => {
    // ✅ normalizeText kullan
    const ad = normalizeText(item.ad || '');
    const isVital = ad.includes('VITAL BULGU ASC');
    const isYasli = ad.includes('YASLI SAGLIGI IZLEMI ASC');
    
    if (isVital || isYasli) {
      const hedef = parseInt(item.gereken) || 0;
      const yapilan = parseInt(item.yapilan) || 0;
      const devreden = parseInt(item.devreden) || 0;
      toplamHedef += hedef;
      const etkiliYapilan = getEffectiveYapilan(hedef, yapilan, devreden);
      toplamEtkiliYapilan += etkiliYapilan;
    }
  });
  
  if (toplamHedef === 0) {
    return { percentage: 0, neededFor40: 0, neededFor70: 0, totalHedef: 0, totalYapilan: 0 };
  }
  
  const rawPercentage = (toplamEtkiliYapilan / toplamHedef) * 100;
  const percentage = Math.round(rawPercentage);
  const target40 = Math.ceil(toplamHedef * 0.4);
  const neededFor40 = Math.max(0, target40 - toplamEtkiliYapilan);
  const target70 = Math.ceil(toplamHedef * 0.7);
  const neededFor70 = Math.max(0, target70 - toplamEtkiliYapilan);
  
  return {
    percentage: percentage,
    neededFor40: neededFor40,
    neededFor70: neededFor70,
    totalHedef: toplamHedef,
    totalYapilan: toplamEtkiliYapilan
  };
}

export function clearNurseKatsayiCache() {
  katsayiCache.clear();
}

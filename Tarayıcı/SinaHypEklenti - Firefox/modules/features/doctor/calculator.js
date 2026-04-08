// modules/features/doctor/calculator.js
import { katsayiMap } from '../../lib/constants.js';
import { getEffectiveYapilan } from '../../lib/calculations.js';

// Cache Map
const katsayiCache = new Map();

export function calculateDoctorKatsayi(islemAdi, gereken, yapilan, devreden) {
  // Cache key oluştur
  const cacheKey = `${islemAdi}|${gereken}|${yapilan}|${devreden}`;
  
  // Cache'te varsa döndür
  if (katsayiCache.has(cacheKey)) {
    return katsayiCache.get(cacheKey);
  }
  
  const ad = islemAdi.toUpperCase().trim();
  const etkiliYapilan = getEffectiveYapilan(gereken, yapilan, devreden);
  const oranYuzde = gereken > 0 ? (etkiliYapilan / gereken) * 100 : 0;
  
  let sonuc = 1.0;
  for (let [anahtar, k] of katsayiMap.entries()) {
    if (ad.includes(anahtar.toUpperCase().trim())) {
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
  
  // Cache'e kaydet (maksimum 1000 entry ile sınırla)
  if (katsayiCache.size > 1000) {
    const firstKey = katsayiCache.keys().next().value;
    katsayiCache.delete(firstKey);
  }
  katsayiCache.set(cacheKey, sonuc);
  
  return sonuc;
}

export function calculateDoctorKHT(data) {
  if (!data || data.length === 0) {
    return { percentage: 0, neededFor40: 0, neededFor70: 0, totalHedef: 0, totalYapilan: 0 };
  }
  
  let toplamHedef = 0;
  let toplamEtkiliYapilan = 0;
  
  data.forEach(item => {
    const ad = (item.ad || '').toUpperCase();
    const isDiabet = ad.includes('DİYABET') && ad.includes('TARAMASI');
    const isHipertansiyon = ad.includes('HİPERTANSİYON') && ad.includes('TARAMASI');
    const isKvr = (ad.includes('KVR') || ad.includes('KVH') || ad.includes('KARDİYOVASKÜLER')) && ad.includes('TARAMASI');
    const isObezite = ad.includes('OBEZİTE') && ad.includes('TARAMASI');
    
    if (isDiabet || isHipertansiyon || isKvr || isObezite) {
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

// Cache temizleme fonksiyonu (gerektiğinde çağrılır)
export function clearDoctorKatsayiCache() {
  katsayiCache.clear();
}

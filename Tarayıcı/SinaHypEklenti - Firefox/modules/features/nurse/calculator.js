// modules/features/nurse/calculator.js
import { katsayiMapNurse } from '../../lib/constants.js';
import { getEffectiveYapilan } from '../../lib/calculations.js';

export function calculateNurseKatsayi(islemAdi, gereken, yapilan, devreden) {
  const ad = islemAdi.toUpperCase().trim();
  const etkiliYapilan = getEffectiveYapilan(gereken, yapilan, devreden);
  const oranYuzde = gereken > 0 ? (etkiliYapilan / gereken) * 100 : 0;
  
  for (let [anahtar, k] of katsayiMapNurse.entries()) {
    if (ad.includes(anahtar.toUpperCase().trim())) {
      if (oranYuzde < k.asgariOran) return k.asgariKatsayi;
      if (oranYuzde >= k.azamiOran) return k.azamiKatsayi;
      const artis = ((k.azamiKatsayi - 1) / (k.azamiOran - k.asgariOran)) * (oranYuzde - k.asgariOran);
      return 1 + artis;
    }
  }
  return 1.0;
}

export function calculateNurseKHT(data) {
  if (!data || data.length === 0) {
    return { percentage: 0, neededFor40: 0, neededFor70: 0, totalHedef: 0, totalYapilan: 0 };
  }
  
  let toplamHedef = 0;
  let toplamEtkiliYapilan = 0;
  
  data.forEach(item => {
    const ad = (item.ad || '').toUpperCase();
    const isVital = ad.includes('VİTAL BULGU ASÇ');
    const isYasli = ad.includes('YAŞLI SAĞLIĞI İZLEMİ ASÇ');
    
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

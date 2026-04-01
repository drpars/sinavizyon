import { katsayiMap, katsayiMapNurse } from './constants.js';

// Devreden'in hesaba katılıp katılmayacağını belirleyen fonksiyon
export function getEffectiveYapilan(gereken, yapilan, devreden) {
  if (gereken <= 0) return yapilan;
  const yapilanOran = (yapilan / gereken) * 100;
  if (yapilanOran >= 10) {
    const toplam = yapilan + devreden;
    return toplam >= gereken ? gereken : toplam;
  }
  return yapilan;
}

export function katsayiHesapla(islemAdi, gereken, yapilan, devreden, userType = "doctor") {
  const ad = islemAdi.toUpperCase().trim();
  const etkiliYapilan = getEffectiveYapilan(gereken, yapilan, devreden);
  const oranYuzde = gereken > 0 ? (etkiliYapilan / gereken) * 100 : 0;
  
  // UserType'a göre doğru Map'i seç
  const map = userType === "doctor" ? katsayiMap : katsayiMapNurse;
  
  for (let [anahtar, k] of map.entries()) {
    if (ad.includes(anahtar.toUpperCase())) {
      if (oranYuzde < k.asgariOran) return k.asgariKatsayi;
      if (oranYuzde >= k.azamiOran) return k.azamiKatsayi;
      const artis = ((k.azamiKatsayi - 1) / (k.azamiOran - k.asgariOran)) * (oranYuzde - k.asgariOran);
      return 1 + artis;
    }
  }
  return 1.0;
}

// KHT hesaplama (ASÇ için sadece ASÇ işlemlerini filtrele)
export function calculateKHTPerformance(data, userType = "doctor") {
  if (!data || data.length === 0) {
    return { percentage: 0, neededFor40: 0, neededFor70: 0, totalHedef: 0, totalYapilan: 0 };
  }
  
  let toplamHedef = 0;
  let toplamEtkiliYapilan = 0;
  
  data.forEach(item => {
    const ad = (item.ad || '').toUpperCase();
    
    // Doktor için mevcut mantık
    if (userType === "doctor") {
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
    } else {
      // ASÇ için sadece Vital Bulgu ve Yaşlı Sağlığı İzlemi
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

export function tavanHesapla(nufus) {
  const tavanElement = document.getElementById("tavanKatsayi");
  const n = parseFloat(nufus);
  let tavan = 1.0;
  if (n > 0) {
    tavan = 4000 / n;
    if (tavan > 1.5) tavan = 1.5;
    if (tavan < 1.0) tavan = 1.0;
  }
  if (tavanElement) tavanElement.textContent = tavan.toFixed(5);
  return tavan;
}

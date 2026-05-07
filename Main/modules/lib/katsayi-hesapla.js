// modules/lib/katsayi-hesapla.js
import { getEffectiveYapilan } from "./calculations.js";
import { normalizeText } from "../utils/text-utils.js";

const katsayiCache = new Map();

export function calculateKatsayi(islemAdi, gereken, yapilan, devreden, katsayiMapNorm) {
  // ✅ Map'in azamiKatsayi değerlerinin toplamını hash olarak kullan
  let mapHash = 0;
  for (let [, v] of katsayiMapNorm.entries()) {
    mapHash += v.azamiKatsayi;
  }
  const cacheKey = `${islemAdi}|${gereken}|${yapilan}|${devreden}|${mapHash.toFixed(6)}`;

  if (katsayiCache.has(cacheKey)) return katsayiCache.get(cacheKey);

  const ad = normalizeText(islemAdi);
  const etkiliYapilan = getEffectiveYapilan(gereken, yapilan, devreden);
  const oranYuzde = gereken > 0 ? (etkiliYapilan / gereken) * 100 : 0;
  let sonuc = 1.0;

  for (let [anahtar, k] of katsayiMapNorm.entries()) {
    if (ad.includes(anahtar)) {
      if (oranYuzde < k.asgariOran) { sonuc = k.asgariKatsayi; break; }
      if (oranYuzde >= k.azamiOran) { sonuc = k.azamiKatsayi; break; }
      const artis = ((k.azamiKatsayi - 1) / (k.azamiOran - k.asgariOran)) * (oranYuzde - k.asgariOran);
      sonuc = 1 + artis;
      break;
    }
  }

  if (katsayiCache.size > 1000) katsayiCache.delete(katsayiCache.keys().next().value);
  katsayiCache.set(cacheKey, sonuc);
  return sonuc;
}

export function clearKatsayiCache() {
  katsayiCache.clear();
}

import { getEffectiveYapilan } from "../../lib/calculations.js";
import { getKatsayiMapNormalized } from "../../lib/constants.js";
import { calculateKatsayi } from "../../lib/katsayi-hesapla.js";
import { normalizeText } from "../../utils/text-utils.js";

export function calculateDoctorKatsayi(islemAdi, gereken, yapilan, devreden, katsayiMapNorm = null) {
  const map = katsayiMapNorm || getKatsayiMapNormalized();
  return calculateKatsayi(islemAdi, gereken, yapilan, devreden, map);
}

export { clearKatsayiCache as clearDoctorKatsayiCache } from "../../lib/katsayi-hesapla.js";

export function calculateDoctorKHT(data) {
  if (!data || data.length === 0) {
    return { percentage: 0, neededFor40: 0, neededFor70: 0, totalHedef: 0, totalYapilan: 0 };
  }

  let toplamHedef = 0;
  let toplamEtkiliYapilan = 0;

  data.forEach((item) => {
    const ad = normalizeText(item.ad || "");
    const isDiabet = ad.includes("DIYABET") && ad.includes("TARAMASI");
    const isHipertansiyon = ad.includes("HIPERTANSIYON") && ad.includes("TARAMASI");
    const isKvr =
      (ad.includes("KVR") || ad.includes("KVH") || ad.includes("KARDIYOVASKULER")) && ad.includes("TARAMASI");
    const isObezite = ad.includes("OBEZITE") && ad.includes("TARAMASI");

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
    totalYapilan: toplamEtkiliYapilan,
  };
}

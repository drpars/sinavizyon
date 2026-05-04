// modules/lib/constants.js
import { getMonthNumber } from "./date-utils.js";

import { normalizeText } from "../utils/text-utils.js";

// ========== ESKİ DOKTOR KATSAYILARI (≤ Nisan 2026) ==========
const katsayiMapEski = new Map([
  ["DİYABET TARAMASI", { asgariOran: 40, azamiOran: 90, asgariKatsayi: 0.994, azamiKatsayi: 1.05 }],
  ["DİYABET İZLEM", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.98871, azamiKatsayi: 1.0249 }],
  ["HİPERTANSİYON TARAMASI", { asgariOran: 40, azamiOran: 90, asgariKatsayi: 0.994, azamiKatsayi: 1.05 }],
  ["HİPERTANSİYON İZLEM", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.98871, azamiKatsayi: 1.0249 }],
  ["KANSER KOLOREKTAL", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.994, azamiKatsayi: 1.03 }],
  ["KANSER MAMOGRAFİ", { asgariOran: 40, azamiOran: 90, asgariKatsayi: 0.994, azamiKatsayi: 1.031 }],
  ["KANSER SERVİKS", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.994, azamiKatsayi: 1.03 }],
  ["KVR TARAMASI", { asgariOran: 40, azamiOran: 90, asgariKatsayi: 0.994, azamiKatsayi: 1.05 }],
  ["KVR İZLEM", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.98871, azamiKatsayi: 1.0249 }],
  ["OBEZİTE TARAMASI", { asgariOran: 40, azamiOran: 90, asgariKatsayi: 0.994, azamiKatsayi: 1.017 }],
  ["OBEZİTE İZLEM", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.98871, azamiKatsayi: 1.0249 }],
  ["YAŞLI SAĞLIĞI", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.98871, azamiKatsayi: 1.0249 }],
]);

// ========== YENİ DOKTOR KATSAYILARI (≥ Mayıs 2026) ==========
const katsayiMapYeni = new Map([
  ["DİYABET TARAMASI", { asgariOran: 40, azamiOran: 90, asgariKatsayi: 0.993999, azamiKatsayi: 1.02344 }],
  ["DİYABET İZLEM", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.996994, azamiKatsayi: 1.011652 }],
  ["HİPERTANSİYON TARAMASI", { asgariOran: 40, azamiOran: 90, asgariKatsayi: 0.993999, azamiKatsayi: 1.02344 }],
  ["HİPERTANSİYON İZLEM", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.996994, azamiKatsayi: 1.011652 }],
  ["KANSER KOLOREKTAL", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.99101, azamiKatsayi: 1.035365 }],
  ["KANSER MAMOGRAFİ", { asgariOran: 40, azamiOran: 90, asgariKatsayi: 0.99101, azamiKatsayi: 1.035365 }],
  ["KANSER SERVİKS", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.99101, azamiKatsayi: 1.035365 }],
  ["KVR TARAMASI", { asgariOran: 40, azamiOran: 90, asgariKatsayi: 0.993999, azamiKatsayi: 1.02344 }],
  ["KVR İZLEM", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.996994, azamiKatsayi: 1.011652 }],
  ["OBEZİTE TARAMASI", { asgariOran: 40, azamiOran: 90, asgariKatsayi: 0.996994, azamiKatsayi: 1.011652 }],
  ["OBEZİTE İZLEM", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.993997, azamiKatsayi: 1.02344 }],
  ["YAŞLI SAĞLIĞI", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.993997, azamiKatsayi: 1.02344 }],
  ["KORONERARTER", { asgariOran: 40, azamiOran: 85, asgariKatsayi: 0.993997, azamiKatsayi: 1.02344 }],
  ["İNME", { asgariOran: 40, azamiOran: 85, asgariKatsayi: 0.993997, azamiKatsayi: 1.02344 }],
  ["BOBREK", { asgariOran: 40, azamiOran: 85, asgariKatsayi: 0.993997, azamiKatsayi: 1.02344 }],
  ["KOAH", { asgariOran: 40, azamiOran: 85, asgariKatsayi: 0.993997, azamiKatsayi: 1.02344 }],
  ["ASTIM", { asgariOran: 40, azamiOran: 85, asgariKatsayi: 0.993997, azamiKatsayi: 1.02344 }],
  ["OTİZM", { asgariOran: 40, azamiOran: 90, asgariKatsayi: 0.993997, azamiKatsayi: 1.02344 }],
]);

// ========== ESKİ ASÇ KATSAYILARI (≤ Nisan 2026) ==========
const katsayiMapNurseEski = new Map([
  ["VİTAL BULGU ASÇ", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.93, azamiKatsayi: 1.06 }],
  ["VİTAL BULGU ASÇ TEKİL", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.93, azamiKatsayi: 1.06 }],
  ["YAŞLI SAĞLIĞI İZLEMİ ASÇ", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.97, azamiKatsayi: 1.13 }],
]);

// ========== YENİ ASÇ KATSAYILARI (≥ Mayıs 2026) ==========
const katsayiMapNurseYeni = new Map([
  ["VİTAL BULGU ASÇ", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.93, azamiKatsayi: 1.0611 }],
  ["VİTAL BULGU ASÇ TEKİL", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.93, azamiKatsayi: 1.0611 }],
  ["YAŞLI SAĞLIĞI İZLEMİ ASÇ", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.97, azamiKatsayi: 1.1309 }],
]);

// ========== TARİH BAZLI KATSAYI SEÇİMİ ==========
export function getKatsayiMap(ay, yil) {
  const ayNum = typeof ay === "string" ? getMonthNumber(ay) : ay;
  if (yil > 2026 || (yil === 2026 && ayNum >= 5)) return katsayiMapYeni;
  return katsayiMapEski;
}

export function getNurseKatsayiMap(ay, yil) {
  const ayNum = typeof ay === "string" ? getMonthNumber(ay) : ay;
  if (yil > 2026 || (yil === 2026 && ayNum >= 5)) return katsayiMapNurseYeni;
  return katsayiMapNurseEski;
}

// ========== SABİTLER ==========
export const katsayiMapNurse = katsayiMapNurseEski; // Geriye dönük
export const RETENTION_DAYS = 60;
export const SUREC_KATSAYISI = 1.03;

export const hypToSinaMap = {
  "HİPERTANSİYON TARAMA": "HİPERTANSİYON TARAMASI",
  "HİPERTANSİYON İZLEM": "HİPERTANSİYON İZLEM",
  "KARDİYOVASKÜLER RİSK TARAMA": "KVR TARAMASI",
  "KARDİYOVASKÜLER RİSK İZLEM": "KVR İZLEMİ",
  "DİYABET TARAMA": "DİYABET TARAMASI",
  "DİYABET İZLEM": "DİYABET İZLEMİ",
  "OBEZİTE TARAMA": "OBEZİTE TARAMASI",
  "OBEZİTE İZLEM (AİLE HEKİMİ)": "OBEZİTE İZLEMİ",
  "KORONER ARTER HASTALIĞI İZLEM": "KORONERARTER",
  "YAŞLI DEĞERLENDİRME İZLEM": "YAŞLI SAĞLIĞI",
  "İNME İZLEM": "İNME",
  "KRONİK BÖBREK HASTALIĞI İZLEM": "BOBREK",
};

export const nurseFilterList = ["YAŞLI SAĞLIĞI İZLEMİ ASÇ", "VİTAL BULGU ASÇ", "VİTAL BULGU ASÇ TEKİL"];
export const PASIF_ISLEMLER_NORMALIZED = ["KOAH", "ASTIM", "OTIZM"];

// ========== NORMALİZE MAP'LER (ESKİ - geriye dönük uyumluluk) ==========
export const katsayiMapNormalized = new Map();
for (let [anahtar, deger] of katsayiMapEski.entries()) {
  katsayiMapNormalized.set(normalizeText(anahtar), deger);
}

export const katsayiMapNurseNormalized = new Map();
for (let [anahtar, deger] of katsayiMapNurseEski.entries()) {
  katsayiMapNurseNormalized.set(normalizeText(anahtar), deger);
}

export const nurseFilterListNormalized = nurseFilterList.map((f) => normalizeText(f));

export const hypToSinaMapNormalized = new Map();
for (let [hypKey, sinaKey] of Object.entries(hypToSinaMap)) {
  hypToSinaMapNormalized.set(normalizeText(hypKey), normalizeText(sinaKey));
}

export const PRIORITY_ORDER_NORMALIZED = [
  "HIPERTANSIYON TARAMASI",
  "OBEZITE TARAMASI",
  "DIYABET TARAMASI",
  "KVR TARAMASI",
  "HIPERTANSIYON IZLEM",
  "DIYABET IZLEM",
  "KVR IZLEM",
  "OBEZITE IZLEM",
  "KANSER KOLOREKTAL",
  "KANSER MAMOGRAFI",
  "KANSER SERVIKS",
];

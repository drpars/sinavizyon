// modules/lib/constants.js
import { normalizeText } from "../utils/text-utils.js";

export const katsayiMap = new Map([
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

export const hypToSinaMap = {
  "HİPERTANSİYON TARAMA": "HİPERTANSİYON TARAMASI",
  "HİPERTANSİYON İZLEM": "HİPERTANSİYON İZLEM",
  "KARDİYOVASKÜLER RİSK TARAMA": "KVR TARAMASI",
  "KARDİYOVASKÜLER RİSK İZLEM": "KVR İZLEM",
  "DİYABET TARAMA": "DİYABET TARAMASI",
  "DİYABET İZLEM": "DİYABET İZLEM",
  "OBEZİTE TARAMA": "OBEZİTE TARAMASI",
  "OBEZİTE İZLEM (AİLE HEKİMİ)": "OBEZİTE İZLEM",
  "KORONER ARTER HASTALIĞI İZLEM": "KORONERARTER",
  "YAŞLI DEĞERLENDİRME İZLEM": "YAŞLI SAĞLIĞI",
  "İNME İZLEM": "İNME",
  "KRONİK BÖBREK HASTALIĞI İZLEM": "BOBREK",
};

export const katsayiMapNurse = new Map([
  ["VİTAL BULGU ASÇ", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.93, azamiKatsayi: 1.06 }],
  ["VİTAL BULGU ASÇ TEKİL", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.93, azamiKatsayi: 1.06 }],
  ["YAŞLI SAĞLIĞI İZLEMİ ASÇ", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.97, azamiKatsayi: 1.13 }],
]);

export const nurseFilterList = ["YAŞLI SAĞLIĞI İZLEMİ ASÇ", "VİTAL BULGU ASÇ", "VİTAL BULGU ASÇ TEKİL"];

export const RETENTION_DAYS = 90;
export const SUREC_KATSAYISI = 1.03;

// ============================================================
// NORMALİZE EDİLMİŞ SABİTLER (Türkçe karakter sorunu için)
// ============================================================

// Pasif işlemler (normalize edilmiş)
export const PASIF_ISLEMLER_NORMALIZED = ["INME", "BOREK", "BOBREK", "KORONERARTER", "KORONER"];

// Doktor katsayı map'i için normalize anahtarlar
export const katsayiMapNormalized = new Map();
for (let [anahtar, deger] of katsayiMap.entries()) {
  katsayiMapNormalized.set(normalizeText(anahtar), deger);
}

// ASÇ katsayı map'i için normalize anahtarlar
export const katsayiMapNurseNormalized = new Map();
for (let [anahtar, deger] of katsayiMapNurse.entries()) {
  katsayiMapNurseNormalized.set(normalizeText(anahtar), deger);
}

// ASÇ filtre listesi (normalize edilmiş)
export const nurseFilterListNormalized = nurseFilterList.map((f) => normalizeText(f));

// HYP'den SİNA'ya dönüşüm map'i (normalize edilmiş)
export const hypToSinaMapNormalized = new Map();
for (let [hypKey, sinaKey] of Object.entries(hypToSinaMap)) {
  hypToSinaMapNormalized.set(normalizeText(hypKey), normalizeText(sinaKey));
}

// Öncelik sıralaması (normalize edilmiş) - strategy.js için
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

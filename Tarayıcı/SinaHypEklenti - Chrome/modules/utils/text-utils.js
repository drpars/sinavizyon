// modules/utils/text-utils.js
// ============================================================
// METİN NORMALİZASYONU (Türkçe Karakter ve Case Duyarsız)
// ============================================================

/**
 * Bir metni, tüm Türkçe karakterleri İngilizce karşılıklarına çevirir,
 * fazla boşlukları temizler ve büyük harfe çevirir.
 * Bu sayede "Obezİte İzleMİ" ile "OBEZİTE İZLEMİ" eşit olur.
 * @param {string} text Normalize edilecek metin.
 * @returns {string} Normalize edilmiş, İngilizce karakterli ve büyük harfli metin.
 */
export function normalizeText(text) {
  if (!text || typeof text !== "string") return "";

  // 1. Türkçe karakterleri İngilizce karşılıklarına çevir
  const turkishToEnglish = {
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    I: "i", // Dikkat: I (ı) -> i
    i: "i",
    İ: "i", // Dikkat: İ (i) -> i
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ü: "u",
    Ü: "u",
  };

  let normalized = text;
  for (const [tr, en] of Object.entries(turkishToEnglish)) {
    normalized = normalized.replaceAll(tr, en);
  }

  // 2. Fazla boşlukları temizle ve büyük harfe çevir
  return normalized.replace(/\s+/g, " ").trim().toUpperCase();
}

/**
 * İki metni normalize ederek karşılaştırır.
 * @param {string} text1 Birinci metin
 * @param {string} text2 İkinci metin
 * @returns {boolean} Metinler eşit mi?
 */
export function compareNormalized(text1, text2) {
  return normalizeText(text1) === normalizeText(text2);
}

/**
 * Bir metnin, verilen dizideki herhangi bir metni içerip içermediğini kontrol eder.
 * @param {string} text Aranacak metin
 * @param {string} search Aranan metin
 * @returns {boolean} İçeriyor mu?
 */
export function includesNormalized(text, search) {
  return normalizeText(text).includes(normalizeText(search));
}

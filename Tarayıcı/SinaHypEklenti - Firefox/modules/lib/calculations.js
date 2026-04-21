// modules/lib/calculations.js
// Sadece ortak yardımcı fonksiyonlar

export function getEffectiveYapilan(gereken, yapilan, devreden) {
  if (gereken <= 0) return yapilan;
  const yapilanOran = (yapilan / gereken) * 100;
  if (yapilanOran >= 10) {
    const toplam = yapilan + devreden;
    return toplam >= gereken ? gereken : toplam;
  }
  return yapilan;
}

export function tavanHesapla(nufus) {
  const tavanElement = document.getElementById("tavanKatsayi");
  const n = parseFloat(nufus);
  let tavan = 0.0;
  if (n > 0) {
    tavan = 4000 / n;
    if (tavan > 1.5) tavan = 1.5;
    if (tavan < 1.0) tavan = 1.0;
  }
  if (tavanElement) tavanElement.textContent = tavan.toFixed(5);
  return tavan;
}

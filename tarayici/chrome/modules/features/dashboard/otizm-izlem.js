// modules/features/dashboard/otizm-izlem.js
// Otizm İzlem Takvimi - Hesaplama ve Render Modülü

/**
 * Verilen doğum tarihine göre 3 izlem periyodunun başlangıç/bitiş tarihlerini hesaplar.
 * @param {string|Date} birthDate - Doğum tarihi (ISO string veya Date)
 * @returns {{ donem18: Date, donem20: Date, donem24: Date, donem26: Date, donem36: Date, donem38: Date }}
 */
export function hesaplaOtizmDonemleri(birthDate) {
  const dogum = new Date(birthDate);

  const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  return {
    donem18: addMonths(dogum, 18),                    // 18. ay
    donem20: addDays(addMonths(dogum, 20), 30),       // 20. ay + 30 gün
    donem24: addMonths(dogum, 24),                    // 24. ay
    donem26: addDays(addMonths(dogum, 26), 30),        // 26. ay + 30 gün
    donem36: addMonths(dogum, 36),                    // 36. ay
    donem38: addDays(addMonths(dogum, 38), 30),        // 38. ay + 30 gün
  };
}

/**
 * Periyot bitiş tarihinin belirtilen ayda olup olmadığını kontrol eder.
 * OSB tarama kuralı: Çocuk sadece periyodun son ayında hedefe girer.
 * Örn: 1. periyot (18-21 ay arası yapılabilir) → sadece 20.ay+30gün tarihinin olduğu ayda listelenir.
 * @param {Date} bitis - Periyot bitiş tarihi (20.ay+30g, 26.ay+30g, 38.ay+30g)
 * @param {number} yil
 * @param {number} ay (0-11)
 * @returns {boolean}
 */
function periyotBuAydaBiterMi(bitis, yil, ay) {
  return bitis.getFullYear() === yil && bitis.getMonth() === ay;
}

/**
 * Periyot bilgilerini içeren obje
 * @typedef {Object} PeriyotBilgisi
 * @property {string} ad - Periyot adı (örn: "1. Periyot")
 * @property {Date} baslangic
 * @property {Date} bitis
 * @property {number} periyotNo - 1, 2 veya 3
 */

/**
 * Hastanın belirtilen ayda hedefe giren periyotlarını bulur.
 * OSB kuralı: Periyodun son tarihinin (bitiş) bulunduğu ay hedef aydır.
 * @param {object} donemler - hesaplaOtizmDonemleri() çıktısı
 * @param {number} yil
 * @param {number} ay (0-11)
 * @returns {PeriyotBilgisi[]}
 */
function periyotlariBul(donemler, yil, ay) {
  const periyotlar = [
    { ad: "1. Periyot", baslangic: donemler.donem18, bitis: donemler.donem20, periyotNo: 1 },
    { ad: "2. Periyot", baslangic: donemler.donem24, bitis: donemler.donem26, periyotNo: 2 },
    { ad: "3. Periyot", baslangic: donemler.donem36, bitis: donemler.donem38, periyotNo: 3 },
  ];

  return periyotlar.filter((p) => periyotBuAydaBiterMi(p.bitis, yil, ay));
}

/**
 * Ay farkını hesaplar (tam ay olarak).
 * @param {Date} dogum
 * @param {Date} referans
 * @returns {number}
 */
function ayOlarakYas(dogum, referans) {
  let aylar = (referans.getFullYear() - dogum.getFullYear()) * 12;
  aylar += referans.getMonth() - dogum.getMonth();
  if (referans.getDate() < dogum.getDate()) {
    aylar -= 1;
  }
  return aylar;
}

/**
 * Tarihi GG.AA.YYYY formatında biçimlendirir.
 * @param {Date} date
 * @returns {string}
 */
function formatTarih(date) {
  const gun = String(date.getDate()).padStart(2, "0");
  const ay = String(date.getMonth() + 1).padStart(2, "0");
  const yil = date.getFullYear();
  return `${gun}.${ay}.${yil}`;
}

/**
 * Ay adını sözel olarak döndürür.
 * @param {number} ay (0-11)
 * @returns {string}
 */
function ayAdi(ay) {
  const aylar = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];
  return aylar[ay] || "";
}

/**
 * Belirtilen ay için hastaları filtreler ve render için hazırlar.
 * @param {Array} hastalar - Hasta listesi
 * @param {number} yil
 * @param {number} ay (0-11)
 * @returns {Array} Render edilmeye hazır hasta satırları
 */
function hastalariAyIcinFiltrele(hastalar, yil, ay) {
  const sonuc = [];

  hastalar.forEach((hasta) => {
    if (!hasta.BirthDate) return;

    const donemler = hesaplaOtizmDonemleri(hasta.BirthDate);
    const aktifPeriyotlar = periyotlariBul(donemler, yil, ay);

    if (aktifPeriyotlar.length > 0) {
      const dogum = new Date(hasta.BirthDate);
      const referans = new Date(yil, ay + 1, 0); // Ayın son günü
      const yasAy = ayOlarakYas(dogum, referans);
      const bugun = new Date();
      bugun.setHours(0, 0, 0, 0); // Bugün başlangıcı (saat sıfır)

      aktifPeriyotlar.forEach((periyot) => {
        // Periyodun bitiş tarihi bugünden önceyse listeleme (kapanmış periyot)
        const bitisTarih = new Date(periyot.bitis);
        bitisTarih.setHours(0, 0, 0, 0);
        if (bitisTarih <= bugun) return;

        sonuc.push({
          hasta: hasta,
          yasAy: yasAy,
          periyotNo: periyot.periyotNo,
          periyotAd: periyot.ad,
          baslangic: periyot.baslangic,
          bitis: periyot.bitis,
          donemAralik: `${formatTarih(periyot.baslangic)} - ${formatTarih(periyot.bitis)}`,
        });
      });
    }
  });

  // Önce periyot numarasına, sonra isme göre sırala
  sonuc.sort((a, b) => {
    if (a.periyotNo !== b.periyotNo) return a.periyotNo - b.periyotNo;
    const adA = `${a.hasta.GivenName} ${a.hasta.FamilyName}`.toLowerCase();
    const adB = `${b.hasta.GivenName} ${b.hasta.FamilyName}`.toLowerCase();
    return adA.localeCompare(adB, "tr");
  });

  return sonuc;
}

/**
 * Tek bir ay için tablo HTML'i oluşturur.
 * @param {string} baslik - Tablo başlığı (örn: "📅 BU AY (Temmuz 2025)")
 * @param {Array} satirlar - hastalariAyIcinFiltrele() çıktısı
 * @param {string} renk - Başlık gradient rengi
 * @returns {string} HTML
 */
function ayTablosuOlustur(baslik, satirlar, renk) {
  if (satirlar.length === 0) {
    return `
      <div class="otizm-ay-tablo">
        <div class="otizm-ay-header" style="background: linear-gradient(135deg, ${renk}, ${renk}dd);">
          <span>${baslik}</span>
          <span class="otizm-count">0 hasta</span>
        </div>
        <div class="otizm-ay-body otizm-empty">
          <span>Bu ayda tarama periyodunda hasta bulunmamaktadır.</span>
        </div>
      </div>
    `;
  }

  let rowsHtml = "";
  satirlar.forEach((satir, index) => {
    const adSoyad = `${satir.hasta.GivenName} ${satir.hasta.FamilyName}`;
    const cinsiyet = satir.hasta.Gender === "male" ? "♂" : satir.hasta.Gender === "female" ? "♀" : "";

    rowsHtml += `
      <tr>
        <td>${index + 1}</td>
        <td class="otizm-hasta-ad">
          ${adSoyad}
          <span class="otizm-cinsiyet">${cinsiyet}</span>
        </td>
        <td>${satir.yasAy} ay</td>
        <td><span class="otizm-periyot-badge periyot-${satir.periyotNo}">${satir.periyotAd}</span></td>
        <td class="otizm-donem-aralik">${satir.donemAralik}</td>
      </tr>
    `;
  });

  return `
    <div class="otizm-ay-tablo">
      <div class="otizm-ay-header" style="background: linear-gradient(135deg, ${renk}, ${renk}dd);">
        <span>${baslik}</span>
        <span class="otizm-count">${satirlar.length} hasta</span>
      </div>
      <div class="otizm-ay-body">
        <table class="otizm-table">
          <thead>
            <tr>
              <th>#</th>
              <th style="text-align:left;">Hasta</th>
              <th>Yaş</th>
              <th>Periyot</th>
              <th>Tarama Aralığı</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Ana render fonksiyonu - Dashboard'dan çağrılır.
 * @param {Array} hastalar - HYP API'den gelen hasta listesi
 */
export function renderOtizmIzlem(hastalar) {
  const container = document.getElementById("otizmIzlemContainer");
  if (!container) return;

  if (!hastalar || hastalar.length === 0) {
    container.innerHTML = `
      <div class="otizm-izlem-section">
        <div class="otizm-section-header">
          <span>🧩 OTİZM TARAMA TAKVİMİ</span>
        </div>
        <div class="otizm-empty-state">
          <span>Veri bulunamadı. HYP bağlantısı gereklidir.</span>
        </div>
      </div>
    `;
    return;
  }

  const simdi = new Date();
  const buAy = simdi.getMonth();      // 0-11
  const buYil = simdi.getFullYear();

  // Gelecek ay
  let gelecekAy = buAy + 1;
  let gelecekYil = buYil;
  if (gelecekAy > 11) {
    gelecekAy = 0;
    gelecekYil = buYil + 1;
  }

  const buAySatirlar = hastalariAyIcinFiltrele(hastalar, buYil, buAy);
  const gelecekAySatirlar = hastalariAyIcinFiltrele(hastalar, gelecekYil, gelecekAy);

  const buAyBaslik = `📅 BU AY (${ayAdi(buAy)} ${buYil})`;
  const gelecekAyBaslik = `📅 GELECEK AY (${ayAdi(gelecekAy)} ${gelecekYil})`;

  container.innerHTML = `
    <div class="otizm-izlem-section">
      <div class="otizm-section-header">
        <span>🧩 OTİZM TARAMA TAKVİMİ</span>
        <span class="otizm-section-subtitle">Tarama periyodundaki hastalar</span>
      </div>
      <div class="otizm-tablolar-grid">
        ${ayTablosuOlustur(buAyBaslik, buAySatirlar, "#8b5cf6")}
        ${ayTablosuOlustur(gelecekAyBaslik, gelecekAySatirlar, "#6366f1")}
      </div>
    </div>
  `;
}

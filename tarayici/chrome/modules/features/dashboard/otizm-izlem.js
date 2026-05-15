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
    const targetMonth = d.getMonth() + months;
    d.setMonth(targetMonth);
    // setMonth kaymasını düzelt: ay doğru değilse (örn: 31 Ocak + 1 ay → 3 Mart),
    // hedef ayın son gününe çek
    if (d.getMonth() !== targetMonth % 12) {
      d.setDate(0); // Hedef ayın son günü
    }
    return d;
  };

  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  // Periyot penceresinin son günü = (X+1). ayın 1 gün öncesi
  // 1P: 18.ay → 21.ay-1gün, 2P: 24.ay → 27.ay-1gün, 3P: 36.ay → 39.ay-1gün
  const addMonthsMinus1Day = (date, months) => {
    const d = addMonths(date, months);
    d.setDate(d.getDate() - 1);
    return d;
  };

  return {
    donem18: addMonths(dogum, 18),                // 18. ay (başlangıç)
    donem20: addMonthsMinus1Day(dogum, 21),       // 21. ay - 1 gün (periyot sonu)
    donem24: addMonths(dogum, 24),                // 24. ay (başlangıç)
    donem26: addMonthsMinus1Day(dogum, 27),       // 27. ay - 1 gün (periyot sonu)
    donem36: addMonths(dogum, 36),                // 36. ay (başlangıç)
    donem38: addMonthsMinus1Day(dogum, 39),       // 39. ay - 1 gün (periyot sonu)
  };
}

/**
 * Periyot bitiş tarihinin belirtilen ayda olup olmadığını kontrol eder.
 * OSB tarama kuralı: Çocuk sadece periyodun son ayında (pencerenin kapandığı ay) hedefe girer.
 * Periyot penceresi: 1P=18.ay→21.ay-1gün, 2P=24.ay→27.ay-1gün, 3P=36.ay→39.ay-1gün
 * @param {Date} bitis - Periyot bitiş tarihi (21.ay-1g, 27.ay-1g, 39.ay-1g)
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
  let toplamHasta = 0;
  let dogumYok = 0;
  let periyotYok = 0;

  hastalar.forEach((hasta) => {
    if (!hasta.BirthDate) { dogumYok++; return; }
    toplamHasta++;

    const donemler = hesaplaOtizmDonemleri(hasta.BirthDate);
    const aktifPeriyotlar = periyotlariBul(donemler, yil, ay);

    if (aktifPeriyotlar.length > 0) {
      const dogum = new Date(hasta.BirthDate);
      const referans = new Date(yil, ay + 1, 0);
      const yasAy = ayOlarakYas(dogum, referans);

      aktifPeriyotlar.forEach((periyot) => {
        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);
        const bitisTarih = new Date(periyot.bitis);
        bitisTarih.setHours(0, 0, 0, 0);
        const sureDoldu = bitisTarih < bugun;

        sonuc.push({
          hasta: hasta,
          yasAy: yasAy,
          periyotNo: periyot.periyotNo,
          periyotAd: periyot.ad,
          baslangic: periyot.baslangic,
          bitis: periyot.bitis,
          donemAralik: `${formatTarih(periyot.baslangic)} - ${formatTarih(periyot.bitis)}`,
          sureDoldu: sureDoldu,
          durum: sureDoldu ? "Süre Doldu" : "Yapılabilir",
        });
      });
    } else {
      periyotYok++;
    }
  });

  console.log(`🧩 Filtre [${ayAdi(ay)} ${yil}]: toplam=${toplamHasta} dogumYok=${dogumYok} periyotYok=${periyotYok} sonuc=${sonuc.length}`);

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
    const durumClass = satir.sureDoldu ? "otizm-sure-doldu" : "otizm-yapilabilir";

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
        <td class="otizm-durum ${durumClass}">${satir.durum}</td>
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
              <th>Durum</th>
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

  console.log(`🧩 renderOtizmIzlem: ${hastalar?.length || 0} hasta alındı`);

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

  console.log(`🧩 Bu ay (${ayAdi(buAy)} ${buYil}): ${buAySatirlar.length} hasta`);
  console.log(`🧩 Gelecek ay (${ayAdi(gelecekAy)} ${gelecekYil}): ${gelecekAySatirlar.length} hasta`);

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

// Sabitler

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

// ASÇ katsayı tablosu
export const katsayiMapNurse = new Map([
  ["VİTAL BULGU ASÇ", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.93, azamiKatsayi: 1.06 }],
  ["VİTAL BULGU ASÇ TEKİL", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.93, azamiKatsayi: 1.06 }],
  ["YAŞLI SAĞLIĞI İZLEMİ ASÇ", { asgariOran: 50, azamiOran: 90, asgariKatsayi: 0.97, azamiKatsayi: 1.13 }],
]);

// ASÇ için işlem adı filtresi
export const nurseFilterList = [
  "YAŞLI SAĞLIĞI İZLEMİ ASÇ",
  "VİTAL BULGU ASÇ",
  "VİTAL BULGU ASÇ TEKİL"
];

// Saklama süresi (gün)
export const RETENTION_DAYS = 90;

// Sürüm geçmişi verisi (son 3 sürüm)
export const changelogData = [
  {
    version: "1.6.6",
    date: "2026-04-08",
    changes: [
      "⚡ **Performans iyileştirmeleri:** Küçük düzeltmeler yapıldı."
    ]
  },
  {
    version: "1.6.5",
    date: "2026-04-08",
    changes: [
      "🧩 **Tam modüler mimariye geçiş:** Tüm kod modüllere ayrıldı (dom-elements, state, ui-updaters, event-handlers).",
      "🗂️ **Merkezi state yönetimi:** Global değişkenler tamamen kaldırıldı, state.js ile yönetiliyor.",
      "🎯 **Event handler'lar tek dosyada:** Tüm event listener'lar event-handlers.js'de toplandı.",
      "🎨 **Tema seçimi kalıcı hale geldi:** Koyu/Açık tema tercihi artık hatırlanıyor.",
      "📅 **Ay/Yıl değişiminde otomatik yenileme:** Ay veya yıl değiştirildiğinde tablo anında güncelleniyor.",
      "🔧 **DOM erişimi merkezileştirildi:** Tüm getElementById çağrıları dom-elements.js üzerinden yapılıyor.",
      "🧹 **Kod temizliği:** Kullanılmayan import'lar ve tekrar eden kodlar temizlendi.",
      "⚡ **Performans iyileştirmeleri:** Daha hızlı tablo yenileme ve daha az bellek kullanımı."
    ]
  },
  {
    version: "1.6.3",
    date: "2026-04-07",
    changes: [
      "🐛 **SİNA BİRİM zaman göstergesi düzeltildi:** ASÇ modunda SİNA BİRİM çekimi, SİNA butonunun zamanını etkilemiyor artık.",
      "💬 **Bilgilendirme mesajı iyileştirildi:** Veri bulunamadığında gösterilen mesaj daha temiz ve okunabilir hale getirildi.",
      "🔧 **messageDialog HTML desteği:** Mesaj pencerelerinde artık satır sonları düzgün görüntüleniyor.",
      "⚡ **Sıralı hibrit veri çekme:** SİNA sayfasından veri çekme artık daha kararlı (Observer → Interval → Zaman aşımı)."
    ]
  },
  {
    version: "1.6.2",
    date: "2026-04-06",
    changes: [
      "📅 **Ay/Yıl bazlı veri saklama:** Veriler artık hangi ay ve yıla ait olduğu bilgisiyle kaydediliyor.",
      "🔄 **Ay/Yıl değişince otomatik yenileme:** Kullanıcı ay veya yıl seçimini değiştirdiğinde, o döneme ait veriler otomatik olarak yükleniyor.",
      "⚠️ **Veri yoksa bilgilendirme:** Cari ayın ilk 10 gününde veri çekilemezse, kullanıcıya bilgilendirme mesajı gösteriliyor ve önceki aya yönlendiriliyor.",
      "⚡ **MutationObserver ile hızlı veri çekme:** SİNA sayfasından veri çekme artık çok daha hızlı ve verimli."
    ]
  },
  {
    version: "1.6.1",
    date: "2026-04-05",
    changes: [
      "🔧 **Konfigürasyon dosyası eklendi (config.js):** Tüm linkler ve API parametreleri tek bir dosyadan yönetilebilir.",
      "🐛 **Doktor verilerinin kaybolması düzeltildi:** Eklenti kapatılıp açılınca verilerin kaybolması sorunu giderildi.",
      "🧩 **Modülerlik iyileştirmesi:** ui.js parçalandı (ui-helpers.js, ui-table.js)."
    ]
  },
  {
    version: "1.6.0",
    date: "2026-04-04",
    changes: [
      "👩‍⚕️ **ASÇ (Aile Sağlığı Çalışanı) desteği:** ASÇ kendi verilerini çekip analiz edebilir.",
      "🔧 **Çift buton sistemi:** ASÇ modunda SİNA ve SİNA BİRİM butonları.",
      "📊 **ASÇ özel katsayı tablosu:** Vital Bulgu ve Yaşlı Sağlığı İzlemi için özel katsayılar.",
      "🎯 **ASÇ tavan katsayısı:** Doktor başarı katsayısına eşittir.",
      "🔐 **Birim bazlı görünüm modu:** Her birim için son kullanılan tablo görünümü ayrı saklanır.",
      "🐛 **Çoklu hata düzeltmeleri:** Veri silme, tema kalıcılığı, ASÇ görünüm modu, zaman göstergeleri ve renklendirme iyileştirildi.",
      "🎉 **Hoş geldin modalı:** İlk kurulumda kullanıcı tipi ve tema seçimi sorulur.",
      "📢 **Yenilikler modalı:** Güncelleme sonrası yeni özellikler tanıtılır.",
      "🎨 **Hakkında sayfası yenilendi:** Modern kart tasarımı ile yenilendi.",
      "🔔 **Tüm uyarılar iyileştirildi:** Alert/confirm dialog'ları artık özel modal ile gösteriliyor."
    ]
  },
  {
    version: "1.5.6",
    date: "2026-03-31",
    changes: [
      "🎨 **Modern UI Revizyonu:** Tüm arayüz esnek (responsive) hale getirildi.",
      "🔤 **Yazı boyutu ayarı:** Ayarlar menüsünden yazı boyutunu 11-15px arasında ayarlayabilirsiniz.",
      "📐 **Taşma koruması:** Büyük yazı boyutlarında tablo ve kartlar taşmaz."
    ]
  },
  {
    version: "1.5.5",
    date: "2026-03-30",
    changes: [
      "👥 **Kullanıcı türü seçimi eklendi:** Aile Hekimi / Aile Sağlığı Çalışanı (ASÇ).",
      "📁 **Veriler ayrı saklanıyor:** Doktor ve hemşire verileri artık farklı storage anahtarlarında tutulur.",
      "🎯 **HYP butonu artık SİNA verisi yokken devre dışı:** Kullanıcı deneyimi iyileştirildi."
    ]
  }
];

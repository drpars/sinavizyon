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
    version: "1.5.5",
    date: "2026-03-30",
    changes: [
      "👥 **Kullanıcı türü seçimi eklendi:** Aile Hekimi / Aile Sağlığı Çalışanı (ASÇ).",
      "📁 **Veriler ayrı saklanıyor:** Doktor ve hemşire verileri artık farklı storage anahtarlarında tutulur.",
      "🎯 **HYP butonu artık SİNA verisi yokken devre dışı:** Kullanıcı deneyimi iyileştirildi."
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
    version: "1.6.0",
    date: "2026-04-01",
    changes: [
      "👩‍⚕️ **ASÇ (Aile Sağlığı Çalışanı) desteği:** ASÇ kendi verilerini çekip analiz edebilir.",
      "🔧 **Çift buton sistemi:** ASÇ modunda SİNA (ASÇ) ve SİNA BİRİM (ASÇ) butonları.",
      "📊 **ASÇ özel katsayı tablosu:** Vital Bulgu ve Yaşlı Sağlığı İzlemi için özel katsayılar.",
      "🎯 **ASÇ tavan katsayısı:** Doktor başarı katsayısına eşittir.",
      "🔐 **Birim bazlı görünüm modu:** Her birim için son kullanılan tablo görünümü ayrı saklanır."
    ]
  }
];

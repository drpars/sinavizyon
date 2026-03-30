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

// Saklama süresi (gün)
export const RETENTION_DAYS = 90;

// Sürüm geçmişi verisi (en eski sürümden günümüze)
export const changelogData = [
  {
    version: "1.4.6",
    date: "2026-03-19",
    changes: [
      "🚀 İlk sürüm.",
      "📊 SİNA ve HYP'den veri çekme ve tabloda gösterme.",
      "🖱️ Manuel tıklama ile sekme açma, otomatik veri yakalama.",
      "🎨 Koyu tema desteği (Tokyo Night)."
    ]
  },
  {
    version: "1.5.0",
    date: "2026-03-22",
    changes: [
      "🔒 KVKK uyumlu hale getirildi: Açık rıza alınır, veriler 90 gün sonra otomatik silinir, istenirse veriler silinebilir veya dışa aktarılabilir.",
      "🛡️ Güvenlik iyileştirmeleri yapıldı (XSS koruması, CSP uyumu).",
      "⚡ Performans artırıldı, daha hızlı çalışır.",
      "🎨 Açık tema (SİNA Klasik) eklendi.",
      "⏱️ Veri çekme işlemlerinde zaman aşımı eklendi (30 saniye).",
      "📋 Sürüm geçmişi butonu eklendi.",
      "🔧 Gelişmiş ayarlar bölümü eklendi."
    ]
  },
  {
    version: "1.5.1",
    date: "2026-03-24",
    changes: [
      "🎨 Varsayılan tema açık (SİNA Klasik) olarak değiştirildi.",
      "🔧 Gelişmiş ayarlar butonu toggle (aç/kapa) mantığına kavuştu.",
      "📌 KVKK bilgilendirme metni hem tablo altında (yapışkan) hem ayarlar panelinde gösteriliyor.",
      "🎨 Arayüz iyileştirmeleri: Gelişmiş ayarlar bölümü başlangıçta gizli, ihtiyaç halinde açılıyor.",
      "🛡️ CSP (Content Security Policy) uyumu sağlandı, inline script hatası giderildi.",
      "🐛 Küçük hata düzeltmeleri ve performans iyileştirmeleri."
    ]
  },
  {
    version: "1.5.2",
    date: "2026-03-25",
    changes: [
      "🔒 KVKK bilgilendirme notları artık ayarlar panelinden gizlenebilir / gösterilebilir (tercih hatırlanır).",
      "📅 Tarih kısıtlamaları: HYP butonu sadece cari ay/yıl için çalışır, SİNA butonu geçmişe izin verir.",
      "📊 KHT (Kronik Hastalık Tarama) yüzdesi ve renkli bar eklendi. Bar üzerinde %40 ve %70 hedef işaretleri, tiklerle gösterilir.",
      "📊 KHT hesaplamasına 'devreden' değeri dahil edildi. Artık önceki aylardan devreden sayılar hedefe katkı sağlar.",
      "🎨 Performans katsayısı rengi artık Tavan katsayısı ile karşılaştırılarak yeşil/kırmızı olur.",
      "🏷️ Üçlü kutu düzeni: BAŞARI, TAVAN KATSAYI ve KHT kutuları eklendi. KHT durumu %70'e göre TAMAM/EKSİK olarak gösterilir.",
      "📐 Kutu içi hizalama iyileştirildi: başlıklar üstte, değerler altta ve sabit yükseklikte."
    ]
  },
  {
    version: "1.5.3",
    date: "2026-03-26",
    changes: [
      "📊 Tavan katsayısı 1 ile 1.5 arasında sınırlandırıldı.",
      "📈 KHT ve başarı katsayısı hesaplamalarında devreden, yapılan hedefin %10'u veya üzerindeyse hesaba katılıyor.",
      "🔧 Çoklu birim desteği: Veriler artık Birim ID ile birlikte saklanıyor ve dışa aktarılıyor.",
      "🧹 Popup.html kaldırıldı, sidepanel.js ile tek tip arayüz.",
      "🐛 Küçük hata düzeltmeleri ve performans iyileştirmeleri."
    ]
  },
  {
    version: "1.5.4",
    date: "2026-03-28",
    changes: [
      "🧩 **Daha düzenli altyapı:** Eklenti artık daha hızlı ve kararlı çalışıyor.",
      "🐛 **Hata düzeltmesi:** Birim ID alanı artık doğru görünüyor.",
      "🔄 **Verileriniz korunuyor:** Güncelleme sırasında hiçbir veriniz kaybolmaz.",
      "📊 **Tablo görünümü iyileştirildi:** Yüzdelikler artık daha anlaşılır şekilde gösteriliyor.",
      "⚡ **Genel performans artışı:** Daha hızlı açılma ve veri çekme süreleri.",
      "🎨 **Küçük görsel iyileştirmeler**"
    ]
  },
  {
    version: "1.5.5",
    date: "2026-03-30",
    changes: [
      "👥 **Kullanıcı türü seçimi eklendi:** Aile Hekimi / Aile Sağlığı Çalışanı (ASÇ).",
      "🔧 **ASÇ modülü altyapısı hazırlandı:** ASÇ seçildiğinde SİNA butonu şimdilik çalışmaz, uyarı verir.",
      "📁 **Veriler ayrı saklanıyor:** Doktor ve hemşire verileri artık farklı storage anahtarlarında tutulur.",
      "🔄 **Güncelleme desteği:** 1.5.4 ve öncesinden gelen veriler otomatik olarak doktor verisi olarak taşınır.",
      "🎯 **HYP butonu artık SİNA verisi yokken devre dışı:** Kullanıcı deneyimi iyileştirildi.",
      "⚡ **Küçük performans iyileştirmeleri ve hata düzeltmeleri.**"
    ]
  }
];


# SİNA VİZYON Sürüm Geçmişi

## 1.6.0 (2026-04-01)
- 👩‍⚕️ **ASÇ (Aile Sağlığı Çalışanı) desteği:** Kullanıcı türü seçimi ile ASÇ kendi verilerini çekip analiz edebilir.
- 🔧 **Çift buton sistemi:** ASÇ modunda SİNA (ASÇ) butonu ASÇ kendi işlemlerini, SİNA BİRİM (ASÇ) butonu ise birim verilerini (doktor verilerini) çeker.
- 📊 **ASÇ özel katsayı tablosu:** Vital Bulgu ve Yaşlı Sağlığı İzlemi için özel katsayılar tanımlandı.
- 📋 **Akıllı tablo birleştirme:** SİNA BİRİM butonu ile çekilen veriler, ASÇ işlemlerinin altına doktor grupları olarak eklenir.
- 🎯 **ASÇ tavan katsayısı:** Doktor başarı katsayısına eşittir (doktor verisi yoksa 1.0).
- 🔐 **Birim bazlı görünüm modu:** Her birim için son kullanılan tablo görünümü ayrı saklanır.
- 🎨 **ASÇ işlemleri için özel grup başlığı:** ASÇ işlemleri yeşil başlık altında gösterilir.
- 🐛 **ASÇ SİNA tablo okuma düzeltmesi:** Farklı tablo yapısına sahip ASÇ sayfasından veri çekme sorunu giderildi.
- ⚡ **Küçük performans iyileştirmeleri ve hata düzeltmeleri.**

## 1.5.6 (2026-03-31)
- 🎨 **Modern UI Revizyonu:** Tüm mizanpaj 'rem' birimine taşınarak esnek (responsive) hale getirildi. Artık farklı pencere boyutlarında tablo ve kartlar çok daha dengeli görünüyor.
- 🔤 **Gelişmiş Yazı Boyutu Kontrolü:** Ayarlar menüsüne şık bir slider ve görsel ikonlar eklendi. Yazı boyutunu değiştirdiğinizde tüm arayüz artık orantılı bir şekilde büyüyor.
- 📐 **Taşma Koruması:** Büyük yazı boyutlarında 'DURUM' sütunu ve katsayı kartlarının mizanpajı bozması engellendi; içerik artık kutulara tam uyum sağlıyor.
- 🚀 **V1.5.5 Görsel Uyumluluğu:** Varsayılan yazı boyutu 16px olarak optimize edilerek, eski sürümün ferah ve okunaklı yapısı korundu.
- 🐛 **Veri & Senkronizasyon:** Çoklu birim yönetimi ve nüfus verilerinin eksik gelmesine neden olan kritik senkronizasyon hataları giderildi.
- ✨ **Yeni Eklenti İkonu:** Yüksek çözünürlüklü, modern ve profesyonel yeni tasarım devreye alındı.
- ⚡ **Performans:** Tema geçişleri ve veri yükleme hızında iyileştirmeler yapıldı.

## 1.5.5 (2026-03-30)
- 👥 **Kullanıcı türü seçimi eklendi:** Aile Hekimi / Aile Sağlığı Çalışanı (ASÇ).
- 🔧 **ASÇ modülü altyapısı hazırlandı:** ASÇ seçildiğinde SİNA butonu şimdilik çalışmaz, uyarı verir.
- 📁 **Veriler ayrı saklanıyor:** Doktor ve hemşire verileri artık farklı storage anahtarlarında tutulur.
- 🔄 **Güncelleme desteği:** 1.5.4 ve öncesinden gelen veriler otomatik olarak doktor verisi olarak taşınır.
- 🎯 **HYP butonu artık SİNA verisi yokken devre dışı:** Kullanıcı deneyimi iyileştirildi.
- 🐛 **HYP zaman göstergesi düzeltmesi:** Birim ID değiştiğinde eski birimin HYP zamanı artık gözükmüyor.
- ⚡ **Küçük performans iyileştirmeleri ve hata düzeltmeleri.**

## 1.5.4 (2026-03-28)
- 🧩 **Daha düzenli altyapı:** Eklenti artık daha hızlı ve kararlı çalışıyor.
- 🐛 **Hata düzeltmesi:** Birim ID alanı artık doğru görünüyor.
- 🔄 **Verileriniz korunuyor:** Güncelleme sırasında hiçbir veriniz kaybolmaz.
- 📊 **Tablo görünümü iyileştirildi:** Yüzdelikler artık daha anlaşılır şekilde gösteriliyor.
- ⚡ **Genel performans artışı:** Daha hızlı açılma ve veri çekme süreleri.
- 🎨 **Küçük görsel iyileştirmeler**

## 1.5.3 (2026-03-26)
- 📊 **Tavan katsayısı 1 ile 1.5 arasında sınırlandırıldı.**
- 📈 **KHT ve başarı katsayısı hesaplamalarında devreden, yapılan hedefin %10'u veya üzerindeyse hesaba katılıyor.**
- 🔧 **Çoklu birim desteği:** Veriler artık Birim ID ile birlikte saklanıyor ve dışa aktarılıyor.
- 🧹 **Popup.html kaldırıldı, sidepanel.js ile tek tip arayüz.**
- 🐛 **Küçük hata düzeltmeleri ve performans iyileştirmeleri.**

## 1.5.2 (2026-03-25)
- 🔒 **KVKK bilgilendirme notları artık ayarlar panelinden gizlenebilir / gösterilebilir (tercih hatırlanır).**
- 📅 **Tarih kısıtlamaları:** HYP butonu sadece cari ay/yıl için çalışır, SİNA butonu geçmişe izin verir.
- 📊 **KHT (Kronik Hastalık Tarama) yüzdesi ve renkli bar eklendi.** Bar üzerinde %40 ve %70 hedef işaretleri, tiklerle gösterilir.
- 📊 **KHT hesaplamasına 'devreden' değeri dahil edildi.** Artık önceki aylardan devreden sayılar hedefe katkı sağlar.
- 🎨 **Performans katsayısı rengi artık Tavan katsayısı ile karşılaştırılarak yeşil/kırmızı olur.**
- 🏷️ **Üçlü kutu düzeni:** BAŞARI, TAVAN KATSAYI ve KHT kutuları eklendi.
- 📐 **Kutu içi hizalama iyileştirildi:** başlıklar üstte, değerler altta ve sabit yükseklikte.

## 1.5.1 (2026-03-24)
- 🎨 **Varsayılan tema açık (SİNA Klasik) olarak değiştirildi.**
- 🔧 **Gelişmiş ayarlar butonu toggle (aç/kapa) mantığına kavuştu.**
- 📌 **KVKK bilgilendirme metni hem tablo altında (yapışkan) hem ayarlar panelinde gösteriliyor.**
- 🎨 **Arayüz iyileştirmeleri:** Gelişmiş ayarlar bölümü başlangıçta gizli, ihtiyaç halinde açılıyor.
- 🛡️ **CSP (Content Security Policy) uyumu sağlandı, inline script hatası giderildi.**
- 🐛 **Küçük hata düzeltmeleri ve performans iyileştirmeleri.**

## 1.5.0 (2026-03-22)
- 🔒 **KVKK uyumlu hale getirildi:** Açık rıza alınır, veriler 90 gün sonra otomatik silinir, istenirse veriler silinebilir veya dışa aktarılabilir.
- 🛡️ **Güvenlik iyileştirmeleri yapıldı (XSS koruması, CSP uyumu).**
- ⚡ **Performans artırıldı, daha hızlı çalışır.**
- 🎨 **Açık tema (SİNA Klasik) eklendi.**
- ⏱️ **Veri çekme işlemlerinde zaman aşımı eklendi (30 saniye).**
- 📋 **Sürüm geçmişi butonu eklendi.**
- 🔧 **Gelişmiş ayarlar bölümü eklendi.**

## 1.4.6 (2026-03-19)
- 🚀 **İlk sürüm.**
- 📊 **SİNA ve HYP'den veri çekme ve tabloda gösterme.**
- 🖱️ **Manuel tıklama ile sekme açma, otomatik veri yakalama.**
- 🎨 **Koyu tema desteği (Tokyo Night).**

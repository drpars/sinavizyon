# SİNA VİZYON - Performans Yönetim Eklentisi

**SİNA VİZYON**, aile hekimliği birimlerinde SİNA (Sağlık İstatistikleri ve Analiz) ve HYP (Halk Yönetim Platformu) sistemlerinden performans verilerini çeken, analiz eden ve kullanıcı dostu bir arayüzle sunan bir tarayıcı eklentisidir.

## 🚀 Özellikler

- **📊 Veri Çekme:** SİNA ve HYP sistemlerinden otomatik veya manuel veri çekme.
- **📈 Performans Analizi:** KHT (Kronik Hastalık Tarama) yüzdesi, başarı katsayısı ve tavan katsayısı hesaplamaları.
- **🔧 Çoklu Birim Desteği:** Farklı birim ID'leri ile veriler ayrı ayrı saklanır ve yönetilir.
- **🎨 Tema Desteği:** Açık (SİNA Klasik) ve koyu (Tokyo Night) tema seçenekleri.
- **🔒 KVKK Uyumlu:** Açık rıza yönetimi, 90 gün veri saklama, veri silme ve dışa aktarım imkanı.
- **📅 Tarih Kısıtlamaları:** SİNA butonu geçmiş dönemlere izin verir, HYP butonu sadece cari ay/yıl için çalışır.
- **📋 Sürüm Geçmişi:** Yapılan güncellemeleri görüntüleme.
- **⚙️ Gelişmiş Ayarlar:** Süreç yönetimi, ay/yıl seçimi, birim ID ve nüfus bilgisi girişi.

## 📦 Kurulum

### Chrome / Chromium Tabanlı Tarayıcılar
1. Bu repoyu klonlayın veya ZIP olarak indirin.
2. Tarayıcınızda `chrome://extensions/` adresine gidin.
3. **Geliştirici modu**'nu açın.
4. **Paketlenmemiş öğe yükle**'ye tıklayın ve `SinaHypEklenti - Chrome` klasörünü seçin.

### Firefox / Gecko Tabanlı Tarayıcılar
1. `SinaHypEklenti - Firefox` klasörüne gidin.
2. `manifest.json` dosyasının içinde `browser_specific_settings.gecko.id` alanını kendi e-posta adresinizle güncelleyin.
3. Firefox'ta `about:debugging` adresine gidin.
4. **Geçici Eklenti Yükle**'ye tıklayın ve `manifest.json` dosyasını seçin.

## 🛠️ Kullanım

1. Eklenti simgesine tıklayarak yan paneli açın.
2. **Gelişmiş Ayarlar** butonuna tıklayarak ay, yıl, birim ID ve nüfus bilgilerini girin.
3. **SİNA** butonuna tıklayarak hedef verilerini çekin.
4. **HYP** butonuna tıklayarak yapılan verilerini güncelleyin.
5. Tabloda performans verilerini ve katsayıları görüntüleyin.

## 📁 Proje Yapısı

```
SinaVizyon/
├── modules/
│   ├── core/
│   │   ├── dom.js
│   │   ├── state.js
│   │   ├── events.js
│   │   └── storage.js
│   ├── ui/
│   │   ├── table/
│   │   │   └── index.js
│   │   ├── updaters/
│   │   │   ├── index.js
│   │   │   ├── kht-updater.js
│   │   │   ├── theme-updater.js
│   │   │   ├── kvkk-updater.js
│   │   │   ├── button-updater.js
│   │   │   ├── table-updater.js
│   │   │   └── helpers.js
│   │   └── components/
│   │       ├── index.js
│   │       ├── modal.js
│   │       └── dialog.js
│   ├── features/
│   │   ├── doctor/
│   │   │   ├── index.js
│   │   │   └── calculator.js
│   │   ├── nurse/
│   │   │   ├── index.js
│   │   │   ├── calculator.js
│   │   │   └── showall-manager.js
│   │   └── consent/
│   │       ├── index.js
│   │       └── manager.js
│   ├── lib/
│   │   ├── calculations.js
│   │   ├── constants.js
│   │   ├── config.js
│   │   ├── date-utils.js
│   │   └── migration.js
│   └── data/
│       └── changelog.json
├── sidepanel.html
├── sidepanel.js
├── sidepanel-toggle.js
├── styles.css
├── content.js
├── background.js
├── manifest-chrome.json
├── manifest-firefox.json
└── icons/
```

## 🔧 Geliştirme

### Modüler Yapı
Eklenti, ES6 modülleri ile geliştirilmiştir. Her modül tek bir sorumluluğa sahiptir:

| Modül | Sorumluluk |
|-------|------------|
| `constants.js` | Sabit veriler (katsayı tablosu, eşleme, sürüm geçmişi) |
| `storage.js` | Storage işlemleri (birim bazlı veri kaydetme/okuma) |
| `calculations.js` | Katsayı, KHT, efektif yapılan hesaplamaları |
| `ui.js` | Tablo, tema, görünürlük işlemleri |
| `modals.js` | Modal pencereler (KVKK rıza, sürüm geçmişi) |
| `date-utils.js` | Tarih ve ay işlemleri |
| `migration.js` | Eski sürümlerden veri taşıma |

### Tarayıcı Uyumluluğu
- **Chrome/Chromium:** `sidePanel` API kullanılır, buton tıklaması yan paneli açar.
- **Firefox/Gecko:** `sidebarAction` API kullanılır, buton tıklaması kenar çubuğunu açar/kapatır (toggle).

## 📝 Sürüm Geçmişi

Sürüm geçmişini eklenti içindeki **"📋 Sürüm Geçmişi"** butonundan görüntüleyebilirsiniz.

## 🤝 Katkıda Bulunma

1. Bu repoyu fork'layın.
2. Yeni bir dal oluşturun (`git checkout -b ozellik/yeni-ozellik`).
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`).
4. Dalınızı push edin (`git push origin ozellik/yeni-ozellik`).
5. Bir Pull Request oluşturun.

## 📜 Lisans

Bu proje, [MIT Lisansı](LICENSE) ile lisanslanmıştır.

<!-- ## 📧 İletişim -->

<!-- Sorularınız veya geri bildirimleriniz için: [drpars@example.com](mailto:drpars@example.com) -->

---

**SİNA VİZYON** - Sağlıkta Performans Yönetimi

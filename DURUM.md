# Yapılacaklar - Durumlar

## Faz 1: Altyapı ve Düzeltmeler ✅
| # | Görev | Durum |
|---|------|-------|
| 1 | API istemci altyapısı (api-client.js) | ✅ Tamamlandı (sina-api-client.js + sina-endpoints.js) |
| 2 | Simülatör katsayı farkı (1.30705 vs 1.23985) | ✅ Düzeltildi (surecKatsayisi eklendi) |
| 3 | HYP sonrası başarı katsayısı güncellenmeme sorunu | ✅ Düzeltildi (dinamik map, calculateDoctorKatsayi güncellendi) |
| 4 | Tabloda TAMAM/EKSİK için her işlemin kendi azamiOran'ını kullanma | ✅ Düzeltildi (createTableRow güncellendi) |

## Faz 2: API Entegrasyonları ⏳ (Kısmen)
| # | Görev | Durum |
|---|------|-------|
| 5 | Birim adını SİNA API'den çekme | ⏸️ |
| 6 | Memnuniyet puanı API entegrasyonu | ⏸️ |
| 7 | Muayene ortalaması API entegrasyonu | ⏸️ |
| 8 | Otizm API entegrasyonu | ✅ Tamamlandı (v2.2.6: birimId + çift endpoint + measure_id) |

## Faz 3: Akıllı Öneri ve Simülatör ⏳
| # | Görev | Durum |
|---|------|-------|
| 9 | Akıllı öneri - eş zamanlı parametre değerlendirme + zorluk ağırlığı | ✅ (v2.3.0 redesign: öneri barı + popup) |
| 10 | Slider badge dinamik ekleme sayısı (0 → +1 → +2 ...) | ✅ (zaten çalışıyordu) |
| 11 | Düşük Nüfus desteği (2400/Nüfus + radio buton) | ⏸️ (bilgi eksik) |
| 12 | Simülasyon modalı yeniden tasarım (başlıkta katsayı + öneri barı + popup) | ✅ (v2.3.0 redesign) |

## Faz 4: Dashboard ✅ (Kısmen)
| # | Görev | Durum |
|---|------|-------|
| 13 | Dashboard birimInfo düzeltme + birim adı gösterme | ✅ (Birim adı kartı eklendi, glow animasyonlu) |
| 14 | Dashboard'a yeni kartlar (memnuniyet, muayene) | ⏳ |
| 15 | Ayarlar modalına "Birim Tipi" radio butonları | ⏳ |

## Faz 5: Veri Yönetimi ⏳
| # | Görev | Durum |
|---|------|-------|
| 16 | Dışa aktar güncelleme | ⏳ |
| 17 | İçe aktar özelliği | ⏳ |

## Faz 6: Test ⏳
| # | Görev | Durum |
|---|------|-------|
| 18 | strategy.js zorluk puanı testleri | ⏳ |
| 19 | calculateCurrentKatsayi testi | ⏳ |
| 20 | simulateSingleChange testi | ⏳ |
| 21 | calculateSmartStrategy testi | ⏳ |
| 22 | calculateCombinationStrategy testi | ⏳ |
| 23 | getMaxYapilanForIslem testi | ⏳ |
| 24 | calculateDoctorKHT / calculateNurseKHT testi | ⏳ |

## Faz 7: Dashboard-Canlı Bağlantı (v2.2.4) ⏳
| # | Görev | Durum |
|---|------|-------|
| 25 | HYP/SİNA butonuna basıldığında Dashboard açıksa otomatik yenileme | ⏳ |
| 26 | SİNA butonuna basıldığında Dashboard açıksa otomatik yenileme (HYP gibi) | ⏳ |

---

## v2.3.0 Yapılanlar ✅ (2026-05-15)
- **Otizm Tarama Takvimi:** Dashboard'a yeni panel eklendi. Bu ay ve gelecek ay tarama periyodundaki çocuklar listeleniyor.
- **HYP Hasta Listesi API:** `status=all&careType=osb` ile OSB tanılı tüm çocuklar çekiliyor, sayfalama destekli.
- **Periyot Hesaplama:** SİNA kuralına uygun (21.ay-1g, 27.ay-1g, 39.ay-1g). 15.09.2024 örneği ile birebir doğrulandı.
- **Durum Sütunu:** Her çocuk için 🟢 Yapılabilir / 🔴 Süre Doldu renkli göstergesi.
- **Yan Yana Tablolar:** Bu ay ve gelecek ay ayrı sütunlarda, responsive tasarım.
- **content.js:** `fetchOtizmHastalari` mesaj handler'ı, HYP Population API entegrasyonu.
- **dashboard.js:** Arka plan HYP sekmesi açıp content.js üzerinden veri çekme, sekme yönetimi.
- **otizm-izlem.js:** Yeni modül - hesaplama, filtreleme, render.
- **Oturum ve Birim Kontrolü:** HYP oturumu ve seçili birim uyuşmazlığı durumunda durum çubuğu ile bilgilendirme.
- **Dashboard Scrollbar:** Dashboard geneli ve otizm tablosu için ince, oksuz, temalı scrollbar eklendi.
- **About Modal:** İbn-i Sina sözü sanatsal tasarımla yenilendi, versiyon numarası kaldırıldı.
- **changelog.json / whatsnew.js:** v2.3.0 için güncellendi.

## v2.2.6 Yapılanlar ✅ (2026-05-15)
- **Node'lar hardcoded**: node4 + node7 sabit, v2.2.3'teki node fallback (4→1→2→3) yok. Gerekirse eklenmeli.
- **Otizm API yeniden yazıldı**: birimId tabanlı filtreleme, çift endpoint (node4 + node7) ile paralel veri çekme
- **Otizm response parse**: positional index yerine measure_id eşleştirmesi (`dm-dh7dfjad3d67dwc` vb.)
- **yapilanAlt yedek**: Asıl yapilan değeri öncelikli, yapilanAlt sadece fallback
- **HYP otizm mapping kaldırıldı**: Otizm verileri sadece SİNA API'den çekiliyor
- **v2.2.6 migration**: Eski veriler otomatik temizleniyor (savedResults, sinaLastTime, hypLastTime)
- **changelog.json / whatsnew.js**: v2.2.6 için güncellendi

## v2.2.3 Yapılanlar ✅
- **Dashboard birim adı fix**: HYP çekildiğinde birimAdi silinmesi giderildi
- **Dashboard ikonu**: `dashboard.png` ile değiştirildi, dikey hizalama iyileştirildi
- **markNewFeature sistemi**: `YENİ` badge + pulse glow, 2.2.5'e kadar gösteriliyor
- **Dashboard tek sekme**: `createOrFocusTab()` ile tabId takibi
- **ASÇ başarı katsayısı fix**: ay/yil parametresi tüm updateTable çağrılarına eklendi, süreç katsayısı düzeldi
- **ASÇ veri yokken**: 1.0000 varsayılan değer, doktora eşitlenmez
- **Spinner timeout**: 15sn → 25sn (otizm API gecikmesi için)
- **changelog.json / whatsnew.js**: v2.2.3 için güncellendi

---

## İstatistik
- **Toplam:** 27 görev
- **Tamamlanan:** 11 (#2, #3, #4 faz1 + #1, #8 faz2 + #9, #10, #12 faz3 + v2.2.3 + v2.2.6 + v2.3.0)
- **Devam eden:** 13
- **Pasif:** 3 (Faz 2: #5, #6, #7)
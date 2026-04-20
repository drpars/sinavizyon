// modules/ui/components/modal/whatsnew.js

export async function showWhatsNewModal(version) {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "consent-modal";
    modal.style.animation = "fadeIn 0.2s ease";

    let whatsNewItems = [];

    if (version === "2.1.4") {
      whatsNewItems = [
        "🐛 Akıllı öneride tamamlanmış işlemler artık önerilmez",
        "📊 Slider kartları zorluk puanına göre sıralanır",
        "🧠 Hibrit Zorluk Puanı (statik + dinamik analiz)",
        "⚖️ Devreden bulunan işlemler daha kolay kabul edilir",
      ];
    } else if (version === "2.1.3") {
      whatsNewItems = [
        "🧠 Stratejik Zeka (AI) güncellemesi",
        "🎯 Tavan katsayısını aşan gereksiz eforları önerme",
        "🧹 Kod temizliği ve performans iyileştirmeleri",
      ];
    } else if (version === "2.1.2") {
      whatsNewItems = [
        "🧹 v2.1.x'den geçişte eski veriler temizlenir (temiz başlangıç)",
        "🐛 SİNA tekrar çekildiğinde büyük olan yapilan değeri korunur",
        "🎨 WhatsNew modalı koyu tema ile uyumlu hale geldi",
        "🎮 Simülasyon kartları tıkla-aç/kapat özelliği (daha fazla slider görünür)",
      ];
    } else if (version === "2.1.1") {
      whatsNewItems = [
        "🐛 ASÇ modu veri birleştirme düzeltildi (SİNA + SİNA BİRİM)",
        "🐛 Doktor modu HYP güncelleme düzeltildi",
        "🐛 Türkçe karakter sorunu çözüldü (İ/ı karakterleri)",
        "🐛 Modlar arası geçişte veri kaybı giderildi",
        "🔧 Veri çekme işlemleri daha kararlı hale getirildi",
        "🧹 Kod temizliği ve performans iyileştirmeleri",
      ];
    } else if (version === "2.1.0") {
      whatsNewItems = [
        "🎯 Yeni 'Ne Yapmalıyım?' butonu ile Performans Simülasyonu",
        "💡 Akıllı Öneri Sistemi (en az işlemle hedefe ulaş)",
        "🎮 İnteraktif slider'lar ile anlık katsayı hesaplama",
        "📊 Öncelikli sıralama (Taramalar > İzlemler > Kanser)",
        "🎨 Sade ve modern arayüz, global scrollbar stili",
        "🐛 SİNA zamanı, spinner ve Birim ID hata düzeltmeleri",
      ];
    } else if (version === "2.0.4") {
      whatsNewItems = [
        "🔒 Güvenlik iyileştirmesi (innerHTML → textContent)",
        "🛡️ XSS saldırılarına karşı koruma",
        "📱 Firefox manifest uyumluluğu güncellendi",
      ];
    } else if (version === "2.0.3") {
      whatsNewItems = [
        "🔔 Toast bildirimleri iyileştirildi (daha hızlı ve kararlı)",
        "🎨 Scrollbar tasarımı yenilendi (ince ve şık görünüm)",
        "🖌️ CSS iyileştirmeleri ve hover efektleri",
        "🧹 Kod temizliği ve performans artışı",
      ];
    } else if (version === "2.0.2") {
      whatsNewItems = [
        "🔧 Kod temizliği ve modüler yapı iyileştirmeleri",
        "🐛 Birim ID çakışması giderildi",
        "📦 Modal dosyaları modüler hale getirildi",
        "⚡ State yükleme optimize edildi",
      ];
    } else if (version === "2.0.1") {
      whatsNewItems = [
        "🎨 Görsel iyileştirmeler yapıldı",
        "🌙 Koyu tema uyumu tamamlandı",
        "🐛 Farklı aylara ait veriler artık karışmıyor",
        "⚡ Veri çekme, tutarsızlık ve birleştirme düzeltildi",
        "🔧 Ayarlar penceresindeki butonlar düzeltildi",
        "🛡️ Sadece ihtiyaç duyulan sayfalarda veri çekiliyor",
      ];
    } else if (version === "2.0.0") {
      whatsNewItems = [
        "🎨 Yepyeni ve sade bir görünüm",
        "🌙 Göz yormayan koyu tema",
        "🔧 Tüm ayarlar tek pencerede",
        "📏 Yazı boyutunu kendiniz ayarlayın",
        "👩‍⚕️ ASÇ hesaplamaları iyileştirildi",
        "⚡ Daha hızlı veri çekme",
      ];
    } else {
      whatsNewItems = ["🎨 Yeni görünüm ve temalar", "🐛 Hata düzeltmeleri", "⚡ Performans iyileştirmeleri"];
    }

    const itemsHtml = whatsNewItems
      .map(
        (item) => `
      <div style="margin: 12px 0; font-size: 0.85rem; display: flex; align-items: flex-start; gap: 10px;">
        <span style="min-width: 24px;">✅</span>
        <span style="flex: 1; line-height: 1.4;">${item}</span>
      </div>
    `
      )
      .join("");

    modal.innerHTML = `
      <div class="consent-modal-content" style="max-width: 420px; text-align: left; overflow: hidden;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="icons/icon-org.svg" style="width: 64px; height: 64px;">
          <h2 style="margin: 12px 0 4px 0; color: var(--blue); font-size: 1.3rem;">SİNA VİZYON</h2>
          <p style="margin: 0; font-size: 0.75rem; opacity: 0.7;">v${version} ile neler değişti?</p>
        </div>
        
        <div style="background: var(--bg); border-radius: 16px; padding: 8px 16px; margin-bottom: 20px; max-height: 350px; overflow-y: auto;">
          ${itemsHtml}
        </div>
        
        <div style="background: var(--bg-dark); border-radius: 12px; padding: 10px; margin-bottom: 16px; text-align: center; border: 1px solid var(--border);">
          <span style="font-size: 0.7rem;">💡 İpucu: 'Ne Yapmalıyım' butonu ile hedefe ulaşmak için strateji alın!</span>
        </div>
        
        <button id="whatsNewConfirmBtn" style="width: 100%; background-color: var(--blue); color: white; border: none; padding: 12px; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 0.9rem;">
          SİNA VİZYON'U KULLANMAYA BAŞLA
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = "flex";

    const confirmBtn = document.getElementById("whatsNewConfirmBtn");
    confirmBtn.addEventListener(
      "click",
      () => {
        modal.remove();
        resolve();
      },
      { once: true }
    );
  });
}

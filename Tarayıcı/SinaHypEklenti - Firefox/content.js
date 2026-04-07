(function () {
  const isHyp = window.location.href.includes("hyp.saglik.gov.tr");
  const isSina = window.location.href.includes("sina.saglik.gov.tr");

  // Consent cache
  let consentCache = null;
  let consentPromise = null;

  // Rıza kontrolü – sadece rıza varsa veri çekme işlemleri başlatılır
  async function checkConsent() {
    if (consentCache !== null) return consentCache;
    
    if (consentPromise) return consentPromise;
    
    consentPromise = new Promise((resolve) => {
      chrome.storage.local.get(["kvkkConsent"], (res) => {
        consentCache = res.kvkkConsent === true;
        resolve(consentCache);
      });
    });
    return consentPromise;
  }

  // --- HYP: İnatçı tıklayıcı ve veri çekici ---
  if (isHyp && window.location.hash === "#kopyala") {
    checkConsent().then((hasConsent) => {
      if (!hasConsent) {
        console.log("🔒 KVKK rızası yok, HYP verisi çekilmiyor.");
        return;
      }

      console.log("🚀 HYP Eklentisi: İnatçı Tıklama Modu Devrede");

      let basarili = false;
      let intervalId = null;
      let observer = null;
      let attemptCount = 0;
      const MAX_ATTEMPTS = 30;

      const tiklaVeKontrolEt = () => {
        if (basarili) {
          if (intervalId) clearInterval(intervalId);
          return;
        }

        attemptCount++;
        if (attemptCount > MAX_ATTEMPTS) {
          console.warn("⏰ Zaman aşımı: Hedef kartlar bulunamadı.");
          if (intervalId) clearInterval(intervalId);
          if (observer) observer.disconnect();
          return;
        }

        const kartlar = document.querySelectorAll(
          ".population-target-analysis .content-sub"
        );
        if (kartlar.length > 0) {
          console.log("✅ Kartlar ekranda görüldü, veriler çekiliyor...");
          veriCekVeGonder(kartlar);
          basarili = true;
          if (intervalId) clearInterval(intervalId);
          if (observer) observer.disconnect();
          return;
        }

        let sekme = document.querySelector('a[id="5"]');
        if (!sekme) {
          const li = document.getElementById("5");
          if (li) sekme = li.querySelector("a") || li;
        }

        if (sekme) {
          console.log("⏳ Sekme bulundu, tıklanıyor...");
          sekme.click();
        } else {
          console.log("Aranan sekme henüz sayfada yok, yüklenmesi bekleniyor...");
        }
      };

      intervalId = setInterval(tiklaVeKontrolEt, 1000);

      observer = new MutationObserver(() => {
        if (basarili) return;
        const kartlar = document.querySelectorAll(
          ".population-target-analysis .content-sub"
        );
        if (kartlar.length > 0) {
          veriCekVeGonder(kartlar);
          basarili = true;
          if (intervalId) clearInterval(intervalId);
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      function veriCekVeGonder(kartlar) {
        const sonuclar = Array.from(kartlar)
          .map((kart) => ({
            ad: kart.querySelector(".title")?.textContent?.trim() || "",
            yapilan: kart
              .querySelector(".performance-statistics-value")
              ?.textContent?.trim() || "",
          }))
          .filter((item) => item.ad && item.yapilan);

        if (sonuclar.length > 0) {
          chrome.runtime
            .sendMessage({
              action: "hypDataParsed",
              results: sonuclar,
            })
            .catch((err) => console.error("Mesaj gönderilemedi:", err));
          console.log("🚀 Veriler eklentiye başarıyla gönderildi!");
        }
      }
    });
  }

  // --- SİNA: Sıralı Hibrit Yaklaşım (Observer → Interval → Zaman Aşımı) ---
  if (isSina) {
    checkConsent().then((hasConsent) => {
      if (!hasConsent) {
        console.log("🔒 KVKK rızası yok, SİNA verisi çekilmiyor.");
        return;
      }

      console.log("🚀 SİNA Veri İzleyici Aktif (Sıralı Hibrit Mod)...");

      let veriGonderildi = false;
      let observer = null;
      let fallbackInterval = null;
      let observerTimeout = null;
      let finalTimeout = null;

      // Veri çekme fonksiyonu
      function sinaExtractData() {
        if (veriGonderildi) return;
        
        // ASÇ sayfasındaki flex tablo için özel seçici
        let rows = document.querySelectorAll('div[role="row"], [role="row"]');
        
        // Doktor sayfası için alternatif seçiciler
        if (rows.length === 0) {
          rows = document.querySelectorAll('table tbody tr, [role="row"], .MuiTableRow-root');
        }
        
        // Son çare: Sayfadaki tüm tablo satırları
        if (rows.length === 0) {
          rows = document.querySelectorAll('table tr');
        }
        
        // Sayfada "Aradığınız kriterlerde..." mesajı var mı?
        const noDataMessage = document.body.innerText.includes("Aradığınız kriterlerde Gerçekleşme Tablosu için sonuç bulunamadı");
        if (noDataMessage) {
          console.log("📭 Sayfada 'sonuç bulunamadı' mesajı var, boş mesaj gönderiliyor...");
          veriGonderildi = true;
          chrome.runtime.sendMessage({ action: "dataParsed", results: [] })
            .catch((err) => console.error("Mesaj gönderilemedi:", err));
          return;
        }
        
        // Başlık satırlarını filtrele
        const dataRows = Array.from(rows).filter(row => {
          const cells = row.querySelectorAll('[role="cell"], .MuiTableCell-root, div[role="cell"], td, th');
          if (cells.length === 0) return false;
          const firstCell = cells[0];
          const text = firstCell.textContent?.trim() || "";
          return text !== "" && 
                 !text.includes("İŞLEM ADI") && 
                 !text.includes("GER.") && 
                 !text.includes("YAP.") && 
                 !text.includes("DEV.") && 
                 !text.includes("DURUM") &&
                 !text.includes("Kronik") &&
                 !text.includes("Birim");
        });
        
        const results = [];
        dataRows.forEach((row) => {
          let cells = row.querySelectorAll('[role="cell"], .MuiTableCell-root, div[role="cell"], td, th');
          if (cells.length < 4) return;
          
          const cellArray = Array.from(cells);
          let ad = "", gereken = "", yapilan = "", devreden = "";
          
          if (cellArray.length >= 5) {
            ad = cellArray[1]?.textContent?.trim() || "";
            gereken = cellArray[2]?.textContent?.trim() || "";
            yapilan = cellArray[3]?.textContent?.trim() || "";
            devreden = cellArray[4]?.textContent?.trim() || "0";
          } else {
            ad = cellArray[0]?.textContent?.trim() || "";
            gereken = cellArray[1]?.textContent?.trim() || "";
            yapilan = cellArray[2]?.textContent?.trim() || "";
            devreden = cellArray[3]?.textContent?.trim() || "0";
          }
          
          const rowData = { ad, gereken, yapilan, devreden };
          const hasNumber = !isNaN(parseInt(rowData.gereken));
          
          if (hasNumber && rowData.ad && !rowData.ad.includes("Çankırı")) {
            results.push(rowData);
          }
        });

        if (veriGonderildi) return;
        veriGonderildi = true;
        
        if (results.length > 0) {
          console.log("✅ SİNA verileri çekildi:", results.length, "işlem");
          console.log("📊 İşlemler:", results.map(r => r.ad));
          chrome.runtime.sendMessage({ action: "dataParsed", results: results })
            .catch((err) => console.error("Mesaj gönderilemedi:", err));
        } else {
          console.log("⚠️ SİNA verisi bulunamadı, boş mesaj gönderiliyor...");
          chrome.runtime.sendMessage({ action: "dataParsed", results: [] })
            .catch((err) => console.error("Mesaj gönderilemedi:", err));
        }
        
        // Temizlik
        if (observer) observer.disconnect();
        if (fallbackInterval) clearInterval(fallbackInterval);
        if (observerTimeout) clearTimeout(observerTimeout);
        if (finalTimeout) clearTimeout(finalTimeout);
      }

      // ========== 1. MUTATION OBSERVER (3 saniye boyunca) ==========
      observer = new MutationObserver(() => {
        if (veriGonderildi) return;
        setTimeout(() => {
          if (!veriGonderildi) {
            const rows = document.querySelectorAll('div[role="row"], [role="row"], table tbody tr');
            if (rows.length > 0) {
              console.log("👁️ Observer veri buldu, çekiliyor...");
              sinaExtractData();
            }
          }
        }, 100);
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // 3 saniye sonra Observer'ı durdur ve Interval'e geç
      observerTimeout = setTimeout(() => {
        if (!veriGonderildi) {
          console.log("⏳ Observer 3 sn içinde veri bulamadı, Interval moduna geçiliyor...");
          if (observer) observer.disconnect();
          
          // ========== 2. FALLBACK INTERVAL ==========
          fallbackInterval = setInterval(() => {
            if (veriGonderildi) {
              clearInterval(fallbackInterval);
              return;
            }
            const rows = document.querySelectorAll('div[role="row"], [role="row"], table tbody tr');
            if (rows.length > 0) {
              console.log("🔄 Interval ile veri bulundu, çekiliyor...");
              sinaExtractData();
              clearInterval(fallbackInterval);
            }
          }, 1000);
        }
      }, 3000);

      // ========== 3. ZAMAN AŞIMI (10 saniye sonra zorla) ==========
      finalTimeout = setTimeout(() => {
        if (!veriGonderildi) {
          console.log("⏰ Zaman aşımı (10 sn), zorla veri çekiliyor...");
          sinaExtractData();
        }
        if (observer) observer.disconnect();
        if (fallbackInterval) clearInterval(fallbackInterval);
      }, 10000);
    });
  }
})();

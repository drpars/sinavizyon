(function () {
  const isHyp = window.location.href.includes("hyp.saglik.gov.tr");
  const isSina = window.location.href.includes("sina.saglik.gov.tr");

  // Rıza kontrolü – sadece rıza varsa veri çekme işlemleri başlatılır
  async function checkConsent() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["kvkkConsent"], (res) => {
        resolve(res.kvkkConsent === true);
      });
    });
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

  // --- SİNA: Kayma düzeltmeli veri çekme (Doktor ve ASÇ için) ---
  if (isSina) {
    checkConsent().then((hasConsent) => {
      if (!hasConsent) {
        console.log("🔒 KVKK rızası yok, SİNA verisi çekilmiyor.");
        return;
      }

      console.log("🚀 SİNA Veri İzleyici Aktif (Düzeltilmiş Mod)...");

      let checkCount = 0;
      const MAX_CHECKS = 40;
      let lastRowCount = 0;
      let stableCount = 0;

      const checkInterval = setInterval(() => {
        checkCount++;
        
        // ASÇ sayfasındaki flex tablo için özel seçici
        let rows = document.querySelectorAll('div[role="row"], [role="row"]');
        
        // Doktor sayfası için alternatif seçiciler
        if (rows.length === 0) {
          rows = document.querySelectorAll('table tbody tr, [role="row"], .MuiTableRow-root');
        }
        
        // Başlık satırlarını filtrele
        const dataRows = Array.from(rows).filter(row => {
          // ASÇ flex tablo yapısı için: içinde text içeren bir div var mı?
          const cells = row.querySelectorAll('[role="cell"], .MuiTableCell-root, div[role="cell"]');
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
        
        const currentRowCount = dataRows.length;
        console.log(`SİNA kontrol ${checkCount}/${MAX_CHECKS}: ${currentRowCount} satır bulundu`);
        
        if (currentRowCount === lastRowCount && currentRowCount > 0) {
          stableCount++;
          if (stableCount >= 2) {
            console.log("✅ Tablo stabil, veriler çekiliyor...");
            clearInterval(checkInterval);
            sinaExtractData(dataRows);
          }
        } else {
          stableCount = 0;
          lastRowCount = currentRowCount;
        }
        
        if (checkCount > MAX_CHECKS) {
          clearInterval(checkInterval);
          console.warn("SİNA: Zaman aşımı, veri bulunamadı.");
        }
      }, 1000);

      function sinaExtractData(rows) {
        const results = [];
        rows.forEach((row) => {
          // ASÇ flex tablo yapısı için hücreleri al
          let cells = row.querySelectorAll('[role="cell"], .MuiTableCell-root, div[role="cell"]');
          
          if (cells.length === 0) {
            cells = row.querySelectorAll('td, th');
          }
          
          if (cells.length < 4) return;
          
          // Hücreleri diziye çevir
          const cellArray = Array.from(cells);
          
          // İşlem adını bul (genellikle 1. veya 2. hücrede)
          let ad = "";
          let gereken = "";
          let yapilan = "";
          let devreden = "";
          
          // ASÇ tablosunda yapı: [Birim Adı, İşlem Adı, Gereken, Yapılan, Devreden, ...]
          if (cellArray.length >= 5) {
            ad = cellArray[1]?.textContent?.trim() || "";
            gereken = cellArray[2]?.textContent?.trim() || "";
            yapilan = cellArray[3]?.textContent?.trim() || "";
            devreden = cellArray[4]?.textContent?.trim() || "0";
          } else {
            // Doktor tablosu yapısı
            ad = cellArray[0]?.textContent?.trim() || "";
            gereken = cellArray[1]?.textContent?.trim() || "";
            yapilan = cellArray[2]?.textContent?.trim() || "";
            devreden = cellArray[3]?.textContent?.trim() || "0";
          }
          
          const rowData = {
            ad: ad,
            gereken: gereken,
            yapilan: yapilan,
            devreden: devreden,
          };
          
          const hasNumber = !isNaN(parseInt(rowData.gereken));
          
          if (hasNumber && rowData.ad && !rowData.ad.includes("Çankırı")) {
            results.push(rowData);
          }
        });

        if (results.length > 0) {
          console.log("✅ SİNA verileri çekildi:", results.length, "işlem");
          console.log("📊 İşlemler:", results.map(r => r.ad));
          chrome.runtime
            .sendMessage({ action: "dataParsed", results: results })
            .catch((err) => console.error("Mesaj gönderilemedi:", err));
        } else {
          console.warn("⚠️ SİNA verisi bulunamadı, satırlar:", rows.length);
          if (rows.length > 0) {
            const firstRow = rows[0];
            const cells = firstRow.querySelectorAll('[role="cell"], .MuiTableCell-root');
            console.log("🔍 İlk satırdaki hücre sayısı:", cells.length);
            Array.from(cells).forEach((c, i) => {
              console.log(`  Hücre ${i}:`, c.textContent?.trim());
            });
          }
        }
      }
    });
  }
})();

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

  // --- SİNA: Kayma düzeltmeli veri çekme ---
  if (isSina && window.location.hash.includes("#kopyala")) {
    checkConsent().then((hasConsent) => {
      if (!hasConsent) {
        console.log("🔒 KVKK rızası yok, SİNA verisi çekilmiyor.");
        return;
      }

      console.log("🚀 SİNA Veri İzleyici Aktif (Düzeltilmiş Mod)...");

      let checkCount = 0;
      const MAX_CHECKS = 20;

      const checkInterval = setInterval(() => {
        checkCount++;
        const rows = document.querySelectorAll('[role="row"], .MuiTableRow-root');
        if (rows.length > 5) {
          clearInterval(checkInterval);
          sinaExtractData(rows);
        }
        if (checkCount > MAX_CHECKS) {
          clearInterval(checkInterval);
          console.warn("SİNA: Zaman aşımı, veri bulunamadı.");
        }
      }, 1000);

      function sinaExtractData(rows) {
        const results = [];
        rows.forEach((row) => {
          const cells = row.querySelectorAll(
            '[role="cell"], td, .MuiTableCell-root'
          );

          if (cells.length >= 4) {
            const rowData = {
              ad: cells[1]?.textContent?.replace(/\n/g, " ").trim() || "",
              gereken: cells[2]?.textContent?.trim() || "",
              yapilan: cells[3]?.textContent?.trim() || "",
              devreden: cells[4]?.textContent?.trim() || "0",
            };

            const isHeader =
              rowData.ad.includes("Birim") ||
              rowData.ad.includes("Kronik") ||
              rowData.ad === "";
            const hasNumber = !isNaN(parseInt(rowData.gereken));

            if (!isHeader && hasNumber) {
              results.push(rowData);
            }
          }
        });

        if (results.length > 0) {
          // Veriyi zaman damgasıyla kaydet (popup.js'de işlenecek)
          chrome.runtime
            .sendMessage({ action: "dataParsed", results: results })
            .catch((err) => console.error("Mesaj gönderilemedi:", err));
        }
      }
    });
  }
})();

// ============================================================
// HYP API ENTEGRASYONU (v2.1.6)
// ============================================================

// HYP sayfasında seçili birimin ID'sini bul
function getHypSelectedBirimId() {
  try {
    const dd = document.querySelector("p-dropdown");
    const lbl = dd?.querySelector(".ui-dropdown-label");
    const name = lbl?.textContent?.trim();
    const orgs = JSON.parse(localStorage.getItem("hyp-user-organizations") || "[]");
    const selected = orgs.find((o) => o.OrganizationName === name);
    return selected?.OrganizationId || null;
  } catch (e) {
    console.error("❌ HYP birim ID alınamadı:", e);
    return null;
  }
}

// HYP API'sinden veri çek
async function fetchHypData(ay, yil) {
  const ayNumaralari = {
    OCAK: "01",
    SUBAT: "02",
    MART: "03",
    NISAN: "04",
    MAYIS: "05",
    HAZIRAN: "06",
    TEMMUZ: "07",
    AGUSTOS: "08",
    EYLUL: "09",
    EKIM: "10",
    KASIM: "11",
    ARALIK: "12",
  };

  const ayNo = ayNumaralari[ay];
  const dateStart = `${yil}-${ayNo}-01`;

  const response = await fetch(
    `https://hyp.saglik.gov.tr/api/EpisodeOfCare/$calculate-performance-statistics?dateStart=${dateStart}`,
    { credentials: "include" }
  );

  // Oturum kontrolü
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("OTURUM_YOK");
  }

  if (!response.ok) {
    throw new Error(`API hatası: ${response.status}`);
  }

  return await response.json();
}

// HYP verilerini SİNA formatına dönüştür
function mapHypToSina(hypData) {
  const mapping = {
    hypertension_screening: "HİPERTANSİYON TARAMASI",
    hypertension_monitoring: "HİPERTANSİYON İZLEM",
    diabetes_screening: "DİYABET TARAMASI",
    diabetes_monitoring: "DİYABET İZLEMİ",
    obesity_screening: "OBEZİTE TARAMASI",
    "obesity_monitoring-shm": "OBEZİTE İZLEMİ",
    cvdrisk_screening: "KVR TARAMASI",
    cvdrisk_monitoring: "KVR İZLEMİ",
    elderly_monitoring: "YAŞLI SAĞLIĞI İZLEMİ",
    cad_monitoring: "KORONERARTER İZLEMİ",
    stroke_monitoring: "İNME İZLEMİ",
    ckd_monitoring: "KRONİK BOBREK İZLEMİ",
    copd_monitoring: "KOAH İZLEMİ",
    asthma_monitoring: "ASTIM İZLEMİ",
  };

  return hypData
    .map((item) => {
      const key = `${item.CareType}_${item.State}`;
      const ad = mapping[key];
      return ad ? { ad, yapilan: item.NumOfEpisodes.toString() } : null;
    })
    .filter((item) => item !== null);
}

// HYP veri çekme ana fonksiyonu
async function fetchHypAndSend(expectedBirimId, ay, yil, tabId) {
  console.log("🚀 HYP API entegrasyonu başlatılıyor...");

  // 0. ÖNCE KISA BİR OTOURUM KONTROLÜ YAPALIM
  try {
    const testResponse = await fetch(
      "https://hyp.saglik.gov.tr/api/EpisodeOfCare/$calculate-performance-statistics?dateStart=2026-04-01",
      { credentials: "include" }
    );
    const contentType = testResponse.headers.get("content-type");

    // Eğer JSON değilse (giriş sayfası HTML'i döndüyse) oturum yok demektir.
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("OTURUM_YOK");
    }
  } catch (e) {
    if (e.message === "OTURUM_YOK") {
      // Pasif sekmeyi kapat
      if (tabId) {
        setTimeout(() => chrome.runtime.sendMessage({ action: "closeTab", tabId: tabId }), 500);
      }
      // Kullanıcıya bildir ve HYP ana sayfasını aç
      chrome.runtime.sendMessage({
        action: "hypError",
        error: "HYP oturumu bulunamadı. Lütfen açılan sayfada giriş yapın.",
        openHyp: true,
      });
      return;
    }
  }

  // 1. Seçili birim ID'sini al
  const selectedBirimId = getHypSelectedBirimId();

  if (!selectedBirimId) {
    chrome.runtime.sendMessage({
      action: "hypError",
      error: "HYP'de seçili birim bulunamadı. Lütfen HYP'ye giriş yaptığınızdan emin olun.",
    });
    if (tabId) {
      setTimeout(() => chrome.runtime.sendMessage({ action: "closeTab", tabId: tabId }), 500);
    }
    return;
  }

  console.log("📍 HYP seçili birim ID:", selectedBirimId);

  // 2. Birim ID eşleştirme
  if (selectedBirimId !== expectedBirimId) {
    const orgs = JSON.parse(localStorage.getItem("hyp-user-organizations") || "[]");
    const selected = orgs.find((o) => o.OrganizationId === selectedBirimId);
    const selectedName = selected?.OrganizationName || selectedBirimId;

    chrome.runtime.sendMessage({
      action: "hypError",
      error: `HYP'de farklı birim seçili: "${selectedName}".\n\nLütfen HYP'de doğru birimi seçin.`,
    });
    // ✅ Hata durumunda da sekmeyi kapat
    if (tabId) {
      setTimeout(() => chrome.runtime.sendMessage({ action: "closeTab", tabId: tabId }), 500);
    }
    return;
  }

  // 3. Veriyi çek
  try {
    const hypData = await fetchHypData(ay, yil);
    const results = mapHypToSina(hypData);

    console.log("✅ HYP verileri çekildi:", results.length, "işlem");

    chrome.runtime.sendMessage({
      action: "hypDataParsed",
      results: results,
    });

    // ✅ Başarılı durumda sekmeyi kapat
    if (tabId) {
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: "closeTab", tabId: tabId });
      }, 1000);
    }
  } catch (e) {
    if (tabId) {
      setTimeout(() => chrome.runtime.sendMessage({ action: "closeTab", tabId: tabId }), 500);
    }

    if (e.message === "OTURUM_YOK") {
      chrome.runtime.sendMessage({
        action: "hypError",
        error: "HYP oturumu bulunamadı. Lütfen açılan sayfada giriş yapın.",
        openHyp: true,
      });
    } else {
      chrome.runtime.sendMessage({
        action: "hypError",
        error: `HYP verileri çekilemedi: ${e.message}`,
      });
    }
  }
}

// Eklentiden gelen mesajı dinle
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "fetchHypData") {
    fetchHypAndSend(msg.expectedBirimId, msg.ay, msg.yil, msg.tabId);
    sendResponse({ status: "ok" });
  }
  return true;
});

console.log("📦 content.js sürüm: v2.0.1 - 2026-04-09");
(function () {
  // const isHyp = window.location.href.includes("hyp.saglik.gov.tr");
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
  // if (isHyp && window.location.hash === "#kopyala") {
  //   checkConsent().then((hasConsent) => {
  //     if (!hasConsent) {
  //       console.log("🔒 KVKK rızası yok, HYP verisi çekilmiyor.");
  //       return;
  //     }
  //
  //     console.log("🚀 HYP Eklentisi: İnatçı Tıklama Modu Devrede");
  //
  //     // ========== SPINNER GÖSTER ==========
  //     chrome.runtime.sendMessage({ action: "showSpinner" }).catch(() => {});
  //     console.log("🔄 HYP: Spinner gösterildi");
  //
  //     let basarili = false;
  //     let intervalId = null;
  //     let observer = null;
  //     let attemptCount = 0;
  //     const MAX_ATTEMPTS = 10;
  //
  //     const tiklaVeKontrolEt = () => {
  //       if (basarili) {
  //         if (intervalId) clearInterval(intervalId);
  //         return;
  //       }
  //
  //       attemptCount++;
  //       if (attemptCount > MAX_ATTEMPTS) {
  //         console.warn("⏰ Zaman aşımı: Hedef kartlar bulunamadı.");
  //         // ========== ZAMAN AŞIMINDA SPINNER'I GİZLE ==========
  //         chrome.runtime.sendMessage({ action: "hideSpinner" }).catch(() => {});
  //         if (intervalId) clearInterval(intervalId);
  //         if (observer) observer.disconnect();
  //         return;
  //       }
  //
  //       const kartlar = document.querySelectorAll(".population-target-analysis .content-sub");
  //       if (kartlar.length > 0) {
  //         console.log("✅ Kartlar ekranda görüldü, veriler çekiliyor...");
  //         veriCekVeGonder(kartlar);
  //         basarili = true;
  //         if (intervalId) clearInterval(intervalId);
  //         if (observer) observer.disconnect();
  //         return;
  //       }
  //
  //       let sekme = document.querySelector('a[id="5"]');
  //       if (!sekme) {
  //         const li = document.getElementById("5");
  //         if (li) sekme = li.querySelector("a") || li;
  //       }
  //
  //       if (sekme) {
  //         console.log("⏳ Sekme bulundu, tıklanıyor...");
  //         sekme.click();
  //       } else {
  //         console.log("Aranan sekme henüz sayfada yok, yüklenmesi bekleniyor...");
  //       }
  //     };
  //
  //     intervalId = setInterval(tiklaVeKontrolEt, 1000);
  //
  //     observer = new MutationObserver(() => {
  //       if (basarili) return;
  //       const kartlar = document.querySelectorAll(".population-target-analysis .content-sub");
  //       if (kartlar.length > 0) {
  //         veriCekVeGonder(kartlar);
  //         basarili = true;
  //         if (intervalId) clearInterval(intervalId);
  //         observer.disconnect();
  //       }
  //     });
  //     observer.observe(document.body, { childList: true, subtree: true });
  //
  //     function veriCekVeGonder(kartlar) {
  //       // ========== VERİ ÇEKİLDİ, SPINNER'I GİZLE ==========
  //       chrome.runtime.sendMessage({ action: "hideSpinner" }).catch(() => {});
  //       console.log("✅ HYP: Spinner gizlendi");
  //
  //       const sonuclar = Array.from(kartlar)
  //         .map((kart) => ({
  //           ad: kart.querySelector(".title")?.textContent?.trim() || "",
  //           yapilan: kart.querySelector(".performance-statistics-value")?.textContent?.trim() || "",
  //         }))
  //         .filter((item) => item.ad && item.yapilan);
  //
  //       if (sonuclar.length > 0) {
  //         chrome.runtime
  //           .sendMessage({
  //             action: "hypDataParsed",
  //             results: sonuclar,
  //           })
  //           .catch((err) => {
  //             console.error("Mesaj gönderilemedi:", err);
  //             console.trace(); // Stack trace göster
  //           });
  //         console.log("🚀 Veriler eklentiye başarıyla gönderildi!");
  //       } else {
  //         console.log("⚠️ HYP verisi bulunamadı");
  //       }
  //     }
  //   });
  // }

  // --- SİNA: Sıralı Hibrit Yaklaşım (Observer → Interval → Zaman Aşımı) ---
  const hasCopyHash = window.location.hash === "#kopyala";

  if (isSina && hasCopyHash) {
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

      // Spinner göster
      chrome.runtime.sendMessage({ action: "showSpinner" }).catch(() => {});
      console.log("🔄 SİNA: Spinner gösterildi");

      // Veri çekme fonksiyonu
      async function sinaExtractData() {
        if (veriGonderildi) return;

        // Spinner'ı HENÜZ gizleme — otizm API'si cevap verene kadar bekle

        // ASÇ sayfasındaki flex tablo için özel seçici
        let rows = document.querySelectorAll('div[role="row"], [role="row"]');

        // Doktor sayfası için alternatif seçiciler
        if (rows.length === 0) {
          rows = document.querySelectorAll('table tbody tr, [role="row"], .MuiTableRow-root');
        }

        // Son çare: Sayfadaki tüm tablo satırları
        if (rows.length === 0) {
          rows = document.querySelectorAll("table tr");
        }

        // Sayfada "Aradığınız kriterlerde..." mesajı var mı?
        const noDataMessage = document.body.innerText.includes(
          "Aradığınız kriterlerde Gerçekleşme Tablosu için sonuç bulunamadı"
        );
        if (noDataMessage) {
          console.log("📭 Sayfada 'sonuç bulunamadı' mesajı var, boş mesaj gönderiliyor...");
          veriGonderildi = true;
          chrome.runtime
            .sendMessage({ action: "dataParsed", results: [] })
            .catch((err) => console.error("Mesaj gönderilemedi:", err));
          return;
        }

        // Başlık satırlarını filtrele
        const dataRows = Array.from(rows).filter((row) => {
          const cells = row.querySelectorAll('[role="cell"], .MuiTableCell-root, div[role="cell"], td, th');
          if (cells.length === 0) return false;
          const firstCell = cells[0];
          const text = firstCell.textContent?.trim() || "";
          return (
            text !== "" &&
            !text.includes("İŞLEM ADI") &&
            !text.includes("GER.") &&
            !text.includes("YAP.") &&
            !text.includes("DEV.") &&
            !text.includes("DURUM") &&
            !text.includes("Kronik") &&
            !text.includes("Birim")
          );
        });

        const results = [];
        dataRows.forEach((row) => {
          let cells = row.querySelectorAll('[role="cell"], .MuiTableCell-root, div[role="cell"], td, th');
          if (cells.length < 4) return;

          const cellArray = Array.from(cells);
          let birimAdi = "",
            ad = "",
            gereken = "",
            yapilan = "",
            devreden = "";

          if (cellArray.length >= 5) {
            birimAdi = cellArray[0]?.textContent?.trim() || "";
            ad = cellArray[1]?.textContent?.trim() || "";
            gereken = cellArray[2]?.textContent?.trim() || "";
            yapilan = cellArray[3]?.textContent?.trim() || "";
            devreden = cellArray[4]?.textContent?.trim() || "0";
          } else {
            birimAdi = cellArray[0]?.textContent?.trim() || "";
            ad = cellArray[1]?.textContent?.trim() || "";
            gereken = cellArray[2]?.textContent?.trim() || "";
            yapilan = cellArray[3]?.textContent?.trim() || "";
            devreden = cellArray[4]?.textContent?.trim() || "0";
          }

          const rowData = { birimAdi, ad, gereken, yapilan, devreden };
          const hasNumber = !isNaN(parseInt(rowData.gereken));

          if (hasNumber && rowData.ad && !rowData.ad.includes("Çankırı")) {
            results.push(rowData);
          }
        });

        if (veriGonderildi) return;
        veriGonderildi = true;

        // ========== OTİZM API (v2: birimId tabanlı, çift endpoint) ==========
        // URL'den birimId, ay ve yıl bilgilerini al
        const urlParamsOtizm = new URLSearchParams(window.location.search);
        const filtersStrOtizm = urlParamsOtizm.get("filters") || "";
        const birimIdMatch = filtersStrOtizm.match(/252860=(\d+)/);
        const birimId = birimIdMatch ? birimIdMatch[1] : "";
        const ayMatch = filtersStrOtizm.match(/252840=([A-Z]+)/);
        const yilMatch = filtersStrOtizm.match(/252916=(\d{4})/);
        const ay = ayMatch ? ayMatch[1] : "";
        const yil = yilMatch ? yilMatch[1] : "";

        if (birimId && ay && yil) {
          const aylar = { OCAK: "01", SUBAT: "02", MART: "03", NISAN: "04", MAYIS: "05", HAZIRAN: "06", TEMMUZ: "07", AGUSTOS: "08", EYLUL: "09", EKIM: "10", KASIM: "11", ARALIK: "12" };
          const ayNo = aylar[ay] || ay.padStart(2, "0");
          const donem = `${yil}-${ayNo}`;

          const ortakFiltreler = `dbfl-ayffa266fbaeep7=${donem}&dbfl-y0athdfbb05282b=${donem}&dbfl-690d338da4xeu40=${birimId}&dbmfl-0eebb5447f112m8=${donem}`;

          const url1 = `https://node4sina.saglik.gov.tr/api/v1/data/?id=DL-414727O41003S03&type=info_cell&refresh_cache=false&dashboard=db-e319dcd344pk5at&filters=${ortakFiltreler}`;
          const url2 = `https://node7sina.saglik.gov.tr/api/v1/data/?id=DL-9L2Q9CDF8A92Q6T&type=info_cell&refresh_cache=false&dashboard=db-e319dcd344pk5at&filters=${ortakFiltreler}`;

          console.log("🔄 Otizm API çağrılıyor...");
          try {
            const auth = JSON.parse(localStorage.getItem("auth") || "{}");
            const token = auth._accessToken;
            if (token) {
              const headers = {
                accept: "application/json, text/plain, */*",
                authorization: `Token ${token}`,
              };

              const [res1, res2] = await Promise.all([
                fetch(url1, { headers, method: "GET", mode: "cors" }),
                fetch(url2, { headers, method: "GET", mode: "cors" })
              ]);

              if (res1.ok && res2.ok) {
                const data1 = await res1.json();
                const data2 = await res2.json();

                const getByMeasureId = (items, measureId) => {
                  const item = items.find(i => i.attributes?.meta?.measure_id === measureId);
                  return item?.attributes?.meta?.value?.[0] || 0;
                };

                const items1 = data1?.data || [];
                const items2 = data2?.data || [];

                const gereken   = getByMeasureId(items1, 'dm-dh7dfjad3d67dwc');
                const yapilan   = getByMeasureId(items1, 'dm-rya8d12yh77wc66');
                const devreden  = getByMeasureId(items2, 'de-8ear7qdf7e07cf7');
                const yapilanAlt = getByMeasureId(items2, 'de-1bra511ddu81fv1');

                // yapilanAlt > 0 ise güncel değer olarak onu kullan
                const finalYapilan = (yapilanAlt > 0) ? yapilanAlt : yapilan;

                if (gereken != null) {
                  const birimAdi = results.length > 0 ? results[0].birimAdi : "";
                  const otizmData = {
                    birimAdi: birimAdi,
                    ad: "OTİZM TARAMASI",
                    gereken: String(gereken),
                    yapilan: String(finalYapilan),
                    devreden: String(devreden),
                  };
                  console.log("✅ Otizm verisi API'den çekildi:", otizmData);
                  results.push(otizmData);
                }
              } else {
                console.warn("⚠️ Otizm API HTTP hatası:", res1.status, res2.status);
              }
            } else {
              console.warn("⚠️ Otizm API: Token bulunamadı");
            }
          } catch (e) {
            console.warn("⚠️ Otizm API hatası (sessiz):", e.message);
          }
        }

        // Spinner'ı SONUÇLAR GÖNDERİLMEDEN hemen önce gizle
        chrome.runtime.sendMessage({ action: "hideSpinner" }).catch(() => {});
        console.log("✅ SİNA: Spinner gizlendi");

        if (results.length > 0) {
          console.log("✅ SİNA verileri çekildi:", results.length, "işlem");
          chrome.runtime
            .sendMessage({ action: "dataParsed", results: results })
            .catch((err) => console.error("Mesaj gönderilemedi:", err));
        } else {
          console.log("⚠️ SİNA verisi bulunamadı, boş mesaj gönderiliyor...");
          chrome.runtime
            .sendMessage({ action: "dataParsed", results: [] })
            .catch((err) => console.error("Mesaj gönderilemedi:", err));
        }

        // Temizlik
        if (observer) observer.disconnect();
        if (fallbackInterval) clearInterval(fallbackInterval);
        if (observerTimeout) clearTimeout(observerTimeout);
        if (finalTimeout) clearTimeout(finalTimeout);
      }

      // ========== TEK ZAMAN AŞIMI (12 sn) ==========
      finalTimeout = setTimeout(() => {
        if (!veriGonderildi) {
          console.log("⏰ Zaman aşımı (12 sn), zorla veri çekiliyor...");
          chrome.runtime.sendMessage({ action: "hideSpinner" }).catch(() => {});
          sinaExtractData();
        }
        if (observer) observer.disconnect();
        if (fallbackInterval) clearInterval(fallbackInterval);
      }, 12000);

      // ========== 1. MUTATION OBSERVER (2 saniye) ==========
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

      // 2 saniye sonra Observer'ı durdur ve Interval'e geç
      observerTimeout = setTimeout(() => {
        if (!veriGonderildi) {
          console.log("⏳ Observer 2 sn içinde veri bulamadı, Interval moduna geçiliyor...");
          if (observer) observer.disconnect();

          // ========== 2. FALLBACK INTERVAL (maksimum 10 sn) ==========
          let intervalAttempts = 0;
          const MAX_INTERVAL_ATTEMPTS = 10;

          fallbackInterval = setInterval(() => {
            intervalAttempts++;

            if (veriGonderildi) {
              clearInterval(fallbackInterval);
              return;
            }

            if (intervalAttempts > MAX_INTERVAL_ATTEMPTS) {
              console.log("⏹️ Interval maksimum denemeye ulaştı, durduruluyor...");
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
      }, 2000);
    });
  } else if (isSina && !hasCopyHash) {
    console.log("ℹ️ SİNA sayfası açıldı ama #kopyala yok, veri çekme işlemi başlatılmadı.");
  }
})();
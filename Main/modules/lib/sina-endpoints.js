// modules/lib/sina-endpoints.js
// SİNA API endpoint tanımları ve response mapper'ları

/**
 * URL encode helper (RFC 3986)
 */
function encode(str) {
  return encodeURIComponent(str);
}

/**
 * Ay adını iki haneli sayıya çevir (OCAK → "01", ŞUBAT → "02", ...)
 */
function ayToNum(ay) {
  const aylar = {
    OCAK: "01", SUBAT: "02", MART: "03", NISAN: "04",
    MAYIS: "05", HAZIRAN: "06", TEMMUZ: "07", AGUSTOS: "08",
    EYLUL: "09", EKIM: "10", KASIM: "11", ARALIK: "12",
  };
  // Zaten sayı ise pad'le, değilse aylar'dan al
  if (/^\d{1,2}$/.test(ay)) return ay.padStart(2, "0");
  return aylar[ay] || ay;
}

// ============================================================
// ENDPOINT TANIMLARI
// ============================================================

export const SINA_ENDPOINTS = {
  OTIZM: {
    id: "DL-414727O41003S03",
    type: "info_cell",
    dashboard: "db-5q98b0nfa3d119b",

    /**
     * Otizm API URL'sini oluşturur
     * @param {object} params
     * @param {string} params.ay - Ay adı (OCAK) veya numarası ("01")
     * @param {string|number} params.yil - Yıl (2026)
     * @param {string} params.il - İl adı büyük harf (ÇANKIRI)
     * @param {string} params.ilce - İlçe adı büyük harf (MERKEZ)
     * @param {string} params.birimAdi - Tam birim adı (Çankırı Merkez 20 Nolu AHB)
     * @param {string} [params.node] - Sabit node host (node3sina)
     */
    buildUrl(params) {
      const { ay, yil, il, ilce, birimAdi, node = "node3sina" } = params;
      const ayNo = ayToNum(ay);
      const period = `${yil}-${ayNo}`;

      const filters = [
        `dbfl-8bdxh2f6ggcf9d8=${period}`,
        `dbfl-rfa1t6x79dakfsc=__latest_period__month__movement__0`,
        `dbfl-7f19d5fhd73e374=${encode(il)}`,
        `dbfl-e2ax0ef5ede3aoa=${encode(ilce)}`,
        `dbfl-4ly5i4cud9d19no=${encode(birimAdi)}`,
      ].join("%26");

      return `https://${node}.saglik.gov.tr/api/v1/data/?id=${this.id}&type=${this.type}&refresh_cache=false&dashboard=${this.dashboard}&filters=${filters}`;
    },

    /**
     * API response'unu standart veri formatına dönüştürür
     * @param {object} result - API'den dönen JSON
     * @returns {{ ad: string, gereken: string, yapilan: string, devreden: string } | null}
     */
    mapResponse(result) {
      try {
        const items = result?.data || [];
        if (items.length < 3) return null;

        const gereken = items[0]?.attributes?.rows?.m0?.[0];
        const yapilan = items[1]?.attributes?.rows?.m0?.[0];

        if (gereken == null || yapilan == null) return null;

        return {
          ad: "OTİZM TARAMASI",
          gereken: String(gereken),
          yapilan: String(yapilan),
          devreden: "0", // Otizm için devreden yok
        };
      } catch {
        return null;
      }
    },
  },
};

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
  /**
   * Otizm verisi iki ayrı endpoint'ten paralel çekilir:
   *   Endpoint 1 (node4): DL-414727O41003S03 → gereken, yapilan
   *   Endpoint 2 (node7): DL-9L2Q9CDF8A92Q6T  → devreden, yapilanAlt (yedek)
   * Filtreleme birimId ile yapılır (eski birimAdi tabanlı değil).
   */
  OTIZM: {
    type: "info_cell",
    dashboard: "db-e319dcd344pk5at",

    endpoints: [
      {
        id: "DL-414727O41003S03",
        node: "node4sina",
        measures: {
          gereken: "dm-dh7dfjad3d67dwc",
          yapilan: "dm-rya8d12yh77wc66",
        },
      },
      {
        id: "DL-9L2Q9CDF8A92Q6T",
        node: "node7sina",
        measures: {
          devreden: "de-8ear7qdf7e07cf7",
          yapilanAlt: "de-1bra511ddu81fv1",
        },
      },
    ],

    /**
     * @param {object} params
     * @param {string} params.birimId - Birim ID
     * @param {string} params.donem - Dönem (YYYY-MM)
     */
    buildFilters(params) {
      const { birimId, donem } = params;
      return [
        `dbfl-ayffa266fbaeep7=${donem}`,
        `dbfl-y0athdfbb05282b=${donem}`,
        `dbfl-690d338da4xeu40=${birimId}`,
        `dbmfl-0eebb5447f112m8=${donem}`,
      ].join("%26");
    },

    /**
     * Tüm endpoint URL'lerini oluşturur
     * @param {object} params - { birimId, donem }
     * @returns {string[]}
     */
    buildUrls(params) {
      const filters = this.buildFilters(params);
      return this.endpoints.map(
        (ep) =>
          `https://${ep.node}.saglik.gov.tr/api/v1/data/?id=${ep.id}&type=${this.type}&refresh_cache=false&dashboard=${this.dashboard}&filters=${filters}`
      );
    },

    /**
     * İki endpoint'ten gelen response'ları birleştirip standart formata dönüştürür
     * @param {object[]} responses - [{ endpointIndex: 0, json }, { endpointIndex: 1, json }]
     * @returns {{ ad: string, gereken: string, yapilan: string, devreden: string } | null}
     */
    mapResponse(responses) {
      try {
        const getByMeasureId = (items, measureId) => {
          const item = items.find((i) => i.attributes?.meta?.measure_id === measureId);
          return item?.attributes?.meta?.value?.[0] || 0;
        };

        const items0 = responses[0]?.json?.data || [];
        const items1 = responses[1]?.json?.data || [];

        const gereken  = getByMeasureId(items0, "dm-dh7dfjad3d67dwc");
        const yapilan  = getByMeasureId(items0, "dm-rya8d12yh77wc66");
        const devreden = getByMeasureId(items1, "de-8ear7qdf7e07cf7");
        const yapilanAlt = getByMeasureId(items1, "de-1bra511ddu81fv1");

        const finalYapilan = yapilanAlt > 0 ? yapilanAlt : yapilan;

        if (gereken == null) return null;

        return {
          ad: "OTİZM TARAMASI",
          gereken: String(gereken),
          yapilan: String(finalYapilan),
          devreden: String(devreden),
        };
      } catch {
        return null;
      }
    },
  },
};
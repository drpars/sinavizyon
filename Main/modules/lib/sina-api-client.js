// modules/lib/sina-api-client.js
// SİNA API ortak istemci modülü
// Token alma, node fallback, endpoint çağırma

import { SINA_ENDPOINTS } from "./sina-endpoints.js";

// Denenecek node'ların sırası
const NODE_POOL = ["node3sina", "node1sina", "node2sina", "node4sina"];

/**
 * SİNA sayfasının localStorage'ından auth token'ı alır
 * @returns {string|null} Access token veya null
 */
function getSinaAuthToken() {
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    return auth._accessToken || null;
  } catch {
    return null;
  }
}

/**
 * Tek bir node'a API isteği yapar
 * @param {string} url - Tam API URL'i
 * @returns {Promise<object>} API response JSON
 */
async function fetchFromNode(url) {
  const token = getSinaAuthToken();
  if (!token) {
    throw new Error("SINA_TOKEN_YOK");
  }

  const response = await fetch(url, {
    headers: {
      accept: "application/json, text/plain, */*",
      authorization: `Token ${token}`,
    },
    method: "GET",
    mode: "cors",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("SINA_OTURUM_YOK");
  }

  return response.json();
}

/**
 * Tüm node'ları dene, ilk başarılı sonucu döndür
 * @param {string} urlBuilder - Belirli bir node için URL üreten fonksiyon: (node) => url
 * @returns {Promise<object>} API response JSON
 */
async function tryAllNodes(urlBuilder) {
  let lastError = null;

  for (const node of NODE_POOL) {
    try {
      const url = urlBuilder(node);
      console.log(`🔄 SİNA API: ${node} deneniyor...`);
      const result = await fetchFromNode(url);
      console.log(`✅ SİNA API: ${node} başarılı`);
      return result;
    } catch (e) {
      console.warn(`⚠️ SİNA API: ${node} başarısız - ${e.message}`);
      lastError = e;
      // Token yoksa veya oturum yoksa diğer node'ları denemenin anlamı yok
      if (e.message === "SINA_TOKEN_YOK" || e.message === "SINA_OTURUM_YOK") {
        throw e;
      }
    }
  }

  throw lastError || new Error("Tüm node'lar başarısız");
}

/**
 * Otizm verisini çeker (çift endpoint, paralel fetch)
 * @param {object} params - { birimId, ay, yil }
 * @returns {Promise<{ ad: string, gereken: string, yapilan: string, devreden: string } | null>}
 */
export async function fetchOtizmData(params) {
  const { birimId, ay, yil } = params;
  if (!birimId || !ay || !yil) return null;

  const token = getSinaAuthToken();
  if (!token) {
    console.warn("⚠️ fetchOtizmData: Token bulunamadı");
    return null;
  }

  const aylar = { OCAK: "01", SUBAT: "02", MART: "03", NISAN: "04", MAYIS: "05", HAZIRAN: "06", TEMMUZ: "07", AGUSTOS: "08", EYLUL: "09", EKIM: "10", KASIM: "11", ARALIK: "12" };
  const ayNo = /^\d{1,2}$/.test(ay) ? ay.padStart(2, "0") : (aylar[ay] || ay);
  const donem = `${yil}-${ayNo}`;

  const endpoint = SINA_ENDPOINTS.OTIZM;
  const urls = endpoint.buildUrls({ birimId, donem });

  console.log("🔄 fetchOtizmData: paralel çağrı başlatılıyor...");

  try {
    const responses = await Promise.all(
      urls.map((url, i) =>
        fetch(url, {
          headers: {
            accept: "application/json, text/plain, */*",
            authorization: `Token ${token}`,
          },
          method: "GET",
          mode: "cors",
        }).then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          return { endpointIndex: i, json };
        })
      )
    );

    return endpoint.mapResponse(responses);
  } catch (e) {
    console.warn("⚠️ fetchOtizmData hatası:", e.message);
    return null;
  }
}

/**
 * Tek endpoint'li SİNA API çağrısı (genel amaçlı)
 * @param {object} endpointConfig - SINA_ENDPOINTS'ten bir endpoint tanımı
 * @param {object} params - buildUrl için parametreler
 * @returns {Promise<{ ad: string, gereken: string, yapilan: string, devreden: string } | null>}
 */
export async function callSinaEndpoint(endpointConfig, params) {
  try {
    const result = await tryAllNodes((node) =>
      endpointConfig.buildUrl({ ...params, node })
    );
    return endpointConfig.mapResponse(result);
  } catch (e) {
    console.error(`❌ SİNA API hatası (${endpointConfig.id}):`, e.message);
    return null;
  }
}
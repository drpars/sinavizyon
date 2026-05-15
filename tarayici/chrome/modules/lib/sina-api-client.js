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
 * Bir SİNA endpoint'ini çağırır
 * @param {object} endpointConfig - SINA_ENDPOINTS'ten bir endpoint tanımı
 * @param {object} params - buildUrl için parametreler (ay, yil, il, ilce, birimAdi)
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

/**
 * Otizm verisini çeker (kolay kullanım wrapper)
 * @param {object} params - { ay, yil, il, ilce, birimAdi }
 * @returns {Promise<{ ad: string, gereken: string, yapilan: string, devreden: string } | null>}
 */
export async function fetchOtizmData(params) {
  return callSinaEndpoint(SINA_ENDPOINTS.OTIZM, params);
}

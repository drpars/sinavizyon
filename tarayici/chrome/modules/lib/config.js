// modules/lib/config.js
export const SINA_URLS = {
  DOCTOR_SINA: "https://sina.saglik.gov.tr/showcases/SC-DBBEMXEEDFCCEAB/SCI-2N8Y5C2ADDC1FCD",
  NURSE_SINA: "https://sina.saglik.gov.tr/showcases/SC-0320Z42B2FCOK70/SCI-0N184E437ACA419",
};

export const HYP_URLS = {
  DASHBOARD: "https://hyp.saglik.gov.tr/dashboard#kopyala",
};

export const SINA_FILTERS = {
  MONTH: "252840",
  UNIT_ID: "252860",
  YEAR: "252916",
  EXTRA: "330586",
};

export function buildSinaUrl(type, ay, birimId, yil) {
  const baseUrl = type === "nurse" ? SINA_URLS.NURSE_SINA : SINA_URLS.DOCTOR_SINA;
  const filters = `${SINA_FILTERS.MONTH}=${ay}%26${SINA_FILTERS.UNIT_ID}=${birimId}%26${SINA_FILTERS.YEAR}=${yil}%26${SINA_FILTERS.EXTRA}`;
  return `${baseUrl}?filters=${filters}#kopyala`;
}

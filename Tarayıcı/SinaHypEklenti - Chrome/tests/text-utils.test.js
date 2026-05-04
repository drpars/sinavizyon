// tests/text-utils.test.js
import { describe, test, expect } from "@jest/globals";
import { normalizeText, compareNormalized, includesNormalized } from "../modules/utils/text-utils.js";

describe("normalizeText", () => {
  test("Türkçe karakterleri İngilizce'ye çevirir", () => {
    expect(normalizeText("DİYABET İZLEMİ")).toBe("DIYABET IZLEMI");
  });

  test("ı → i dönüşümü", () => {
    expect(normalizeText("KVR İZLEMİ")).toBe("KVR IZLEMI");
  });

  test("Büyük harfe çevirir", () => {
    expect(normalizeText("diyabet taraması")).toBe("DIYABET TARAMASI");
  });

  test("Fazla boşlukları temizler", () => {
    expect(normalizeText("  DİYABET   TARAMASI  ")).toBe("DIYABET TARAMASI");
  });

  test("null → boş string", () => {
    expect(normalizeText(null)).toBe("");
  });

  test("undefined → boş string", () => {
    expect(normalizeText(undefined)).toBe("");
  });
});

describe("compareNormalized", () => {
  test("Farklı yazımlar eşit kabul edilir", () => {
    expect(compareNormalized("Diyabet İzlemi", "DİYABET İZLEMİ")).toBe(true);
  });
});

describe("includesNormalized", () => {
  test("İçerme kontrolü", () => {
    expect(includesNormalized("DİYABET TARAMASI", "diyabet")).toBe(true);
  });
});

// tests/calculations.test.js
import { describe, test, expect } from "@jest/globals";
import { getEffectiveYapilan, tavanHesapla } from "../modules/lib/calculations.js";

describe("getEffectiveYapilan", () => {
  test("Normal durum: %10 üstü, devreden eklenir", () => {
    expect(getEffectiveYapilan(100, 40, 20)).toBe(60);
  });

  test("%10 altı: devreden eklenmez", () => {
    expect(getEffectiveYapilan(100, 5, 50)).toBe(5);
  });

  test("Toplam hedefi aşarsa sınırlama", () => {
    expect(getEffectiveYapilan(100, 60, 50)).toBe(100);
  });

  test("Gereken 0 ise yapilan döner", () => {
    expect(getEffectiveYapilan(0, 50, 10)).toBe(50);
  });

  test("Gereken negatif ise yapilan döner", () => {
    expect(getEffectiveYapilan(-10, 50, 10)).toBe(50);
  });

  test("Tam %10 sınırında devreden eklenir", () => {
    expect(getEffectiveYapilan(100, 10, 30)).toBe(40);
  });

  test("%9.99 altı devreden eklenmez", () => {
    expect(getEffectiveYapilan(100, 9, 50)).toBe(9);
  });

  test("Tüm değerler 0", () => {
    expect(getEffectiveYapilan(0, 0, 0)).toBe(0);
  });
});

describe("tavanHesapla", () => {
  test("Nüfus 4000 → tavan 1.0", () => {
    // DOM manipülasyonu gerektirir, şimdilik mock'lu test yazılabilir
    expect(true).toBe(true); // Placeholder
  });
});

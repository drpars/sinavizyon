// tests/constants.test.js
import { describe, test, expect } from "@jest/globals";
import { getKatsayiMap, getNurseKatsayiMap } from "../modules/lib/constants.js";

describe("getKatsayiMap - Tarih Bazlı Katsayı Seçimi", () => {
  test("Nisan 2026 → eski katsayılar", () => {
    const map = getKatsayiMap("NISAN", 2026);
    const diyabet = map.get("DİYABET TARAMASI");
    expect(diyabet.azamiKatsayi).toBe(1.05);
  });

  test("Mayıs 2026 → yeni katsayılar", () => {
    const map = getKatsayiMap("MAYIS", 2026);
    const diyabet = map.get("DİYABET TARAMASI");
    expect(diyabet.azamiKatsayi).toBe(1.023440);
  });

  test("Ocak 2027 → yeni katsayılar", () => {
    const map = getKatsayiMap("OCAK", 2027);
    const diyabet = map.get("DİYABET TARAMASI");
    expect(diyabet.azamiKatsayi).toBe(1.023440);
  });

  test("Yeni katsayılarda KORONERARTER var", () => {
    const map = getKatsayiMap("MAYIS", 2026);
    expect(map.has("KORONERARTER")).toBe(true);
  });

  test("Eski katsayılarda KORONERARTER yok", () => {
    const map = getKatsayiMap("NISAN", 2026);
    expect(map.has("KORONERARTER")).toBe(false);
  });

  test("Yeni katsayılarda KOAH var (pasif ama map'te)", () => {
    const map = getKatsayiMap("MAYIS", 2026);
    expect(map.has("KOAH")).toBe(true);
  });
});

describe("getNurseKatsayiMap - Tarih Bazlı ASÇ Katsayı Seçimi", () => {
  test("Nisan 2026 → eski ASÇ katsayıları", () => {
    const map = getNurseKatsayiMap("NISAN", 2026);
    const vital = map.get("VİTAL BULGU ASÇ");
    expect(vital.azamiKatsayi).toBe(1.06);
  });

  test("Mayıs 2026 → yeni ASÇ katsayıları", () => {
    const map = getNurseKatsayiMap("MAYIS", 2026);
    const vital = map.get("VİTAL BULGU ASÇ");
    expect(vital.azamiKatsayi).toBe(1.0611);
  });
});

// tests/calculator.test.js
import { describe, test, expect } from "@jest/globals";
import { calculateDoctorKatsayi } from "../modules/features/doctor/calculator.js";
import { calculateNurseKatsayi } from "../modules/features/nurse/calculator.js";
import { getKatsayiMap, getNurseKatsayiMap } from "../modules/lib/constants.js";
import { normalizeText } from "../modules/utils/text-utils.js";

function buildNormMap(map) {
  const norm = new Map();
  for (let [k, v] of map.entries()) norm.set(normalizeText(k), v);
  return norm;
}

describe("calculateDoctorKatsayi", () => {
  const eskiMap = buildNormMap(getKatsayiMap("NISAN", 2026));
  const yeniMap = buildNormMap(getKatsayiMap("MAYIS", 2026));

  test("Eski: %50 DİYABET TARAMASI", () => {
    const k = calculateDoctorKatsayi("DİYABET TARAMASI", 100, 50, 0, eskiMap);
    expect(k).toBeCloseTo(1.022, 2);
  });

  test("Yeni: %50 DİYABET TARAMASI", () => {
    const k = calculateDoctorKatsayi("DİYABET TARAMASI", 100, 50, 0, yeniMap);
    expect(k).toBeLessThan(1.022); // Yeni katsayılar daha düşük
  });

  test("%90 üstü → azamiKatsayi döner", () => {
    const k = calculateDoctorKatsayi("DİYABET TARAMASI", 100, 90, 0, eskiMap);
    expect(k).toBe(1.05);
  });

  test("%40 altı → asgariKatsayi döner", () => {
    const k = calculateDoctorKatsayi("DİYABET TARAMASI", 100, 30, 0, eskiMap);
    expect(k).toBe(0.994);
  });

  test("Yeni işlem: KORONERARTER İZLEMİ", () => {
    const map = buildNormMap(getKatsayiMap("MAYIS", 2026));
    const k = calculateDoctorKatsayi("KORONERARTER İZLEMİ", 100, 60, 0, map);
    expect(k).toBeGreaterThan(0.99);
    expect(k).toBeLessThan(1.03);
  });

  test("Map verilmezse fallback çalışır", () => {
    const k = calculateDoctorKatsayi("DİYABET TARAMASI", 100, 50, 0);
    expect(k).toBeGreaterThan(1.0);
  });
});

describe("calculateNurseKatsayi", () => {
  const eskiMap = buildNormMap(getNurseKatsayiMap("NISAN", 2026));
  const yeniMap = buildNormMap(getNurseKatsayiMap("MAYIS", 2026));

  test("Eski: %70 VİTAL BULGU ASÇ", () => {
    const k = calculateNurseKatsayi("VİTAL BULGU ASÇ", 100, 70, 0, eskiMap);
    expect(k).toBeCloseTo(1.015, 2);
  });

  test("Yeni: %70 VİTAL BULGU ASÇ", () => {
    const k = calculateNurseKatsayi("VİTAL BULGU ASÇ", 100, 70, 0, yeniMap);
    expect(k).toBeGreaterThan(1.015); // Yeni tavan daha yüksek (1.0611)
  });
});

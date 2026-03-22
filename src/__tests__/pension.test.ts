import { describe, expect, it } from "vitest";
import { SS } from "../engine/constants";
import {
  calcBaseReguladora,
  calcEarlyPenalty,
  calcPensionMonthly,
  calcPensionPct,
  calcYearsCotizados,
} from "../engine/pension";

describe("calcYearsCotizados", () => {
  it("converts 6694 days to ~18.33 years", () => {
    expect(calcYearsCotizados(6694)).toBeCloseTo(18.33, 1);
  });

  it("converts 0 days to 0 years", () => {
    expect(calcYearsCotizados(0)).toBe(0);
  });
});

describe("calcPensionPct", () => {
  it("returns 0 for less than 15 years", () => {
    expect(calcPensionPct(10)).toBe(0);
    expect(calcPensionPct(14.9)).toBe(0);
  });

  it("returns 50% at exactly 15 years", () => {
    expect(calcPensionPct(15)).toBeCloseTo(0.5, 5);
  });

  it("returns 80% at 25 years (15 + 10*3%)", () => {
    expect(calcPensionPct(25)).toBeCloseTo(0.8, 5);
  });

  it("returns 100% at 37 years (80% + 12*2%)", () => {
    expect(calcPensionPct(37)).toBeCloseTo(1.0, 5);
  });

  it("caps at 100% above 37 years", () => {
    expect(calcPensionPct(40)).toBeCloseTo(1.0, 5);
    expect(calcPensionPct(45)).toBeCloseTo(1.0, 5);
  });

  it("returns correct value at 30 years (80% + 5*2% = 90%)", () => {
    expect(calcPensionPct(30)).toBeCloseTo(0.9, 5);
  });
});

describe("calcEarlyPenalty", () => {
  it("returns 0 at legal retirement age (67)", () => {
    expect(calcEarlyPenalty(67, 30)).toBe(0);
  });

  it("returns 0 when pensionAge >= 67", () => {
    expect(calcEarlyPenalty(68, 30)).toBe(0);
  });

  it("returns 16% for 2 years early (8 quarters * 2%) with <38.5y cotizados", () => {
    // 2 years = 8 quarters, 8 * 0.02 = 0.16
    expect(calcEarlyPenalty(65, 30)).toBeCloseTo(0.16, 5);
  });

  it("returns 8% for 1 year early (4 quarters * 2%)", () => {
    expect(calcEarlyPenalty(66, 30)).toBeCloseTo(0.08, 5);
  });

  it("caps penalty at 50%", () => {
    // Very early retirement — penalty capped at 0.5
    expect(calcEarlyPenalty(50, 30)).toBeLessThanOrEqual(0.5);
  });
});

describe("calcBaseReguladora", () => {
  const salary = 62000;

  it("returns correct value with full 300 work months", () => {
    const result = calcBaseReguladora(salary, 300, 0);
    const expected = Math.min(salary / 12, SS.BASE_MAX_MONTHLY);
    expect(result).toBeCloseTo(expected, 0);
  });

  it("reduces base when there are zero months", () => {
    const full = calcBaseReguladora(salary, 300, 0);
    const withGap = calcBaseReguladora(salary, 150, 0);
    expect(withGap).toBeLessThan(full);
  });

  it("convenio months contribute BASE_MIN to the average", () => {
    const noConvenio = calcBaseReguladora(salary, 240, 0);
    const withConvenio = calcBaseReguladora(salary, 240, 60);
    // Convenio adds BASE_MIN contributions, which is better than zero
    expect(withConvenio).toBeGreaterThan(noConvenio);
  });
});

describe("calcPensionMonthly", () => {
  it("is capped at PENSION_MAX", () => {
    const result = calcPensionMonthly(SS.BASE_MAX_MONTHLY, 40, 67);
    expect(result).toBeLessThanOrEqual(SS.PENSION_MAX_MONTHLY);
  });

  it("is at least PENSION_MIN when cotizados >= 15", () => {
    const result = calcPensionMonthly(1000, 20, 67);
    expect(result).toBeGreaterThanOrEqual(SS.PENSION_MIN_MONTHLY);
  });

  it("is reduced by early penalty", () => {
    const at67 = calcPensionMonthly(3000, 35, 67);
    const at65 = calcPensionMonthly(3000, 35, 65);
    expect(at65).toBeLessThan(at67);
  });

  it("produces reasonable pension for the user's base case (~baja 55 + convenio)", () => {
    // At stop: ~30y cotizados + 5y convenio = 35y, pension at 65 (-16%)
    const baseReg = calcBaseReguladora(62000, 200, 60); // 200 work + 60 convenio months
    const result = calcPensionMonthly(baseReg, 35, 65);
    // Should be between 2000 and 3361
    expect(result).toBeGreaterThan(2000);
    expect(result).toBeLessThanOrEqual(SS.PENSION_MAX_MONTHLY);
  });
});

import { describe, expect, it } from "vitest";
import { SS } from "../engine/constants";
import {
  calcConvenioMonthlyCost,
  calcConvenioNeeded,
  calcDiasCotizadosAtStopAge,
} from "../engine/convenio";

describe("calcConvenioMonthlyCost", () => {
  it("returns BASE_MIN * SS_TYPE * COEF", () => {
    const expected = SS.BASE_MIN_MONTHLY * SS.SS_TYPE * SS.CONVENIO_COEF;
    expect(calcConvenioMonthlyCost()).toBeCloseTo(expected, 2);
  });

  it("is approximately 367 EUR/month (SS 2026 base mínima)", () => {
    // 1381.20 * 0.283 * 0.94 ≈ 367.27
    expect(calcConvenioMonthlyCost()).toBeCloseTo(367, 0);
  });
});

describe("calcConvenioNeeded", () => {
  it("returns 0 months if already at 35 years", () => {
    const diasFor35y = 35 * 365.25;
    const result = calcConvenioNeeded(diasFor35y);
    expect(result.months).toBe(0);
    expect(result.totalCost).toBe(0);
  });

  it("returns correct months for user at baja 55 (30.3 years → need 35)", () => {
    // User at 55: currentAge=43 + 12 years work = ~30.3 years cotizados
    // 6694 days + 12*365.25 days = 6694 + 4383 = 11077 days ≈ 30.32 years
    const diasAtStop = 11077;
    const result = calcConvenioNeeded(diasAtStop, 35);
    // Need 35 - 30.32 = 4.68 years = ~56 months
    expect(result.months).toBeGreaterThan(50);
    expect(result.months).toBeLessThan(65);
    expect(result.totalCost).toBeGreaterThan(0);
  });

  it("totalCost = months * monthly cost", () => {
    const diasAtStop = 6000;
    const result = calcConvenioNeeded(diasAtStop);
    const expected = result.months * calcConvenioMonthlyCost();
    expect(result.totalCost).toBeCloseTo(expected, 0);
  });
});

describe("calcDiasCotizadosAtStopAge", () => {
  it("adds working years to current dias", () => {
    // 43 → 55 = 12 years more work
    const result = calcDiasCotizadosAtStopAge(43, 6694, 55);
    expect(result).toBeCloseTo(6694 + 12 * 365.25, 0);
  });

  it("returns diasCotizados unchanged when stopWorkAge <= currentAge", () => {
    const result = calcDiasCotizadosAtStopAge(55, 6694, 55);
    expect(result).toBe(6694);
  });
});

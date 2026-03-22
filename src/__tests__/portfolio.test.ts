import { describe, expect, it } from "vitest";
import { calcFutureValue, calcPortfolioAtAge } from "../engine/portfolio";

describe("calcFutureValue", () => {
  it("returns initial value when months=0", () => {
    expect(calcFutureValue(10000, 500, 0.07, 0)).toBe(10000);
  });

  it("returns initial + contributions when rate=0", () => {
    expect(calcFutureValue(10000, 500, 0, 12)).toBe(16000);
  });

  it("grows correctly at 7% annual for 12 months with no contributions", () => {
    const result = calcFutureValue(10000, 0, 0.07, 12);
    // 10000 * (1+0.07/12)^12 ≈ 10722.9
    expect(result).toBeCloseTo(10722.9, 0);
  });

  it("calculates compound growth with contributions correctly", () => {
    // 54000 initial, 2000/month, 7% annual, 12 years * 12 months = 144 months
    const result = calcFutureValue(54000, 2000, 0.07, 144);
    // Rough expectation: should be well above 54000 + 2000*144 = 342000 due to compounding
    expect(result).toBeGreaterThan(450000);
    expect(result).toBeLessThan(600000);
  });

  it("is monotonically increasing with more months", () => {
    const r1 = calcFutureValue(50000, 1000, 0.07, 60);
    const r2 = calcFutureValue(50000, 1000, 0.07, 120);
    expect(r2).toBeGreaterThan(r1);
  });
});

describe("calcPortfolioAtAge", () => {
  const inputs = {
    currentAge: 43,
    currentPortfolio: 54000,
    monthlyContrib: 2000,
    annualReturnRate: 0.07,
  };

  it("returns current portfolio at current age", () => {
    expect(calcPortfolioAtAge(inputs, 43, 55)).toBe(54000);
  });

  it("returns larger value at future age during accumulation", () => {
    const result = calcPortfolioAtAge(inputs, 55, 55);
    expect(result).toBeGreaterThan(54000);
  });

  it("portfolio at 55 is less than portfolio at 60 (more time to grow)", () => {
    const at55 = calcPortfolioAtAge(inputs, 55, 55);
    const at60 = calcPortfolioAtAge(inputs, 60, 60);
    expect(at60).toBeGreaterThan(at55);
  });
});

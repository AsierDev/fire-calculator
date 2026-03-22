import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS, SCENARIO_F58_65 } from "../engine/constants";
import { runMonteCarlo } from "../engine/montecarlo";
import { calcScenario } from "../engine/scenarios";

const scenario = calcScenario(DEFAULT_INPUTS, SCENARIO_F58_65);

describe("runMonteCarlo", () => {
  it("returns one point per age from currentAge to 89", () => {
    const result = runMonteCarlo(DEFAULT_INPUTS, scenario, 100);
    expect(result.length).toBe(90 - DEFAULT_INPUTS.currentAge);
    expect(result[0]?.age).toBe(DEFAULT_INPUTS.currentAge);
    expect(result[result.length - 1]?.age).toBe(89);
  });

  it("p10 <= p50 <= p90 at every age", () => {
    const result = runMonteCarlo(DEFAULT_INPUTS, scenario, 200);
    for (const pt of result) {
      expect(pt.p10).toBeLessThanOrEqual(pt.p50);
      expect(pt.p50).toBeLessThanOrEqual(pt.p90);
    }
  });

  it("range equals p90 - p10", () => {
    const result = runMonteCarlo(DEFAULT_INPUTS, scenario, 100);
    for (const pt of result) {
      expect(pt.range).toBeCloseTo(pt.p90 - pt.p10, 0);
    }
  });

  it("all values are non-negative", () => {
    const result = runMonteCarlo(DEFAULT_INPUTS, scenario, 100);
    for (const pt of result) {
      expect(pt.p10).toBeGreaterThanOrEqual(0);
      expect(pt.p50).toBeGreaterThanOrEqual(0);
      expect(pt.p90).toBeGreaterThanOrEqual(0);
    }
  });

  it("portfolio is higher at accumulation peak than current", () => {
    const result = runMonteCarlo(DEFAULT_INPUTS, scenario, 300);
    const atStop = result.find((p) => p.age === scenario.stopWorkAge - 1);
    expect(atStop?.p50).toBeGreaterThan(DEFAULT_INPUTS.currentPortfolio);
  });
});

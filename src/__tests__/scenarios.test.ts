import { describe, expect, it } from "vitest";
import {
  DEFAULT_INPUTS,
  PREDEFINED_SCENARIOS,
  SCENARIO_F55_67,
  SCENARIO_F55_CONV_65,
  SCENARIO_F58_65,
} from "../engine/constants";
import { calcAllScenarios, calcCustomScenario, calcScenario } from "../engine/scenarios";

describe("calcScenario", () => {
  it("returns a result with correct keys matching scenario", () => {
    const result = calcScenario(DEFAULT_INPUTS, SCENARIO_F55_67);
    expect(result.key).toBe(SCENARIO_F55_67.key);
    expect(result.stopWorkAge).toBe(SCENARIO_F55_67.stopWorkAge);
    expect(result.pensionAge).toBe(SCENARIO_F55_67.pensionAge);
  });

  it("has a positive portfolioAtStop", () => {
    const result = calcScenario(DEFAULT_INPUTS, SCENARIO_F55_67);
    expect(result.portfolioAtStop).toBeGreaterThan(0);
  });

  it("has a reasonable pension estimate", () => {
    const result = calcScenario(DEFAULT_INPUTS, SCENARIO_F55_67);
    expect(result.pensionMonthlyGross).toBeGreaterThan(900); // above SS minimum
    expect(result.pensionMonthlyGross).toBeLessThanOrEqual(3360); // below SS maximum
  });

  it("has bridge years = pensionAge - stopWorkAge", () => {
    const result = calcScenario(DEFAULT_INPUTS, SCENARIO_F58_65);
    expect(result.bridgeYears).toBe(7);
  });

  it("convenio scenario has convenioMonths > 0", () => {
    const result = calcScenario(DEFAULT_INPUTS, SCENARIO_F55_CONV_65);
    expect(result.convenioMonths).toBeGreaterThan(0);
    expect(result.convenioCostTotal).toBeGreaterThan(0);
  });

  it("non-convenio scenario has convenioMonths = 0", () => {
    const result = calcScenario(DEFAULT_INPUTS, SCENARIO_F55_67);
    expect(result.convenioMonths).toBe(0);
  });

  it("timeline spans from currentAge to 89", () => {
    const result = calcScenario(DEFAULT_INPUTS, SCENARIO_F55_67);
    const ages = result.timeline.map((s) => s.age);
    expect(ages[0]).toBe(DEFAULT_INPUTS.currentAge);
    expect(ages.at(-1)).toBe(89);
  });
});

describe("calcAllScenarios", () => {
  it("returns one result per predefined scenario", () => {
    const results = calcAllScenarios(DEFAULT_INPUTS);
    expect(results).toHaveLength(PREDEFINED_SCENARIOS.length);
  });

  it("at least one scenario is viable with default inputs", () => {
    const results = calcAllScenarios(DEFAULT_INPUTS);
    expect(results.some((r) => r.viable)).toBe(true);
  });

  it("keys are unique", () => {
    const results = calcAllScenarios(DEFAULT_INPUTS);
    const keys = results.map((r) => r.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it("later stopWorkAge scenarios have higher portfolioAtStop", () => {
    const results = calcAllScenarios(DEFAULT_INPUTS);
    const r55 = results.find((r) => r.stopWorkAge === 55 && !r.useConvenio);
    const r60 = results.find((r) => r.stopWorkAge === 60);
    if (r55 && r60) {
      expect(r60.portfolioAtStop).toBeGreaterThan(r55.portfolioAtStop);
    }
  });
});

describe("calcCustomScenario", () => {
  it("creates a scenario with custom stop age", () => {
    const result = calcCustomScenario(DEFAULT_INPUTS, 57, 65, false);
    expect(result.stopWorkAge).toBe(57);
    expect(result.pensionAge).toBe(65);
    expect(result.bridgeYears).toBe(8);
  });

  it("has a meaningful name", () => {
    const result = calcCustomScenario(DEFAULT_INPUTS, 57, 65, false);
    expect(result.name).toContain("57");
    expect(result.name).toContain("65");
  });
});

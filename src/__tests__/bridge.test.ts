import { describe, expect, it } from "vitest";
import { simulateBridge } from "../engine/bridge";
import { DEFAULT_INPUTS, SCENARIO_F55_67, SCENARIO_F55_CONV_65 } from "../engine/constants";

describe("simulateBridge", () => {
  it("returns a timeline covering accumulation and bridge/pension phases", () => {
    const result = simulateBridge(DEFAULT_INPUTS, SCENARIO_F55_67, 2500);
    expect(result.timeline.length).toBeGreaterThan(0);

    const phases = result.timeline.map((s) => s.phase);
    expect(phases).toContain("accumulation");
    expect(phases).toContain("bridge");
    expect(phases).toContain("pension");
  });

  it("accumulation phase ends at stopWorkAge", () => {
    const result = simulateBridge(DEFAULT_INPUTS, SCENARIO_F55_67, 2500);
    const lastAccumulation = result.timeline.filter((s) => s.phase === "accumulation").at(-1);
    expect(lastAccumulation?.age).toBe(SCENARIO_F55_67.stopWorkAge - 1);
  });

  it("pension phase starts at pensionAge", () => {
    const result = simulateBridge(DEFAULT_INPUTS, SCENARIO_F55_67, 2500);
    const firstPension = result.timeline.find((s) => s.phase === "pension");
    expect(firstPension?.age).toBe(SCENARIO_F55_67.pensionAge);
  });

  it("portfolioAtStop is positive and greater than initial portfolio", () => {
    const result = simulateBridge(DEFAULT_INPUTS, SCENARIO_F55_67, 2500);
    expect(result.portfolioAtStop).toBeGreaterThan(DEFAULT_INPUTS.currentPortfolio);
  });

  it("accumulation snapshots have zero withdrawals", () => {
    const result = simulateBridge(DEFAULT_INPUTS, SCENARIO_F55_67, 2500);
    const accSnapshots = result.timeline.filter((s) => s.phase === "accumulation");
    accSnapshots.forEach((s) => {
      expect(s.withdrawals).toBe(0);
    });
  });

  it("requires convenio months when useConvenio=true", () => {
    const result = simulateBridge(DEFAULT_INPUTS, SCENARIO_F55_CONV_65, 2500);
    expect(result.convenioMonths).toBeGreaterThan(0);
    expect(result.convenioCostMonthly).toBeGreaterThan(0);
    expect(result.convenioCostTotal).toBeGreaterThan(0);
  });

  it("convenioMonths=0 when useConvenio=false", () => {
    const result = simulateBridge(DEFAULT_INPUTS, SCENARIO_F55_67, 2500);
    expect(result.convenioMonths).toBe(0);
    expect(result.convenioCostTotal).toBe(0);
  });

  it("viable=true when pension is high enough to cover expenses", () => {
    // Large pension and small expenses → should be viable
    const result = simulateBridge(
      { ...DEFAULT_INPUTS, monthlyExpenses: 500 },
      SCENARIO_F55_67,
      3000
    );
    expect(result.viable).toBe(true);
  });

  it("viable=false when portfolio runs out during bridge", () => {
    // Very high expenses, minimal portfolio and no pension → not viable
    const result = simulateBridge(
      { ...DEFAULT_INPUTS, currentPortfolio: 1000, monthlyContrib: 0, monthlyExpenses: 10000 },
      SCENARIO_F55_67,
      0
    );
    expect(result.viable).toBe(false);
  });
});

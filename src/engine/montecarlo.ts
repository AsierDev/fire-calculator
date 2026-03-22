import { AFTER_TAX_RETURN_FACTOR } from "./constants";
import type { ScenarioResult, UserInputs } from "./types";

const RETURN_STDDEV = 0.17; // Historical annual std dev for global equity
const SIMULATION_END_AGE = 90;

/** Box-Muller transform: normally distributed random number */
function normalRandom(mean: number, stddev: number): number {
  const u1 = Math.random() + 1e-10; // avoid log(0)
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)] ?? 0;
}

/** Single Monte Carlo run — returns portfolio value at each age */
function simulateOneRun(inputs: UserInputs, scenario: ScenarioResult): Map<number, number> {
  const { currentAge, currentPortfolio, monthlyContrib, monthlyExpenses, inflationRate } = inputs;
  const { stopWorkAge, pensionAge, convenioCostMonthly, convenioMonths, pensionMonthlyGross } =
    scenario;

  let portfolio = currentPortfolio;
  let convenioMonthsRemaining = convenioMonths;
  const result = new Map<number, number>();

  for (let age = currentAge; age < SIMULATION_END_AGE; age++) {
    // Record start-of-year value (consistent with BridgeChart / PortfolioChart)
    result.set(age, portfolio);

    const annualReturn = normalRandom(inputs.annualReturnRate, RETURN_STDDEV);
    const isPensionPhase = age >= pensionAge;
    const isAccumulation = age < stopWorkAge;

    if (isAccumulation) {
      // Monthly compounding with contributions, gross return
      const mr = (1 + annualReturn) ** (1 / 12) - 1;
      for (let m = 0; m < 12; m++) {
        portfolio = portfolio * (1 + mr) + monthlyContrib;
      }
    } else {
      // Annual net-of-tax return
      const effectiveReturn = annualReturn * AFTER_TAX_RETURN_FACTOR;
      const yearsSinceStop = age - stopWorkAge;
      const inflationFactor = (1 + inflationRate) ** yearsSinceStop;
      const annualExpenses = monthlyExpenses * 12 * inflationFactor;

      let annualConvenioCost = 0;
      if (convenioMonthsRemaining > 0) {
        const monthsThisYear = Math.min(convenioMonthsRemaining, 12);
        annualConvenioCost = convenioCostMonthly * monthsThisYear;
        convenioMonthsRemaining -= monthsThisYear;
      }

      const annualPension = isPensionPhase ? pensionMonthlyGross * 12 : 0;
      const netWithdrawal = Math.max(0, annualExpenses + annualConvenioCost - annualPension);
      portfolio = Math.max(0, portfolio * (1 + effectiveReturn) - netWithdrawal);
    }
  }

  return result;
}

export interface MonteCarloPoint {
  age: number;
  p10: number;
  p50: number;
  p90: number;
  /** p90 - p10, for stacked area rendering */
  range: number;
}

/**
 * Run Monte Carlo simulation for a scenario.
 * Returns per-age percentile bands (p10 / median / p90).
 */
export function runMonteCarlo(
  inputs: UserInputs,
  scenario: ScenarioResult,
  runs = 1000
): MonteCarloPoint[] {
  const ages: number[] = [];
  for (let age = inputs.currentAge; age < SIMULATION_END_AGE; age++) {
    ages.push(age);
  }

  const runResults: Map<number, number>[] = Array.from({ length: runs }, () =>
    simulateOneRun(inputs, scenario)
  );

  return ages.map((age) => {
    const values = runResults.map((r) => r.get(age) ?? 0).sort((a, b) => a - b);
    const p10 = percentile(values, 0.1);
    const p50 = percentile(values, 0.5);
    const p90 = percentile(values, 0.9);
    return { age, p10, p50, p90, range: Math.max(0, p90 - p10) };
  });
}

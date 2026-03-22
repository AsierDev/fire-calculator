import { AFTER_TAX_RETURN_FACTOR } from "./constants";
import {
  calcConvenioMonthlyCost,
  calcConvenioNeeded,
  calcDiasCotizadosAtStopAge,
} from "./convenio";
import { calcFutureValue } from "./portfolio";
import type { ScenarioDefinition, UserInputs, YearSnapshot } from "./types";

const SIMULATION_END_AGE = 90;

interface BridgeSimulationResult {
  timeline: YearSnapshot[];
  portfolioAtStop: number;
  portfolioAtPension: number;
  viable: boolean;
  convenioMonths: number;
  convenioCostMonthly: number;
  convenioCostTotal: number;
  diasCotizadosAtStop: number;
}

/**
 * Simulate the full financial timeline year by year from currentAge to SIMULATION_END_AGE.
 * Three phases:
 *  1. Accumulation (currentAge → stopWorkAge): portfolio grows with contributions
 *  2. Bridge (stopWorkAge → pensionAge): portfolio draws down with inflation-adj expenses
 *  3. Pension (pensionAge → 90): pension covers expenses; portfolio grows/draws down gap
 */
export function simulateBridge(
  inputs: UserInputs,
  scenario: ScenarioDefinition,
  pensionMonthlyGross: number
): BridgeSimulationResult {
  const {
    currentAge,
    currentPortfolio,
    monthlyContrib,
    annualReturnRate,
    monthlyExpenses,
    inflationRate,
  } = inputs;
  const { stopWorkAge, pensionAge, useConvenio } = scenario;

  const effectiveReturnRate = annualReturnRate * AFTER_TAX_RETURN_FACTOR;

  // --- Convenio setup ---
  const diasAtStop = calcDiasCotizadosAtStopAge(currentAge, inputs.diasCotizados, stopWorkAge);
  const { months: convenioMonths, totalCost: convenioCostTotal } = useConvenio
    ? calcConvenioNeeded(diasAtStop)
    : { months: 0, totalCost: 0 };
  const convenioCostMonthly = useConvenio ? calcConvenioMonthlyCost() : 0;

  // --- Accumulation phase: grow portfolio to stopWorkAge ---
  const accumulationMonths = Math.round((stopWorkAge - currentAge) * 12);
  const portfolioAtStop = calcFutureValue(
    currentPortfolio,
    monthlyContrib,
    annualReturnRate,
    accumulationMonths
  );

  // --- Year-by-year simulation ---
  const timeline: YearSnapshot[] = [];
  let portfolio = portfolioAtStop;
  let convenioMonthsRemaining = convenioMonths;
  let viableBridge = true;

  for (let age = stopWorkAge; age < SIMULATION_END_AGE; age++) {
    const yearsSinceStop = age - stopWorkAge;
    const inflationFactor = (1 + inflationRate) ** yearsSinceStop;
    const annualExpenses = monthlyExpenses * 12 * inflationFactor;

    const isConvenioPeriod = useConvenio && convenioMonthsRemaining > 0;
    const isPensionPhase = age >= pensionAge;

    // Convenio payment this year (partial last year possible)
    let annualConvenioCost = 0;
    if (isConvenioPeriod) {
      const monthsThisYear = Math.min(convenioMonthsRemaining, 12);
      annualConvenioCost = convenioCostMonthly * monthsThisYear;
      convenioMonthsRemaining -= monthsThisYear;
    }

    // Pension income this year
    const annualPension = isPensionPhase ? pensionMonthlyGross * 12 : 0;

    // Net withdrawals needed from portfolio
    const netWithdrawal = Math.max(0, annualExpenses + annualConvenioCost - annualPension);

    const portfolioStart = portfolio;
    const annualReturn = portfolio * effectiveReturnRate;
    const rawPortfolioEnd = portfolio + annualReturn - netWithdrawal;

    const phase = isPensionPhase ? "pension" : "bridge";

    // Track viability: bridge is not viable if portfolio goes negative during bridge phase
    if (!isPensionPhase && rawPortfolioEnd < 0) {
      viableBridge = false;
    }

    portfolio = Math.max(0, rawPortfolioEnd);

    timeline.push({
      age,
      phase,
      portfolioStart,
      portfolioEnd: portfolio,
      withdrawals: netWithdrawal,
      returns: annualReturn,
      convenioPayment: annualConvenioCost,
      pensionIncome: annualPension,
    });
  }

  // Add accumulation years to the front of timeline
  const accumulationTimeline: YearSnapshot[] = [];
  let accPortfolio = currentPortfolio;
  for (let age = currentAge; age < stopWorkAge; age++) {
    const portfolioStart = accPortfolio;
    accPortfolio = calcFutureValue(accPortfolio, monthlyContrib, annualReturnRate, 12);
    accumulationTimeline.push({
      age,
      phase: "accumulation",
      portfolioStart,
      portfolioEnd: accPortfolio,
      withdrawals: 0,
      returns: accPortfolio - portfolioStart - monthlyContrib * 12,
      convenioPayment: 0,
      pensionIncome: 0,
    });
  }

  const fullTimeline = [...accumulationTimeline, ...timeline];

  const pensionSnapshot = timeline.find((s) => s.age === pensionAge);
  const portfolioAtPension = pensionSnapshot?.portfolioStart ?? portfolioAtStop;

  return {
    timeline: fullTimeline,
    portfolioAtStop,
    portfolioAtPension,
    viable: viableBridge,
    convenioMonths,
    convenioCostMonthly,
    convenioCostTotal,
    diasCotizadosAtStop: diasAtStop,
  };
}

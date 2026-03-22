import { simulateBridge } from "./bridge";
import { PREDEFINED_SCENARIOS, SS } from "./constants";
import { calcDiasCotizadosAtStopAge } from "./convenio";
import { calcBaseReguladora, calcPensionMonthly, calcYearsCotizados } from "./pension";
import type { ScenarioDefinition, ScenarioResult, UserInputs } from "./types";

/**
 * Binary search for the minimum portfolio at stopWorkAge that makes the bridge viable.
 * simulateBridge handles returns/inflation internally, so we just vary the starting portfolio.
 */
function calcMinPortfolioAtStop(
  inputs: UserInputs,
  scenario: ScenarioDefinition,
  pensionMonthlyGross: number
): number {
  if (scenario.pensionAge <= scenario.stopWorkAge) return 0;

  const bridgeYears = scenario.pensionAge - scenario.stopWorkAge;
  const upperBound = inputs.monthlyExpenses * 12 * bridgeYears * 4;

  let lo = 0;
  let hi = upperBound;

  const testInputs: UserInputs = {
    ...inputs,
    currentAge: scenario.stopWorkAge,
    monthlyContrib: 0,
  };

  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const result = simulateBridge(
      { ...testInputs, currentPortfolio: mid },
      scenario,
      pensionMonthlyGross
    );
    if (result.viable) hi = mid;
    else lo = mid;
  }

  return Math.ceil(hi / 1000) * 1000;
}

/**
 * Calculate a single FIRE scenario and return the full result.
 */
export function calcScenario(inputs: UserInputs, scenario: ScenarioDefinition): ScenarioResult {
  const { stopWorkAge, pensionAge } = scenario;

  // --- Years cotizados ---
  const diasAtStop = calcDiasCotizadosAtStopAge(
    inputs.currentAge,
    inputs.diasCotizados,
    stopWorkAge
  );
  const yearsCotizadosAtStop = calcYearsCotizados(diasAtStop);

  // --- Simulate bridge first to get convenio details ---
  const { convenioMonths } = simulateBridge(
    inputs,
    scenario,
    0 // pension=0 for first pass to determine convenio months
  );

  const yearsCotizadosTotal = yearsCotizadosAtStop + convenioMonths / 12;

  // --- Pension calculation ---
  const windowMonths = SS.PENSION_BASE_MONTHS; // 300
  const yearsWorked = stopWorkAge - inputs.currentAge;
  const workMonthsInWindow = Math.min(yearsWorked * 12, windowMonths);
  const convenioMonthsInWindow = Math.min(convenioMonths, windowMonths - workMonthsInWindow);

  const baseReg = calcBaseReguladora(
    inputs.annualSalaryGross,
    workMonthsInWindow,
    convenioMonthsInWindow
  );

  const pensionMonthlyGross = calcPensionMonthly(baseReg, yearsCotizadosTotal, pensionAge);

  // --- Full bridge simulation with actual pension ---
  const bridgeResult = simulateBridge(inputs, scenario, pensionMonthlyGross);

  // --- Minimum portfolio needed at stop age ---
  const minPortfolioAtStop = calcMinPortfolioAtStop(inputs, scenario, pensionMonthlyGross);

  return {
    key: scenario.key,
    name: scenario.name,
    description: scenario.description,
    stopWorkAge,
    pensionAge,
    useConvenio: scenario.useConvenio,
    yearsCotizadosAtStop,
    yearsCotizadosTotal,
    convenioMonths: bridgeResult.convenioMonths,
    convenioCostMonthly: bridgeResult.convenioCostMonthly,
    convenioCostTotal: bridgeResult.convenioCostTotal,
    baseReguladora: baseReg,
    earlyPenaltyPct:
      pensionAge < SS.LEGAL_RETIREMENT_AGE
        ? (SS.LEGAL_RETIREMENT_AGE - pensionAge) * 4 * SS.EARLY_PENALTY_PER_QUARTER
        : 0,
    pensionMonthlyGross,
    portfolioAtStop: bridgeResult.portfolioAtStop,
    portfolioAtPension: bridgeResult.portfolioAtPension,
    minPortfolioAtStop,
    bridgeYears: pensionAge - stopWorkAge,
    viable: bridgeResult.viable,
    timeline: bridgeResult.timeline,
  };
}

/**
 * Run all predefined scenarios and return results array.
 */
export function calcAllScenarios(inputs: UserInputs): ScenarioResult[] {
  return PREDEFINED_SCENARIOS.map((scenario) => calcScenario(inputs, scenario));
}

/**
 * Calculate a single custom scenario with any stopWorkAge.
 */
export function calcCustomScenario(
  inputs: UserInputs,
  stopWorkAge: number,
  pensionAge: number,
  useConvenio: boolean
): ScenarioResult {
  const scenario: ScenarioDefinition = {
    key: `CUSTOM_${stopWorkAge}_${pensionAge}`,
    name: `Baja ${stopWorkAge} → Pensión ${pensionAge}${useConvenio ? " + Convenio" : ""}`,
    stopWorkAge,
    pensionAge,
    useConvenio,
  };
  return calcScenario(inputs, scenario);
}

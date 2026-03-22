export interface UserInputs {
  currentAge: number;
  diasCotizados: number;
  currentPortfolio: number;
  monthlyContrib: number;
  annualReturnRate: number;
  monthlyExpenses: number;
  annualSalaryGross: number;
  inflationRate: number;
}

export interface ScenarioDefinition {
  key: string;
  name: string;
  /** Plain-language explanation shown in the UI */
  description?: string | undefined;
  stopWorkAge: number;
  pensionAge: number;
  useConvenio: boolean;
}

export type Phase = "accumulation" | "bridge" | "pension";

export interface YearSnapshot {
  age: number;
  phase: Phase;
  portfolioStart: number;
  portfolioEnd: number;
  withdrawals: number;
  returns: number;
  convenioPayment: number;
  pensionIncome: number;
}

export interface ScenarioResult {
  key: string;
  name: string;
  description?: string | undefined;
  stopWorkAge: number;
  pensionAge: number;
  useConvenio: boolean;
  yearsCotizadosAtStop: number;
  yearsCotizadosTotal: number;
  convenioMonths: number;
  convenioCostMonthly: number;
  convenioCostTotal: number;
  baseReguladora: number;
  earlyPenaltyPct: number;
  pensionMonthlyGross: number;
  portfolioAtStop: number;
  portfolioAtPension: number;
  /** Minimum portfolio needed at stop age to make the bridge viable */
  minPortfolioAtStop: number;
  bridgeYears: number;
  viable: boolean;
  timeline: YearSnapshot[];
}

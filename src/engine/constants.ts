import type { ScenarioDefinition, UserInputs } from "./types";

export const SS = {
  BASE_MAX_MONTHLY: 5101.2,
  BASE_MIN_MONTHLY: 1381.2,
  PENSION_MAX_MONTHLY: 3360,
  PENSION_MIN_MONTHLY: 936,
  SS_TYPE: 0.283,
  CONVENIO_COEF: 0.94,
  EARLY_PENALTY_PER_QUARTER: 0.02,
  MIN_YEARS_FOR_EARLY: 35,
  MIN_YEARS_FOR_EARLY_63: 38.5,
  LEGAL_RETIREMENT_AGE: 67,
  EARLY_RETIREMENT_AGE: 65,
  PENSION_BASE_MONTHS: 300, // 25 years
} as const;

// After-tax factor for investment returns during bridge:
// capital gains taxed at ~21% on gains portion; gains are ~70% of gross withdrawal
export const AFTER_TAX_RETURN_FACTOR = 1 - 0.21 * 0.7;

export const DEFAULT_INPUTS: UserInputs = {
  currentAge: 35,
  diasCotizados: 3653, // 10 años, 0 meses
  currentPortfolio: 20000,
  monthlyContrib: 500,
  annualReturnRate: 0.07,
  monthlyExpenses: 1200,
  annualSalaryGross: 30000,
  inflationRate: 0.025,
};

export const SCENARIO_F55_67: ScenarioDefinition = {
  key: "F55_67",
  name: "Baja 55 → Pensión 67",
  description:
    "Dejas de trabajar a los 55 y esperas hasta los 67 (la edad legal de jubilación en España) para cobrar la pensión. Durante 12 años vives exclusivamente del portfolio. A cambio, la pensión no tiene penalización por anticipación y puede ser completa.",
  stopWorkAge: 55,
  pensionAge: 67,
  useConvenio: false,
};

export const SCENARIO_F55_CONV_65: ScenarioDefinition = {
  key: "F55_CONV_65",
  name: "Baja 55 + Convenio → Pensión 65",
  description:
    "Dejas de trabajar a los 55 y suscribes el Convenio Especial con la Seguridad Social: pagas una cuota mensual (~367 €) para seguir cotizando en situación voluntaria. Así completas los años de cotización necesarios para jubilarte anticipadamente a los 65, dos años antes que en el escenario sin Convenio.",
  stopWorkAge: 55,
  pensionAge: 65,
  useConvenio: true,
};

export const SCENARIO_F58_65: ScenarioDefinition = {
  key: "F58_65",
  name: "Baja 58 → Pensión 65",
  description:
    "Dejas de trabajar a los 58. El bridge es de 7 años (de 58 a 65). Necesitas menos capital acumulado que si bajas antes, y la pensión es mayor porque habrás cotizado más años.",
  stopWorkAge: 58,
  pensionAge: 65,
  useConvenio: false,
};

export const SCENARIO_F60_65: ScenarioDefinition = {
  key: "F60_65",
  name: "Baja 60 → Pensión 65",
  description:
    "Dejas de trabajar a los 60. Solo 5 años de bridge antes de cobrar la pensión. Es el escenario más conservador: requiere menos capital, la pensión es la más alta de los cuatro y el riesgo de que el portfolio se agote es menor.",
  stopWorkAge: 60,
  pensionAge: 65,
  useConvenio: false,
};

export const PREDEFINED_SCENARIOS: ScenarioDefinition[] = [
  SCENARIO_F55_67,
  SCENARIO_F55_CONV_65,
  SCENARIO_F58_65,
  SCENARIO_F60_65,
];

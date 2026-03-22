import { SS } from "./constants";

/**
 * Convert days cotizados to decimal years.
 */
export function calcYearsCotizados(diasCotizados: number): number {
  return diasCotizados / 365.25;
}

/**
 * Pension percentage based on years cotizados.
 * 15y = 50%, +3%/year years 16–25, +2%/year years 26–37, max 100%.
 */
export function calcPensionPct(yearsCotizados: number): number {
  if (yearsCotizados < 15) return 0;
  if (yearsCotizados <= 25) {
    return Math.min(0.5 + (yearsCotizados - 15) * 0.03, 1.0);
  }
  return Math.min(0.8 + (yearsCotizados - 25) * 0.02, 1.0);
}

/**
 * Simplified base reguladora: weighted average of last 25 years (300 months).
 * Assumes:
 *  - working months: capped salary base
 *  - convenio months: BASE_MIN
 *  - zero months: 0 (no work, no convenio)
 */
export function calcBaseReguladora(
  annualSalaryGross: number,
  workMonths: number,
  convenioMonths: number
): number {
  const totalMonths = SS.PENSION_BASE_MONTHS;
  const salaryBase = Math.min(annualSalaryGross / 12, SS.BASE_MAX_MONTHLY);
  const zeroMonths = Math.max(0, totalMonths - workMonths - convenioMonths);

  const total = salaryBase * workMonths + SS.BASE_MIN_MONTHLY * convenioMonths + 0 * zeroMonths;

  return total / totalMonths;
}

/**
 * Early retirement penalty fraction.
 * 2% per quarter early for workers with < 38.5 years cotizados.
 * Only applies if pensionAge < LEGAL_RETIREMENT_AGE.
 * Returns a fraction (e.g. 0.16 = 16% penalty).
 */
export function calcEarlyPenalty(pensionAge: number, yearsCotizados: number): number {
  if (pensionAge >= SS.LEGAL_RETIREMENT_AGE) return 0;
  const monthsEarly = (SS.LEGAL_RETIREMENT_AGE - pensionAge) * 12;
  const quartersEarly = Math.floor(monthsEarly / 3);

  // Reduced penalty table for >= 38.5 years (simplified: use same 2%/quarter)
  // The full regulation has a sliding scale but 2%/quarter is the key case
  const penaltyPerQuarter =
    yearsCotizados >= SS.MIN_YEARS_FOR_EARLY_63 ? 0.0175 : SS.EARLY_PENALTY_PER_QUARTER;

  return Math.min(quartersEarly * penaltyPerQuarter, 0.5);
}

/**
 * Final gross monthly pension.
 * baseReg × pensionPct × (1 - earlyPenalty), clamped to SS min/max.
 */
export function calcPensionMonthly(
  baseReg: number,
  yearsCotizados: number,
  pensionAge: number
): number {
  const pct = calcPensionPct(yearsCotizados);
  const penalty = calcEarlyPenalty(pensionAge, yearsCotizados);
  const raw = baseReg * pct * (1 - penalty);
  return Math.min(Math.max(raw, SS.PENSION_MIN_MONTHLY), SS.PENSION_MAX_MONTHLY);
}

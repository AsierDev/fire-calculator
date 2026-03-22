import { SS } from "./constants";
import { calcYearsCotizados } from "./pension";

/**
 * Monthly cost of Convenio Especial at base mínima.
 * cuota = BASE_MIN * SS_TYPE * CONVENIO_COEF
 */
export function calcConvenioMonthlyCost(): number {
  return SS.BASE_MIN_MONTHLY * SS.SS_TYPE * SS.CONVENIO_COEF;
}

/**
 * Calculate how many months of Convenio are needed and the total cost.
 * @param diasCotizados - days cotizados at the moment of stopping work
 * @param targetYears - years needed (typically SS.MIN_YEARS_FOR_EARLY = 35)
 * @returns { months, totalCost } — months=0 if already at or above target
 */
export function calcConvenioNeeded(
  diasCotizados: number,
  targetYears: number = SS.MIN_YEARS_FOR_EARLY
): { months: number; totalCost: number } {
  const currentYears = calcYearsCotizados(diasCotizados);
  const yearsNeeded = Math.max(0, targetYears - currentYears);
  const months = Math.ceil(yearsNeeded * 12);
  const totalCost = months * calcConvenioMonthlyCost();
  return { months, totalCost };
}

/**
 * How many days will the user have cotizados when they stop work at stopWorkAge,
 * given their current age and current dias cotizados.
 */
export function calcDiasCotizadosAtStopAge(
  currentAge: number,
  diasCotizados: number,
  stopWorkAge: number
): number {
  const yearsWorking = Math.max(0, stopWorkAge - currentAge);
  return diasCotizados + yearsWorking * 365.25;
}

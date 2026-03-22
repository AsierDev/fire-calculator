import type { UserInputs } from "./types";

/**
 * Compound interest future value with monthly contributions.
 * FV = initial*(1+r/12)^n + contrib*[((1+r/12)^n - 1)/(r/12)]
 */
export function calcFutureValue(
  initial: number,
  monthlyContrib: number,
  annualRate: number,
  months: number
): number {
  if (months <= 0) return initial;
  const r = annualRate / 12;
  if (r === 0) return initial + monthlyContrib * months;
  const growth = (1 + r) ** months;
  return initial * growth + monthlyContrib * ((growth - 1) / r);
}

/**
 * Portfolio value at a given age, assuming contributions stop at stopWorkAge.
 * After stopWorkAge, returns after-tax growth with no new contributions.
 */
export function calcPortfolioAtAge(
  inputs: Pick<
    UserInputs,
    "currentAge" | "currentPortfolio" | "monthlyContrib" | "annualReturnRate"
  >,
  targetAge: number,
  stopWorkAge: number,
  afterTaxFactor = 1
): number {
  const { currentAge, currentPortfolio, monthlyContrib, annualReturnRate } = inputs;
  if (targetAge <= currentAge) return currentPortfolio;

  const effectiveStopAge = Math.min(stopWorkAge, targetAge);
  const accumulationMonths = Math.round((effectiveStopAge - currentAge) * 12);

  const portfolioAtStop = calcFutureValue(
    currentPortfolio,
    monthlyContrib,
    annualReturnRate,
    accumulationMonths
  );

  if (targetAge <= stopWorkAge) return portfolioAtStop;

  // After stop: grow at after-tax rate, no contributions
  const bridgeMonths = Math.round((targetAge - effectiveStopAge) * 12);
  const effectiveRate = annualReturnRate * afterTaxFactor;
  return calcFutureValue(portfolioAtStop, 0, effectiveRate, bridgeMonths);
}

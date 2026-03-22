import { useFireStore } from "../store/useFireStore";
import styles from "./FireSummaryCard.module.css";
import { HelpTooltip } from "./HelpTooltip";

const EUR = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function diasToText(dias: number): string {
  const years = Math.floor(dias / 365.25);
  const months = Math.floor((dias % 365.25) / 30.44);
  if (months === 0) return `${years} años`;
  return `${years} años y ${months} meses`;
}

export function FireSummaryCard() {
  const { inputs, results, customResult } = useFireStore();

  const {
    currentAge,
    diasCotizados,
    currentPortfolio,
    monthlyContrib,
    monthlyExpenses,
    annualReturnRate,
  } = inputs;

  const isDuplicateOfPredefined =
    customResult !== null &&
    results.some(
      (r) =>
        r.stopWorkAge === customResult.stopWorkAge &&
        r.pensionAge === customResult.pensionAge &&
        r.useConvenio === customResult.useConvenio
    );
  const allScenarios =
    customResult && !isDuplicateOfPredefined ? [...results, customResult] : results;
  const viableScenarios = allScenarios.filter((r) => r.viable);
  const earliestViable = viableScenarios.reduce<(typeof allScenarios)[number] | null>(
    (best, r) => (!best || r.stopWorkAge < best.stopWorkAge ? r : best),
    null
  );

  return (
    <div className={styles.wrapper}>
      {/* Intro narrative */}
      <div className={styles.intro}>
        <div className={styles.introTitle}>Tu situación FIRE</div>
        <p className={styles.narrative}>
          Tienes <strong>{currentAge} años</strong> y llevas{" "}
          <strong>{diasToText(diasCotizados)}</strong> cotizados a la Seguridad Social. Tienes{" "}
          <strong>{EUR.format(currentPortfolio)}</strong> en fondos indexados y aportas{" "}
          <strong>{EUR.format(monthlyContrib)}/mes</strong>. Planeas gastar{" "}
          <strong>{EUR.format(monthlyExpenses)}/mes</strong> cuando dejes de trabajar, con una
          rentabilidad estimada del <strong>{(annualReturnRate * 100).toFixed(1)}%</strong> anual.
        </p>
        {earliestViable ? (
          <p className={styles.narrativeHighlight}>
            Con tu plan actual, la opción más temprana viable es{" "}
            <strong>dejar de trabajar a los {earliestViable.stopWorkAge} años</strong>, con una
            pensión estimada de{" "}
            <strong>{EUR.format(earliestViable.pensionMonthlyGross)}/mes</strong> a partir de los{" "}
            {earliestViable.pensionAge}.
          </p>
        ) : (
          <p className={styles.narrativeAlert}>
            Con los parámetros actuales ningún escenario predefinido es viable. Considera aumentar
            el ahorro mensual o ajustar los gastos.
          </p>
        )}
      </div>

      {/* Scenario cards */}
      <div className={styles.scenarioGrid}>
        {allScenarios.map((r) => {
          const margin = r.portfolioAtStop - r.minPortfolioAtStop;
          const positive = margin >= 0;
          return (
            <div
              key={r.key}
              className={`${styles.scenarioCard} ${r.viable ? styles.cardViable : styles.cardNotViable}`}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardName}>{r.name}</span>
                <span
                  className={`${styles.cardBadge} ${r.viable ? styles.badgeOk : styles.badgeNo}`}
                >
                  {r.viable ? "✓ Viable" : "✗ Inviable"}
                </span>
              </div>

              {r.description && <p className={styles.cardDescription}>{r.description}</p>}

              <div className={styles.cardRows}>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Llegarás con</span>
                  <span className={styles.cardValue}>{EUR.format(r.portfolioAtStop)}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>
                    Mínimo necesario
                    <HelpTooltip text="Capital mínimo que necesitas al dejar de trabajar para que el portfolio no se agote antes de los 90 años, incluyendo gastos, inflación y pensión." />
                  </span>
                  <span className={styles.cardValue}>≈ {EUR.format(r.minPortfolioAtStop)}</span>
                </div>
                <div className={`${styles.cardRow} ${styles.cardRowMargin}`}>
                  <span className={styles.cardLabel}>Margen</span>
                  <span
                    className={`${styles.cardMargin} ${positive ? styles.marginOk : styles.marginNo}`}
                  >
                    {positive ? "+" : ""}
                    {EUR.format(margin)}
                  </span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>
                    Sin ingresos
                    <HelpTooltip text='Período "bridge" o puente: los años entre que dejas de trabajar y cuando empieza tu pensión. Durante este tiempo vives del portfolio acumulado.' />
                  </span>
                  <span className={styles.cardValue}>
                    {r.bridgeYears} años (de {r.stopWorkAge} a {r.pensionAge})
                  </span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Pensión estimada</span>
                  <span className={styles.cardValue}>
                    {EUR.format(r.pensionMonthlyGross)}/mes desde los {r.pensionAge}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className={styles.disclaimer}>
        Cálculos en euros constantes de hoy. La pensión es una estimación basada en la legislación
        SS 2026 y puede variar.
      </p>
    </div>
  );
}

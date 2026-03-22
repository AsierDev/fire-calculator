import type { ScenarioResult } from "../engine/types";
import { useFireStore } from "../store/useFireStore";
import styles from "./ConvenioBreakdown.module.css";

const EUR = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function getSelectedScenario(
  results: ScenarioResult[],
  customResult: ScenarioResult | null,
  selectedKey: string | null
): ScenarioResult | null {
  if (!selectedKey) return results.find((r) => r.useConvenio) ?? null;
  if (customResult && selectedKey === customResult.key) return customResult;
  return results.find((r) => r.key === selectedKey) ?? null;
}

export function ConvenioBreakdown() {
  const { results, customResult, selectedScenarioKey } = useFireStore();

  const scenario = getSelectedScenario(results, customResult, selectedScenarioKey);

  // Only show if the scenario uses Convenio
  if (!scenario?.useConvenio || scenario.convenioMonths === 0) return null;

  // ROI: pension gain vs convenio cost
  // Pension anticipada 2 years earlier = 24 months of pension
  const earlyMonths = (67 - scenario.pensionAge) * 12;
  const extraPensionTotal = earlyMonths > 0 ? scenario.pensionMonthlyGross * earlyMonths : 0;
  const roi =
    scenario.convenioCostTotal > 0
      ? Math.round((extraPensionTotal / scenario.convenioCostTotal) * 10) / 10
      : 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.title}>Convenio Especial con la SS</div>
          <div className={styles.subtitle}>{scenario.name}</div>
        </div>
        <span className={styles.badge}>Herramienta SS</span>
      </div>

      {/* Explanation */}
      <p className={styles.intro}>
        El <strong>Convenio Especial</strong> te permite seguir cotizando a la SS después de dejar
        de trabajar, pagando una cuota mensual. Así completas los años necesarios para acceder a la
        pensión anticipada a los {scenario.pensionAge} años en vez de a los 67.
      </p>

      {/* Key metrics */}
      <div className={styles.grid}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Meses necesarios</span>
          <span className={styles.metricValue}>{scenario.convenioMonths}</span>
          <span className={styles.metricSub}>hasta completar 35 años cotizados</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Cuota mensual</span>
          <span className={styles.metricValue}>{EUR.format(scenario.convenioCostMonthly)}</span>
          <span className={styles.metricSub}>base mínima SS 2026</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Coste total</span>
          <span className={styles.metricValue}>{EUR.format(scenario.convenioCostTotal)}</span>
          <span className={styles.metricSub}>
            {scenario.convenioMonths} × {EUR.format(scenario.convenioCostMonthly)}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Pensión resultante</span>
          <span className={styles.metricValue}>{EUR.format(scenario.pensionMonthlyGross)}/mes</span>
          <span className={styles.metricSub}>brutos, desde los {scenario.pensionAge} años</span>
        </div>
      </div>

      {/* Steps */}
      <div className={styles.stepsTitle}>Cómo solicitarlo</div>
      <div className={styles.steps}>
        <div className={styles.step}>
          <span className={styles.stepNum}>1</span>
          <span>
            Da la baja voluntaria y marca en el calendario el <strong>día 89</strong> como límite.
          </span>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>2</span>
          <span>
            Accede a <strong>Importass</strong> (importass.seg-social.es) con certificado digital o
            Cl@ve.
          </span>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>3</span>
          <span>
            Selecciona <em>Afiliación → Convenios Especiales → Alta convenio especial ordinario</em>
            . Elige <strong>base mínima</strong> y domicilia el pago.
          </span>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>4</span>
          <span>
            Re-suscríbete <strong>3–4 meses antes de los {scenario.pensionAge} años</strong> para
            estar en «situación asimilada al alta» al solicitar la jubilación anticipada.
          </span>
        </div>
      </div>

      {/* ROI highlight */}
      {earlyMonths > 0 && extraPensionTotal > 0 && (
        <div className={styles.roi}>
          Cobrar la pensión desde los <strong>{scenario.pensionAge}</strong> en vez de los 67
          equivale a <span className={styles.roiHighlight}>{EUR.format(extraPensionTotal)}</span> en{" "}
          {earlyMonths} meses de pensión extra — frente a un coste de{" "}
          <span className={styles.roiHighlight}>{EUR.format(scenario.convenioCostTotal)}</span> del
          Convenio. ROI aproximado: <span className={styles.roiHighlight}>{roi}×</span>.
        </div>
      )}
    </div>
  );
}

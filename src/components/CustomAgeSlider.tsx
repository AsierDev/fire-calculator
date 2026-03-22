import { useFireStore } from "../store/useFireStore";
import styles from "./CustomAgeSlider.module.css";

const EUR = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function CustomAgeSlider() {
  const {
    customStopAge,
    customPensionAge,
    customUseConvenio,
    customResult,
    setCustomStopAge,
    setCustomPensionAge,
    setCustomUseConvenio,
    selectScenario,
    selectedScenarioKey,
  } = useFireStore();

  const isSelected = selectedScenarioKey === customResult?.key;

  function handleSelect() {
    if (!customResult) return;
    selectScenario(isSelected ? null : customResult.key);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>Escenario personalizado</div>

      <div className={styles.controls}>
        {/* Stop work age slider */}
        <div className={styles.sliderGroup}>
          <span className={styles.sliderLabel}>Edad de baja voluntaria</span>
          <div className={styles.sliderRow}>
            <input
              type="range"
              className={styles.slider}
              min={45}
              max={66}
              step={1}
              value={customStopAge}
              onChange={(e) => setCustomStopAge(Number(e.target.value))}
            />
            <span className={styles.sliderValue}>{customStopAge}</span>
          </div>
        </div>

        {/* Pension age slider */}
        <div className={styles.sliderGroup}>
          <span className={styles.sliderLabel}>Edad de inicio de pensión</span>
          <div className={styles.sliderRow}>
            <input
              type="range"
              className={styles.slider}
              min={Math.max(customStopAge + 1, 60)}
              max={70}
              step={1}
              value={customPensionAge}
              onChange={(e) => setCustomPensionAge(Number(e.target.value))}
            />
            <span className={styles.sliderValue}>{customPensionAge}</span>
          </div>
        </div>

        {/* Options */}
        <div className={styles.options}>
          <span className={styles.optionLabel}>Opciones:</span>
          <button
            type="button"
            className={`${styles.toggleBtn} ${customUseConvenio ? styles.toggleBtnActive : ""}`}
            onClick={() => setCustomUseConvenio(!customUseConvenio)}
          >
            Convenio Especial
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${isSelected ? styles.toggleBtnActive : ""}`}
            onClick={handleSelect}
          >
            {isSelected ? "✓ Seleccionado" : "Ver detalle"}
          </button>
        </div>
      </div>

      {/* Metrics */}
      {customResult && (
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Estado</span>
            <span
              className={`${styles.metricValue} ${customResult.viable ? styles.metricValueViable : styles.metricValueNotViable}`}
            >
              {customResult.viable ? "✓ Viable" : "✗ Inviable"}
            </span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Sin ingresos</span>
            <span className={styles.metricValue}>{customResult.bridgeYears} años</span>
            <span className={styles.metricSub}>hasta la pensión</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Capital al parar</span>
            <span className={styles.metricValue}>{EUR.format(customResult.portfolioAtStop)}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Pensión estimada</span>
            <span className={styles.metricValue}>
              {EUR.format(customResult.pensionMonthlyGross)}/mes
            </span>
            <span className={styles.metricSub}>brutos</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Capital al cobrar pensión</span>
            <span className={styles.metricValue}>
              {EUR.format(customResult.portfolioAtPension)}
            </span>
          </div>
          {customUseConvenio && customResult.convenioMonths > 0 && (
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Coste Convenio</span>
              <span className={styles.metricValue}>
                {EUR.format(customResult.convenioCostTotal)}
              </span>
              <span className={styles.metricSub}>
                {customResult.convenioMonths} meses × {EUR.format(customResult.convenioCostMonthly)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import type { UserInputs } from "../engine/types";
import { useFireStore } from "../store/useFireStore";
import { ImpactIndicator } from "./ImpactIndicator";
import styles from "./InputPanel.module.css";

interface FieldProps {
  id: string;
  label: string;
  hint?: string | undefined;
  extra?: React.ReactNode;
  children: React.ReactNode;
}

function Field({ id, label, hint, extra, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {extra}
      </label>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}

interface SliderFieldProps {
  id: string;
  label: string;
  hint?: string | undefined;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderField({
  id,
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: SliderFieldProps) {
  return (
    <Field id={id} label={label} hint={hint}>
      <div className={styles.sliderRow}>
        <input
          id={id}
          type="range"
          className={styles.slider}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className={styles.sliderValue}>{format(value)}</span>
      </div>
    </Field>
  );
}

export function InputPanel() {
  const { inputs, setInput, resetInputs } = useFireStore();

  function handleInput(key: keyof UserInputs) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      if (!Number.isNaN(val) && val >= 0) setInput(key, val);
    };
  }

  return (
    <div className={styles.panel}>
      {/* ── Situación personal ───────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Situación personal</h2>

        <Field id="currentAge" label="Edad actual">
          <input
            id="currentAge"
            type="number"
            className={styles.input}
            value={inputs.currentAge}
            min={20}
            max={64}
            onChange={handleInput("currentAge")}
          />
        </Field>

        <Field id="cotizados-years" label="Vida laboral cotizada a la SS">
          <div className={styles.cotizadosRow}>
            <div className={styles.cotizadosUnit}>
              <input
                id="cotizados-years"
                type="number"
                className={styles.input}
                value={Math.floor(inputs.diasCotizados / 365.25)}
                min={0}
                max={45}
                onChange={(e) => {
                  const years = Math.max(0, Number(e.target.value));
                  const months = Math.floor((inputs.diasCotizados % 365.25) / 30.44);
                  setInput("diasCotizados", Math.round(years * 365.25 + months * 30.44));
                }}
              />
              <span className={styles.cotizadosLabel}>años</span>
            </div>
            <div className={styles.cotizadosUnit}>
              <input
                id="cotizados-months"
                type="number"
                className={styles.input}
                value={Math.floor((inputs.diasCotizados % 365.25) / 30.44)}
                min={0}
                max={11}
                onChange={(e) => {
                  const years = Math.floor(inputs.diasCotizados / 365.25);
                  const months = Math.min(11, Math.max(0, Number(e.target.value)));
                  setInput("diasCotizados", Math.round(years * 365.25 + months * 30.44));
                }}
              />
              <span className={styles.cotizadosLabel}>meses</span>
            </div>
          </div>
        </Field>

        <Field id="annualSalaryGross" label="Salario bruto anual (€)">
          <input
            id="annualSalaryGross"
            type="number"
            className={styles.input}
            value={inputs.annualSalaryGross}
            min={0}
            step={1000}
            onChange={handleInput("annualSalaryGross")}
          />
        </Field>
      </section>

      {/* ── Ahorro e inversión ───────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Ahorro e inversión</h2>

        <Field id="currentPortfolio" label="Portfolio actual en fondos (€)">
          <input
            id="currentPortfolio"
            type="number"
            className={styles.input}
            value={inputs.currentPortfolio}
            min={0}
            step={1000}
            onChange={handleInput("currentPortfolio")}
          />
        </Field>

        <Field id="monthlyContrib" label="Aportación mensual (€)" extra={<ImpactIndicator />}>
          <input
            id="monthlyContrib"
            type="number"
            className={styles.input}
            value={inputs.monthlyContrib}
            min={0}
            step={100}
            onChange={handleInput("monthlyContrib")}
          />
        </Field>

        <Field
          id="monthlyExpenses"
          label="Gastos mensuales en FIRE (€)"
          hint="¿Cuánto necesitas al mes cuando dejes de trabajar?"
        >
          <input
            id="monthlyExpenses"
            type="number"
            className={styles.input}
            value={inputs.monthlyExpenses}
            min={0}
            step={100}
            onChange={handleInput("monthlyExpenses")}
          />
        </Field>
      </section>

      {/* ── Parámetros ───────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Parámetros</h2>

        <SliderField
          id="annualReturnRate"
          label="Rentabilidad anual esperada"
          hint="Fondos indexados globales, histórico ~7–10%"
          value={inputs.annualReturnRate}
          min={0.03}
          max={0.12}
          step={0.005}
          format={(v) => `${(v * 100).toFixed(1)}%`}
          onChange={(v) => setInput("annualReturnRate", v)}
        />

        <SliderField
          id="inflationRate"
          label="Inflación estimada"
          value={inputs.inflationRate}
          min={0.01}
          max={0.05}
          step={0.005}
          format={(v) => `${(v * 100).toFixed(1)}%`}
          onChange={(v) => setInput("inflationRate", v)}
        />
      </section>

      <button className={styles.resetBtn} onClick={resetInputs} type="button">
        Restablecer valores por defecto
      </button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useFireStore } from "../store/useFireStore";
import { ImpactIndicator } from "./ImpactIndicator";
import styles from "./InputPanel.module.css";

// ── NumberInput ───────────────────────────────────────────
// Holds local string state so clearing the field doesn't force 0.
// Only commits to the store when a valid non-empty number is typed.
// Restores the last valid store value on blur if the field is empty.

interface NumberInputProps {
  id: string;
  className?: string | undefined;
  value: number;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  onChange: (v: number) => void;
}

function NumberInput({ id, className, value, min, max, step, onChange }: NumberInputProps) {
  const [local, setLocal] = useState(String(value));

  // Sync from store (e.g. reset button)
  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  return (
    <input
      id={id}
      type="number"
      className={className}
      value={local}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const raw = e.target.value;
        setLocal(raw);
        const num = Number(raw);
        if (raw !== "" && !Number.isNaN(num) && num >= 0) {
          onChange(num);
        }
      }}
      onBlur={() => {
        const num = Number(local);
        if (local === "" || Number.isNaN(num)) {
          setLocal(String(value)); // restore last valid value
        }
      }}
    />
  );
}

// ── Field ─────────────────────────────────────────────────

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

// ── SliderField ───────────────────────────────────────────

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

// ── InputPanel ────────────────────────────────────────────

export function InputPanel() {
  const { inputs, setInput, resetInputs } = useFireStore();

  const cotizadosYears = Math.floor(inputs.diasCotizados / 365.25);
  const cotizadosMonths = Math.floor((inputs.diasCotizados % 365.25) / 30.44);

  return (
    <div className={styles.panel}>
      {/* ── Situación personal ───────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Situación personal</h2>

        <Field id="currentAge" label="Edad actual">
          <NumberInput
            id="currentAge"
            className={styles.input}
            value={inputs.currentAge}
            min={20}
            max={64}
            onChange={(v) => setInput("currentAge", v)}
          />
        </Field>

        <Field id="cotizados-years" label="Vida laboral cotizada a la SS">
          <div className={styles.cotizadosRow}>
            <div className={styles.cotizadosUnit}>
              <NumberInput
                id="cotizados-years"
                className={styles.input}
                value={cotizadosYears}
                min={0}
                max={45}
                onChange={(years) => {
                  setInput("diasCotizados", Math.round(years * 365.25 + cotizadosMonths * 30.44));
                }}
              />
              <span className={styles.cotizadosLabel}>años</span>
            </div>
            <div className={styles.cotizadosUnit}>
              <NumberInput
                id="cotizados-months"
                className={styles.input}
                value={cotizadosMonths}
                min={0}
                max={11}
                onChange={(months) => {
                  setInput(
                    "diasCotizados",
                    Math.round(cotizadosYears * 365.25 + Math.min(11, months) * 30.44)
                  );
                }}
              />
              <span className={styles.cotizadosLabel}>meses</span>
            </div>
          </div>
        </Field>

        <Field id="annualSalaryGross" label="Salario bruto anual (€)">
          <NumberInput
            id="annualSalaryGross"
            className={styles.input}
            value={inputs.annualSalaryGross}
            min={0}
            step={1000}
            onChange={(v) => setInput("annualSalaryGross", v)}
          />
        </Field>
      </section>

      {/* ── Ahorro e inversión ───────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Ahorro e inversión</h2>

        <Field id="currentPortfolio" label="Portfolio actual en fondos (€)">
          <NumberInput
            id="currentPortfolio"
            className={styles.input}
            value={inputs.currentPortfolio}
            min={0}
            step={1000}
            onChange={(v) => setInput("currentPortfolio", v)}
          />
        </Field>

        <Field id="monthlyContrib" label="Aportación mensual (€)" extra={<ImpactIndicator />}>
          <NumberInput
            id="monthlyContrib"
            className={styles.input}
            value={inputs.monthlyContrib}
            min={0}
            step={100}
            onChange={(v) => setInput("monthlyContrib", v)}
          />
        </Field>

        <Field
          id="monthlyExpenses"
          label="Gastos mensuales en FIRE (€)"
          hint="¿Cuánto necesitas al mes cuando dejes de trabajar?"
        >
          <NumberInput
            id="monthlyExpenses"
            className={styles.input}
            value={inputs.monthlyExpenses}
            min={0}
            step={100}
            onChange={(v) => setInput("monthlyExpenses", v)}
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

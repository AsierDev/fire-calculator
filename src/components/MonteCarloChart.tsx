import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { runMonteCarlo } from "../engine/montecarlo";
import { useFireStore } from "../store/useFireStore";
import styles from "./MonteCarloChart.module.css";

const EUR_K = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

function formatEurK(v: number): string {
  if (v >= 1_000_000) return `${EUR_K.format(v / 1_000_000)}M€`;
  if (v >= 1_000) return `${EUR_K.format(v / 1_000)}k€`;
  return `${EUR_K.format(v)}€`;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const p10 = payload.find((p) => p.name === "p10");
  const p50 = payload.find((p) => p.name === "p50");
  const p90Entry = payload.find((p) => p.name === "range");
  const p90Val = p10 && p90Entry ? p10.value + p90Entry.value : null;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipAge}>{label} años</div>
      {p90Val !== null && (
        <div className={styles.tooltipRow}>
          <span>P90:</span>
          <strong>{formatEurK(p90Val)}</strong>
        </div>
      )}
      {p50 && (
        <div className={styles.tooltipRow}>
          <span>Mediana:</span>
          <strong>{formatEurK(p50.value)}</strong>
        </div>
      )}
      {p10 && (
        <div className={styles.tooltipRow}>
          <span>P10:</span>
          <strong>{formatEurK(p10.value)}</strong>
        </div>
      )}
    </div>
  );
}

const RUNS = 800;

export function MonteCarloChart() {
  const { results, customResult, selectedScenarioKey, inputs } = useFireStore();
  const [enabled, setEnabled] = useState(false);

  const scenario = useMemo(() => {
    const all = customResult ? [...results, customResult] : results;
    return (
      (selectedScenarioKey ? all.find((r) => r.key === selectedScenarioKey) : null) ??
      results.find((r) => r.viable) ??
      results[0]
    );
  }, [results, customResult, selectedScenarioKey]);

  const data = useMemo(() => {
    if (!enabled || !scenario) return [];
    return runMonteCarlo(inputs, scenario, RUNS);
  }, [enabled, inputs, scenario]);

  if (!scenario) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.title}>Simulación Monte Carlo</div>
          <div className={styles.subtitle}>
            {enabled
              ? `${RUNS} escenarios aleatorios · bandas P10–P90 · σ=17% anual`
              : "Distribución de rentabilidades históricas (σ=17%)"}
          </div>
        </div>
        <button
          type="button"
          className={`${styles.runBtn} ${enabled ? styles.runBtnActive : ""}`}
          onClick={() => setEnabled((v) => !v)}
        >
          {enabled ? "Ocultar" : "Ejecutar simulación"}
        </button>
      </div>

      {enabled && data.length > 0 && (
        <div className={styles.explainer}>
          <p>
            Se simularon <strong>{RUNS} futuros posibles</strong> variando aleatoriamente la
            rentabilidad cada año (media {(inputs.annualReturnRate * 100).toFixed(1)}%, desviación
            típica histórica ±17%). El resultado muestra tres líneas:
          </p>
          <ul>
            <li>
              <strong>Mediana (línea azul)</strong> — el resultado del 50% central: la mitad de los
              escenarios acaban mejor y la mitad peor.
            </li>
            <li>
              <strong>P10 — pesimista (línea roja)</strong> — solo el 10% de los futuros simulados
              son peores que esto. Representa un escenario de mala suerte sostenida.
            </li>
            <li>
              <strong>Banda azul (P10–P90)</strong> — el rango donde cae el 80% de los escenarios.
              Cuanto más estrecha, más predecible es el resultado.
            </li>
          </ul>
          <p>
            Si incluso en el escenario pesimista (P10) el portfolio no llega a cero, el plan es
            robusto ante la volatilidad del mercado.
          </p>
        </div>
      )}

      {enabled && data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              label={{
                value: "Edad",
                position: "insideRight",
                offset: -4,
                fontSize: 11,
                fill: "var(--text-muted)",
              }}
            />
            <YAxis
              tickFormatter={formatEurK}
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "0.75rem", paddingTop: 8 }}
              formatter={(value) => {
                if (value === "p10") return "Percentil 10 (pesimista)";
                if (value === "p50") return "Mediana";
                if (value === "range") return "Banda P10–P90";
                return value;
              }}
            />
            <ReferenceLine
              x={scenario.stopWorkAge}
              stroke="var(--text-muted)"
              strokeDasharray="4 2"
              label={{
                value: `Baja ${scenario.stopWorkAge}`,
                fontSize: 10,
                fill: "var(--text-muted)",
                position: "top",
              }}
            />
            <ReferenceLine
              x={scenario.pensionAge}
              stroke="var(--success)"
              strokeDasharray="4 2"
              label={{
                value: `Pensión ${scenario.pensionAge}`,
                fontSize: 10,
                fill: "var(--success)",
                position: "top",
              }}
            />
            {/* Stacked areas: p10 transparent base, then range on top */}
            <Area
              type="monotone"
              dataKey="p10"
              stackId="mc"
              fill="transparent"
              stroke="none"
              dot={false}
              animationDuration={400}
            />
            <Area
              type="monotone"
              dataKey="range"
              stackId="mc"
              fill="var(--primary)"
              fillOpacity={0.15}
              stroke="none"
              dot={false}
              animationDuration={400}
            />
            <Line
              type="monotone"
              dataKey="p50"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
              animationDuration={400}
            />
            <Line
              type="monotone"
              dataKey="p10"
              stroke="var(--danger)"
              strokeWidth={1}
              strokeDasharray="3 2"
              dot={false}
              animationDuration={400}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {!enabled && (
        <div className={styles.placeholder}>
          <span className={styles.placeholderIcon}>🎲</span>
          <span>
            El futuro es incierto: la bolsa no da siempre un 7%. Esta simulación corre{" "}
            <strong>{RUNS} futuros posibles</strong> con rentabilidades aleatorias y muestra en qué
            rango podría acabar tu portfolio — desde el escenario pesimista hasta el optimista.
          </span>
        </div>
      )}
    </div>
  );
}

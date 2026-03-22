import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScenarioResult } from "../engine/types";
import { useFireStore } from "../store/useFireStore";
import styles from "./PortfolioChart.module.css";

const EUR_K = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

const COLORS: Record<string, string> = {
  F55_67: "#2563eb",
  F55_CONV_65: "#7c3aed",
  F58_65: "#16a34a",
  F60_65: "#d97706",
  CUSTOM: "#e11d48",
};

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
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipAge}>{label} años</div>
      {payload.map((p) => (
        <div key={p.name} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: p.color }} />
          <span>
            {p.name}: <strong>{formatEurK(p.value)}</strong>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Merge all scenario timelines into a single array keyed by age */
function buildChartData(
  results: ScenarioResult[],
  customResult: ScenarioResult | null,
  selectedKey: string | null
): Array<Record<string, number>> {
  const all = customResult
    ? [...results, { ...customResult, key: "CUSTOM", name: customResult.name }]
    : results;

  // Use selected scenario's timeline range if one is selected, else show all
  const primary = selectedKey ? (all.find((r) => r.key === selectedKey) ?? all[0]) : all[0];

  if (!primary) return [];

  const ages = primary.timeline.map((s) => s.age);
  const dataMap = new Map<number, Record<string, number>>();
  for (const age of ages) {
    dataMap.set(age, { age });
  }

  for (const scenario of all) {
    for (const snap of scenario.timeline) {
      const row = dataMap.get(snap.age);
      if (row) {
        row[scenario.name] = snap.portfolioStart;
      }
    }
  }

  return Array.from(dataMap.values());
}

export function PortfolioChart() {
  const { results, customResult, selectedScenarioKey, inputs } = useFireStore();

  const isDuplicateOfPredefined =
    customResult !== null &&
    results.some(
      (r) =>
        r.stopWorkAge === customResult.stopWorkAge &&
        r.pensionAge === customResult.pensionAge &&
        r.useConvenio === customResult.useConvenio
    );
  const effectiveCustom = isDuplicateOfPredefined ? null : customResult;
  const data = buildChartData(results, effectiveCustom, selectedScenarioKey);
  const allScenarios = effectiveCustom
    ? [...results, { ...effectiveCustom, key: "CUSTOM" }]
    : results;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.title}>Evolución del portfolio</div>
        <div className={styles.subtitle}>
          Acumulación → bridge → pensión · en euros de hoy · rentabilidad{" "}
          {(inputs.annualReturnRate * 100).toFixed(1)}%
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
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
          <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: 8 }} />
          <ReferenceLine
            x={67}
            stroke="var(--text-muted)"
            strokeDasharray="4 2"
            label={{ value: "67", fontSize: 10, fill: "var(--text-muted)", position: "top" }}
          />
          {allScenarios.map((r) => {
            const color = COLORS[r.key] ?? COLORS.CUSTOM ?? "#888";
            const isSelected = !selectedScenarioKey || selectedScenarioKey === r.key;
            return (
              <Line
                key={r.key}
                type="monotone"
                dataKey={r.name}
                stroke={color}
                strokeWidth={isSelected ? 2.5 : 1}
                dot={false}
                opacity={isSelected ? 1 : 0.3}
                animationDuration={300}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

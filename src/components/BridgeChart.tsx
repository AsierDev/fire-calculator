import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScenarioResult, YearSnapshot } from "../engine/types";
import { useFireStore } from "../store/useFireStore";
import styles from "./BridgeChart.module.css";

const EUR_K = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

function formatEurK(v: number): string {
  if (v >= 1_000_000) return `${EUR_K.format(v / 1_000_000)}M€`;
  if (v >= 1_000) return `${EUR_K.format(v / 1_000)}k€`;
  return `${EUR_K.format(v)}€`;
}

const PHASE_COLORS = {
  accumulation: "#2563eb",
  bridge: "#f59e0b",
  pension: "#16a34a",
} as const;

const PHASE_LABELS = {
  accumulation: "Acumulación",
  bridge: "Bridge (sin ingresos)",
  pension: "Pensión activa",
} as const;

interface ChartPoint {
  age: number;
  portfolio: number;
  accumulation: number | null;
  bridge: number | null;
  pension: number | null;
  pensionIncome: number;
  withdrawals: number;
  phase: string;
}

function buildChartData(timeline: YearSnapshot[]): ChartPoint[] {
  return timeline.map((s) => ({
    age: s.age,
    portfolio: s.portfolioStart,
    accumulation: s.phase === "accumulation" ? s.portfolioStart : null,
    bridge: s.phase === "bridge" ? s.portfolioStart : null,
    pension: s.phase === "pension" ? s.portfolioStart : null,
    pensionIncome: s.pensionIncome / 12, // monthly
    withdrawals: s.withdrawals / 12, // monthly
    phase: s.phase,
  }));
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: ChartPoint }>;
  label?: number;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  const phaseLabel = PHASE_LABELS[point.phase as keyof typeof PHASE_LABELS] ?? point.phase;
  const phaseColor = PHASE_COLORS[point.phase as keyof typeof PHASE_COLORS] ?? "#888";

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipAge}>{label} años</div>
      <span
        className={styles.tooltipPhase}
        style={{ background: `${phaseColor}22`, color: phaseColor }}
      >
        {phaseLabel}
      </span>
      <div className={styles.tooltipRow}>
        Portfolio: <strong>{formatEurK(point.portfolio)}</strong>
      </div>
      {point.pensionIncome > 0 && (
        <div className={styles.tooltipRow}>
          Pensión: <strong>{formatEurK(point.pensionIncome)}/mes</strong>
        </div>
      )}
      {point.withdrawals > 0 && (
        <div className={styles.tooltipRow}>
          Retirada: <strong>{formatEurK(point.withdrawals)}/mes</strong>
        </div>
      )}
    </div>
  );
}

function getSelectedScenario(
  results: ScenarioResult[],
  customResult: ScenarioResult | null,
  selectedKey: string | null
): ScenarioResult | null {
  if (!selectedKey) return results.find((r) => r.viable) ?? results[0] ?? null;
  if (customResult && (selectedKey === customResult.key || selectedKey.startsWith("CUSTOM"))) {
    return customResult;
  }
  return results.find((r) => r.key === selectedKey) ?? null;
}

export function BridgeChart() {
  const { results, customResult, selectedScenarioKey } = useFireStore();
  const scenario = getSelectedScenario(results, customResult, selectedScenarioKey);

  if (!scenario) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.empty}>Selecciona un escenario en la tabla para ver el detalle</div>
      </div>
    );
  }

  const data = buildChartData(scenario.timeline);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.title}>Simulación completa — {scenario.name}</div>
        <div className={styles.subtitle}>
          De {scenario.timeline[0]?.age ?? "?"} a 89 años · azul = ahorro, naranja = vivir del
          portfolio sin pensión, verde = pensión activa
        </div>
        <div className={styles.legend}>
          {Object.entries(PHASE_LABELS).map(([key, label]) => (
            <div key={key} className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: PHASE_COLORS[key as keyof typeof PHASE_COLORS] }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="age" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
          <YAxis
            tickFormatter={formatEurK}
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Reference lines at key ages */}
          <ReferenceLine
            x={scenario.stopWorkAge}
            stroke={PHASE_COLORS.bridge}
            strokeDasharray="4 2"
            label={{
              value: `Baja ${scenario.stopWorkAge}`,
              fontSize: 10,
              fill: PHASE_COLORS.bridge,
              position: "top",
            }}
          />
          <ReferenceLine
            x={scenario.pensionAge}
            stroke={PHASE_COLORS.pension}
            strokeDasharray="4 2"
            label={{
              value: `Pensión ${scenario.pensionAge}`,
              fontSize: 10,
              fill: PHASE_COLORS.pension,
              position: "top",
            }}
          />

          {/* Phase areas */}
          <Area
            type="monotone"
            dataKey="accumulation"
            fill={`${PHASE_COLORS.accumulation}22`}
            stroke={PHASE_COLORS.accumulation}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            animationDuration={400}
          />
          <Area
            type="monotone"
            dataKey="bridge"
            fill={`${PHASE_COLORS.bridge}22`}
            stroke={PHASE_COLORS.bridge}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            animationDuration={400}
          />
          <Area
            type="monotone"
            dataKey="pension"
            fill={`${PHASE_COLORS.pension}22`}
            stroke={PHASE_COLORS.pension}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            animationDuration={400}
          />

          {/* Zero line for viability reference */}
          <Line
            type="monotone"
            dataKey="portfolio"
            stroke="transparent"
            dot={false}
            legendType="none"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

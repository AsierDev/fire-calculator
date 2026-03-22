import type { ScenarioResult } from "../engine/types";
import { useFireStore } from "../store/useFireStore";
import { HelpTooltip } from "./HelpTooltip";
import styles from "./ResultsTable.module.css";

const EUR = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function exportToCsv(results: ScenarioResult[], customResult: ScenarioResult | null) {
  const all = customResult ? [...results, customResult] : results;
  const headers = [
    "Escenario",
    "Baja",
    "Pensión desde",
    "Años puente",
    "Convenio (meses)",
    "Coste Convenio (€)",
    "Pensión bruta (€/mes)",
    "Capital al parar (€)",
    "Capital al cobrar pensión (€)",
    "Viable",
  ];
  const rows = all.map((r) => [
    r.name,
    r.stopWorkAge,
    r.pensionAge,
    r.bridgeYears,
    r.convenioMonths,
    Math.round(r.convenioCostTotal),
    Math.round(r.pensionMonthlyGross),
    Math.round(r.portfolioAtStop),
    Math.round(r.portfolioAtPension),
    r.viable ? "Sí" : "No",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fire-escenarios.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface RowProps {
  result: ScenarioResult;
  isSelected: boolean;
  isCustom?: boolean;
  onSelect: () => void;
}

function ScenarioRow({ result: r, isSelected, isCustom, onSelect }: RowProps) {
  const rowClass = [
    styles.row,
    r.viable ? styles.rowViable : styles.rowNotViable,
    isSelected ? styles.rowSelected : "",
    isCustom ? styles.customRow : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className={rowClass} onClick={onSelect}>
      <td title={r.description}>
        {r.name}
        {isCustom && <span className={styles.customLabel}>CUSTOM</span>}
      </td>
      <td>{r.stopWorkAge} años</td>
      <td>{r.pensionAge} años</td>
      <td>{r.bridgeYears} años</td>
      <td>{r.convenioMonths > 0 ? `${r.convenioMonths} meses` : "—"}</td>
      <td>{EUR.format(r.pensionMonthlyGross)}/mes</td>
      <td>{EUR.format(r.portfolioAtStop)}</td>
      <td>{EUR.format(r.portfolioAtPension)}</td>
      <td>
        <span className={`${styles.badge} ${r.viable ? styles.badgeOk : styles.badgeNo}`}>
          {r.viable ? "✓ Viable" : "✗ Inviable"}
        </span>
      </td>
    </tr>
  );
}

export function ResultsTable() {
  const { results, customResult, selectedScenarioKey, selectScenario } = useFireStore();

  function handleSelect(key: string) {
    selectScenario(selectedScenarioKey === key ? null : key);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.title}>Escenarios FIRE</span>
        <button
          className={styles.exportBtn}
          onClick={() => exportToCsv(results, customResult)}
          type="button"
        >
          Exportar CSV
        </button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Escenario</th>
              <th>Baja</th>
              <th>Pensión</th>
              <th>
                Sin ingresos
                <HelpTooltip text="Años entre que dejas de trabajar y cuando empieza la pensión. Vives del portfolio acumulado." />
              </th>
              <th>
                Convenio
                <HelpTooltip text="Meses cotizando voluntariamente a la SS tras dejar de trabajar, para mejorar la pensión." />
              </th>
              <th>Pensión bruta</th>
              <th>
                Capital al parar
                <HelpTooltip text="Lo que tendrás ahorrado cuando dejes de trabajar, según tu ritmo actual." />
              </th>
              <th>Capital al cobrar pensión</th>
              <th>
                Estado
                <HelpTooltip text="Viable = el portfolio no se agota antes de los 90 años. Inviable = el dinero se acaba durante el período sin ingresos." />
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <ScenarioRow
                key={r.key}
                result={r}
                isSelected={selectedScenarioKey === r.key}
                onSelect={() => handleSelect(r.key)}
              />
            ))}
            {customResult && (
              <ScenarioRow
                key={customResult.key}
                result={customResult}
                isSelected={selectedScenarioKey === customResult.key}
                isCustom
                onSelect={() => handleSelect(customResult.key)}
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

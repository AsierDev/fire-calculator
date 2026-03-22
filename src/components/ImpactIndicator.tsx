import { useFireStore } from "../store/useFireStore";
import styles from "./ImpactIndicator.module.css";

export function ImpactIndicator() {
  const impactDeltaMonths = useFireStore((s) => s.impactDeltaMonths);

  if (impactDeltaMonths === null || impactDeltaMonths === 0) return null;

  const positive = impactDeltaMonths > 0;
  const abs = Math.abs(impactDeltaMonths);
  const years = Math.floor(abs / 12);
  const months = abs % 12;

  const label = [years > 0 ? `${years}a` : null, months > 0 ? `${months}m` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={`${styles.badge} ${positive ? styles.positive : styles.negative}`}>
      {positive ? `▲ −${label}` : `▼ +${label}`}
    </span>
  );
}

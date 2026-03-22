import styles from "./HelpTooltip.module.css";

interface HelpTooltipProps {
  text: string;
}

export function HelpTooltip({ text }: HelpTooltipProps) {
  return (
    <span className={styles.wrapper}>
      <span className={styles.icon} aria-label="Ayuda" role="img">
        ?
      </span>
      <span className={styles.popover} role="tooltip">
        {text}
      </span>
    </span>
  );
}

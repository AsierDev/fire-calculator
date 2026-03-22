import { useFireStore } from "../store/useFireStore";
import styles from "./Layout.module.css";

interface LayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function Layout({ sidebar, children }: LayoutProps) {
  const { theme, toggleTheme } = useFireStore();

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleAccent}>FIRE</span> España
        </h1>
        <div className={styles.headerRight}>
          <button className={styles.themeBtn} onClick={toggleTheme} type="button">
            {theme === "light" ? "🌙 Oscuro" : "☀️ Claro"}
          </button>
        </div>
      </header>
      <div className={styles.body}>
        <aside className={styles.sidebar}>{sidebar}</aside>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

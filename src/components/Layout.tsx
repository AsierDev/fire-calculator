import { useState } from "react";
import { useFireStore } from "../store/useFireStore";
import styles from "./Layout.module.css";

interface LayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function Layout({ sidebar, children }: LayoutProps) {
  const { theme, toggleTheme } = useFireStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen((o) => !o)}
            type="button"
            aria-expanded={sidebarOpen}
            aria-label="Parámetros"
          >
            {sidebarOpen ? "✕" : "☰"} Parámetros
          </button>
          <h1 className={styles.title}>
            <span className={styles.titleAccent}>FIRE</span> España
          </h1>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.themeBtn} onClick={toggleTheme} type="button">
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>
      <div className={styles.body}>
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
          {sidebar}
        </aside>
        <main
          className={styles.main}
          onClick={() => sidebarOpen && setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

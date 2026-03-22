# Calculadora FIRE España

Herramienta para planificar la independencia financiera y jubilación anticipada (**FIRE — Financial Independence, Retire Early**) adaptada al sistema de Seguridad Social español.

Permite simular distintos escenarios de jubilación anticipada, calcular la pensión estimada según la legislación vigente, y determinar cuánto capital necesitas acumular para que tu plan sea viable.

**Demo:** [asierdev.github.io/fire-calculator](https://asierdev.github.io/fire-calculator/)

---

## Qué hace

### Motor de cálculo

- **Pensión SS estimada** — Calcula la base reguladora (media salarial de los últimos 25 años), aplica el porcentaje según años cotizados y penalización por anticipación conforme al art. 208 LGSS y la reforma 2023.
- **Simulación del período bridge** — Modela el tramo entre que dejas de trabajar y cuando empiezas a cobrar la pensión. El portfolio cubre los gastos con rentabilidad after-tax (descuenta ~21% IRPF sobre plusvalías).
- **Convenio Especial SS** — Cotización voluntaria tras dejar de trabajar para completar años y mejorar la pensión. Calcula coste mensual y total.
- **Capital mínimo necesario** — Búsqueda binaria sobre la simulación de bridge para encontrar el portfolio mínimo al dejar de trabajar que garantiza viabilidad hasta los 90 años.
- **Monte Carlo** — 800 simulaciones con variabilidad histórica de mercado (σ=17%) para obtener bandas de percentil P10/P50/P90.

### Escenarios predefinidos

| Escenario | Baja | Pensión | Convenio |
|-----------|------|---------|----------|
| Baja 55 → Pensión 67 | 55 años | 67 años | No |
| Baja 55 + Convenio → Pensión 65 | 55 años | 65 años | Sí |
| Baja 58 → Pensión 65 | 58 años | 65 años | No |
| Baja 60 → Pensión 65 | 60 años | 65 años | No |

Además de un **escenario personalizado** donde puedes ajustar libremente la edad de baja y la edad de pensión.

### Métricas por escenario

- Capital proyectado al dejar de trabajar vs. capital mínimo necesario → **margen en €**
- Años de bridge (período sin ingresos)
- Pensión bruta estimada mensual
- Evolución del portfolio año a año
- Viabilidad: ¿llega el dinero hasta los 90 años?

---

## Stack técnico

| | |
|--|--|
| **Frontend** | React 19 |
| **Lenguaje** | TypeScript 5.7 (strict mode) |
| **Build** | Vite 7 |
| **Estado** | Zustand 5 |
| **Gráficos** | Recharts 3 |
| **Linting/formato** | Biome 2 |
| **Tests** | Vitest 4 |
| **Deploy** | GitHub Pages via GitHub Actions |

### Estructura del proyecto

```
src/
├── engine/               # Lógica de negocio pura (sin React)
│   ├── types.ts          # Interfaces: UserInputs, ScenarioResult, YearSnapshot…
│   ├── constants.ts      # Constantes SS 2026, valores por defecto
│   ├── pension.ts        # Base reguladora, años cotizados, pensión mensual
│   ├── bridge.ts         # Simulación año a año del período bridge
│   ├── convenio.ts       # Cálculo del Convenio Especial SS
│   ├── scenarios.ts      # Orquestador: calcScenario, calcAllScenarios, minPortfolioAtStop
│   ├── montecarlo.ts     # Simulación Monte Carlo con distribución normal Box-Muller
│   └── portfolio.ts      # Proyección de portfolio durante acumulación
├── store/
│   └── useFireStore.ts   # Estado global Zustand (inputs, results, selección, impact delta)
├── components/
│   ├── Layout             # Sidebar + main content
│   ├── InputPanel         # Formulario de parámetros del usuario
│   ├── FireSummaryCard    # Resumen narrativo en lenguaje natural
│   ├── ResultsTable       # Tabla comparativa de escenarios con CSV export
│   ├── BridgeChart        # Gráfico de evolución por fases (acumulación/bridge/pensión)
│   ├── PortfolioChart     # Comparativa de escenarios en el tiempo
│   ├── MonteCarloChart    # Bandas de percentil P10/P50/P90
│   ├── CustomAgeSlider    # Explorador de edad de baja personalizada
│   ├── ConvenioBreakdown  # Detalle del Convenio Especial paso a paso
│   ├── ImpactIndicator    # Delta de edad FIRE al cambiar la aportación mensual
│   └── HelpTooltip        # Popover CSS con explicaciones de términos financieros
└── __tests__/            # Tests unitarios del motor de cálculo
```

---

## Uso local

### Requisitos

- Node.js 20+
- npm

### Instalación

```bash
git clone https://github.com/AsierDev/fire-calculator.git
cd fire-calculator
npm install
```

### Comandos

```bash
npm run dev          # Servidor de desarrollo en http://localhost:3000
npm run build        # Build de producción en dist/
npm run preview      # Preview del build de producción
npm run typecheck    # Comprobación de tipos TypeScript
npm run lint         # Biome lint
npm run lint:fix     # Biome lint con auto-fix
npm run format       # Biome format
npm run test         # Tests unitarios (vitest)
npm run test:watch   # Tests en modo watch
```

### Personalización de datos

Los valores por defecto son neutros (demo pública). Para usar tus datos reales sin que aparezcan en el repositorio:

1. Crea un archivo `mis-datos.ts` en la raíz (ya está en `.gitignore`).
2. Copia tus valores en `src/engine/constants.ts` → `DEFAULT_INPUTS`.

---

## Despliegue

El proyecto se despliega automáticamente en **GitHub Pages** en cada push a `main` mediante el workflow `.github/workflows/deploy.yml`.

Para desplegar en tu propio fork:

1. Cambia el campo `base` en `vite.config.ts` al nombre de tu repositorio:
   ```ts
   base: "/nombre-de-tu-repo/",
   ```
2. En el repositorio: **Settings → Pages → Source: GitHub Actions**
3. Haz push — el workflow se encarga del resto.

---

## Advertencia legal

Los cálculos son estimaciones basadas en la legislación de la Seguridad Social española vigente en 2026 y pueden variar. No constituyen asesoramiento financiero. Consulta con un profesional antes de tomar decisiones de inversión o jubilación.

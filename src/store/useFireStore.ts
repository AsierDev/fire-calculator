import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_INPUTS } from "../engine/constants";
import { calcAllScenarios, calcCustomScenario } from "../engine/scenarios";
import type { ScenarioResult, UserInputs } from "../engine/types";

interface FireState {
  inputs: UserInputs;
  results: ScenarioResult[];
  customResult: ScenarioResult | null;
  customStopAge: number;
  customPensionAge: number;
  customUseConvenio: boolean;
  selectedScenarioKey: string | null;
  theme: "light" | "dark";
  /** Delta in months vs previous monthlyContrib: positive = earlier FIRE */
  impactDeltaMonths: number | null;

  setInput: <K extends keyof UserInputs>(key: K, value: UserInputs[K]) => void;
  setCustomStopAge: (age: number) => void;
  setCustomPensionAge: (age: number) => void;
  setCustomUseConvenio: (value: boolean) => void;
  selectScenario: (key: string | null) => void;
  toggleTheme: () => void;
  resetInputs: () => void;
}

function recalcAll(
  inputs: UserInputs,
  customStopAge: number,
  customPensionAge: number,
  customUseConvenio: boolean
) {
  const results = calcAllScenarios(inputs);
  const customResult = calcCustomScenario(
    inputs,
    customStopAge,
    customPensionAge,
    customUseConvenio
  );
  return { results, customResult };
}

/** Find the earliest stop age (45-66) where a scenario with pension at 65 is viable */
function findEarliestViableAge(inputs: UserInputs): number | null {
  for (let stopAge = 45; stopAge <= 66; stopAge++) {
    if (calcCustomScenario(inputs, stopAge, 65, false).viable) return stopAge;
  }
  return null;
}

export const useFireStore = create<FireState>()(
  persist(
    (set, get) => ({
      inputs: DEFAULT_INPUTS,
      results: calcAllScenarios(DEFAULT_INPUTS),
      customResult: calcCustomScenario(DEFAULT_INPUTS, 56, 65, false),
      customStopAge: 56,
      customPensionAge: 65,
      customUseConvenio: false,
      selectedScenarioKey: null,
      theme: "light",
      impactDeltaMonths: null,

      setInput: (key, value) => {
        const state = get();
        const newInputs = { ...state.inputs, [key]: value };
        const { customStopAge, customPensionAge, customUseConvenio } = state;
        const { results, customResult } = recalcAll(
          newInputs,
          customStopAge,
          customPensionAge,
          customUseConvenio
        );
        let impactDeltaMonths: number | null = null;
        if (key === "monthlyContrib") {
          const oldAge = findEarliestViableAge(state.inputs);
          const newAge = findEarliestViableAge(newInputs);
          if (oldAge !== null && newAge !== null) {
            impactDeltaMonths = (oldAge - newAge) * 12;
          }
        }
        set({ inputs: newInputs, results, customResult, impactDeltaMonths });
      },

      setCustomStopAge: (age) => {
        const { inputs, customPensionAge, customUseConvenio } = get();
        const { results, customResult } = recalcAll(
          inputs,
          age,
          customPensionAge,
          customUseConvenio
        );
        set({ customStopAge: age, results, customResult });
      },

      setCustomPensionAge: (age) => {
        const { inputs, customStopAge, customUseConvenio } = get();
        const { results, customResult } = recalcAll(inputs, customStopAge, age, customUseConvenio);
        set({ customPensionAge: age, results, customResult });
      },

      setCustomUseConvenio: (value) => {
        const { inputs, customStopAge, customPensionAge } = get();
        const { results, customResult } = recalcAll(inputs, customStopAge, customPensionAge, value);
        set({ customUseConvenio: value, results, customResult });
      },

      selectScenario: (key) => set({ selectedScenarioKey: key }),

      toggleTheme: () => {
        const next = get().theme === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        set({ theme: next });
      },

      resetInputs: () => {
        const { customStopAge, customPensionAge, customUseConvenio } = get();
        const { results, customResult } = recalcAll(
          DEFAULT_INPUTS,
          customStopAge,
          customPensionAge,
          customUseConvenio
        );
        set({ inputs: DEFAULT_INPUTS, results, customResult });
      },
    }),
    {
      name: "fire-calculator-storage",
      partialize: (state) => ({
        inputs: state.inputs,
        customStopAge: state.customStopAge,
        customPensionAge: state.customPensionAge,
        customUseConvenio: state.customUseConvenio,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Apply theme to DOM on load
        document.documentElement.setAttribute("data-theme", state.theme);
        // Recalculate results after rehydration (not persisted)
        const { results, customResult } = recalcAll(
          state.inputs,
          state.customStopAge,
          state.customPensionAge,
          state.customUseConvenio
        );
        state.results = results;
        state.customResult = customResult;
      },
    }
  )
);

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { type AppSettings, DEFAULT_SETTINGS } from "@/types/settings";

interface SettingsState {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  updateReaderSettings: (partial: Partial<AppSettings["reader"]>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      updateReaderSettings: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, ...partial },
          },
        })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "karizzma-settings",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

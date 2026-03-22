import { useSettingsStore } from "@/stores/settings-store";
import { DEFAULT_SETTINGS } from "@/types/settings";
import { cn } from "@/lib/utils";
import {
  Palette,
  BookOpen,
  Wifi,
  HardDrive,
  Bell,
  Database,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";

type SettingsSection =
  | "appearance"
  | "reader"
  | "network"
  | "storage"
  | "notifications"
  | "backup"
  | "advanced";

const sections: { id: SettingsSection; label: string; icon: typeof Palette }[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "reader", label: "Reader", icon: BookOpen },
  { id: "network", label: "Network", icon: Wifi },
  { id: "storage", label: "Storage", icon: HardDrive },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "backup", label: "Backup & Restore", icon: Database },
  { id: "advanced", label: "Advanced", icon: RotateCcw },
];

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");
  const { settings, updateSettings, updateReaderSettings, resetSettings } =
    useSettingsStore();

  return (
    <div className="flex h-full overflow-hidden">
      {/* Settings sidebar */}
      <div className="w-52 border-r border-border p-3 space-y-1 shrink-0">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm transition-colors",
              activeSection === section.id
                ? "bg-bg-hover text-brand font-medium"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            )}
          >
            <section.icon size={16} />
            {section.label}
          </button>
        ))}
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto p-6 min-w-0">
        {activeSection === "appearance" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Appearance</h2>

            {/* Theme */}
            <SettingGroup label="Theme">
              <div className="flex gap-3">
                {(["dark", "light", "amoled"] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => updateSettings({ theme })}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm capitalize border transition-colors",
                      settings.theme === theme
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border bg-bg-secondary text-text-secondary hover:border-border-hover"
                    )}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </SettingGroup>

            {/* Accent color */}
            <SettingGroup label="Accent Color">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => updateSettings({ accentColor: e.target.value })}
                  className="w-10 h-10 rounded-md cursor-pointer border border-border bg-transparent"
                />
                <span className="text-sm text-text-secondary">
                  {settings.accentColor}
                </span>
              </div>
            </SettingGroup>

            {/* Reset */}
            <div className="pt-4 border-t border-border">
              <button
                onClick={() => {
                  updateSettings({
                    theme: DEFAULT_SETTINGS.theme,
                    accentColor: DEFAULT_SETTINGS.accentColor,
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border rounded-md text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
              >
                <RotateCcw size={14} />
                Reset Appearance to Defaults
              </button>
            </div>
          </div>
        )}

        {activeSection === "reader" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Reader Defaults</h2>

            <SettingGroup label="Default Manga Mode">
              <select
                value={settings.reader.defaultMangaMode}
                onChange={(e) =>
                  updateReaderSettings({ defaultMangaMode: e.target.value as "rtl" | "ltr" | "vertical" })
                }
                className="settings-select"
              >
                <option value="rtl">Right to Left</option>
                <option value="ltr">Left to Right</option>
                <option value="vertical">Vertical Scroll</option>
              </select>
            </SettingGroup>

            <SettingGroup label="Default Manhwa Mode">
              <select
                value={settings.reader.defaultManhwaMode}
                onChange={(e) =>
                  updateReaderSettings({ defaultManhwaMode: e.target.value as "rtl" | "ltr" | "vertical" })
                }
                className="settings-select"
              >
                <option value="vertical">Vertical Scroll</option>
                <option value="ltr">Left to Right</option>
                <option value="rtl">Right to Left</option>
              </select>
            </SettingGroup>

            <SettingGroup label="Page Transition">
              <select
                value={settings.reader.pageTransition}
                onChange={(e) =>
                  updateReaderSettings({ pageTransition: e.target.value as "instant" | "slide" | "fade" })
                }
                className="settings-select"
              >
                <option value="instant">Instant</option>
                <option value="slide">Slide</option>
                <option value="fade">Fade</option>
              </select>
            </SettingGroup>

            <SettingGroup label="Prefetch Pages Ahead">
              <input
                type="number"
                min={1}
                max={10}
                value={settings.reader.prefetchAhead}
                onChange={(e) =>
                  updateReaderSettings({ prefetchAhead: Number(e.target.value) })
                }
                className="settings-input w-20"
              />
            </SettingGroup>

            <SettingGroup label="Show Page Number">
              <Toggle
                checked={settings.reader.showPageNumber}
                onChange={(v) => updateReaderSettings({ showPageNumber: v })}
              />
            </SettingGroup>

            <SettingGroup label="Crop Whitespace">
              <Toggle
                checked={settings.reader.cropWhitespace}
                onChange={(v) => updateReaderSettings({ cropWhitespace: v })}
              />
            </SettingGroup>
          </div>
        )}

        {activeSection === "network" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Network</h2>

            <SettingGroup label="Concurrent Downloads">
              <input
                type="number"
                min={1}
                max={10}
                value={settings.concurrentDownloads}
                onChange={(e) =>
                  updateSettings({ concurrentDownloads: Number(e.target.value) })
                }
                className="settings-input w-20"
              />
            </SettingGroup>

            <SettingGroup label="FlareSolverr URL" description="Leave empty to use Karizzma's server">
              <input
                type="text"
                placeholder="http://localhost:8191"
                value={settings.flaresolverrUrl}
                onChange={(e) => updateSettings({ flaresolverrUrl: e.target.value })}
                className="settings-input w-full"
              />
            </SettingGroup>

            <SettingGroup label="Proxy URL" description="Optional HTTP/SOCKS5 proxy">
              <input
                type="text"
                placeholder="socks5://127.0.0.1:1080"
                value={settings.proxyUrl}
                onChange={(e) => updateSettings({ proxyUrl: e.target.value })}
                className="settings-input w-full"
              />
            </SettingGroup>
          </div>
        )}

        {activeSection === "storage" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Storage</h2>

            <SettingGroup label="Cache Size Limit (MB)">
              <input
                type="number"
                min={100}
                max={5000}
                step={100}
                value={settings.cacheSizeLimit}
                onChange={(e) =>
                  updateSettings({ cacheSizeLimit: Number(e.target.value) })
                }
                className="settings-input w-28"
              />
            </SettingGroup>

            <SettingGroup label="Library Update Interval (hours)">
              <select
                value={settings.libraryUpdateInterval}
                onChange={(e) =>
                  updateSettings({ libraryUpdateInterval: Number(e.target.value) })
                }
                className="settings-select"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={168}>Weekly</option>
                <option value={0}>Manual only</option>
              </select>
            </SettingGroup>
          </div>
        )}

        {activeSection === "notifications" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <p className="text-sm text-text-muted">
              Notification settings will be available when the Tauri backend is connected.
            </p>
          </div>
        )}

        {activeSection === "backup" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Backup & Restore</h2>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-bg-secondary border border-border rounded-md text-sm hover:bg-bg-hover transition-colors">
                Export Backup
              </button>
              <button className="px-4 py-2 bg-bg-secondary border border-border rounded-md text-sm hover:bg-bg-hover transition-colors">
                Import Backup
              </button>
              <button className="px-4 py-2 bg-bg-secondary border border-border rounded-md text-sm hover:bg-bg-hover transition-colors">
                Import from Tachiyomi
              </button>
            </div>
          </div>
        )}

        {activeSection === "advanced" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Advanced</h2>
            <div className="space-y-3">
              <button className="px-4 py-2 bg-bg-secondary border border-border rounded-md text-sm hover:bg-bg-hover transition-colors">
                Clear Image Cache
              </button>
              <button className="px-4 py-2 bg-bg-secondary border border-border rounded-md text-sm hover:bg-bg-hover transition-colors">
                Clear Reading History
              </button>
              <button
                onClick={resetSettings}
                className="px-4 py-2 bg-red-900/30 border border-red-800 text-red-400 rounded-md text-sm hover:bg-red-900/50 transition-colors"
              >
                Reset All Settings
              </button>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-text-muted">
                Karizzma v0.1.0-dev
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingGroup({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      {description && (
        <p className="text-xs text-text-muted">{description}</p>
      )}
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-10 h-5 rounded-full transition-colors",
        checked ? "bg-brand" : "bg-bg-tertiary"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

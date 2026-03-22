import { Search, Command } from "lucide-react";
import { useState } from "react";

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="flex items-center h-14 px-4 border-b border-border bg-bg-primary shrink-0 gap-4">
      {/* Window drag region (Tauri) */}
      <div className="flex-1" data-tauri-drag-region />

      {/* Search bar */}
      <div className="flex items-center gap-2 bg-bg-secondary border border-border rounded-md px-3 py-1.5 w-80 focus-within:border-brand transition-colors duration-200">
        <Search size={16} className="text-text-muted shrink-0" />
        <input
          type="text"
          placeholder="Search library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none w-full"
        />
        <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded border border-border">
          <Command size={10} />K
        </kbd>
      </div>

      {/* Window drag region (Tauri) */}
      <div className="flex-1" data-tauri-drag-region />
    </header>
  );
}

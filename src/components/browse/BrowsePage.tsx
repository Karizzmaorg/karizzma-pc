import { Puzzle, Plus, Globe } from "lucide-react";

export function BrowsePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Browse</h1>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-border rounded-md text-sm hover:bg-bg-hover transition-colors">
          <Plus size={16} />
          Add Repository
        </button>
      </div>

      {/* Extension repos */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Globe size={18} className="text-text-secondary" />
          <h2 className="text-base font-medium">Extension Repositories</h2>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-8 flex justify-center">
          <div className="text-center w-96">
            <Puzzle size={40} className="mx-auto mb-3 text-text-muted" />
            <h3 className="text-sm font-medium mb-1">No repositories added</h3>
            <p className="text-xs text-text-secondary mb-4">
              Add an extension repository URL to browse and install content sources.
              Extensions allow you to access manga, novels, and comics from various sources.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors">
              <Plus size={16} />
              Add Your First Repository
            </button>
          </div>
        </div>
      </section>

      {/* Installed extensions */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Puzzle size={18} className="text-text-secondary" />
          <h2 className="text-base font-medium">Installed Extensions</h2>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-6 text-center">
          <p className="text-sm text-text-muted">
            No extensions installed. Add a repository to get started.
          </p>
        </div>
      </section>
    </div>
  );
}

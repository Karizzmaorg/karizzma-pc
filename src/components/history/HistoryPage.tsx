import { Clock, Trash2 } from "lucide-react";

export function HistoryPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">History</h1>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:text-brand transition-colors">
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      {/* Empty state */}
      <div className="flex items-center justify-center h-64">
        <div className="text-center w-80">
          <Clock size={40} className="mx-auto mb-3 text-text-muted" />
          <p className="text-sm text-text-secondary">No reading history yet</p>
          <p className="text-xs text-text-muted mt-1">
            Your reading history will appear here as you read manga and novels
          </p>
        </div>
      </div>
    </div>
  );
}

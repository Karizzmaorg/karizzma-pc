import { Download, HardDrive } from "lucide-react";

export function DownloadsPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Downloads</h1>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <HardDrive size={14} />
          <span>0 MB used</span>
        </div>
      </div>

      <div className="flex items-center justify-center h-64">
        <div className="text-center w-80">
          <Download size={40} className="mx-auto mb-3 text-text-muted" />
          <p className="text-sm text-text-secondary">No downloads</p>
          <p className="text-xs text-text-muted mt-1">
            Downloaded chapters will appear here for offline reading
          </p>
        </div>
      </div>
    </div>
  );
}

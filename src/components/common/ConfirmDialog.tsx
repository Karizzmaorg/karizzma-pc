import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  title: string;
  message: string;
  details?: string[];
  footnote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  title,
  message,
  details,
  footnote,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-bg-primary border border-border rounded-lg p-6 w-[420px] max-w-[calc(100vw-2rem)] shadow-xl">
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-1">{message}</p>
        {details && details.length > 0 && (
          <ul className="text-sm text-text-secondary mb-3 max-h-32 overflow-y-auto list-disc pl-5">
            {details.map((item, i) => (
              <li key={i} className="truncate">{item}</li>
            ))}
          </ul>
        )}
        {footnote && (
          <p className="text-xs text-text-muted mb-4">{footnote}</p>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md bg-bg-secondary hover:bg-bg-hover text-text-primary transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
              destructive
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-brand hover:bg-brand-hover text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

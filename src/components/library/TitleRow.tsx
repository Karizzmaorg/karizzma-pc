import { useState, useEffect } from "react";
import type { Title } from "@/types/manga";
import { BookOpen, Trash2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface TitleRowProps {
  title: Title;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
  reorderable?: boolean;
  isDragOver?: boolean;
  onPointerDown?: (e: React.PointerEvent, id: number) => void;
  onPointerEnter?: (id: number) => void;
}

export function TitleRow({ title, onClick, onDelete, selectable, selected, onSelect, reorderable, isDragOver, onPointerDown, onPointerEnter }: TitleRowProps) {
  const [coverSrc, setCoverSrc] = useState<string | null>(title.coverUrl ?? null);

  useEffect(() => {
    if (title.coverLocalPath) {
      invoke<string>("read_image_as_data_url", { path: title.coverLocalPath })
        .then(setCoverSrc)
        .catch(() => setCoverSrc(null));
    }
  }, [title.coverLocalPath]);

  return (
    <button
      onClick={selectable ? () => onSelect?.(title.id) : onClick}
      onPointerDown={reorderable ? (e) => onPointerDown?.(e, title.id) : undefined}
      onPointerEnter={reorderable ? () => onPointerEnter?.(title.id) : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-bg-hover transition-colors text-left w-full group ${selected ? "bg-bg-hover ring-1 ring-brand" : ""} ${isDragOver ? "ring-1 ring-brand bg-bg-hover opacity-60" : ""} ${reorderable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {/* Selection checkbox */}
      {selectable && (
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-brand border-brand" : "border-border bg-bg-secondary"}`}>
          {selected && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </div>
      )}

      {/* Mini cover */}
      <div className="w-10 h-14 rounded bg-bg-secondary overflow-hidden shrink-0">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={14} className="text-text-muted" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-text-primary">
          {title.title}
        </p>
        <p className="text-xs text-text-secondary truncate">
          {title.author ?? "Unknown author"} · {title.contentType} · {title.status}
        </p>
      </div>

      {/* Unread badge */}
      {(title.unreadCount ?? 0) > 0 && (
        <span className="bg-brand text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
          {title.unreadCount}
        </span>
      )}

      {/* Delete button */}
      {onDelete && !reorderable && (
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove from library"
        >
          <Trash2 size={14} />
        </button>
      )}
    </button>
  );
}

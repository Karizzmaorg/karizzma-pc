import { useState, useEffect } from "react";
import type { Title } from "@/types/manga";
import { BookOpen, Trash2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface TitleCardProps {
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

export function TitleCard({ title, onClick, onDelete, selectable, selected, onSelect, reorderable, isDragOver, onPointerDown, onPointerEnter }: TitleCardProps) {
  const hasUnread = (title.unreadCount ?? 0) > 0;
  const [coverSrc, setCoverSrc] = useState<string | null>(title.coverUrl ?? null);

  useEffect(() => {
    if (title.coverLocalPath) {
      invoke<string>("read_image_as_data_url", { path: title.coverLocalPath })
        .then(setCoverSrc)
        .catch(() => setCoverSrc(null));
    }
  }, [title.coverLocalPath]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={selectable ? () => onSelect?.(title.id) : onClick}
      onPointerDown={reorderable ? (e) => onPointerDown?.(e, title.id) : undefined}
      onPointerEnter={reorderable ? () => onPointerEnter?.(title.id) : undefined}
      className={`group relative flex flex-col text-left rounded-md overflow-hidden transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer ${selected ? "ring-2 ring-brand" : ""} ${isDragOver ? "ring-2 ring-brand scale-[1.05] opacity-60" : ""} ${reorderable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {/* Cover */}
      <div className="relative aspect-2/3 bg-bg-secondary rounded-md overflow-hidden">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={title.title}
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={32} className="text-text-muted" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />

        {/* Selection checkbox */}
        {selectable && (
          <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected ? "bg-brand border-brand" : "border-white/60 bg-black/40"}`}>
            {selected && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </div>
        )}

        {/* Delete button */}
        {onDelete && !reorderable && (
          <button
            onClick={onDelete}
            className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/60 text-white/80 hover:text-red-400 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            title="Remove from library"
          >
            <Trash2 size={14} />
          </button>
        )}

        {/* Unread badge */}
        {hasUnread && (
          <div className="absolute top-1.5 right-1.5 bg-brand text-white text-xs font-bold px-1.5 py-0.5 rounded-sm min-w-[20px] text-center">
            {title.unreadCount}
          </div>
        )}

        {/* Hover info */}
        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="text-[10px] text-white/80 truncate">
            {title.author && <span>{title.author}</span>}
          </div>
          <div className="text-[10px] text-white/60 capitalize">
            {title.contentType} · {title.status}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-1.5 px-0.5">
        <p className="text-sm font-medium leading-tight line-clamp-2 text-text-primary">
          {title.title}
        </p>
      </div>
    </div>
  );
}

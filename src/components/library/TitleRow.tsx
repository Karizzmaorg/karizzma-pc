import type { Title } from "@/types/manga";
import { BookOpen } from "lucide-react";

interface TitleRowProps {
  title: Title;
  onClick?: () => void;
}

export function TitleRow({ title, onClick }: TitleRowProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-bg-hover transition-colors text-left w-full group"
    >
      {/* Mini cover */}
      <div className="w-10 h-14 rounded bg-bg-secondary overflow-hidden shrink-0">
        {title.coverUrl || title.coverLocalPath ? (
          <img
            src={title.coverLocalPath ?? title.coverUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
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
    </button>
  );
}

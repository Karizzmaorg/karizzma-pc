import type { Title } from "@/types/manga";
import { BookOpen } from "lucide-react";

interface TitleCardProps {
  title: Title;
  onClick?: () => void;
}

export function TitleCard({ title, onClick }: TitleCardProps) {
  const hasUnread = (title.unreadCount ?? 0) > 0;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col text-left rounded-md overflow-hidden transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] bg-bg-secondary rounded-md overflow-hidden">
        {title.coverUrl || title.coverLocalPath ? (
          <img
            src={title.coverLocalPath ?? title.coverUrl}
            alt={title.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={32} className="text-text-muted" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />

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
    </button>
  );
}

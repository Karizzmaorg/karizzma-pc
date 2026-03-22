import { useReaderStore } from "@/stores/reader-store";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  BookOpen,
  ArrowLeftRight,
  ArrowUpDown,
  Columns2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReadingMode } from "@/types/manga";

const readingModes: { mode: ReadingMode; icon: typeof BookOpen; label: string }[] = [
  { mode: "rtl", icon: ArrowLeftRight, label: "Right to Left" },
  { mode: "ltr", icon: ArrowLeftRight, label: "Left to Right" },
  { mode: "vertical", icon: ArrowUpDown, label: "Vertical Scroll" },
  { mode: "double-page", icon: Columns2, label: "Double Page" },
];

export function ReaderToolbar() {
  const {
    currentChapter,
    chapters,
    currentPage,
    pages,
    readingMode,
    isFullscreen,
    setCurrentPage,
    setReadingMode,
    toggleFullscreen,
    closeReader,
    goToChapter,
  } = useReaderStore();

  const currentIndex = chapters.findIndex((c) => c.id === currentChapter?.id);
  const hasPrevChapter = currentIndex < chapters.length - 1;
  const hasNextChapter = currentIndex > 0;

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Close */}
        <button
          onClick={closeReader}
          className="p-1.5 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          title="Close reader"
        >
          <X size={20} />
        </button>

        {/* Chapter info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {currentChapter?.name ?? `Chapter ${currentChapter?.chapterNumber}`}
          </p>
        </div>

        {/* Chapter navigation */}
        <button
          onClick={() => hasPrevChapter && goToChapter(chapters[currentIndex + 1])}
          disabled={!hasPrevChapter}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            hasPrevChapter
              ? "hover:bg-white/10 text-white/80 hover:text-white"
              : "text-white/20 cursor-not-allowed"
          )}
          title="Previous chapter"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => hasNextChapter && goToChapter(chapters[currentIndex - 1])}
          disabled={!hasNextChapter}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            hasNextChapter
              ? "hover:bg-white/10 text-white/80 hover:text-white"
              : "text-white/20 cursor-not-allowed"
          )}
          title="Next chapter"
        >
          <ChevronRight size={20} />
        </button>

        {/* Reading mode selector */}
        <div className="flex items-center bg-white/10 rounded-md overflow-hidden">
          {readingModes.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setReadingMode(mode)}
              title={label}
              className={cn(
                "p-1.5 transition-colors",
                readingMode === mode
                  ? "bg-brand text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      {/* Page slider */}
      {readingMode !== "vertical" && pages.length > 0 && (
        <div className="px-4 pb-2 flex items-center gap-3">
          <span className="text-xs text-white/60 w-6 text-right">
            {currentPage + 1}
          </span>
          <input
            type="range"
            min={0}
            max={pages.length - 1}
            value={currentPage}
            onChange={(e) => setCurrentPage(Number(e.target.value))}
            className="flex-1 h-1 accent-brand"
          />
          <span className="text-xs text-white/60 w-6">{pages.length}</span>
        </div>
      )}
    </div>
  );
}

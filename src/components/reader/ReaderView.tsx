import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useReaderStore } from "@/stores/reader-store";
import { ReaderToolbar } from "./ReaderToolbar";

export function ReaderView() {
  const {
    pages,
    currentPage,
    readingMode,
    isFullscreen,
    showToolbar,
    isLoading,
    zoom,
    nextPage,
    prevPage,
    toggleToolbar,
    closeReader,
  } = useReaderStore();

  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          if (readingMode === "rtl") prevPage();
          else nextPage();
          break;
        case "ArrowLeft":
          if (readingMode === "rtl") nextPage();
          else prevPage();
          break;
        case "ArrowDown":
        case " ":
          if (readingMode !== "vertical") {
            e.preventDefault();
            nextPage();
          }
          break;
        case "ArrowUp":
          if (readingMode !== "vertical") {
            e.preventDefault();
            prevPage();
          }
          break;
        case "f":
        case "F":
          useReaderStore.getState().toggleFullscreen();
          break;
        case "Escape":
          if (isFullscreen) useReaderStore.getState().toggleFullscreen();
          else closeReader();
          break;
      }
    },
    [readingMode, nextPage, prevPage, closeReader, isFullscreen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Click navigation for paged modes
  const handlePageClick = (e: React.MouseEvent) => {
    if (readingMode === "vertical") {
      toggleToolbar();
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;

    if (x < third) {
      // Left third
      readingMode === "rtl" ? nextPage() : prevPage();
    } else if (x > third * 2) {
      // Right third
      readingMode === "rtl" ? prevPage() : nextPage();
    } else {
      // Center third — toggle toolbar
      toggleToolbar();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary text-sm">Loading pages...</span>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">No pages to display</p>
          <button
            onClick={closeReader}
            className="px-4 py-2 bg-bg-secondary rounded-md text-sm hover:bg-bg-hover transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 bg-black flex flex-col",
        isFullscreen && "cursor-none"
      )}
    >
      {/* Toolbar */}
      {showToolbar && <ReaderToolbar />}

      {/* Reader content */}
      {readingMode === "vertical" ? (
        <VerticalReader pages={pages} zoom={zoom} onClick={handlePageClick} />
      ) : (
        <PagedReader
          pages={pages}
          currentPage={currentPage}
          zoom={zoom}
          onClick={handlePageClick}
        />
      )}

      {/* Page indicator */}
      {showToolbar && readingMode !== "vertical" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-sm text-white/80">
          {currentPage + 1} / {pages.length}
        </div>
      )}
    </div>
  );
}

function PagedReader({
  pages,
  currentPage,
  zoom,
  onClick,
}: {
  pages: string[];
  currentPage: number;
  zoom: number;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="flex-1 flex items-center justify-center overflow-hidden select-none"
      onClick={onClick}
    >
      <img
        src={pages[currentPage]}
        alt={`Page ${currentPage + 1}`}
        className="max-h-full max-w-full object-contain"
        style={{ transform: `scale(${zoom})` }}
        draggable={false}
      />
    </div>
  );
}

function VerticalReader({
  pages,
  zoom,
  onClick,
}: {
  pages: string[];
  zoom: number;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden"
      onClick={onClick}
    >
      <div
        className="flex flex-col items-center"
        style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
      >
        {pages.map((page, i) => (
          <img
            key={i}
            src={page}
            alt={`Page ${i + 1}`}
            className="w-full max-w-3xl"
            loading={i < 5 ? "eager" : "lazy"}
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}

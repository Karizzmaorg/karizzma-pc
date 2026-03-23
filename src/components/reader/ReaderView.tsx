import { useCallback, useEffect, useRef, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { useReaderStore } from "@/stores/reader-store";
import { ReaderToolbar } from "./ReaderToolbar";

export function ReaderView() {
  const {
    pages,
    currentPage,
    currentChapter,
    readingMode,
    isFullscreen,
    showToolbar,
    isLoading,
    zoom,
    nextPage,
    prevPage,
    toggleToolbar,
    closeReader,
    setZoom,
  } = useReaderStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const singlePanelRef = useRef<HTMLDivElement>(null);
  const verticalRef = useRef<HTMLDivElement>(null);
  const [resetScroll, setResetScroll] = useState(true);

  const scrollContainer = useCallback((delta: number) => {
    const el = singlePanelRef.current || verticalRef.current;
    if (el) {
      el.scrollBy({ top: delta, behavior: "smooth" });
    }
  }, []);

  // Scroll wheel zoom (Ctrl+scroll)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(zoom + delta);
      }
    },
    [zoom, setZoom]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener("wheel", handleWheel, { passive: false });
      return () => el.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          if (readingMode === "single-panel") setResetScroll(true);
          if (readingMode === "rtl") prevPage();
          else nextPage();
          break;
        case "ArrowLeft":
          if (readingMode === "single-panel") setResetScroll(false);
          if (readingMode === "rtl") nextPage();
          else prevPage();
          break;
        case "ArrowDown":
        case " ":
          if (readingMode === "vertical" || readingMode === "single-panel") {
            e.preventDefault();
            scrollContainer(100);
          } else {
            e.preventDefault();
            nextPage();
          }
          break;
        case "ArrowUp":
          if (readingMode === "vertical" || readingMode === "single-panel") {
            e.preventDefault();
            scrollContainer(-100);
          } else {
            e.preventDefault();
            prevPage();
          }
          break;
        case "+":
        case "=":
          setZoom(zoom + 0.1);
          break;
        case "-":
          setZoom(zoom - 0.1);
          break;
        case "0":
          setZoom(1);
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
    [readingMode, nextPage, prevPage, closeReader, isFullscreen, zoom, setZoom]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Load pages when chapter changes — get file paths, convert to asset URLs instantly
  const lastLoadedChapterRef = useRef<number | null>(null);
  useEffect(() => {
    if (!currentChapter || !isLoading) return;
    if (lastLoadedChapterRef.current === currentChapter.id) return;
    lastLoadedChapterRef.current = currentChapter.id;

    (async () => {
      try {
        const pagePaths = await invoke<string[]>("get_chapter_pages", {
          chapterId: currentChapter.id,
        });
        if (pagePaths.length === 0) return;

        // Convert file paths to asset protocol URLs — instant, no encoding
        const assetUrls = pagePaths.map((p) =>
          p.startsWith("http://") || p.startsWith("https://") ? p : convertFileSrc(p)
        );
        useReaderStore.getState().setPages(assetUrls);
      } catch (err) {
        console.error("Failed to load chapter pages:", err);
      }
    })();
  }, [currentChapter, isLoading]);

  // Click navigation for paged modes
  const handlePageClick = (e: React.MouseEvent) => {
    if (readingMode === "vertical" || readingMode === "single-panel") {
      toggleToolbar();
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;

    if (x < third) {
      readingMode === "rtl" ? nextPage() : prevPage();
    } else if (x > third * 2) {
      readingMode === "rtl" ? prevPage() : nextPage();
    } else {
      toggleToolbar();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/src/assets/app-icon.png"
            alt="Loading"
            className="w-12 h-12 rounded-lg animate-spin-slow"
            draggable={false}
          />
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

  // For double-page mode, step by 2
  const pageIndicator =
    readingMode === "double-page"
      ? `${currentPage + 1}-${Math.min(currentPage + 2, pages.length)} / ${pages.length}`
      : `${currentPage + 1} / ${pages.length}`;

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
        <VerticalReader ref={verticalRef} pages={pages} zoom={zoom} onClick={handlePageClick} />
      ) : readingMode === "double-page" ? (
        <DoublePageReader
          pages={pages}
          currentPage={currentPage}
          zoom={zoom}
          onClick={handlePageClick}
        />
      ) : readingMode === "single-panel" ? (
        <SinglePanelReader
          ref={singlePanelRef}
          pages={pages}
          currentPage={currentPage}
          zoom={zoom}
          resetScroll={resetScroll}
          onClick={handlePageClick}
        />
      ) : (
        <PagedReader
          pages={pages}
          currentPage={currentPage}
          zoom={zoom}
          onClick={handlePageClick}
        />
      )}

      {/* Page indicator */}
      {showToolbar && readingMode !== "vertical" && readingMode !== "single-panel" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-sm text-white/80">
          {pageIndicator}
        </div>
      )}
    </div>
  );
}

function PagePlaceholder() {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-50">
      <img
        src="/src/assets/app-icon.png"
        alt="Loading"
        className="w-10 h-10 rounded-lg animate-logo-pulse"
        draggable={false}
      />
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
      className="flex-1 flex items-center justify-center overflow-auto select-none"
      onClick={onClick}
    >
      {pages[currentPage] ? (
        <img
          src={pages[currentPage]}
          alt={`Page ${currentPage + 1}`}
          className="max-h-full max-w-full object-contain"
          style={{ transform: `scale(${zoom})` }}
          draggable={false}
        />
      ) : (
        <PagePlaceholder />
      )}
    </div>
  );
}

function DoublePageReader({
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
  const leftPage = pages[currentPage];
  const rightPage = currentPage + 1 < pages.length ? pages[currentPage + 1] : null;

  return (
    <div
      className="flex-1 flex items-center justify-center overflow-auto select-none gap-1"
      onClick={onClick}
    >
      <div className="flex items-center justify-center h-full" style={{ transform: `scale(${zoom})` }}>
        {leftPage ? (
          <img
            src={leftPage}
            alt={`Page ${currentPage + 1}`}
            className="max-h-full object-contain"
            draggable={false}
          />
        ) : (
          <PagePlaceholder />
        )}
        {rightPage !== null && (rightPage ? (
          <img
            src={rightPage}
            alt={`Page ${currentPage + 2}`}
            className="max-h-full object-contain"
            draggable={false}
          />
        ) : (
          <PagePlaceholder />
        ))}
      </div>
    </div>
  );
}

const SinglePanelReader = forwardRef<
  HTMLDivElement,
  {
    pages: string[];
    currentPage: number;
    zoom: number;
    resetScroll: boolean;
    onClick: (e: React.MouseEvent) => void;
  }
>(function SinglePanelReader({ pages, currentPage, zoom, resetScroll, onClick }, ref) {
  const innerRef = useRef<HTMLDivElement>(null);
  const scrollPerPage = useRef<Record<number, number>>({});
  const ignoreScroll = useRef(false);
  const prevPageRef = useRef(currentPage);

  // On page change: save current scroll, then restore or reset
  useEffect(() => {
    if (currentPage === prevPageRef.current) return;
    const el = innerRef.current;
    if (!el) { prevPageRef.current = currentPage; return; }

    // Pause scroll tracking during transition
    ignoreScroll.current = true;

    if (resetScroll) {
      el.scrollTop = 0;
    } else {
      // Restore saved position for the page we're going back to
      const target = scrollPerPage.current[currentPage] ?? 0;
      const img = el.querySelector("img");
      if (img) {
        // Always listen for load event since src may change after effect runs
        const restore = () => {
          el.scrollTop = target;
          ignoreScroll.current = false;
        };
        img.addEventListener("load", restore, { once: true });
        // Also try restoring after a short delay in case image is already cached
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (img.complete) {
              img.removeEventListener("load", restore);
              el.scrollTop = target;
              ignoreScroll.current = false;
            }
          });
        });
      }
    }

    prevPageRef.current = currentPage;
    if (resetScroll) ignoreScroll.current = false;
  }, [currentPage, resetScroll]);

  // Track scroll position per page
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const onScroll = () => {
      if (!ignoreScroll.current) {
        scrollPerPage.current[currentPage] = el.scrollTop;
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [currentPage]);

  // Expose the inner ref to parent via forwardRef
  useEffect(() => {
    if (typeof ref === "function") ref(innerRef.current);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = innerRef.current;
  });

  return (
    <div
      ref={innerRef}
      className="flex-1 overflow-auto select-none"
      onClick={onClick}
    >
      {pages[currentPage] ? (
        <img
          src={pages[currentPage]}
          alt={`Page ${currentPage + 1}`}
          className="w-full h-auto"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          draggable={false}
        />
      ) : (
        <PagePlaceholder />
      )}
    </div>
  );
});

const VerticalReader = forwardRef<
  HTMLDivElement,
  {
    pages: string[];
    zoom: number;
    onClick: (e: React.MouseEvent) => void;
  }
>(function VerticalReader({ pages, zoom, onClick }, ref) {
  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto overflow-x-hidden"
      onClick={onClick}
    >
      <div
        className="flex flex-col items-center"
        style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
      >
        {pages.map((page, i) =>
          page ? (
            <img
              key={i}
              src={page}
              alt={`Page ${i + 1}`}
              className="w-full max-w-3xl"
              loading={i < 5 ? "eager" : "lazy"}
              draggable={false}
            />
          ) : (
            <div key={i} className="w-full max-w-3xl flex items-center justify-center min-h-50">
              <PagePlaceholder />
            </div>
          )
        )}
      </div>
    </div>
  );
});

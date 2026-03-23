import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { ReadingMode, Chapter } from "@/types/manga";

interface ReaderState {
  isOpen: boolean;
  titleId: number | null;
  currentChapter: Chapter | null;
  chapters: Chapter[];
  pages: string[]; // data URLs for page images (empty string = not yet loaded)
  currentPage: number;
  readingMode: ReadingMode;
  isFullscreen: boolean;
  showToolbar: boolean;
  isLoading: boolean;
  zoom: number;

  openReader: (titleId: number, chapter: Chapter, chapters: Chapter[]) => void;
  closeReader: () => void;
  setPages: (pages: string[]) => void;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setReadingMode: (mode: ReadingMode) => void;
  toggleFullscreen: () => void;
  toggleToolbar: () => void;
  setLoading: (loading: boolean) => void;
  setZoom: (zoom: number) => void;
  goToChapter: (chapter: Chapter) => void;
}

let progressTimer: ReturnType<typeof setTimeout> | null = null;

function saveProgressDebounced(chapterId: number, page: number, totalPages: number) {
  if (progressTimer) clearTimeout(progressTimer);
  progressTimer = setTimeout(() => {
    const isRead = page >= totalPages - 1;
    invoke("update_reading_progress", { chapterId, page, isRead }).catch(() => {});
  }, 500);
}

function saveProgressImmediate(chapterId: number, page: number, totalPages: number) {
  if (progressTimer) clearTimeout(progressTimer);
  const isRead = page >= totalPages - 1;
  invoke("update_reading_progress", { chapterId, page, isRead }).catch((e) =>
    console.error("Failed to save reading progress:", e)
  );
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  isOpen: false,
  titleId: null,
  currentChapter: null,
  chapters: [],
  pages: [],
  currentPage: 0,
  readingMode: "ltr",
  isFullscreen: false,
  showToolbar: true,
  isLoading: false,
  zoom: 1,

  openReader: (titleId, chapter, chapters) =>
    set({
      isOpen: true,
      titleId,
      currentChapter: chapter,
      chapters,
      currentPage: chapter.lastPageRead,
      pages: [],
      isLoading: true,
    }),

  closeReader: async () => {
    const { currentChapter, currentPage, pages } = get();
    if (currentChapter) {
      saveProgressImmediate(currentChapter.id, currentPage, pages.length);
    }

    set({
      isOpen: false,
      titleId: null,
      currentChapter: null,
      chapters: [],
      pages: [],
      currentPage: 0,
      isLoading: false,
      isFullscreen: false,
    });
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setFullscreen(false);
    } catch {}
  },

  setPages: (pages) => set({ pages, isLoading: false }),

  setCurrentPage: (currentPage) => {
    set({ currentPage });
    const { currentChapter, pages } = get();
    if (currentChapter) {
      saveProgressDebounced(currentChapter.id, currentPage, pages.length);
    }
  },

  nextPage: () => {
    const { currentPage, pages, readingMode, currentChapter } = get();
    const step = readingMode === "double-page" ? 2 : 1;
    if (currentPage < pages.length - 1) {
      const newPage = Math.min(currentPage + step, pages.length - 1);
      set({ currentPage: newPage });
      if (currentChapter) {
        saveProgressDebounced(currentChapter.id, newPage, pages.length);
      }
    }
  },

  prevPage: () => {
    const { currentPage, readingMode, currentChapter, pages } = get();
    const step = readingMode === "double-page" ? 2 : 1;
    if (currentPage > 0) {
      const newPage = Math.max(currentPage - step, 0);
      set({ currentPage: newPage });
      if (currentChapter) {
        saveProgressDebounced(currentChapter.id, newPage, pages.length);
      }
    }
  },

  setReadingMode: (readingMode) => set({ readingMode }),
  toggleFullscreen: async () => {
    const next = !get().isFullscreen;
    set({ isFullscreen: next });
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setFullscreen(next);
    } catch {}
  },
  toggleToolbar: () => set((s) => ({ showToolbar: !s.showToolbar })),
  setLoading: (isLoading) => set({ isLoading }),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),

  goToChapter: (chapter) => {
    // Save progress for current chapter before switching
    const { currentChapter, currentPage, pages } = get();
    if (currentChapter) {
      saveProgressImmediate(currentChapter.id, currentPage, pages.length);
    }

    set({
      currentChapter: chapter,
      currentPage: chapter.lastPageRead,
      pages: [],
      isLoading: true,
    });
  },
}));

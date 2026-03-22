import { create } from "zustand";
import type { ReadingMode, Chapter } from "@/types/manga";

interface ReaderState {
  isOpen: boolean;
  titleId: number | null;
  currentChapter: Chapter | null;
  chapters: Chapter[];
  pages: string[]; // URLs or local paths to page images
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

export const useReaderStore = create<ReaderState>((set, get) => ({
  isOpen: false,
  titleId: null,
  currentChapter: null,
  chapters: [],
  pages: [],
  currentPage: 0,
  readingMode: "rtl",
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

  closeReader: () =>
    set({
      isOpen: false,
      titleId: null,
      currentChapter: null,
      chapters: [],
      pages: [],
      currentPage: 0,
      isLoading: false,
    }),

  setPages: (pages) => set({ pages, isLoading: false }),
  setCurrentPage: (currentPage) => set({ currentPage }),

  nextPage: () => {
    const { currentPage, pages } = get();
    if (currentPage < pages.length - 1) {
      set({ currentPage: currentPage + 1 });
    }
  },

  prevPage: () => {
    const { currentPage } = get();
    if (currentPage > 0) {
      set({ currentPage: currentPage - 1 });
    }
  },

  setReadingMode: (readingMode) => set({ readingMode }),
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
  toggleToolbar: () => set((s) => ({ showToolbar: !s.showToolbar })),
  setLoading: (isLoading) => set({ isLoading }),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),

  goToChapter: (chapter) =>
    set({
      currentChapter: chapter,
      currentPage: 0,
      pages: [],
      isLoading: true,
    }),
}));

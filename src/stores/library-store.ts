import { create } from "zustand";
import type { Title, Category } from "@/types/manga";

type ViewMode = "grid" | "list";
type SortField = "title" | "lastRead" | "lastUpdated" | "unreadCount" | "dateAdded";
type SortDirection = "asc" | "desc";

interface LibraryFilters {
  search: string;
  category: number | null;
  contentType: string | null;
  downloaded: boolean | null;
  unread: boolean | null;
  completed: boolean | null;
}

interface LibraryState {
  titles: Title[];
  categories: Category[];
  viewMode: ViewMode;
  sortField: SortField;
  sortDirection: SortDirection;
  filters: LibraryFilters;
  selectedIds: Set<number>;

  setTitles: (titles: Title[]) => void;
  setCategories: (categories: Category[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (dir: SortDirection) => void;
  setFilter: <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => void;
  toggleSelected: (id: number) => void;
  clearSelection: () => void;
  selectAll: () => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  titles: [],
  categories: [],
  viewMode: "grid",
  sortField: "lastUpdated",
  sortDirection: "desc",
  filters: {
    search: "",
    category: null,
    contentType: null,
    downloaded: null,
    unread: null,
    completed: null,
  },
  selectedIds: new Set(),

  setTitles: (titles) => set({ titles }),
  setCategories: (categories) => set({ categories }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSortField: (sortField) => set({ sortField }),
  setSortDirection: (sortDirection) => set({ sortDirection }),
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  toggleSelected: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
  clearSelection: () => set({ selectedIds: new Set() }),
  selectAll: () =>
    set((state) => ({
      selectedIds: new Set(state.titles.map((t) => t.id)),
    })),
}));

import { cn } from "@/lib/utils";
import { useLibraryStore } from "@/stores/library-store";
import { useReaderStore } from "@/stores/reader-store";
import {
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  FolderOpen,
  Plus,
} from "lucide-react";
import { useEffect, useCallback } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { TitleCard } from "./TitleCard";
import { TitleRow } from "./TitleRow";
import type { Title, Chapter } from "@/types/manga";

function mapTitle(raw: Record<string, unknown>): Title {
  return {
    id: raw.id as number,
    sourceId: raw.source_id as string,
    url: raw.url as string,
    title: raw.title as string,
    artist: raw.artist as string | undefined,
    author: raw.author as string | undefined,
    description: raw.description as string | undefined,
    coverUrl: raw.cover_url as string | undefined,
    coverLocalPath: raw.cover_local_path as string | undefined,
    status: (raw.status as Title["status"]) ?? "unknown",
    contentType: (raw.content_type as Title["contentType"]) ?? "manga",
    genres: (raw.genres as string[]) ?? [],
    inLibrary: raw.in_library as boolean,
    isFavorite: raw.is_favorite as boolean,
    dateAdded: raw.date_added as number | undefined,
    lastUpdated: raw.last_updated as number | undefined,
    unreadCount: raw.unread_count as number | undefined,
  };
}

function mapChapter(raw: Record<string, unknown>): Chapter {
  return {
    id: raw.id as number,
    titleId: raw.title_id as number,
    url: raw.url as string,
    name: raw.name as string | undefined,
    chapterNumber: raw.chapter_number as number,
    volumeNumber: raw.volume_number as number | undefined,
    scanlator: raw.scanlator as string | undefined,
    dateUpload: raw.date_upload as number | undefined,
    isRead: raw.is_read as boolean,
    isDownloaded: raw.is_downloaded as boolean,
    lastPageRead: (raw.last_page_read as number) ?? 0,
    dateRead: raw.date_read as number | undefined,
    downloadPath: raw.download_path as string | undefined,
  };
}

export function LibraryPage() {
  const {
    titles,
    setTitles,
    viewMode,
    setViewMode,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    filters,
    setFilter,
  } = useLibraryStore();

  const fetchLibrary = useCallback(async () => {
    try {
      const raw = await invoke<Record<string, unknown>[]>("get_library_titles");
      setTitles(raw.map(mapTitle));
    } catch (err) {
      console.error("Failed to fetch library:", err);
    }
  }, [setTitles]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const handleImport = async () => {
    try {
      const selected = await open({
        multiple: true,
        directory: false,
        filters: [
          {
            name: "Manga/Comic Archives",
            extensions: ["cbz", "cbr", "zip", "rar", "7z", "cb7", "epub"],
          },
        ],
      });
      if (!selected) return;

      const paths = Array.isArray(selected) ? selected : [selected];
      await invoke("import_local_files", { paths });
      await fetchLibrary();
    } catch (err) {
      console.error("Import failed:", err);
    }
  };

  const handleImportFolder = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: true,
      });
      if (!selected) return;

      const paths = [selected];
      await invoke("import_local_files", { paths });
      await fetchLibrary();
    } catch (err) {
      console.error("Import folder failed:", err);
    }
  };

  const handleTitleClick = async (title: Title) => {
    try {
      const raw = await invoke<Record<string, unknown>[]>("get_title_chapters", {
        titleId: title.id,
      });
      const chapters = raw.map(mapChapter);
      if (chapters.length === 0) return;

      const openReader = useReaderStore.getState().openReader;
      openReader(title.id, chapters[0], chapters);

      // Fetch pages
      const pages = await invoke<string[]>("get_chapter_pages", {
        chapterId: chapters[0].id,
      });
      // Convert local file paths to asset URLs
      const assetPages = pages.map((p) => {
        if (p.startsWith("http://") || p.startsWith("https://")) return p;
        return convertFileSrc(p);
      });
      useReaderStore.getState().setPages(assetPages);
    } catch (err) {
      console.error("Failed to open reader:", err);
    }
  };

  const filteredTitles = titles
    .filter((t) => {
      if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase()))
        return false;
      if (filters.contentType && t.contentType !== filters.contentType)
        return false;
      if (filters.unread === true && (t.unreadCount ?? 0) === 0)
        return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "title":
          return a.title.localeCompare(b.title) * dir;
        case "dateAdded":
          return ((a.dateAdded ?? 0) - (b.dateAdded ?? 0)) * dir;
        case "lastUpdated":
          return ((a.lastUpdated ?? 0) - (b.lastUpdated ?? 0)) * dir;
        case "unreadCount":
          return ((a.unreadCount ?? 0) - (b.unreadCount ?? 0)) * dir;
        default:
          return 0;
      }
    });

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
        {/* Search */}
        <input
          type="text"
          placeholder="Filter library..."
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          className="bg-bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand transition-colors w-60"
        />

        <div className="flex-1" />

        {/* Sort */}
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as typeof sortField)}
          className="bg-bg-secondary border border-border rounded-md px-2 py-1.5 text-sm text-text-secondary outline-none cursor-pointer"
        >
          <option value="title">Title</option>
          <option value="lastUpdated">Last Updated</option>
          <option value="dateAdded">Date Added</option>
          <option value="unreadCount">Unread Count</option>
          <option value="lastRead">Last Read</option>
        </select>

        <button
          onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
          className="p-1.5 rounded-md hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
          title={`Sort ${sortDirection === "asc" ? "descending" : "ascending"}`}
        >
          {sortDirection === "asc" ? <SortAsc size={18} /> : <SortDesc size={18} />}
        </button>

        <div className="w-px h-6 bg-border" />

        {/* View toggle */}
        <button
          onClick={() => setViewMode("grid")}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            viewMode === "grid"
              ? "bg-bg-hover text-brand"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
          )}
          title="Grid view"
        >
          <Grid3X3 size={18} />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            viewMode === "list"
              ? "bg-bg-hover text-brand"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
          )}
          title="List view"
        >
          <List size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredTitles.length === 0 ? (
          <EmptyLibrary onImport={handleImport} onImportFolder={handleImportFolder} />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
            {filteredTitles.map((title) => (
              <TitleCard key={title.id} title={title} onClick={() => handleTitleClick(title)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredTitles.map((title) => (
              <TitleRow key={title.id} title={title} onClick={() => handleTitleClick(title)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyLibrary({
  onImport,
  onImportFolder,
}: {
  onImport: () => void;
  onImportFolder: () => void;
}) {
  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="text-center w-96">
        <div className="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center mx-auto mb-4">
          <FolderOpen size={36} className="text-text-muted" />
        </div>
        <h3 className="text-lg font-medium mb-1">Your library is empty</h3>
        <p className="text-text-secondary text-sm mb-4">
          Import local manga files (CBZ, ZIP, folders) or install extensions from the Browse tab to add titles.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onImport}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            <FolderOpen size={16} />
            Import Files
          </button>
          <button
            onClick={onImportFolder}
            className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border text-text-primary rounded-md text-sm font-medium hover:bg-bg-hover transition-colors"
          >
            <Plus size={16} />
            Import Folder
          </button>
        </div>
      </div>
    </div>
  );
}

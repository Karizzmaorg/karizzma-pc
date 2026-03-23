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
  Trash2,
  CheckSquare,
  X,
} from "lucide-react";
import { useEffect, useCallback, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { TitleCard } from "./TitleCard";
import { TitleRow } from "./TitleRow";
import { ConfirmDialog } from "../common/ConfirmDialog";
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
    sortOrder: (raw.sort_order as number) ?? 0,
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

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ ids: number[]; names: string[] } | null>(null);
  const draggingId = useRef<number | null>(null);
  const dragOverIdRef = useRef<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

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

  const handleDeleteClick = (e: React.MouseEvent, title: Title) => {
    e.stopPropagation();
    setConfirmDelete({ ids: [title.id], names: [title.title] });
  };

  const handleBatchDelete = () => {
    const selected = titles.filter((t) => selectedIds.has(t.id));
    if (selected.length === 0) return;
    setConfirmDelete({
      ids: selected.map((t) => t.id),
      names: selected.map((t) => t.title),
    });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      for (const id of confirmDelete.ids) {
        await invoke("remove_title_from_library", { titleId: id });
      }
      await fetchLibrary();
      exitSelectMode();
    } catch (err) {
      console.error("Failed to remove titles:", err);
    }
    setConfirmDelete(null);
  };

  // Pointer-based reordering (only when sort is "custom")
  const handleReorderPointerDown = (e: React.PointerEvent, id: number) => {
    // Only left mouse button
    if (e.button !== 0) return;
    e.preventDefault();
    draggingId.current = id;
    dragOverIdRef.current = id;
    setDragOverId(id);

    const handlePointerUp = async () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      const fromId = draggingId.current;
      const toId = dragOverIdRef.current;
      draggingId.current = null;
      setDragOverId(null);

      if (fromId === null || toId === null || fromId === toId) return;

      // Use latest titles from store
      const current = useLibraryStore.getState().titles;
      const allTitles = [...current];
      const fromIdx = allTitles.findIndex((t) => t.id === fromId);
      const toIdx = allTitles.findIndex((t) => t.id === toId);
      if (fromIdx === -1 || toIdx === -1) return;

      const [moved] = allTitles.splice(fromIdx, 1);
      allTitles.splice(toIdx, 0, moved);

      const reordered = allTitles.map((t, i) => ({ ...t, sortOrder: i }));
      setTitles(reordered);

      try {
        await invoke("update_title_order", { titleIds: reordered.map((t) => t.id) });
      } catch (err) {
        console.error("Failed to save order:", err);
      }
    };

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  const handleReorderPointerEnter = (id: number) => {
    if (draggingId.current !== null) {
      dragOverIdRef.current = id;
      setDragOverId(id);
    }
  };

  const isCustomSort = sortField === "custom";

  // When switching to custom sort, initialize sort_order from current display order if not set
  const handleSortChange = async (field: string) => {
    if (field === "custom") {
      const needsInit = filteredTitles.every((t) => t.sortOrder === 0) ||
        new Set(filteredTitles.map((t) => t.sortOrder)).size !== filteredTitles.length;
      if (needsInit) {
        const ordered = filteredTitles.map((t, i) => ({ ...t, sortOrder: i }));
        setTitles(ordered);
        try {
          await invoke("update_title_order", { titleIds: ordered.map((t) => t.id) });
        } catch {}
      }
    }
    setSortField(field as typeof sortField);
  };

  const handleTitleClick = async (title: Title) => {
    try {
      const raw = await invoke<Record<string, unknown>[]>("get_title_chapters", {
        titleId: title.id,
      });
      const chapters = raw.map(mapChapter);
      if (chapters.length === 0) return;

      // Find last-read chapter: most recent dateRead, or first unread, or first chapter
      const lastRead = chapters
        .filter((c) => c.dateRead)
        .sort((a, b) => (b.dateRead ?? 0) - (a.dateRead ?? 0))[0];

      let targetChapter: Chapter;
      if (lastRead) {
        // If last-read chapter is fully read, try the next unread chapter
        if (lastRead.isRead) {
          const lastReadIdx = chapters.findIndex((c) => c.id === lastRead.id);
          const nextUnread = chapters.find((c, i) => i > lastReadIdx && !c.isRead);
          targetChapter = nextUnread ?? lastRead;
        } else {
          targetChapter = lastRead;
        }
      } else {
        targetChapter = chapters[0];
      }

      const openReader = useReaderStore.getState().openReader;
      openReader(title.id, targetChapter, chapters);

      // Fetch pages (batch conversion in single IPC call)
      const pages = await invoke<string[]>("get_chapter_pages", {
        chapterId: targetChapter.id,
      });
      const dataPages = await invoke<string[]>("read_images_as_data_urls", { paths: pages });
      useReaderStore.getState().setPages(dataPages);
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
        case "custom":
          return (a.sortOrder - b.sortOrder) * dir;
        default:
          return 0;
      }
    });

  const selectAll = () => setSelectedIds(new Set(filteredTitles.map((t) => t.id)));

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
        {selectMode ? (
          <>
            {/* Select mode toolbar */}
            <button
              onClick={exitSelectMode}
              className="p-1.5 rounded-md hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
              title="Cancel selection"
            >
              <X size={18} />
            </button>
            <span className="text-sm text-text-secondary">
              {selectedIds.size} selected
            </span>
            <button
              onClick={selectAll}
              className="text-sm text-brand hover:text-brand-hover transition-colors"
            >
              Select All
            </button>
            <div className="flex-1" />
            <button
              onClick={handleBatchDelete}
              disabled={selectedIds.size === 0}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                selectedIds.size > 0
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "bg-bg-secondary text-text-muted cursor-not-allowed"
              )}
            >
              <Trash2 size={14} />
              Delete ({selectedIds.size})
            </button>
          </>
        ) : (
          <>
            {/* Search */}
            <input
              type="text"
              placeholder="Filter library..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="bg-bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand transition-colors w-60"
            />

            <div className="flex-1" />

            {/* Import buttons */}
            <button
              onClick={handleImport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors"
            >
              <FolderOpen size={14} />
              Import
            </button>
            <button
              onClick={handleImportFolder}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-secondary border border-border rounded-md text-sm hover:bg-bg-hover transition-colors"
            >
              <Plus size={14} />
              Folder
            </button>

            <div className="w-px h-6 bg-border" />

            {/* Select mode toggle */}
            {filteredTitles.length > 0 && (
              <button
                onClick={() => setSelectMode(true)}
                className="p-1.5 rounded-md hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
                title="Select titles"
              >
                <CheckSquare size={18} />
              </button>
            )}

            {/* Sort */}
            <select
              value={sortField}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-bg-secondary border border-border rounded-md px-2 py-1.5 text-sm text-text-secondary outline-none cursor-pointer"
            >
              <option value="title">Title</option>
              <option value="lastUpdated">Last Updated</option>
              <option value="dateAdded">Date Added</option>
              <option value="unreadCount">Unread Count</option>
              <option value="lastRead">Last Read</option>
              <option value="custom">Custom Order</option>
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
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredTitles.length === 0 ? (
          <EmptyLibrary onImport={handleImport} onImportFolder={handleImportFolder} />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
            {filteredTitles.map((title) => (
              <TitleCard
                key={title.id}
                title={title}
                onClick={() => handleTitleClick(title)}
                onDelete={(e) => handleDeleteClick(e, title)}
                selectable={selectMode}
                selected={selectedIds.has(title.id)}
                onSelect={toggleSelect}
                reorderable={isCustomSort && !selectMode}
                isDragOver={dragOverId === title.id}
                onPointerDown={handleReorderPointerDown}
                onPointerEnter={handleReorderPointerEnter}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredTitles.map((title) => (
              <TitleRow
                key={title.id}
                title={title}
                onClick={() => handleTitleClick(title)}
                onDelete={(e) => handleDeleteClick(e, title)}
                selectable={selectMode}
                selected={selectedIds.has(title.id)}
                onSelect={toggleSelect}
                reorderable={isCustomSort && !selectMode}
                isDragOver={dragOverId === title.id}
                onPointerDown={handleReorderPointerDown}
                onPointerEnter={handleReorderPointerEnter}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Remove ${confirmDelete.ids.length === 1 ? "title" : `${confirmDelete.ids.length} titles`}?`}
          message={
            confirmDelete.ids.length === 1
              ? `"${confirmDelete.names[0]}" will be removed from your library.`
              : "The following titles will be removed from your library:"
          }
          details={confirmDelete.ids.length > 1 ? confirmDelete.names : undefined}
          footnote="This won't delete the original files from your device."
          confirmLabel="Remove"
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete(null)}
          destructive
        />
      )}
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

export type ContentType = "manga" | "manhwa" | "manhua" | "novel" | "comic";
export type TitleStatus = "ongoing" | "completed" | "hiatus" | "cancelled" | "unknown";
export type ReadingMode = "rtl" | "ltr" | "vertical" | "double-page" | "single-panel";

export interface Title {
  id: number;
  sourceId: string;
  url: string;
  title: string;
  artist?: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  coverLocalPath?: string;
  status: TitleStatus;
  contentType: ContentType;
  genres: string[];
  inLibrary: boolean;
  isFavorite: boolean;
  dateAdded?: number;
  lastUpdated?: number;
  unreadCount?: number;
  sortOrder: number;
}

export interface Chapter {
  id: number;
  titleId: number;
  url: string;
  name?: string;
  chapterNumber: number;
  volumeNumber?: number;
  scanlator?: string;
  dateUpload?: number;
  isRead: boolean;
  isDownloaded: boolean;
  lastPageRead: number;
  dateRead?: number;
  downloadPath?: string;
}

export interface HistoryEntry {
  id: number;
  titleId: number;
  chapterId: number;
  pageNumber: number;
  timeSpentSeconds: number;
  timestamp: number;
  title?: Title;
  chapter?: Chapter;
}

export interface Category {
  id: number;
  name: string;
  sortOrder: number;
}

export interface MangaPage {
  titles: Title[];
  hasNextPage: boolean;
}

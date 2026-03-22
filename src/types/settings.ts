import type { ReadingMode } from "./manga";

export type Theme = "dark" | "light" | "amoled";

export interface ReaderSettings {
  defaultMangaMode: ReadingMode;
  defaultManhwaMode: ReadingMode;
  defaultNovelMode: "paginated" | "scroll";
  pageTransition: "instant" | "slide" | "fade";
  prefetchAhead: number;
  prefetchBehind: number;
  backgroundColor: string;
  cropWhitespace: boolean;
  pageGap: number;
  showPageNumber: boolean;
}

export interface AppSettings {
  theme: Theme;
  accentColor: string;
  language: string;
  libraryUpdateInterval: number; // hours
  downloadPath: string;
  cacheSizeLimit: number; // MB
  concurrentDownloads: number;
  reader: ReaderSettings;
  flaresolverrUrl: string;
  proxyUrl: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  accentColor: "#E8923A",
  language: "en",
  libraryUpdateInterval: 12,
  downloadPath: "",
  cacheSizeLimit: 500,
  concurrentDownloads: 3,
  reader: {
    defaultMangaMode: "rtl",
    defaultManhwaMode: "vertical",
    defaultNovelMode: "scroll",
    pageTransition: "instant",
    prefetchAhead: 3,
    prefetchBehind: 1,
    backgroundColor: "#000000",
    cropWhitespace: false,
    pageGap: 0,
    showPageNumber: true,
  },
  flaresolverrUrl: "",
  proxyUrl: "",
};

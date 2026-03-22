import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/components/home/HomePage";
import { LibraryPage } from "@/components/library/LibraryPage";
import { BrowsePage } from "@/components/browse/BrowsePage";
import { HistoryPage } from "@/components/history/HistoryPage";
import { FavoritesPage } from "@/components/library/FavoritesPage";
import { DownloadsPage } from "@/components/library/DownloadsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { ReaderView } from "@/components/reader/ReaderView";
import { useReaderStore } from "@/stores/reader-store";
import { useSettingsStore } from "@/stores/settings-store";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  const isReaderOpen = useReaderStore((s) => s.isOpen);
  const accentColor = useSettingsStore((s) => s.settings.accentColor);
  const theme = useSettingsStore((s) => s.settings.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accentColor);
  }, [accentColor]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>

        {/* Reader overlay (renders above everything) */}
        {isReaderOpen && <ReaderView />}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

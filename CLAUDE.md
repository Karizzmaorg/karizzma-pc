# Karizzma - Desktop Manga/Novel/Comic Reader

## Quick Start Checklist

### Prerequisites
- **Node.js** installed (npm as package manager)
- **Rust** installed via rustup (`~/.cargo/bin` must be in PATH)
- Run `export PATH="$HOME/.cargo/bin:$PATH"` if Rust commands aren't found in shell

### Starting the Dev Environment
1. **Install dependencies** (only if `node_modules` is missing):
   ```bash
   npm install
   ```
2. **Run the full desktop app**:
   ```bash
   npx tauri dev
   ```
   This starts both Vite (frontend at localhost:1420) and the Rust backend, then opens the Tauri window.

3. **If port 1420 is busy** (from a previous session):
   ```bash
   # Find and kill the process on port 1420
   netstat -ano | grep 1420
   taskkill //PID <pid> //F
   ```

4. **If karizzma.exe is locked** (can't overwrite during rebuild):
   ```bash
   taskkill //IM karizzma.exe //F
   ```

### Frontend Only (no Rust rebuild)
```bash
npm run dev
```
Opens at http://localhost:1420

## Tech Stack
- **Frontend**: React 19 + TypeScript, Vite 8, Tailwind CSS v4, Zustand, React Router v7, TanStack Query v5
- **Desktop**: Tauri v2 (Rust backend)
- **Database**: SQLite via rusqlite (bundled), WAL mode
- **Icons**: lucide-react

## Project Structure
```
src/                          # React frontend
  components/
    layout/                   # AppLayout, Sidebar, TopBar
    home/HomePage.tsx
    library/                  # LibraryPage, TitleCard, TitleRow, FavoritesPage, DownloadsPage
    browse/BrowsePage.tsx
    history/HistoryPage.tsx
    settings/SettingsPage.tsx
    reader/                   # ReaderView, ReaderToolbar
  stores/                     # Zustand stores (library, reader, settings)
  types/                      # TypeScript types (manga.ts, settings.ts)
  lib/utils.ts                # cn() helper
  index.css                   # Tailwind config + custom theme

src-tauri/                    # Rust backend
  Cargo.toml
  tauri.conf.json
  src/
    main.rs                   # Entry point
    lib.rs                    # Tauri builder setup, DB init
    commands/                 # Tauri IPC commands
      library.rs              # get_library_titles, add/remove title, import files, get_categories
      reader.rs               # get_chapter_pages, update_reading_progress
      settings.rs             # get_app_data_dir
    storage/
      database.rs             # SQLite schema, migrations
```

## Key Patterns
- All Rust command files need `use tauri::Manager;` for `.path()` on AppHandle
- Tailwind v4 theme uses `@theme` block in index.css with CSS custom properties
- Sidebar is icon-only (64px), brand color is `#e94560`
- Settings page has its own sidebar navigation (left panel)
- Reader is a modal overlay, not a route
- DB path: `AppHandle.path().app_data_dir()/karizzma.db`

## Common Issues
- **Rust not found**: `export PATH="$HOME/.cargo/bin:$PATH"`
- **Port 1420 in use**: Kill old Vite/node processes
- **Missing icons**: Run `npx tauri icon` (needs `app-icon.png` in project root)
- **Build error "access denied" on .exe**: Kill running karizzma.exe first

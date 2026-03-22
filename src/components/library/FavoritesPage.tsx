import { Heart } from "lucide-react";

export function FavoritesPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Favorites</h1>

      <div className="flex items-center justify-center h-64">
        <div className="text-center w-80">
          <Heart size={40} className="mx-auto mb-3 text-text-muted" />
          <p className="text-sm text-text-secondary">No favorites yet</p>
          <p className="text-xs text-text-muted mt-1">
            Mark titles as favorites for quick access
          </p>
        </div>
      </div>
    </div>
  );
}

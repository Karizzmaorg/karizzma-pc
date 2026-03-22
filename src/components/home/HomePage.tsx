import { BookOpen, TrendingUp, Clock } from "lucide-react";

export function HomePage() {
  return (
    <div className="p-6 space-y-8">
      {/* Continue Reading */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={20} className="text-brand" />
          <h2 className="text-lg font-semibold">Continue Reading</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          <EmptyState message="No reading history yet. Import some manga or install an extension to get started!" />
        </div>
      </section>

      {/* Recently Added */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-brand" />
          <h2 className="text-lg font-semibold">Recently Added</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          <EmptyState message="Your library is empty. Add titles from the Browse tab or import local files." />
        </div>
      </section>

      {/* Recommendations placeholder */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-brand" />
          <h2 className="text-lg font-semibold">Recommended For You</h2>
        </div>
        <div className="flex items-center justify-center h-32 rounded-lg border border-dashed border-border">
          <p className="text-text-muted text-sm">
            Recommendations will appear as you build your library
          </p>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex items-center justify-center h-32 rounded-lg border border-dashed border-border">
      <p className="text-text-muted text-sm text-center px-4">{message}</p>
    </div>
  );
}

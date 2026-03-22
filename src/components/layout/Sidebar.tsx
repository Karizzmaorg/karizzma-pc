import { cn } from "@/lib/utils";
import {
  Home,
  Library,
  Compass,
  Clock,
  Heart,
  Download,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Library, label: "Library", path: "/library" },
  { icon: Compass, label: "Browse", path: "/browse" },
  { icon: Clock, label: "History", path: "/history" },
  { icon: Heart, label: "Favorites", path: "/favorites" },
  { icon: Download, label: "Downloads", path: "/downloads" },
];

const bottomItems: NavItem[] = [
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="flex flex-col h-full w-[var(--sidebar-width)] bg-bg-secondary border-r border-border shrink-0">
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-border">
        <img src="/src/assets/app-icon.png" alt="Karizzma" className="w-9 h-9 rounded" />
      </div>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-2">
        {navItems.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            isActive={
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path)
            }
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col items-center gap-1 py-2 border-t border-border">
        {bottomItems.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            isActive={location.pathname.startsWith(item.path)}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </aside>
  );
}

function NavButton({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={item.label}
      className={cn(
        "flex items-center justify-center w-11 h-11 rounded-md transition-all duration-200",
        "hover:bg-bg-hover",
        isActive
          ? "bg-bg-hover text-brand"
          : "text-text-secondary hover:text-text-primary"
      )}
    >
      <item.icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
    </button>
  );
}

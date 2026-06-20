import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Sparkles,
  MessageSquare,
  FileCheck2,
  NotebookPen,
  CalendarDays,
  Compass,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Aurora } from "./Aurora";
import { FloatingOrb } from "./AIOrb";

const NAV = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/studio", label: "Learning Studio", icon: Sparkles },
  { to: "/app/tutor", label: "AI Tutor", icon: MessageSquare },
  { to: "/app/exam", label: "Exam Engine", icon: FileCheck2 },
  { to: "/app/notes", label: "Notes", icon: NotebookPen },
  { to: "/app/planner", label: "Planner", icon: CalendarDays },
  { to: "/app/career", label: "Career", icon: Compass },
];

const MOBILE_NAV = [
  { to: "/app/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/app/studio", label: "Studio", icon: Sparkles },
  { to: "/app/tutor", label: "Tutor", icon: MessageSquare },
  { to: "/app/planner", label: "Planner", icon: CalendarDays },
];

const NavItem = ({ item, active, onClick }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
      className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all ${
        active
          ? "bg-white/10 text-white"
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-500 to-violet-500"
        />
      )}
      <Icon size={18} className={active ? "text-blue-400" : ""} />
      <span className="font-medium">{item.label}</span>
    </Link>
  );
};

export const AppShell = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [...NAV];
  if (user?.role === "admin") {
    nav.push({ to: "/app/admin", label: "Admin", icon: ShieldCheck });
  }

  const initials = (user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const Sidebar = ({ mobile }) => (
    <div className="flex h-full flex-col">
      <Link to="/" className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-600/30">
          <Sparkles size={18} className="text-white" />
        </div>
        <span className="font-display text-lg font-semibold tracking-tight text-white">
          Luminora
        </span>
      </Link>

      <nav className="flex-1 space-y-1">
        {nav.map((item) => (
          <NavItem
            key={item.to}
            item={item}
            active={location.pathname === item.to}
            onClick={mobile ? () => setMobileOpen(false) : undefined}
          />
        ))}
      </nav>

      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs capitalize text-gray-500">{user?.plan} plan</p>
          </div>
        </div>
        <button
          data-testid="logout-button"
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-red-300"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen text-white">
      <Aurora />

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col p-4 lg:flex">
        <div className="glass-strong h-full rounded-2xl p-4">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#030712]/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-display font-semibold">Luminora</span>
        </Link>
        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-gray-300 hover:bg-white/10"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            className="glass-strong absolute left-0 top-0 h-full w-72 p-5"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 text-gray-400"
            >
              <X size={22} />
            </button>
            <Sidebar mobile />
          </motion.div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-white/10 bg-[#030712]/90 px-2 py-2 backdrop-blur-xl lg:hidden">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] ${
                active ? "text-blue-400" : "text-gray-500"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <FloatingOrb onClick={() => navigate("/app/tutor")} />
    </div>
  );
};

export default AppShell;

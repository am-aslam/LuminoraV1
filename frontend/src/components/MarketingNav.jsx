import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Studio", href: "/#studio" },
  { label: "Pricing", href: "/pricing" },
];

export const MarketingNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
    >
      <nav className="glass-strong mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-600/40">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-display text-lg font-semibold text-white">Luminora</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              className="text-sm text-gray-300 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <button
              data-testid="nav-open-app"
              onClick={() => navigate("/app/dashboard")}
              className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Open App
            </button>
          ) : (
            <>
              <button
                data-testid="nav-login"
                onClick={() => navigate("/auth")}
                className="text-sm font-medium text-gray-300 transition hover:text-white"
              >
                Log in
              </button>
              <button
                data-testid="nav-start-trial"
                onClick={() => navigate("/auth?mode=register")}
                className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:brightness-110"
              >
                Start Free Trial
              </button>
            </>
          )}
        </div>

        <button
          className="text-gray-200 md:hidden"
          onClick={() => setOpen(!open)}
          data-testid="marketing-mobile-toggle"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="glass-strong mx-auto mt-2 max-w-6xl space-y-2 rounded-2xl p-4 md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-gray-200 hover:bg-white/10"
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => navigate(user ? "/app/dashboard" : "/auth?mode=register")}
            className="w-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {user ? "Open App" : "Start Free Trial"}
          </button>
        </div>
      )}
    </motion.header>
  );
};

export default MarketingNav;

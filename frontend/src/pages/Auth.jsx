import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Aurora } from "../components/Aurora";
import { AIOrb } from "../components/AIOrb";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState(params.get("mode") === "register" ? "register" : "login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });

  useEffect(() => {
    setMode(params.get("mode") === "register" ? "register" : "login");
  }, [params]);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        await register(form.name, form.email, form.password, form.role);
        toast.success("Welcome to Luminora! Your trial has started.");
      } else {
        await login(form.email, form.password);
        toast.success("Welcome back!");
      }
      navigate("/app/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setMode("login");
    setForm({ ...form, email: "demo@luminora.ai", password: "Demo@123" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10 text-white">
      <Aurora />

      <Link
        to="/"
        className="absolute left-5 top-5 flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft size={16} /> Back home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-strong w-full max-w-md rounded-3xl p-8"
      >
        <div className="mb-6 flex flex-col items-center">
          <AIOrb size={84} active />
          <h1 className="mt-4 font-display text-2xl font-semibold">
            {mode === "register" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {mode === "register"
              ? "Start your 30-day free trial"
              : "Sign in to your AI Learning OS"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-gray-400">
                Full name
              </label>
              <input
                data-testid="auth-name"
                required
                value={form.name}
                onChange={update("name")}
                placeholder="Aarav Sharma"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-blue-500/60 focus:bg-white/10"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-gray-400">
              Email
            </label>
            <input
              data-testid="auth-email"
              required
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-blue-500/60 focus:bg-white/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-gray-400">
              Password
            </label>
            <input
              data-testid="auth-password"
              required
              type="password"
              value={form.password}
              onChange={update("password")}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-blue-500/60 focus:bg-white/10"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-gray-400">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["student", "parent"].map((r) => (
                  <button
                    type="button"
                    key={r}
                    data-testid={`auth-role-${r}`}
                    onClick={() => setForm({ ...form, role: r })}
                    className={`rounded-xl border px-4 py-2.5 text-sm capitalize transition ${
                      form.role === r
                        ? "border-blue-500/60 bg-blue-500/15 text-white"
                        : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            data-testid="auth-submit"
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:brightness-110 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "register" ? "Create account" : "Sign in"}
          </button>
        </form>

        <button
          onClick={fillDemo}
          data-testid="auth-demo"
          className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs text-gray-400 transition hover:text-white"
        >
          Use demo account (demo@luminora.ai)
        </button>

        <p className="mt-6 text-center text-sm text-gray-400">
          {mode === "register" ? "Already have an account?" : "New to Luminora?"}{" "}
          <button
            data-testid="auth-toggle-mode"
            onClick={() => setMode(mode === "register" ? "login" : "register")}
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            {mode === "register" ? "Sign in" : "Create account"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

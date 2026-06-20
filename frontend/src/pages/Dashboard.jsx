import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  Flame,
  BookOpen,
  Clock,
  Target,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import api from "../lib/api";
import { StatRing } from "../components/StatRing";
import { ProfileBadge } from "../components/ProfileBadge";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5 } }),
};

const SubjectIcon = { heart: "❤", dna: "🧬", solar_system: "🪐", atom: "⚛", brain: "🧠" };

const MetricCard = ({ icon: Icon, label, value, sub, color, i }) => (
  <motion.div variants={fade} initial="hidden" animate="show" custom={i} className="glass glass-hover rounded-2xl p-5">
    <div className="mb-3 flex items-center justify-between">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="font-display text-2xl font-bold">{value}</p>
    <p className="text-sm text-gray-400">{label}</p>
    {sub && <p className="mt-1 text-xs text-emerald-400">{sub}</p>}
  </motion.div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard").then(({ data }) => setData(data)).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="shimmer h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const { stats, recommended, recent_lessons, user } = data;
  const goalPct = stats.goals_total ? Math.round((stats.goals_done / stats.goals_total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome / AI Insight */}
      <motion.div variants={fade} initial="hidden" animate="show" className="glass-strong glow-border relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-400">Welcome back,</p>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">{user.name?.split(" ")[0]} 👋</h1>
            <div className="mt-3"><ProfileBadge /></div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 max-w-lg">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
                <Sparkles size={15} className="text-white" />
              </div>
              <p className="text-sm leading-relaxed text-gray-300">
                <b className="text-white">AI Insight:</b> You're on a {stats.study_streak}-day streak. Focus on{" "}
                <span className="text-violet-300">{stats.weak_topics?.[0]?.topic || "your weak topics"}</span> today to boost your readiness score fastest.
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <StatRing value={stats.readiness_score} size={130} label="AI Readiness" color="#10B981" />
          </div>
        </div>
      </motion.div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard i={0} icon={Flame} label="Study streak" value={`${stats.study_streak} days`} sub="Keep it alive!" color="bg-gradient-to-br from-orange-500 to-red-500" />
        <MetricCard i={1} icon={BookOpen} label="Lessons completed" value={stats.lessons_completed} color="bg-gradient-to-br from-blue-500 to-cyan-500" />
        <MetricCard i={2} icon={Clock} label="Minutes studied" value={stats.minutes_studied} color="bg-gradient-to-br from-violet-500 to-purple-500" />
        <MetricCard i={3} icon={Target} label="Today's goals" value={`${stats.goals_done}/${stats.goals_total}`} sub={`${goalPct}% complete`} color="bg-gradient-to-br from-emerald-500 to-teal-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly progress chart */}
        <motion.div variants={fade} initial="hidden" animate="show" custom={1} className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Learning progress</h3>
              <p className="text-sm text-gray-500">Minutes studied this week</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              <TrendingUp size={13} /> +18%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.weekly_progress}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#0A0F1C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }}
                cursor={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <Area type="monotone" dataKey="minutes" stroke="#A78BFA" strokeWidth={2.5} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Weak topics */}
        <motion.div variants={fade} initial="hidden" animate="show" custom={2} className="glass rounded-2xl p-6">
          <h3 className="mb-4 font-display text-lg font-semibold">Weak topics</h3>
          <div className="space-y-4">
            {stats.weak_topics?.map((t) => (
              <div key={t.topic}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-gray-300">{t.topic}</span>
                  <span className="text-gray-500">{t.mastery}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${t.mastery}%` }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500"
                  />
                </div>
              </div>
            ))}
            <Link to="/app/exam" className="mt-2 flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
              Practice weak topics <ArrowUpRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Recommended lessons */}
      <motion.div variants={fade} initial="hidden" animate="show" custom={3}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Recommended for you</h3>
          <Link to="/app/studio" className="text-sm text-blue-400 hover:text-blue-300">Open Studio</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recommended.map((r, i) => (
            <Link
              key={i}
              to={`/app/studio?topic=${encodeURIComponent(r.title)}`}
              data-testid={`recommended-${i}`}
              className="glass glass-hover rounded-2xl p-5"
            >
              <div className="mb-3 text-3xl">{SubjectIcon[r.model3d] || "✨"}</div>
              <h4 className="font-medium">{r.title}</h4>
              <p className="mt-1 text-xs text-gray-500">{r.subject} · {r.minutes} min</p>
            </Link>
          ))}
        </div>
      </motion.div>

      {recent_lessons?.length > 0 && (
        <motion.div variants={fade} initial="hidden" animate="show" custom={4}>
          <h3 className="mb-4 font-display text-lg font-semibold">Continue learning</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent_lessons.map((l) => (
              <div key={l.id} className="glass rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wider text-cyan-400">{l.subject}</p>
                <h4 className="mt-1 font-medium">{l.title}</h4>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

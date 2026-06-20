import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Compass, Loader2, Sparkles, GraduationCap, TrendingUp, Map } from "lucide-react";
import api from "../lib/api";
import { ProfileBadge } from "../components/ProfileBadge";

const EXAMPLES = ["I love biology and helping people", "I enjoy coding and building things", "I'm fascinated by space and physics"];

export default function Career() {
  const [interests, setInterests] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const advise = async (text) => {
    const q = text || interests;
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post("/career/advise", { interests: q });
      setResult(data);
    } catch {
      toast.error("Could not analyze. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">AI Career Advisor</p>
          <h1 className="font-display text-3xl font-semibold">Discover your future</h1>
        </div>
        <ProfileBadge />
      </div>

      <div className="glass-strong glow-border rounded-2xl p-5">
        <textarea
          data-testid="career-input"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="Tell me about your interests, strengths and dreams…"
          rows={3}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-blue-500/60"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {EXAMPLES.map((e) => (
            <button key={e} onClick={() => { setInterests(e); advise(e); }} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400 hover:text-white">
              {e}
            </button>
          ))}
          <button
            data-testid="career-analyze"
            onClick={() => advise()}
            disabled={loading}
            className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Compass size={16} />}
            Analyze
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 size={32} className="animate-spin text-violet-400" />
          <p className="text-sm text-gray-400">Mapping your future…</p>
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="mt-0.5 text-violet-400" />
              <p className="text-gray-300">{result.summary}</p>
            </div>
          </div>

          {/* Careers */}
          <div>
            <h3 className="mb-3 font-display text-lg font-semibold">Recommended careers</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {result.careers?.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass glass-hover rounded-2xl p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-display font-semibold">{c.title}</h4>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300">{c.match}% match</span>
                  </div>
                  <p className="text-sm text-gray-400">{c.description}</p>
                  <p className="mt-3 text-sm font-medium text-cyan-300">{c.salary_range}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Degrees */}
            <div className="glass rounded-2xl p-6">
              <div className="mb-3 flex items-center gap-2">
                <GraduationCap size={18} className="text-blue-400" />
                <h3 className="font-display text-lg font-semibold">Recommended degrees</h3>
              </div>
              <ul className="space-y-2">
                {result.degrees?.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" /> {d}
                  </li>
                ))}
              </ul>
            </div>

            {/* Skill gaps */}
            <div className="glass rounded-2xl p-6">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-violet-400" />
                <h3 className="font-display text-lg font-semibold">Skill gap analysis</h3>
              </div>
              <div className="space-y-4">
                {result.skill_gaps?.map((s, i) => (
                  <div key={i}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-gray-300">{s.skill}</span>
                      <span className="text-gray-500">{s.current}% → {s.target}%</span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-white/5">
                      <div className="absolute h-full rounded-full bg-white/15" style={{ width: `${s.target}%` }} />
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.current}%` }} transition={{ duration: 1 }} className="absolute h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Roadmap */}
          <div className="glass rounded-2xl p-6">
            <div className="mb-5 flex items-center gap-2">
              <Map size={18} className="text-cyan-400" />
              <h3 className="font-display text-lg font-semibold">Your roadmap</h3>
            </div>
            <div className="relative space-y-6 pl-6">
              <div className="absolute left-[7px] top-2 h-full w-px bg-gradient-to-b from-blue-500 via-violet-500 to-transparent" />
              {result.roadmap?.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="relative">
                  <span className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#030712] bg-gradient-to-br from-blue-500 to-violet-500" />
                  <p className="text-xs uppercase tracking-wider text-cyan-400">{r.phase}</p>
                  <p className="font-medium">{r.focus}</p>
                  <ul className="mt-1.5 space-y-1">
                    {r.milestones?.map((m, j) => (
                      <li key={j} className="text-sm text-gray-400">• {m}</li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

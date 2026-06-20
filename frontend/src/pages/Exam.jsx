import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2,
  Clock,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  RefreshCw,
  Target,
} from "lucide-react";
import api from "../lib/api";
import { StatRing } from "../components/StatRing";
import { ProfileBadge } from "../components/ProfileBadge";

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function Exam() {
  const [phase, setPhase] = useState("setup");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (phase !== "exam") return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          submit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startExam = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/exam/generate", { topic, count });
      setExam(data);
      setAnswers({});
      setIdx(0);
      setTimeLeft(data.questions.length * 60);
      setPhase("exam");
    } catch {
      toast.error("Could not generate exam.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    try {
      const { data } = await api.post("/exam/submit", { exam_id: exam.id, answers });
      setResult(data);
      setPhase("result");
    } catch {
      toast.error("Submit failed");
    }
  };

  const reset = () => {
    setPhase("setup");
    setExam(null);
    setResult(null);
    setTopic("");
  };

  /* ---------- SETUP ---------- */
  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600">
            <FileCheck2 size={26} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-semibold">AI Exam Engine</h1>
          <p className="mt-2 text-gray-400">Generate a focused exam on any topic and get an instant improvement plan.</p>
          <div className="mt-4 flex justify-center">
            <ProfileBadge />
          </div>
        </div>

        <div className="glass-strong space-y-5 rounded-2xl p-6">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-gray-400">Topic</label>
            <input
              data-testid="exam-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, Trigonometry, Indian Constitution"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-blue-500/60"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-gray-400">Questions</label>
            <div className="flex gap-2">
              {[5, 8, 10].map((n) => (
                <button
                  key={n}
                  data-testid={`exam-count-${n}`}
                  onClick={() => setCount(n)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm transition ${
                    count === n ? "border-blue-500/60 bg-blue-500/15 text-white" : "border-white/10 bg-white/5 text-gray-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button
            data-testid="exam-start"
            onClick={startExam}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <FileCheck2 size={16} />}
            {loading ? "Generating exam…" : "Start exam"}
          </button>
        </div>
      </div>
    );
  }

  /* ---------- EXAM ---------- */
  if (phase === "exam" && exam) {
    const q = exam.questions[idx];
    const answered = Object.keys(answers).length;
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="glass-strong flex items-center justify-between rounded-2xl p-4">
          <span className="text-sm text-gray-400">{exam.topic}</span>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-mono ${timeLeft < 30 ? "bg-red-500/20 text-red-300" : "bg-white/10 text-white"}`}>
            <Clock size={15} /> {fmt(timeLeft)}
          </div>
        </div>

        {/* progress */}
        <div className="h-2 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all" style={{ width: `${((idx + 1) / exam.questions.length) * 100}%` }} />
        </div>

        {/* navigator */}
        <div className="flex flex-wrap gap-2">
          {exam.questions.map((qq, i) => (
            <button
              key={qq.id}
              onClick={() => setIdx(i)}
              className={`h-8 w-8 rounded-lg text-xs font-medium transition ${
                i === idx ? "bg-blue-600 text-white" : answers[qq.id] !== undefined ? "bg-emerald-500/30 text-emerald-200" : "bg-white/5 text-gray-400"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-6">
          <p className="mb-1 text-xs uppercase tracking-wider text-cyan-400">Question {idx + 1} of {exam.questions.length}</p>
          <h3 className="mb-5 font-display text-xl font-medium">{q.question}</h3>
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                data-testid={`exam-option-${i}`}
                onClick={() => setAnswers({ ...answers, [q.id]: i })}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                  answers[q.id] === i ? "border-blue-500/60 bg-blue-500/15 text-white" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${answers[q.id] === i ? "bg-blue-600 text-white" : "bg-white/10"}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="flex items-center justify-between">
          <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm disabled:opacity-40">
            <ChevronLeft size={16} /> Prev
          </button>
          {idx === exam.questions.length - 1 ? (
            <button data-testid="exam-submit" onClick={submit} className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white">
              Submit ({answered}/{exam.questions.length})
            </button>
          ) : (
            <button onClick={() => setIdx(Math.min(exam.questions.length - 1, idx + 1))} className="flex items-center gap-1 rounded-xl bg-white/10 px-4 py-2.5 text-sm">
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ---------- RESULT ---------- */
  if (phase === "result" && result) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="glass-strong glow-border flex flex-col items-center gap-4 rounded-3xl p-8 text-center">
          <StatRing value={result.score} size={140} label="Score" color={result.score >= 60 ? "#10B981" : "#F59E0B"} />
          <h2 className="font-display text-2xl font-semibold">
            {result.score >= 80 ? "Outstanding! 🎉" : result.score >= 60 ? "Well done! 👏" : "Keep practising 💪"}
          </h2>
          <p className="text-gray-400">You got {result.correct} of {result.total} correct on <b className="text-white">{result.topic}</b>.</p>
        </div>

        {result.weak_topics?.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <div className="mb-3 flex items-center gap-2">
              <Target size={18} className="text-amber-400" />
              <h3 className="font-display text-lg font-semibold">Improvement plan</h3>
            </div>
            <p className="text-sm text-gray-400">Focus next on:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.weak_topics.map((t) => (
                <span key={t} className="rounded-full bg-amber-500/15 px-3 py-1.5 text-sm text-amber-300">{t}</span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold">Performance breakdown</h3>
          {result.breakdown.map((b, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${b.is_correct ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                  {b.is_correct ? <Check size={14} /> : <X size={14} />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{b.question}</p>
                  <p className="mt-1.5 text-sm text-emerald-400">✓ {b.options[b.correct_index]}</p>
                  {!b.is_correct && b.selected !== undefined && b.selected !== null && (
                    <p className="text-sm text-red-400">✗ Your answer: {b.options[b.selected]}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{b.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={reset} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white">
          <RefreshCw size={16} /> Take another exam
        </button>
      </div>
    );
  }

  return null;
}

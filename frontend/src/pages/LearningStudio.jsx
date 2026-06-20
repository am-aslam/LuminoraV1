import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  Send,
  Target,
  BookOpen,
  Lightbulb,
  Layers,
  ScrollText,
  RotateCw,
} from "lucide-react";
import api from "../lib/api";
import { LearningScene } from "../components/three/LearningScene";
import { ProfileBadge } from "../components/ProfileBadge";

const SUGGESTIONS = [
  "The Human Heart",
  "How DNA replication works",
  "The Solar System",
  "Atomic structure & bonding",
  "Newton's Laws of Motion",
];

const Flashcard = ({ card }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      onClick={() => setFlipped(!flipped)}
      data-testid="flashcard"
      className="glass glass-hover relative h-32 w-full rounded-2xl p-5 text-left"
    >
      <p className="text-[10px] uppercase tracking-wider text-cyan-400">
        {flipped ? "Answer" : "Question"}
      </p>
      <p className="mt-1.5 text-sm text-gray-200">{flipped ? card.back : card.front}</p>
      <RotateCw size={14} className="absolute bottom-3 right-3 text-gray-600" />
    </button>
  );
};

const Section = ({ icon: Icon, title, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="glass rounded-2xl p-6"
  >
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-600/20 ring-1 ring-white/10">
        <Icon size={16} className="text-blue-300" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
    </div>
    {children}
  </motion.div>
);

export default function LearningStudio() {
  const [params] = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);
  const resultRef = useRef(null);

  const generate = async (topic) => {
    const q = topic || prompt;
    if (!q.trim()) return;
    setLoading(true);
    setLesson(null);
    setSelectedPart(null);
    setExplanation("");
    try {
      const { data } = await api.post("/studio/generate", { prompt: q });
      setLesson(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      toast.error("Could not generate lesson. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const topic = params.get("topic");
    if (topic) {
      setPrompt(topic);
      generate(topic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePartClick = async (part) => {
    if (!lesson) return;
    setSelectedPart(part);
    setExplaining(true);
    setExplanation("");
    try {
      const { data } = await api.post("/studio/explain-part", {
        model: lesson.model3d,
        part,
        topic: lesson.title,
      });
      setExplanation(data.explanation);
    } catch {
      setExplanation("Could not load explanation.");
    } finally {
      setExplaining(false);
    }
  };

  const has3d = lesson && lesson.model3d && lesson.model3d !== "none";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">AI Learning Studio</p>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">What would you like to learn today?</h1>
        </div>
        <ProfileBadge />
      </div>

      {/* Prompt */}
      <div className="glass-strong glow-border rounded-2xl p-2">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="ml-3 text-violet-400" />
          <input
            data-testid="studio-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="Teach me anything — e.g. the human heart, photosynthesis, integrals…"
            className="flex-1 bg-transparent px-2 py-3 text-sm text-white placeholder-gray-500 outline-none"
          />
          <button
            data-testid="studio-generate"
            onClick={() => generate()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Generate
          </button>
        </div>
      </div>

      {!lesson && !loading && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              data-testid={`suggestion-${s}`}
              onClick={() => {
                setPrompt(s);
                generate(s);
              }}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 size={36} className="animate-spin text-violet-400" />
          <p className="text-sm text-gray-400">Luminora is crafting your lesson…</p>
        </div>
      )}

      <AnimatePresence>
        {lesson && (
          <motion.div ref={resultRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs text-blue-300">{lesson.subject}</span>
              <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-300">{lesson.difficulty}</span>
              <span className="text-xs text-gray-500">{lesson.read_minutes} min read</span>
            </div>
            <h2 className="font-display text-3xl font-semibold">{lesson.title}</h2>

            <div className={`grid gap-6 ${has3d ? "lg:grid-cols-2" : ""}`}>
              {/* Left: content */}
              <div className="space-y-6">
                <Section icon={Target} title="Learning objectives">
                  <ul className="space-y-2">
                    {lesson.objectives?.map((o, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section icon={BookOpen} title="Lesson" delay={0.05}>
                  <div className="space-y-4">
                    {lesson.sections?.map((s, i) => (
                      <div key={i}>
                        <h4 className="mb-1 font-medium text-white">{s.heading}</h4>
                        <p className="text-sm leading-relaxed text-gray-400">{s.content}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              {/* Right: 3D model */}
              {has3d && (
                <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                  <div className="glass-strong relative h-[380px] overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-violet-600/10 to-cyan-600/10" />
                    <LearningScene model={lesson.model3d} onSelect={handlePartClick} />
                    <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-gray-500">
                      Drag to rotate · click any part to ask the AI
                    </p>
                  </div>

                  <AnimatePresence mode="wait">
                    {selectedPart && (
                      <motion.div
                        key={selectedPart}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="glass rounded-2xl p-5"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
                            <Sparkles size={13} className="text-white" />
                          </div>
                          <p className="font-display font-semibold">{selectedPart}</p>
                        </div>
                        {explaining ? (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Loader2 size={14} className="animate-spin" /> AI is explaining…
                          </div>
                        ) : (
                          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-300">{explanation}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Examples */}
            <Section icon={Lightbulb} title="Examples">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lesson.examples?.map((ex, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">{ex}</div>
                ))}
              </div>
            </Section>

            {/* Flashcards */}
            <Section icon={Layers} title="Flashcards">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lesson.flashcards?.map((c, i) => (
                  <Flashcard key={i} card={c} />
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">Tap a card to flip it.</p>
            </Section>

            {/* Summary + revision */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Section icon={Sparkles} title="Summary">
                <p className="text-sm leading-relaxed text-gray-300">{lesson.summary}</p>
              </Section>
              <Section icon={ScrollText} title="Revision notes">
                <ul className="space-y-2">
                  {lesson.revision_notes?.map((n, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                      {n}
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  MessageSquare,
  FileCheck2,
  CalendarDays,
  Compass,
  BarChart3,
  Play,
  ArrowRight,
  Atom,
  Heart,
  Dna,
} from "lucide-react";
import { Aurora } from "../components/Aurora";
import { AIOrb } from "../components/AIOrb";
import { MarketingNav } from "../components/MarketingNav";
import { LearningScene } from "../components/three/LearningScene";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const FEATURES = [
  { icon: Sparkles, title: "AI Learning Studio", desc: "Type any topic — get a complete lesson, examples, flashcards and an interactive 3D model in seconds.", span: "md:col-span-2" },
  { icon: MessageSquare, title: "AI Tutor", desc: "A personal tutor that streams answers, remembers you and adapts to how you learn.", span: "" },
  { icon: Brain, title: "AI Readiness Score", desc: "Always know exactly how exam-ready you are.", span: "" },
  { icon: FileCheck2, title: "AI Exam Engine", desc: "Generate focused exams, get instant breakdowns and an improvement plan.", span: "" },
  { icon: Compass, title: "AI Career Advisor", desc: "Map your interests to careers, degrees, salaries and a personal roadmap.", span: "md:col-span-2" },
];

const MODEL_TABS = [
  { key: "heart", label: "Human Heart", icon: Heart },
  { key: "dna", label: "DNA", icon: Dna },
  { key: "solar_system", label: "Solar System", icon: Sparkles },
  { key: "atom", label: "Atom", icon: Atom },
];

export default function Landing() {
  const navigate = useNavigate();
  const [model, setModel] = useState("heart");
  const [selected, setSelected] = useState(null);

  return (
    <div className="relative min-h-screen overflow-x-hidden text-white">
      <Aurora />
      <MarketingNav />

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-5 pt-36 pb-24 lg:pt-44">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400" />
              The AI-native Learning Operating System
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl"
            >
              Your Personal <span className="text-gradient-brand">AI Teacher</span> for Life
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-6 max-w-md text-lg leading-relaxed text-gray-400"
            >
              Learn anything. Understand everything. Master faster with an AI that
              truly understands how you learn.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <button
                data-testid="hero-start-trial"
                onClick={() => navigate("/auth?mode=register")}
                className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/30 transition hover:brightness-110"
              >
                Start Free Trial
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button
                data-testid="hero-watch-demo"
                onClick={() => navigate("/auth")}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <Play size={15} className="text-cyan-400" />
                Watch AI Demo
              </button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-10 flex items-center gap-6 text-sm text-gray-500"
            >
              <span><b className="text-white">30-day</b> free trial</span>
              <span className="h-4 w-px bg-white/15" />
              <span>No card required</span>
              <span className="h-4 w-px bg-white/15" />
              <span><b className="text-white">12k+</b> learners</span>
            </motion.div>
          </div>

          {/* Hero visual */}
          <div className="relative flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <AIOrb size={300} active />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30, y: -10 }}
              animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
              transition={{ x: { duration: 0.7, delay: 0.5 }, y: { duration: 5, repeat: Infinity } }}
              className="glass-strong absolute -left-2 top-6 rounded-2xl p-4 lg:-left-10"
            >
              <p className="text-xs text-gray-400">AI Readiness</p>
              <p className="font-display text-2xl font-semibold text-emerald-400">84%</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: [0, 10, 0] }}
              transition={{ x: { duration: 0.7, delay: 0.6 }, y: { duration: 6, repeat: Infinity } }}
              className="glass-strong absolute -right-2 bottom-10 max-w-[200px] rounded-2xl p-4 lg:-right-8"
            >
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600">
                  <Sparkles size={12} />
                </div>
                <p className="text-xs font-medium">Luminora</p>
              </div>
              <p className="text-xs leading-relaxed text-gray-300">
                "The left ventricle pumps oxygen-rich blood to your whole body…"
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.25em] text-gray-600">
          Built for the next generation of learners
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-50">
          {["Stanford", "MIT", "IIT", "NEET", "JEE", "CBSE"].map((n) => (
            <span key={n} className="font-display text-lg font-semibold tracking-tight text-gray-400">
              {n}
            </span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mb-12 max-w-2xl"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-cyan-400">The platform</p>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            One AI that handles your entire learning journey
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className={`glass glass-hover rounded-2xl p-6 ${f.span}`}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 ring-1 ring-white/10">
                  <Icon size={20} className="text-blue-300" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3D STUDIO PREVIEW */}
      <section id="studio" className="mx-auto max-w-6xl px-5 py-20">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.25em] text-violet-400">
                Interactive 3D learning
              </p>
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">
                Don't just read it. <br />
                <span className="text-gradient-brand">Explore it.</span>
              </h2>
              <p className="mt-4 max-w-md text-gray-400">
                Every lesson can come alive in 3D. Rotate, zoom and click any part —
                the AI explains it in real time.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {MODEL_TABS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      data-testid={`model-tab-${t.key}`}
                      onClick={() => {
                        setModel(t.key);
                        setSelected(null);
                      }}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                        model === t.key
                          ? "bg-white/15 text-white ring-1 ring-white/20"
                          : "bg-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      <Icon size={15} />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {selected && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-xs uppercase tracking-wider text-cyan-400">You clicked</p>
                  <p className="font-display text-lg font-semibold">{selected}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Sign in to hear the AI explain this part in real time.
                  </p>
                </motion.div>
              )}
            </div>

            <div className="relative h-[340px] sm:h-[420px]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-600/10 via-violet-600/10 to-cyan-600/10" />
              <LearningScene model={model} onSelect={setSelected} />
              <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-gray-500">
                Drag to rotate · scroll to zoom · click a part
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-5 py-24 text-center">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <h2 className="font-display text-3xl font-semibold sm:text-5xl">
            The future of learning is <span className="text-gradient-brand">personal</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-gray-400">
            Join thousands of learners mastering faster with their own AI teacher.
          </p>
          <button
            data-testid="cta-start-trial"
            onClick={() => navigate("/auth?mode=register")}
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-600/30 transition hover:brightness-110"
          >
            Start your 30-day free trial
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
              <Sparkles size={15} className="text-white" />
            </div>
            <span className="font-display font-semibold">Luminora Learning</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <a href="#features" className="hover:text-white">Features</a>
            <Link to="/auth" className="hover:text-white">Sign in</Link>
          </div>
          <p className="text-xs text-gray-600">© 2026 Luminora. The AI Learning OS.</p>
        </div>
      </footer>
    </div>
  );
}

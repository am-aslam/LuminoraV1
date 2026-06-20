import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  GraduationCap,
  Globe,
  Languages,
  Target,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Aurora } from "../components/Aurora";
import { AIOrb } from "../components/AIOrb";

const Chip = ({ active, onClick, children, testid }) => (
  <button
    type="button"
    data-testid={testid}
    onClick={onClick}
    className={`rounded-xl border px-4 py-2.5 text-sm transition ${
      active
        ? "border-blue-500/60 bg-blue-500/15 text-white"
        : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
    }`}
  >
    {children}
  </button>
);

/**
 * Academic onboarding wizard. Reused as an editor at /app/profile via `edit`.
 */
export default function Onboarding({ edit = false }) {
  const navigate = useNavigate();
  const { user, updateAcademicProfile } = useAuth();
  const [options, setOptions] = useState(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    country: user?.country || "India",
    grade: user?.grade || "",
    exam_target: user?.exam_target || "None",
    board: user?.board || "",
    language: user?.language || "English",
    learning_level: user?.learning_level || "Standard",
  });

  useEffect(() => {
    api.get("/academic/options").then(({ data }) => setOptions(data)).catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const boards = useMemo(() => {
    if (!options) return [];
    return [
      { group: "Indian Boards", items: options.india_boards },
      { group: "International", items: options.international_boards },
    ];
  }, [options]);

  const steps = [
    { title: "Where are you studying?", icon: Globe },
    { title: "Your grade & exam goal", icon: GraduationCap },
    { title: "Your board / curriculum", icon: Target },
    { title: "Language & depth", icon: Languages },
  ];

  const canNext = () => {
    if (step === 1) return !!form.grade;
    if (step === 2) return !!form.board;
    return true;
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateAcademicProfile(form);
      toast.success(edit ? "Profile updated" : "Your AI is now tailored to you!");
      navigate("/app/dashboard");
    } catch {
      toast.error("Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  if (!options) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712]">
        <Loader2 className="animate-spin text-violet-400" />
      </div>
    );
  }

  const StepIcon = steps[step].icon;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10 text-white">
      <Aurora />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong w-full max-w-2xl rounded-3xl p-6 sm:p-8"
      >
        {/* header */}
        <div className="mb-6 flex items-center gap-4">
          <AIOrb size={56} active />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
              {edit ? "Academic profile" : "Let's personalize your AI"}
            </p>
            <h1 className="font-display text-2xl font-semibold">
              {user?.name?.split(" ")[0]
                ? `Welcome, ${user.name.split(" ")[0]}`
                : "Build your academic profile"}
            </h1>
          </div>
        </div>

        {/* progress */}
        <div className="mb-7 flex gap-2">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition ${
                i <= step ? "bg-gradient-to-r from-blue-500 to-violet-500" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <StepIcon size={16} className="text-blue-300" /> {steps[step].title}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="min-h-[220px]"
          >
            {step === 0 && (
              <div className="flex flex-wrap gap-2.5">
                {options.countries.map((c) => (
                  <Chip key={c} active={form.country === c} onClick={() => set("country", c)} testid={`onb-country-${c}`}>
                    {c}
                  </Chip>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">School grade</p>
                  <div className="flex flex-wrap gap-2.5">
                    {options.grades.map((g) => (
                      <Chip key={g} active={form.grade === g} onClick={() => set("grade", g)} testid={`onb-grade-${g}`}>
                        {g}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">Higher education</p>
                  <div className="flex flex-wrap gap-2.5">
                    {options.higher_ed.map((g) => (
                      <Chip key={g} active={form.grade === g} onClick={() => set("grade", g)} testid={`onb-grade-${g}`}>
                        {g}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">Target exam (optional)</p>
                  <div className="flex flex-wrap gap-2.5">
                    {options.exams.map((e) => (
                      <Chip key={e} active={form.exam_target === e} onClick={() => set("exam_target", e)} testid={`onb-exam-${e}`}>
                        {e === "None" ? "No specific exam" : e}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                {boards.map((b) => (
                  <div key={b.group}>
                    <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">{b.group}</p>
                    <div className="flex flex-wrap gap-2.5">
                      {b.items.map((board) => (
                        <Chip key={board} active={form.board === board} onClick={() => set("board", board)} testid={`onb-board-${board}`}>
                          {board}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">Learning language</p>
                  <div className="flex flex-wrap gap-2.5">
                    {options.languages.map((l) => (
                      <Chip key={l} active={form.language === l} onClick={() => set("language", l)} testid={`onb-language-${l}`}>
                        {l}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">Learning depth</p>
                  <div className="flex flex-wrap gap-2.5">
                    {options.learning_levels.map((lv) => (
                      <Chip key={lv} active={form.learning_level === lv} onClick={() => set("learning_level", lv)} testid={`onb-level-${lv}`}>
                        {lv}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* nav */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => (step === 0 ? (edit ? navigate("/app/dashboard") : null) : setStep(step - 1))}
            disabled={step === 0 && !edit}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/10 disabled:opacity-30"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {step < steps.length - 1 ? (
            <button
              data-testid="onb-next"
              onClick={() => canNext() && setStep(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              data-testid="onb-finish"
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {edit ? "Save profile" : "Start learning"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  CalendarDays,
  CalendarClock,
  Check,
} from "lucide-react";
import api from "../lib/api";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";

const TYPES = [
  { key: "study", label: "Study", color: "bg-blue-500" },
  { key: "revision", label: "Revision", color: "bg-violet-500" },
  { key: "exam", label: "Exam", color: "bg-red-500" },
  { key: "goal", label: "Goal", color: "bg-emerald-500" },
];

const typeOf = (k) => TYPES.find((t) => t.key === k) || TYPES[0];

export default function Planner() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("study");
  const [date, setDate] = useState(new Date());

  const load = async () => {
    const { data } = await api.get("/planner");
    setTasks(data);
  };
  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!title.trim()) {
      toast.error("Add a task title");
      return;
    }
    await api.post("/planner", { title, type, date: date.toISOString() });
    setTitle("");
    toast.success("Task added");
    load();
  };

  const toggle = async (id) => {
    await api.put(`/planner/${id}`);
    load();
  };

  const remove = async (id) => {
    await api.delete(`/planner/${id}`);
    load();
  };

  const nextExam = useMemo(() => {
    const exams = tasks
      .filter((t) => t.type === "exam" && !t.done)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return exams[0];
  }, [tasks]);

  const grouped = useMemo(() => {
    const map = {};
    [...tasks]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((t) => {
        const key = format(new Date(t.date), "EEE, dd MMM yyyy");
        (map[key] = map[key] || []).push(t);
      });
    return map;
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">Study Planner</p>
        <h1 className="font-display text-3xl font-semibold">Plan your path to mastery</h1>
      </div>

      {nextExam && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong glow-border flex items-center gap-4 rounded-2xl p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
            <CalendarClock size={22} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Next exam countdown</p>
            <p className="font-display text-xl font-semibold">
              {nextExam.title} · {Math.max(0, differenceInCalendarDays(new Date(nextExam.date), new Date()))} days left
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add task */}
        <div className="glass-strong h-fit space-y-4 rounded-2xl p-5">
          <h3 className="font-display text-lg font-semibold">Add to plan</h3>
          <input
            data-testid="planner-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Revise Organic Chemistry"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-blue-500/60"
          />
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
                  type === t.key ? "bg-white/15 text-white ring-1 ring-white/20" : "bg-white/5 text-gray-400"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${t.color}`} /> {t.label}
              </button>
            ))}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button
                data-testid="planner-date"
                className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300"
              >
                <CalendarDays size={16} /> {format(date, "dd MMM yyyy")}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-white/10 bg-[#0A0F1C] p-0">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
            </PopoverContent>
          </Popover>
          <button
            data-testid="planner-add"
            onClick={add}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold"
          >
            <Plus size={16} /> Add task
          </button>
        </div>

        {/* Task list */}
        <div className="space-y-5 lg:col-span-2">
          {Object.keys(grouped).length === 0 && (
            <div className="glass flex flex-col items-center justify-center rounded-2xl py-16 text-center">
              <CalendarDays size={34} className="text-gray-600" />
              <p className="mt-3 text-gray-400">Your schedule is empty. Add your first task.</p>
            </div>
          )}
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">{day}</p>
              <div className="space-y-2">
                {items.map((t) => {
                  const tt = typeOf(t.type);
                  return (
                    <motion.div
                      key={t.id}
                      layout
                      className="glass flex items-center gap-3 rounded-xl p-4"
                    >
                      <button
                        data-testid={`planner-toggle-${t.id}`}
                        onClick={() => toggle(t.id)}
                        className={`flex h-6 w-6 items-center justify-center rounded-md border transition ${
                          t.done ? "border-emerald-500 bg-emerald-500" : "border-white/20"
                        }`}
                      >
                        {t.done && <Check size={14} className="text-white" />}
                      </button>
                      <span className={`h-2 w-2 rounded-full ${tt.color}`} />
                      <span className={`flex-1 text-sm ${t.done ? "text-gray-500 line-through" : "text-gray-200"}`}>{t.title}</span>
                      <span className="text-xs capitalize text-gray-500">{t.type}</span>
                      <button onClick={() => remove(t.id)}>
                        <Trash2 size={15} className="text-gray-500 hover:text-red-400" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, Bookmark, Download, NotebookPen, Save } from "lucide-react";
import api from "../lib/api";

const COLORS = [
  { key: "blue", cls: "from-blue-500/30 to-blue-600/10", dot: "bg-blue-500" },
  { key: "violet", cls: "from-violet-500/30 to-violet-600/10", dot: "bg-violet-500" },
  { key: "cyan", cls: "from-cyan-500/30 to-cyan-600/10", dot: "bg-cyan-500" },
  { key: "emerald", cls: "from-emerald-500/30 to-emerald-600/10", dot: "bg-emerald-500" },
  { key: "amber", cls: "from-amber-500/30 to-amber-600/10", dot: "bg-amber-500" },
];

const colorOf = (k) => COLORS.find((c) => c.key === k) || COLORS[0];

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const { data } = await api.get("/notes");
    setNotes(data);
  };
  useEffect(() => {
    load();
  }, []);

  const newNote = () =>
    setEditing({ title: "", content: "", color: "blue", bookmarked: false });

  const save = async () => {
    if (!editing.title.trim()) {
      toast.error("Add a title");
      return;
    }
    if (editing.id) {
      await api.put(`/notes/${editing.id}`, editing);
    } else {
      await api.post("/notes", editing);
    }
    toast.success("Note saved");
    setEditing(null);
    load();
  };

  const remove = async (id, e) => {
    e?.stopPropagation();
    await api.delete(`/notes/${id}`);
    if (editing?.id === id) setEditing(null);
    load();
  };

  const exportNote = (note) => {
    const blob = new Blob([`${note.title}\n\n${note.content}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">Notes Center</p>
          <h1 className="font-display text-3xl font-semibold">Your knowledge, organized</h1>
        </div>
        <button
          data-testid="notes-new"
          onClick={newNote}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={16} /> New note
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notes grid */}
        <div className="lg:col-span-2">
          {notes.length === 0 && !editing && (
            <div className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-center">
              <NotebookPen size={36} className="text-gray-600" />
              <p className="mt-4 text-gray-400">No notes yet. Create your first note.</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {notes.map((n) => {
              const c = colorOf(n.color);
              return (
                <motion.div
                  key={n.id}
                  layout
                  onClick={() => setEditing(n)}
                  data-testid={`note-${n.id}`}
                  className={`glass-hover cursor-pointer rounded-2xl border border-white/10 bg-gradient-to-br ${c.cls} p-5`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-display font-semibold">{n.title}</h3>
                    <div className="flex items-center gap-2">
                      {n.bookmarked && <Bookmark size={15} className="fill-amber-400 text-amber-400" />}
                      <button onClick={(e) => { e.stopPropagation(); exportNote(n); }}>
                        <Download size={15} className="text-gray-400 hover:text-white" />
                      </button>
                      <button onClick={(e) => remove(n.id, e)}>
                        <Trash2 size={15} className="text-gray-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                  <p className="line-clamp-4 text-sm text-gray-300">{n.content || "Empty note"}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Editor */}
        {editing && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-strong h-fit rounded-2xl p-5 lg:sticky lg:top-6">
            <input
              data-testid="note-title"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="Note title"
              className="mb-3 w-full bg-transparent font-display text-xl font-semibold outline-none placeholder-gray-600"
            />
            <textarea
              data-testid="note-content"
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              placeholder="Write your notes…"
              rows={10}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-blue-500/60"
            />
            <div className="mt-4 flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setEditing({ ...editing, color: c.key })}
                  className={`h-6 w-6 rounded-full ${c.dot} ${editing.color === c.key ? "ring-2 ring-white" : ""}`}
                />
              ))}
              <button
                onClick={() => setEditing({ ...editing, bookmarked: !editing.bookmarked })}
                className="ml-auto"
              >
                <Bookmark size={18} className={editing.bookmarked ? "fill-amber-400 text-amber-400" : "text-gray-400"} />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <button data-testid="note-save" onClick={save} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold">
                <Save size={15} /> Save
              </button>
              <button onClick={() => setEditing(null)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

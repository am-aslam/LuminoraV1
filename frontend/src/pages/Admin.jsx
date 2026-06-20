import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Users, IndianRupee, BookOpen, Cpu, TrendingUp } from "lucide-react";
import api from "../lib/api";

const PIE_COLORS = ["#6B7280", "#2563EB", "#06B6D4", "#7C3AED"];

const Stat = ({ icon: Icon, label, value, color, i }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass glass-hover rounded-2xl p-5">
    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    <p className="font-display text-2xl font-bold">{value}</p>
    <p className="text-sm text-gray-400">{label}</p>
  </motion.div>
);

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {});
    api.get("/admin/users").then(({ data }) => setUsers(data)).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}
      </div>
    );
  }

  const pieData = Object.entries(stats.plan_distribution).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">Admin</p>
        <h1 className="font-display text-3xl font-semibold">Platform analytics</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat i={0} icon={Users} label="Total users" value={stats.total_users} color="bg-gradient-to-br from-blue-500 to-cyan-500" />
        <Stat i={1} icon={IndianRupee} label="Monthly revenue" value={`₹${stats.mrr.toLocaleString()}`} color="bg-gradient-to-br from-emerald-500 to-teal-500" />
        <Stat i={2} icon={BookOpen} label="Lessons generated" value={stats.lessons_generated} color="bg-gradient-to-br from-violet-500 to-purple-500" />
        <Stat i={3} icon={Cpu} label="AI calls" value={stats.ai_calls} color="bg-gradient-to-br from-orange-500 to-red-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Growth */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Growth</h3>
            <span className="flex items-center gap-1 text-xs text-emerald-400"><TrendingUp size={13} /> Trending up</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.growth}>
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#0A0F1C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="users" radius={[6, 6, 0, 0]} fill="#7C3AED" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="mb-4 font-display text-lg font-semibold">Subscriptions</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0A0F1C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {pieData.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 capitalize text-gray-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {p.name.replace("_", " ")}
                </span>
                <span className="text-gray-500">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="glass rounded-2xl p-6">
        <h3 className="mb-4 font-display text-lg font-semibold">Recent users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-500">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.slice(0, 12).map((u) => (
                <tr key={u.id} className="text-gray-300">
                  <td className="py-3">{u.name}</td>
                  <td className="py-3 text-gray-500">{u.email}</td>
                  <td className="py-3"><span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs capitalize">{u.role}</span></td>
                  <td className="py-3 capitalize">{u.plan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

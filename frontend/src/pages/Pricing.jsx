import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Aurora } from "../components/Aurora";
import { MarketingNav } from "../components/MarketingNav";

const PLANS = [
  {
    id: "trial",
    name: "Free Trial",
    price: "₹0",
    period: "30 days",
    desc: "Experience the full platform, free.",
    features: ["AI Learning Studio", "AI Tutor (limited)", "Interactive 3D models", "Basic analytics"],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    id: "monthly",
    name: "Monthly",
    price: "₹199",
    period: "/ month",
    desc: "For focused, consistent learners.",
    features: ["Everything in Trial", "Unlimited AI Tutor", "AI Exam Engine", "Study Planner & Notes", "Career Advisor"],
    cta: "Choose Monthly",
    highlight: false,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "₹1999",
    period: "/ year",
    desc: "Best value — 2 months free.",
    features: ["Everything in Monthly", "Priority AI responses", "Advanced analytics", "Parent dashboard", "Early access features"],
    cta: "Choose Yearly",
    highlight: true,
    badge: "Best Value",
  },
  {
    id: "six_months",
    name: "6 Months",
    price: "₹999",
    period: "/ 6 mo",
    desc: "Commit to a full exam season.",
    features: ["Everything in Monthly", "Seasonal study plans", "Mock exam packs", "Progress reports"],
    cta: "Choose 6 Months",
    highlight: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen text-white">
      <Aurora />
      <MarketingNav />

      <section className="mx-auto max-w-6xl px-5 pt-36 pb-24 lg:pt-44">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-cyan-400">Pricing</p>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">
            Invest in <span className="text-gradient-brand">yourself</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-gray-400">
            Start free for 30 days. Upgrade anytime. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-4 md:grid-cols-2">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative flex flex-col rounded-2xl p-6 ${
                plan.highlight
                  ? "glow-border glass-strong scale-[1.03] lg:-mt-3"
                  : "glass glass-hover"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-violet-600/40">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{plan.desc}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="font-display text-4xl font-bold">{plan.price}</span>
                <span className="mb-1 text-sm text-gray-500">{plan.period}</span>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                data-testid={`pricing-select-${plan.id}`}
                onClick={() => navigate("/auth?mode=register")}
                className={`mt-7 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/30 hover:brightness-110"
                    : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Sparkles size={15} className="text-violet-400" />
          All plans include the signature AI Orb and interactive 3D learning.
        </div>
      </section>
    </div>
  );
}

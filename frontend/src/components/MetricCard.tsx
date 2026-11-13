import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
};

export default function MetricCard({ title, value, subtitle, icon }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/30"
    >
      <div className="mb-3 flex items-center justify-between text-slate-400">
        <span className="text-sm">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {subtitle ? <div className="mt-2 text-xs text-slate-400">{subtitle}</div> : null}
    </motion.div>
  );
}

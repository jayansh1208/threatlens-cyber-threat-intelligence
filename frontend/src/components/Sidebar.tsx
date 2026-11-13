import { Activity, AlertTriangle, Database, Globe, LayoutDashboard, Search, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/threats', label: 'Threat Intelligence', icon: Search },
  { to: '/classification', label: 'Classification', icon: ShieldCheck },
  { to: '/sources', label: 'Data Sources', icon: Globe },
  { to: '/database', label: 'Database Analytics', icon: Database },
];

export default function Sidebar() {
  return (
    <aside className="w-full max-w-[260px] border-r border-slate-800 bg-slate-950/80 p-5 text-slate-200">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
          <AlertTriangle size={18} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400">ThreatLens</div>
          <div className="text-sm text-slate-300">CTI Platform</div>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-slate-800 text-cyan-300 ring-1 ring-cyan-500/30' : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
          <Activity size={12} />
          SOC Status
        </div>
        <div className="text-2xl font-bold text-emerald-400">Nominal</div>
        <div className="mt-2 text-sm text-slate-400">MongoDB live feed synchronized</div>
      </div>
    </aside>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { fetchThreats } from '../services/api';

export default function ThreatsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    q: '',
    category: '',
    severity: '',
    year: '',
    source: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10 });

  const loadThreats = () => {
    setLoading(true);
    fetchThreats({
      q: filters.q || undefined,
      category: filters.category || undefined,
      severity: filters.severity || undefined,
      year: filters.year || undefined,
      source: filters.source || undefined,
      page: filters.page,
      limit: filters.limit,
    })
      .then((res) => {
        setItems(res.data.items || []);
        setPagination({ total: res.data.total || 0, page: res.data.page || 1, limit: res.data.limit || 10 });
        setError('');
      })
      .catch(() => setError('Unable to fetch threat intelligence data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadThreats();
  }, [filters.page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(pagination.total / pagination.limit)), [pagination]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, page: 1 }));
    loadThreats();
  };

  const clearFilters = () => {
    setFilters({ q: '', category: '', severity: '', year: '', source: '', page: 1, limit: 10 });
    setTimeout(() => loadThreats(), 10);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">Threat intelligence</div>
          <h1 className="mt-2 text-3xl font-bold text-white">Threat feed</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            value={filters.q}
            onChange={(e) => setFilters((current) => ({ ...current, q: e.target.value }))}
            placeholder="Search reports"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <select value={filters.category} onChange={(e) => setFilters((current) => ({ ...current, category: e.target.value }))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
            <option value="">All categories</option>
            <option value="Malware">Malware</option>
            <option value="Ransomware">Ransomware</option>
            <option value="Phishing">Phishing</option>
            <option value="Vulnerability">Vulnerability</option>
            <option value="Data Breach">Data Breach</option>
            <option value="Advanced Persistent Threat">Advanced Persistent Threat</option>
            <option value="Botnet">Botnet</option>
            <option value="Other">Other</option>
          </select>
          <select value={filters.severity} onChange={(e) => setFilters((current) => ({ ...current, severity: e.target.value }))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
            <option value="">All severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Informational">Informational</option>
          </select>
          <input value={filters.year} onChange={(e) => setFilters((current) => ({ ...current, year: e.target.value }))} placeholder="Year" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          <div className="flex gap-2">
            <button type="submit" className="flex items-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">
              <Search size={14} /> Search
            </button>
            <button type="button" onClick={clearFilters} className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300">
              <X size={14} /> Clear
            </button>
          </div>
        </div>
      </form>

      {error ? <div className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div> : null}

      {loading ? <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-10 text-slate-200">Loading threat reports…</div> : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-slate-300">No threat reports match the current query.</div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row">
                <div>
                  <Link to={`/threats/${item._id}`} className="text-lg font-semibold text-cyan-300 hover:text-cyan-200">{item.title}</Link>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded-full bg-slate-800 px-2 py-1">{item.category || 'Other'}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-1">{item.severity || 'Medium'}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-1">{item.source_name || 'Unknown source'}</span>
                  </div>
                </div>
                <div className="text-sm text-slate-400">{item.published_at || 'Unknown date'}</div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">Showing {items.length} of {pagination.total}</div>
        <div className="flex gap-2">
          <button disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm disabled:opacity-40">Previous</button>
          <button disabled={filters.page >= totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}

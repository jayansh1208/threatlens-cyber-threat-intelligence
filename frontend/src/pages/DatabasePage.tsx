import { useEffect, useState } from 'react';
import { fetchDatabaseCache, fetchDatabaseStats } from '../services/api';

export default function DatabasePage() {
  const [dbStats, setDbStats] = useState<any>({});
  const [cacheStats, setCacheStats] = useState<any>({});

  useEffect(() => {
    Promise.all([fetchDatabaseStats(), fetchDatabaseCache()]).then(([statsRes, cacheRes]) => {
      setDbStats(statsRes.data);
      setCacheStats(cacheRes.data);
    });
  }, []);

  const cache = cacheStats.cache || {};

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">Database analytics</div>
        <h1 className="mt-2 text-3xl font-bold text-white">MongoDB performance and schema analysis</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><div className="text-sm text-slate-400">Collection counts</div><div className="mt-2 text-2xl font-bold text-white">{Object.values(dbStats.collections || {}).reduce((a: number, b: any) => a + Number(b || 0), 0)}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><div className="text-sm text-slate-400">Avg BSON size</div><div className="mt-2 text-2xl font-bold text-white">{dbStats.data_size ? `${Math.round(dbStats.data_size / Math.max(1, dbStats.objects || 1))} B` : 'N/A'}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><div className="text-sm text-slate-400">Max document size</div><div className="mt-2 text-2xl font-bold text-white">16 MB</div></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><div className="text-sm text-slate-400">Working set</div><div className="mt-2 text-2xl font-bold text-white">MongoDB cache</div></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Schema comparison</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>Referenced design: better for unbounded IOC collections and long-lived indicators.</li>
            <li>Embedded design: faster for narrow, bounded metadata like a few tags or summary fields.</li>
            <li>Lab 7.1 demonstrates the 16 MiB BSON document threshold and the trade-offs in query behavior.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Cache monitoring</h2>
          <dl className="space-y-2 text-sm text-slate-300">
            <div className="flex justify-between"><dt>Maximum cache</dt><dd>{cache['maximum bytes configured'] ? `${Math.round(cache['maximum bytes configured'] / 1024 / 1024)} MB` : 'N/A'}</dd></div>
            <div className="flex justify-between"><dt>In cache</dt><dd>{cache['bytes currently in the cache'] ? `${Math.round(cache['bytes currently in the cache'] / 1024 / 1024)} MB` : 'N/A'}</dd></div>
            <div className="flex justify-between"><dt>Dirty bytes</dt><dd>{cache['tracked dirty bytes in the cache'] ?? 'N/A'}</dd></div>
            <div className="flex justify-between"><dt>Pages read</dt><dd>{cache['pages read into cache'] ?? 'N/A'}</dd></div>
            <div className="flex justify-between"><dt>Evictions</dt><dd>{cache['eviction pages evicted by application threads'] ?? 'N/A'}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}

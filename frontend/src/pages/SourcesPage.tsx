import { useEffect, useState } from 'react';
import { importSources, fetchSources } from '../services/api';

export default function SourcesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSources = () => {
    fetchSources()
      .then((res) => setItems(res.data.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleImport = async () => {
    setLoading(true);
    await importSources();
    loadSources();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">Data sources</div>
          <h1 className="mt-2 text-3xl font-bold text-white">Threat intelligence feeds</h1>
        </div>
        <button onClick={handleImport} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950">Import metadata</button>
      </div>

      {loading ? <div className="text-slate-300">Loading sources…</div> : null}

      <div className="grid gap-4">
        {items.map((source) => (
          <div key={source._id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex flex-col justify-between gap-2 md:flex-row">
              <div>
                <div className="text-lg font-semibold text-white">{source.source_name}</div>
                <div className="text-sm text-cyan-300">{source.source_type}</div>
              </div>
              <div className="text-sm text-slate-400">Status: {source.status || 'ready'}</div>
            </div>
            <div className="mt-3 text-sm text-slate-300">
              <a href={source.source_url} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200">{source.source_url}</a>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-slate-300">
              <div>Imported reports: {source.import_count ?? 0}</div>
              <div>Last update: {source.last_updated || 'No timestamp'}</div>
              <div>Source type: {source.source_type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

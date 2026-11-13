import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { fetchThreat } from '../services/api';

export default function ThreatDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchThreat(id)
      .then((res) => setReport(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return <div className="text-slate-300">Missing report ID.</div>;
  if (loading) return <div className="text-slate-300">Loading threat details…</div>;
  if (!report) return <div className="text-slate-300">Threat report not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">Threat report</div>
          <h1 className="mt-2 text-3xl font-bold text-white">{report.title}</h1>
        </div>
        {report.source_url ? (
          <a href={report.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950">
            Original source <ArrowUpRight size={14} />
          </a>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-slate-300 leading-7">{report.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {(report.tags || []).map((tag: string) => (
              <span key={tag} className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200">#{tag}</span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm text-cyan-300"><ShieldCheck size={16} /> Threat metadata</div>
          <dl className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between gap-4"><dt>Publisher</dt><dd>{report.source_name || report.source_id || 'Unknown'}</dd></div>
            <div className="flex justify-between gap-4"><dt>Published</dt><dd>{report.published_at || 'Unspecified'}</dd></div>
            <div className="flex justify-between gap-4"><dt>Category</dt><dd>{report.category || 'Other'}</dd></div>
            <div className="flex justify-between gap-4"><dt>Severity</dt><dd>{report.severity || 'Medium'}</dd></div>
            <div className="flex justify-between gap-4"><dt>Confidence</dt><dd>{report.classification?.confidence ?? 'n/a'}</dd></div>
          </dl>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">Indicators of compromise</h2>
          {report.indicators && report.indicators.length > 0 ? (
            <ul className="space-y-2 text-sm text-slate-300">
              {report.indicators.map((indicator: string) => (
                <li key={indicator} className="rounded-lg bg-slate-950/60 px-3 py-2">{indicator}</li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-400">No indicators attached to this record.</div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">Affected technologies</h2>
          <div className="text-sm text-slate-300">{report.affected_technologies?.length ? report.affected_technologies.join(', ') : 'Not specified in source metadata.'}</div>
        </div>
      </div>

      <Link to="/threats" className="text-cyan-300 hover:text-cyan-200">← Back to all threats</Link>
    </div>
  );
}

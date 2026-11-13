import { useEffect, useState } from 'react';
import { classifyReport, fetchThreats, updateThreatClassification } from '../services/api';

export default function ClassificationPage() {
  const [threats, setThreats] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchThreats({ limit: 20 }).then((res) => {
      const items = res.data.items || [];
      setThreats(items);
      if (items[0]) {
        setSelectedId(items[0]._id);
        setTitle(items[0].title || '');
        setDescription(items[0].description || '');
        setTags((items[0].tags || []).join(', '));
      }
    });
  }, []);

  const handleClassify = async () => {
    const response = await classifyReport({ title, description, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean) });
    setResult(response.data.classification);
    setStatus('Classification complete.');
  };

  const handleSave = async () => {
    if (!selectedId || !result) {
      setStatus('Classify a report before saving.');
      return;
    }
    await updateThreatClassification(selectedId, { classification: result });
    setStatus('Classification saved to MongoDB.');
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">Threat classification</div>
        <h1 className="mt-2 text-3xl font-bold text-white">Rule-based classifier</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <label className="mb-2 block text-sm text-slate-300">Select report</label>
          <select value={selectedId} onChange={(e) => {
            const selected = threats.find((item) => item._id === e.target.value);
            setSelectedId(e.target.value);
            setTitle(selected?.title || '');
            setDescription(selected?.description || '');
            setTags((selected?.tags || []).join(', '));
          }} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
            {threats.map((threat) => (
              <option key={threat._id} value={threat._id}>{threat.title}</option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="min-h-32 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" />
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags, comma-separated" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" />
          <div className="flex gap-3">
            <button onClick={handleClassify} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950">Classify</button>
            <button onClick={handleSave} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200">Save classification</button>
          </div>
        </div>
      </div>

      {result ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">Classification result</h2>
          <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-300">
            <div className="rounded-xl bg-slate-950 p-3"><span className="block text-slate-400">Category</span><strong className="text-white">{result.category}</strong></div>
            <div className="rounded-xl bg-slate-950 p-3"><span className="block text-slate-400">Severity</span><strong className="text-white">{result.severity}</strong></div>
            <div className="rounded-xl bg-slate-950 p-3"><span className="block text-slate-400">Confidence</span><strong className="text-white">{result.confidence}</strong></div>
          </div>
        </div>
      ) : null}

      {status ? <div className="rounded-xl border border-cyan-700 bg-cyan-950/30 p-3 text-sm text-cyan-200">{status}</div> : null}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';

interface AgentInfo {
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  inputs: { key: string; label: string; type: string; options?: string[] }[];
}

const AGENTS: AgentInfo[] = [
  { type: 'growth_strategy', name: 'Growth Strategy', description: 'Analyze performance data and identify growth levers', icon: '📈', color: 'bg-blue-50 border-blue-200', inputs: [{ key: 'brandTone', label: 'Brand Tone', type: 'select', options: ['professional', 'casual', 'playful', 'authoritative', 'empathetic'] }] },
  { type: 'social_media', name: 'Social Media', description: 'Generate weekly content calendar with platform-specific posts', icon: '📱', color: 'bg-green-50 border-green-200', inputs: [
    { key: 'platform', label: 'Platform', type: 'select', options: ['X', 'INSTAGRAM'] },
    { key: 'frequency', label: 'Posts per week', type: 'select', options: ['3', '5', '7', '10', '14'] },
    { key: 'brandTone', label: 'Brand Tone', type: 'select', options: ['professional', 'casual', 'playful', 'authoritative', 'empathetic'] },
  ] },
  { type: 'competitor_intelligence', name: 'Competitor Intel', description: 'Analyze competitors and find positioning gaps', icon: '🔍', color: 'bg-purple-50 border-purple-200', inputs: [
    { key: 'competitors', label: 'Competitor names (comma separated)', type: 'text' },
    { key: 'industry', label: 'Industry (optional)', type: 'text' },
  ] },
  { type: 'seo_geo', name: 'SEO / GEO', description: 'Optimize content for search engines and AI answer engines', icon: '🔎', color: 'bg-yellow-50 border-yellow-200', inputs: [
    { key: 'content', label: 'Content to analyze (optional)', type: 'textarea' },
    { key: 'targetKeywords', label: 'Target keywords (comma separated)', type: 'text' },
  ] },
  { type: 'social_listening', name: 'Social Listening', description: 'Monitor conversations, track trends, detect risks', icon: '👂', color: 'bg-pink-50 border-pink-200', inputs: [
    { key: 'keywords', label: 'Keywords to monitor (comma separated)', type: 'text' },
    { key: 'timeframe', label: 'Timeframe', type: 'select', options: ['24h', '7d', '30d'] },
  ] },
  { type: 'industry_news', name: 'Industry News', description: 'Track news and market developments in your industry', icon: '📰', color: 'bg-orange-50 border-orange-200', inputs: [
    { key: 'industry', label: 'Industry', type: 'text' },
    { key: 'market', label: 'Market', type: 'select', options: ['global', 'us', 'japan', 'europe', 'asia'] },
  ] },
  { type: 'outreach', name: 'Outreach', description: 'Identify partners, influencers, and craft outreach strategy', icon: '🤝', color: 'bg-teal-50 border-teal-200', inputs: [
    { key: 'goal', label: 'Outreach goal', type: 'select', options: ['brand_awareness', 'partnership', 'influencer_collab', 'media_coverage'] },
    { key: 'targets', label: 'Target names (comma separated, optional)', type: 'text' },
  ] },
  { type: 'cvr_optimization', name: 'CVR Optimization', description: 'Analyze conversion funnel and recommend improvements', icon: '🎯', color: 'bg-red-50 border-red-200', inputs: [
    { key: 'targetMetric', label: 'Target metric to optimize', type: 'select', options: ['overall', 'engagement', 'conversion', 'reach'] },
  ] },
];

function AgentCard({ agent, onRun, running }: { agent: AgentInfo; onRun: (type: string, inputs: Record<string, string>) => void; running: boolean }) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-xl border-2 p-5 ${agent.color} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{agent.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-600">{agent.description}</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 text-sm">
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
          {agent.inputs.map((input) => (
            <div key={input.key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{input.label}</label>
              {input.type === 'select' ? (
                <select value={inputs[input.key] || ''} onChange={(e) => setInputs({ ...inputs, [input.key]: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white">
                  <option value="">-- Select --</option>
                  {input.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : input.type === 'textarea' ? (
                <textarea value={inputs[input.key] || ''} onChange={(e) => setInputs({ ...inputs, [input.key]: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" rows={3} />
              ) : (
                <input type="text" value={inputs[input.key] || ''} onChange={(e) => setInputs({ ...inputs, [input.key]: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              )}
            </div>
          ))}
          <button onClick={() => onRun(agent.type, inputs)} disabled={running}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {running ? 'Running...' : '▶ Run Agent'}
          </button>
        </div>
      )}
    </div>
  );
}

function ResultModal({ result, agentName, onClose }: { result: any; agentName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{agentName} Results</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700 font-mono">{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<{ data: any; name: string } | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => { api.getTasks().then(setTasks).catch(() => {}); }, []);

  const handleRun = async (agentType: string, inputs: Record<string, string>) => {
    setRunning(agentType);
    try {
      const parsed: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(inputs)) {
        if (k === 'competitors' && v) parsed[k] = v.split(',').map((s: string) => ({ name: s.trim() }));
        else if (k === 'targets' && v) parsed[k] = v.split(',').map((s: string) => ({ name: s.trim(), type: 'partner' }));
        else if (k === 'keywords' && v) parsed[k] = v.split(',').map((s: string) => s.trim());
        else if (k === 'frequency') parsed[k] = parseInt(v);
        else if (v) parsed[k] = v;
      }
      const res = await api.executeAgent(agentType, parsed);
      setResult({ data: res.result, name: AGENTS.find((a) => a.type === agentType)?.name || agentType });
      setTasks(await api.getTasks());
    } catch (e: any) {
      setResult({ data: { error: e.message || 'Unknown error' }, name: 'Error' });
    } finally {
      setRunning(null);
    }
  };

  const filtered = filter === 'all' ? AGENTS : AGENTS.filter((a) => a.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
          <p className="mt-1 text-sm text-gray-500">Select and run AI agents to automate your marketing strategy</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-brand-500 focus:outline-none">
          <option value="all">All Agents</option>
          {AGENTS.map((a) => <option key={a.type} value={a.type}>{a.name}</option>)}
        </select>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((agent) => (
          <AgentCard key={agent.type} agent={agent} onRun={handleRun} running={running === agent.type} />
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500">No tasks yet. Run an agent above.</p>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 10).map((task: any) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.agentType}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                  task.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{task.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {result && <ResultModal result={result.data} agentName={result.name} onClose={() => setResult(null)} />}
    </div>
  );
}

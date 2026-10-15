import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Conversation, TrendData } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';
import { LoadingSpinner } from '../../components/common/States';
import {
  TrendingUp,
  Activity,
  BarChart2,
  CheckCircle2,
  Info,
  AlertCircle,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ReferenceLine,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export const BehaviourTrends: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('CHAT003'); // Default to Charlie (escalation)
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConvs = async () => {
      try {
        const res = await api.get('/parent/conversations');
        const convs = res.data.conversations || [];
        setConversations(convs);
        if (convs.length > 0 && !selectedConvId) {
          setSelectedConvId(convs[0].conversation_id);
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      }
    };
    fetchConvs();
  }, []);

  useEffect(() => {
    const fetchTrend = async () => {
      if (!selectedConvId) return;
      try {
        setLoading(true);
        const res = await api.get(`/parent/trends/${selectedConvId}`);
        setTrendData(res.data);
      } catch (err) {
        console.error('Failed to load trend data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrend();
  }, [selectedConvId]);

  const selectedConv = conversations.find((c) => c.conversation_id === selectedConvId);

  const historyList = trendData?.risk_history || [];
  const chartHistory = historyList.map((h, i) => {
    let dateStr = '';
    if (h.timestamp) {
      const d = new Date(h.timestamp);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    }
    const isLatest = i === historyList.length - 1;
    return {
      label: isLatest ? 'Latest' : dateStr || `Check #${i + 1}`,
      checkpoint: `Checkpoint #${i + 1}`,
      fullDate: dateStr || `Sample ${i + 1}`,
      score: h.score,
      status: h.score >= 60 ? 'HIGH RISK' : h.score >= 30 ? 'ATTENTION' : 'SAFE',
    };
  });

  const categoryFrequencyData = Object.entries(trendData?.category_frequency || {}).map(
    ([name, count]) => {
      const isSafe = name === 'SAFE';
      const isHigh = ['GROOMING', 'THREAT', 'SELF_HARM', 'SEXUAL_SAFETY'].includes(name);
      return {
        category: name.replace('_', ' '),
        rawCategory: name,
        occurrences: count,
        barColor: isSafe ? '#10b981' : isHigh ? '#ef4444' : '#f59e0b',
        level: isSafe ? 'SAFE' : isHigh ? 'HIGH SEVERITY' : 'MODERATE',
      };
    }
  );

  const getTrendBadge = (trend?: string) => {
    if (trend === 'increasing') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold font-mono bg-red-500/15 text-red-400 border border-red-500/30">
          Escalating Risk ↗
        </span>
      );
    }
    if (trend === 'decreasing') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          De-escalating ↘
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold font-mono bg-blue-500/15 text-cyan-300 border border-cyan-500/30">
        Stable Baseline →
      </span>
    );
  };

  const isEscalating = trendData?.trend === 'increasing';
  const firstScore = chartHistory[0]?.score ?? 0;
  const latestScore = chartHistory[chartHistory.length - 1]?.score ?? 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Conversation Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Behavioral Pattern Analysis
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Gradual escalation detection and sustained category recurrence over time.
          </p>
        </div>

        {/* Conversation Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">Select Peer Channel:</label>
          <select
            value={selectedConvId}
            onChange={(e) => setSelectedConvId(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs font-semibold text-white bg-[#0d0d15] border-white/10 focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            {conversations.map((c) => (
              <option key={c.conversation_id} value={c.conversation_id}>
                {c.contact_name} ({c.conversation_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Processing behavioral telemetry..." />
      ) : (
        <>
          {/* Trend KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassCard className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-mono">Monitored Contact</span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedConv?.contact_name || 'Contact'}
                </h3>
              </div>
              <Activity className="w-6 h-6 text-cyan-400 opacity-60" />
            </GlassCard>

            <GlassCard className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-mono">Longitudinal Risk Average</span>
                <h3 className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                  {trendData?.average_risk || 0}%
                </h3>
              </div>
              <BarChart2 className="w-6 h-6 text-cyan-400 opacity-60" />
            </GlassCard>

            <GlassCard className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-mono">Behavior Trajectory</span>
                <div className="mt-1">{getTrendBadge(trendData?.trend)}</div>
              </div>
            </GlassCard>
          </div>

          {/* Historical Progression Chart */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-slate-100">Longitudinal Risk Progression</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {chartHistory.length} Checkpoints
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Tracks how conversational risk develops across sequential interactions over time.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">
                  {isEscalating ? (
                    <span className="text-red-400 font-semibold">Risk Increased: +{Math.max(0, latestScore - firstScore)}%</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">Safe Baseline</span>
                  )}
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="behavGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isEscalating ? '#ef4444' : '#00e5ff'} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={isEscalating ? '#ef4444' : '#00e5ff'} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Safe Limit (30%)', fill: '#10b981', fontSize: 10, position: 'insideTopLeft' }} />
                  <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'High Risk (60%)', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={isEscalating ? '#ef4444' : '#00e5ff'}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#behavGrad)"
                    dot={{ r: 4, fill: isEscalating ? '#ef4444' : '#00a8ff', stroke: '#fff', strokeWidth: 1.5 }}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Plain-English Parent Insight Summary */}
            <div className="mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3 text-xs">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-slate-300 leading-relaxed">
                <span className="font-semibold text-white">Parent Insight: </span>
                {isEscalating ? (
                  <span>
                    <strong className="text-red-400">Escalation Detected:</strong> Risk progressively climbed from {firstScore}% up to {latestScore}%. This indicates gradual boundary-testing, secrecy enforcement, or manipulation that would be missed by single-message filters.
                  </span>
                ) : trendData?.trend === 'decreasing' ? (
                  <span>
                    <strong className="text-emerald-400">Risk Decreasing:</strong> Conversational indicators have normalized back into the safe communication zone (&lt;30%).
                  </span>
                ) : (
                  <span>
                    <strong className="text-emerald-400">Stable Communication:</strong> Interaction patterns remain within the safe, normal peer communication baseline ({trendData?.average_risk || 0}% average). No grooming or escalation detected.
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Category Frequency Chart */}
          {categoryFrequencyData.length > 0 && (
            <GlassCard className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-semibold text-slate-100">Recurrent Indicator Frequency</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Counts how many times specific conversational themes have been flagged in this channel.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-400" /> Safe</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400" /> Attention</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-400" /> High Concern</span>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryFrequencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Bar dataKey="occurrences" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                      {categoryFrequencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.barColor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
};

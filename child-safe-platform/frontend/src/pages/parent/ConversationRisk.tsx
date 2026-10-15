import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { RiskData, TrendData, Conversation } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RiskBar } from '../../components/common/RiskBar';
import { LoadingSpinner } from '../../components/common/States';
import {
  ShieldAlert,
  CheckCircle2,
  Cpu,
  Layers,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Info,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export const ConversationRisk: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!conversationId) return;
      try {
        setLoading(true);
        const [riskRes, trendRes, convsRes] = await Promise.all([
          api.get(`/parent/risk/${conversationId}`),
          api.get(`/parent/trends/${conversationId}`),
          api.get(`/parent/conversations`),
        ]);
        setRiskData(riskRes.data);
        setTrendData(trendRes.data);
        const found = (convsRes.data.conversations || []).find(
          (c: Conversation) => c.conversation_id === conversationId
        );
        setConversation(found || null);
      } catch (err) {
        console.error('Failed to load risk detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [conversationId]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Synthesizing multi-layer risk telemetry..." />;
  }

  const score = riskData?.risk_score || 0;
  const severity = riskData?.severity || 'SAFE';
  const categories = riskData?.categories || {};
  const layerScores = riskData?.layer_scores || { rule: 0, ml: 0, context: 0, behaviour: 0, llm: 0 };
  const reasons = riskData?.reasons || [];

  // Chart data from trend history formatted clearly for parents
  const historyList = trendData?.risk_history || [];
  const chartHistory = historyList.map((h, i) => {
    const isLatest = i === historyList.length - 1;
    let label = isLatest ? 'Latest' : `Msg #${i + 1}`;
    let timeLabel = '';
    if (h.timestamp) {
      const d = new Date(h.timestamp);
      if (!isNaN(d.getTime())) {
        timeLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    }
    return {
      step: label,
      timeLabel: timeLabel || `Point ${i + 1}`,
      score: h.score,
      status: h.score >= 60 ? 'HIGH RISK' : h.score >= 30 ? 'ATTENTION' : 'SAFE',
    };
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation & Header */}
      <div>
        <button
          onClick={() => navigate('/parent/conversations')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to conversations</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Conversation Safety Analysis
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">{conversationId}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Contact: {conversation?.contact_name || 'Participant'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Privacy-preserving analysis across {conversation?.message_count || 0} messages
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge severity={severity} size="lg" />
          </div>
        </div>
      </div>

      {/* Main Score & Multi-Layer Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Risk Gauge Card */}
        <GlassCard
          glow={severity === 'HIGH' || severity === 'CRITICAL' ? 'red' : 'green'}
          className="flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center relative shadow-inner">
              <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
                {score}
              </span>
              <span className="text-[11px] font-mono text-slate-400 uppercase">/ 100</span>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-400 mb-1">CONVERSATION RISK INDEX</div>
          <StatusBadge severity={severity} size="md" />
          <p className="text-[11px] text-slate-500 mt-3 max-w-[200px] leading-relaxed">
            {severity === 'SAFE'
              ? 'Conversation indicates normal friendly communication.'
              : 'Multi-layer signals indicate conversational patterns requiring review.'}
          </p>
        </GlassCard>

        {/* Multi-Layer Detection Breakdown (Requirement #19, #20, #21, #22) */}
        <GlassCard className="md:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Multi-Layer Risk Fusion Telemetry</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-500">Autonomous Layers</span>
            </div>

            <div className="space-y-3.5">
              <RiskBar
                score={layerScores.rule}
                label="Layer 1: Fast Rule / Pattern Engine"
                sublabel="(Weight 20%)"
                size="md"
              />
              <RiskBar
                score={layerScores.ml}
                label="Layer 2: ML Text Classifier (TF-IDF + Model)"
                sublabel="(Weight 25%)"
                size="md"
              />
              <RiskBar
                score={layerScores.context}
                label="Layer 3: Conversational Context & Power Dynamics"
                sublabel="(Weight 25%)"
                size="md"
              />
              <RiskBar
                score={layerScores.behaviour}
                label="Layer 4: Historical Behavioral Trend Tracking"
                sublabel="(Weight 20%)"
                size="md"
              />
              {layerScores.llm > 0 && (
                <RiskBar
                  score={layerScores.llm}
                  label="Layer 5: Deep Semantic LLM Analysis"
                  sublabel="(Weight 10%)"
                  size="md"
                />
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Scores are synthesized using normalized weights to avoid single-keyword false alarms.</span>
          </div>
        </GlassCard>
      </div>

      {/* Explainable AI: "Why was this flagged?" (Requirement #33) */}
      <GlassCard glow="blue" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
            Explainable AI: Why was this assessment generated?
          </h2>
        </div>

        {reasons.length === 0 ? (
          <p className="text-xs text-slate-400">No safety warnings or risk triggers detected for this peer channel.</p>
        ) : (
          <div className="space-y-2.5">
            {reasons.map((reason, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-200"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{reason}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Category Breakdown (Requirement #32) */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100">Conversational Category Distribution</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Contextual Classifier Output</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(categories).map(([cat, val]) => {
            const pct = Math.round((val as number) * 100);
            const isSafeCat = cat === 'SAFE';
            const isHigh = pct >= 60;
            const isMod = pct >= 30;

            return (
              <div
                key={cat}
                className={`p-3.5 rounded-xl border transition-all ${
                  isSafeCat
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                    : isHigh
                    ? 'bg-red-950/20 border-red-500/30'
                    : isMod
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-black/30 border-white/5'
                }`}
              >
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-semibold text-slate-200 capitalize flex items-center gap-1.5">
                    {isSafeCat ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${isHigh ? 'text-red-400' : isMod ? 'text-amber-400' : 'text-slate-400'}`} />
                    )}
                    {isSafeCat ? 'Safe Content' : cat.toLowerCase().replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSafeCat
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : isHigh
                        ? 'bg-red-500/20 text-red-300'
                        : isMod
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isSafeCat ? 'NORMAL' : isHigh ? 'CRITICAL' : isMod ? 'ATTENTION' : 'LOW'}
                    </span>
                    <span className="font-mono text-white font-bold">{pct}%</span>
                  </div>
                </div>
                <RiskBar score={pct} size="sm" showPercentage={false} />
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Risk Progression Timeline (Requirement #34) */}
      {chartHistory.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-100">Conversation Risk Progression Timeline</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                  trendData?.trend === 'increasing'
                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  Trend: {trendData?.trend?.toUpperCase() || 'STABLE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Monitors how conversational risk changes across message exchanges over time.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-300">
                Channel Avg: <span className="font-bold text-cyan-400">{trendData?.average_risk || 0}%</span>
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="convRiskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={score >= 60 ? '#ef4444' : '#00e5ff'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={score >= 60 ? '#ef4444' : '#00e5ff'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="step" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Safe Limit (30%)', fill: '#10b981', fontSize: 10, position: 'insideTopLeft' }} />
                <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Alert Trigger (60%)', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const pointScore = data.score;
                      const isDanger = pointScore >= 60;
                      const isWarning = pointScore >= 30;
                      return (
                        <div className="p-3 rounded-xl bg-[#12121a] border border-white/10 text-xs shadow-2xl font-sans">
                          <p className="font-bold text-slate-100">{data.step} • {data.timeLabel}</p>
                          <p className="font-mono text-cyan-300 mt-1">
                            Evaluated Risk: <span className="font-bold">{pointScore}%</span>
                          </p>
                          <p className={`text-[10px] font-mono mt-0.5 font-semibold ${
                            isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            Assessment: {isDanger ? 'CRITICAL RISK' : isWarning ? 'ELEVATED PATTERN' : 'SAFE INTERACTION'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={score >= 60 ? '#ef4444' : '#00e5ff'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#convRiskGrad)"
                  dot={{ r: 4, fill: score >= 60 ? '#ef4444' : '#00a8ff', stroke: '#fff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: score >= 60 ? '#ef4444' : '#00e5ff', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Intuitive Assessment Summary Card */}
          <div className="mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3 text-xs">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">Timeline Interpretation: </span>
              {trendData?.trend === 'increasing' ? (
                <span>
                  The risk trajectory in this conversation has escalated over time (from {chartHistory[0]?.score}% to {score}%). High secrecy, manipulation, or personal requests contributed to this elevated status.
                </span>
              ) : (
                <span>
                  This conversation exhibits consistent, stable communication ({trendData?.average_risk || score}% average). Indicators remain within the safe threshold (&lt;30%).
                </span>
              )}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

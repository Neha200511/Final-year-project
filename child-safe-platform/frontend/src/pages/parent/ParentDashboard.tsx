import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ParentOverview, Conversation, Alert } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RiskBar } from '../../components/common/RiskBar';
import { LoadingSpinner } from '../../components/common/States';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  Users,
  ArrowRight,
} from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<ParentOverview | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [overviewRes, convsRes, alertsRes] = await Promise.all([
          api.get('/parent/overview'),
          api.get('/parent/conversations'),
          api.get('/parent/alerts?limit=5'),
        ]);
        setOverview(overviewRes.data);
        setConversations(convsRes.data.conversations || []);
        setRecentAlerts(alertsRes.data.alerts || []);
      } catch (err) {
        console.error('Failed to load parent dashboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading security operations center..." />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner (Requirement #51) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card border-cyan-500/20 shadow-[0_0_25px_rgba(0,168,255,0.1)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
              Parent Security Operations Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Child Safety Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Privacy-first conversational risk monitoring & behavioral pattern telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] font-mono text-slate-400">Current Safety Assessment</div>
            <div className="mt-1">
              <StatusBadge severity={overview?.safety_status || 'SAFE'} size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 KPI Metrics Grid (Requirement #30) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1 */}
        <GlassCard hover glow="blue" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Active Conversations</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {overview?.active_conversations || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Isolated peer channels</p>
        </GlassCard>

        {/* KPI 2 */}
        <GlassCard hover glow="red" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Open Risk Alerts</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {overview?.open_alerts || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Requires parent attention</p>
        </GlassCard>

        {/* KPI 3 */}
        <GlassCard hover glow="purple" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Flagged Contacts</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300">
            {overview?.high_risk_contacts || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Risk score &ge; 60%</p>
        </GlassCard>
      </div>

      {/* Contact-Wise Risk Overview */}
      <GlassCard className="p-5">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Contact-Wise Risk Overview</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-500">Live Telemetry</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {conversations
              .filter((conv) => (conv.severity || 'SAFE') !== 'SAFE')
              .length === 0 ? (
              <div className="col-span-full text-center py-6 text-xs text-slate-500">
                All contacts are currently within safe communication parameters.
              </div>
            ) : (
              conversations
                .filter((conv) => (conv.severity || 'SAFE') !== 'SAFE')
                .map((conv) => (
                  <div
                    key={conv.conversation_id}
                    onClick={() => navigate(`/parent/risk/${conv.conversation_id}`)}
                    className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {conv.contact_name}
                      </span>
                      <StatusBadge severity={conv.severity || 'SAFE'} size="sm" />
                    </div>
                    <RiskBar score={conv.risk_score || 0} size="md" />
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 text-center">
          <button
            onClick={() => navigate('/parent/alerts')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View all alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </GlassCard>

      {/* Recent Alerts Table (Requirement #35) */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-slate-100">Recent Security Alerts</h2>
          </div>
          <button
            onClick={() => navigate('/parent/alerts')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Alert Center ({recentAlerts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No active alerts detected. All child conversations appear safe.
          </div>
        ) : (
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div
                key={alert.alert_id}
                className="p-4 rounded-xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <StatusBadge severity={alert.severity} size="sm" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs sm:text-sm text-slate-100">
                      Concerning Pattern with {alert.contact_name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {alert.reasons?.[0] || 'Multiple suspicious conversational indicators detected.'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {alert.categories?.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-cyan-300"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => navigate(`/parent/risk/${alert.conversation_id}`)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    View Analysis
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

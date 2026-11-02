import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { analyticsService } from '@/services/analyticsService';
import { applicationService } from '@/services/applicationService';
import { reminderService } from '@/services/reminderService';
import { DashboardMetrics } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Briefcase,
  Video,
  Trophy,
  XCircle,
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await analyticsService.getDashboardMetrics();
      if (res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReminder = async (id: number, currentCompleted: boolean) => {
    try {
      await reminderService.toggleComplete(id, !currentCompleted);
      loadDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-900 rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-900 rounded-xl lg:col-span-2" />
          <div className="h-80 bg-slate-900 rounded-xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Applications',
      value: metrics?.total_applications || 0,
      subtext: `${metrics?.applications_this_month || 0} this month`,
      icon: Briefcase,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Active Interviews',
      value: metrics?.active_interviews || 0,
      subtext: 'Scheduled rounds',
      icon: Video,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      label: 'Offers Received',
      value: metrics?.offers_received || 0,
      subtext: 'Top of funnel conversion',
      icon: Trophy,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Rejections',
      value: metrics?.rejections || 0,
      subtext: 'Completed cycles',
      icon: XCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: 'Pending Reminders',
      value: metrics?.pending_reminders?.length || 0,
      subtext: 'Action required',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
    },
  ];

  // Pipeline distribution chart data
  const pipelineData = metrics?.pipeline_distribution
    ? Object.entries(metrics.pipeline_distribution).map(([status, count]) => ({
        name: status,
        value: count,
      }))
    : [];

  const STATUS_COLORS: Record<string, string> = {
    SAVED: '#64748b',
    APPLIED: '#38bdf8',
    ASSESSMENT: '#f59e0b',
    INTERVIEW: '#818cf8',
    OFFER: '#34d399',
    REJECTED: '#f43f5e',
    WITHDRAWN: '#71717a',
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Career Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline metrics, upcoming interviews, and scheduled reminders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/app/applications">
            <Button variant="outline" size="sm">
              View All Applications
            </Button>
          </Link>
          <Link to="/app/applications?action=new">
            <Button variant="primary" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Add Application</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 5 High-Level Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i} className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{c.label}</span>
                <div className={`p-2 rounded-lg border ${c.bgColor} ${c.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-extrabold text-white tracking-tight">{c.value}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{c.subtext}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Section: Monthly Trend & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Application Volume Trend</CardTitle>
                <p className="text-xs text-slate-400 mt-1">Monthly velocity of new job submissions</p>
              </div>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            {metrics?.monthly_trends && metrics.monthly_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#appGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No monthly application records found yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Breakdown</CardTitle>
            <p className="text-xs text-slate-400 mt-1">Active status distribution</p>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center justify-center">
            {pipelineData.length > 0 ? (
              <div className="w-full h-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pipelineData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {pipelineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {pipelineData.map((d, i) => (
                    <span key={i} className="text-[10px] flex items-center gap-1 text-slate-400">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.name] || '#64748b' }} />
                      {d.name}: {d.value}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No applications added yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Upcoming Interviews, Follow-up Reminders, Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Interviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Upcoming Interviews</CardTitle>
              <p className="text-xs text-slate-400 mt-1">Confirmed stages on your schedule</p>
            </div>
            <Link to="/app/interviews" className="text-xs text-indigo-400 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics?.upcoming_interviews && metrics.upcoming_interviews.length > 0 ? (
              metrics.upcoming_interviews.slice(0, 4).map((it) => (
                <div
                  key={it.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">{it.company_name || 'Interview'}</p>
                    <p className="text-[11px] text-slate-400">{it.interview_type} &bull; Round {it.interview_round}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-400">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(it.interview_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  {it.meeting_link && (
                    <a
                      href={it.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-medium hover:bg-indigo-500/20"
                    >
                      Join
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                <Video className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                No upcoming interviews scheduled.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Follow-up Reminders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Due Reminders</CardTitle>
              <p className="text-xs text-slate-400 mt-1">Deadlines and action items</p>
            </div>
            <Link to="/app/reminders" className="text-xs text-indigo-400 hover:underline">
              Manage
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {metrics?.pending_reminders && metrics.pending_reminders.length > 0 ? (
              metrics.pending_reminders.slice(0, 4).map((rem) => (
                <div
                  key={rem.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3"
                >
                  <button
                    onClick={() => handleToggleReminder(rem.id, rem.is_completed)}
                    className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{rem.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span className="uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                        {rem.reminder_type}
                      </span>
                      <span>Due {new Date(rem.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                All caught up! No active reminders due.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Stream */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Recent Activity</CardTitle>
            <p className="text-xs text-slate-400 mt-1">Live audit trail of milestones</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics?.recent_activity && metrics.recent_activity.length > 0 ? (
              metrics.recent_activity.slice(0, 4).map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium">
                      {act.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(act.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No recent activity logged yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

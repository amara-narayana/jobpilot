import React, { useEffect, useState } from 'react';
import { analyticsService } from '@/services/analyticsService';
import { AnalyticsMetrics } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BarChart3,
  TrendingUp,
  Percent,
  Download,
  Building2,
  Trophy,
  PieChart as PieIcon,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getAnalyticsMetrics();
      if (res.data) setMetrics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await analyticsService.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jobpilot_backup_${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const conversionCards = [
    {
      label: 'Application to Interview',
      value: `${(metrics?.application_to_interview_rate || 0).toFixed(1)}%`,
      subtext: 'Screening pass-through',
      color: 'text-indigo-400',
    },
    {
      label: 'Interview to Offer',
      value: `${(metrics?.interview_to_offer_rate || 0).toFixed(1)}%`,
      subtext: 'Closing conversion',
      color: 'text-emerald-400',
    },
    {
      label: 'Overall Offer Rate',
      value: `${(metrics?.overall_offer_rate || 0).toFixed(1)}%`,
      subtext: 'Total pipeline efficiency',
      color: 'text-sky-400',
    },
    {
      label: 'Rejection Rate',
      value: `${(metrics?.rejection_rate || 0).toFixed(1)}%`,
      subtext: 'Closed without offer',
      color: 'text-rose-400',
    },
  ];

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Career Analytics & Insights</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Mathematically grounded funnel conversions, volume trends, and interview performance
          </p>
        </div>

        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} loading={exporting}>
          <Download className="w-4 h-4" />
          <span>Export JSON Backup</span>
        </Button>
      </div>

      {/* 4 Funnel Conversion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {conversionCards.map((c, i) => (
          <Card key={i} className="p-5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.label}</div>
            <div className={`mt-3 text-3xl font-extrabold tracking-tight ${c.color}`}>{c.value}</div>
            <div className="mt-1 text-[11px] text-slate-500">{c.subtext}</div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications per month */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Application Velocity</CardTitle>
            <p className="text-xs text-slate-400 mt-1">Number of job applications submitted over time</p>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            {metrics?.monthly_applications && metrics.monthly_applications.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.monthly_applications}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Insufficient data for monthly application trends.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Applications by Status</CardTitle>
            <p className="text-xs text-slate-400 mt-1">Full pipeline lifecycle distribution</p>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            {metrics?.applications_by_status && metrics.applications_by_status.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.applications_by_status} layout="vertical">
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="status" type="category" stroke="#64748b" fontSize={10} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {metrics.applications_by_status.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No application distribution data.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Companies & Interview Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Most Targeted Companies</CardTitle>
            <p className="text-xs text-slate-400 mt-1">Companies with highest application count</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics?.top_companies && metrics.top_companies.length > 0 ? (
              metrics.top_companies.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                >
                  <span className="font-semibold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    {c.company_name}
                  </span>
                  <span className="font-mono text-indigo-300 font-bold">{c.count} applications</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No data available.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview Outcomes Breakdown</CardTitle>
            <p className="text-xs text-slate-400 mt-1">Results across all rounds</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics?.interviews_by_result && metrics.interviews_by_result.length > 0 ? (
              metrics.interviews_by_result.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                >
                  <span className="font-semibold text-white">{r.result}</span>
                  <span className="font-mono text-slate-300 font-bold">{r.count} rounds</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No completed interviews on record.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  User,
  ShieldCheck,
  Moon,
  Sun,
  Bell,
  Globe,
  DollarSign,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, preferences, notificationPreferences, refreshUser, setTheme } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [themeVal, setThemeVal] = useState(preferences?.theme || 'dark');
  const [currency, setCurrency] = useState(preferences?.default_currency || 'USD');
  const [timezone, setTimezone] = useState(preferences?.timezone || 'UTC');

  // Notifications
  const [emailInterview, setEmailInterview] = useState(notificationPreferences?.email_interview_reminders ?? true);
  const [emailDeadline, setEmailDeadline] = useState(notificationPreferences?.email_deadline_reminders ?? true);
  const [emailFollowup, setEmailFollowup] = useState(notificationPreferences?.email_followup_reminders ?? true);
  const [leadHours, setLeadHours] = useState(notificationPreferences?.lead_time_hours || 24);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSuccessMsg(null);
    try {
      await authService.updateProfile({ full_name: fullName });
      await refreshUser();
      setSuccessMsg('Profile information updated.');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setSuccessMsg(null);
    try {
      await Promise.all([
        authService.updatePreferences({
          theme: themeVal as any,
          default_currency: currency,
          timezone,
        }),
        authService.updateNotificationPreferences({
          email_interview_reminders: emailInterview,
          email_deadline_reminders: emailDeadline,
          email_followup_reminders: emailFollowup,
          lead_time_hours: leadHours,
        }),
      ]);
      setTheme(themeVal as any);
      await refreshUser();
      setSuccessMsg('Preferences and notification settings saved.');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <User className="w-6 h-6 text-indigo-400" />
          <span>User Profile & Preferences</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal details, workspace preferences, and notification channels
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <p className="text-xs text-slate-400 mt-1">Core account credentials and verification status</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-400 cursor-not-allowed"
                  />
                  {user?.is_verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" loading={savingProfile} className="gap-1.5">
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* System Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace & Localization</CardTitle>
          <p className="text-xs text-slate-400 mt-1">Appearance and default currency standards</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePrefs} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">UI Theme</label>
                <select
                  value={themeVal}
                  onChange={(e) => setThemeVal(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="dark">Deep Charcoal Dark</option>
                  <option value="light">Clean Light Mode</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="UTC">UTC (Universal)</option>
                  <option value="America/New_York">America/New York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los Angeles (PST/PDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                <span>Notification Preferences</span>
              </h4>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailInterview}
                    onChange={(e) => setEmailInterview(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Interview Reminders</span>
                    <span className="text-[11px] text-slate-400">Alerts for upcoming interview stages and technical rounds</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailDeadline}
                    onChange={(e) => setEmailDeadline(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Application Deadline Alerts</span>
                    <span className="text-[11px] text-slate-400">Notice before active application posting windows close</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailFollowup}
                    onChange={(e) => setEmailFollowup(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Recruiter Follow-up Check-ins</span>
                    <span className="text-[11px] text-slate-400">Actionable reminders when an applied job has seen no activity for 7+ days</span>
                  </div>
                </label>
              </div>

              <div className="pt-2 max-w-xs">
                <Input
                  label="Notification Lead Time (Hours)"
                  type="number"
                  min={1}
                  max={72}
                  value={leadHours}
                  onChange={(e) => setLeadHours(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" loading={savingPrefs} className="gap-1.5">
                <Save className="w-4 h-4" />
                <span>Save All Preferences</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  Briefcase,
  Kanban,
  BarChart3,
  Video,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-xl shadow-indigo-950">
            JP
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">JobPilot</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300 font-medium">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pipeline" className="hover:text-white transition-colors">Pipeline</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm" className="gap-1.5">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 lg:px-12 max-w-6xl mx-auto text-center overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Next-Generation Career Operating System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
          Supercharge Your Job Search with <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">JobPilot</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Say goodbye to messy spreadsheets. Track applications, visualize pipelines on a Kanban board, schedule interviews, store resumes, and uncover actionable career analytics.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-indigo-950 font-semibold">
              <span>Start Managing Applications</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              <span>Sign In with Demo Account</span>
            </Button>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Kanban className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Visual Kanban Board</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Drag-and-drop workflow tracking 7 distinct application states from Initial Discovery to Final Offer.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Deep Funnel Analytics</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Real conversion rates, monthly trends, and company performance statistics calculated from your verified data.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">High-Performance Engine</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Built on asynchronous C++ Drogon, MySQL 8.x connection pooling, and Argon2id cryptographic password security.
            </p>
          </div>
        </div>

        {/* Feature List */}
        <div id="pipeline" className="mt-20 p-8 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Multi-User Isolation</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> 6-Digit Email OTP</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Resume & Document Vault</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Automated Reminders</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Full-text Search</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Interview Scheduler</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Dark / Light Themes</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> JSON / CSV Data Export</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        JobPilot Career Operating System &copy; {new Date().getFullYear()} &mdash; Native C++ Drogon & React TypeScript
      </footer>
    </div>
  );
};

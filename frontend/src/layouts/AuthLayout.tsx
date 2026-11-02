import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, TrendingUp, Layers } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden antialiased">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-xl shadow-indigo-950">
            JP
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">JobPilot</span>
        </Link>
        <p className="mt-2 text-xs text-slate-400 font-medium">
          Personal Career Operating System & Application Engine
        </p>
      </div>

      {/* Main Auth Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800/90">
          <Outlet />
        </div>

        {/* Feature Badges under form */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500">
          <div className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Argon2id Secure</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>C++ Async Engine</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-center">
      <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-xl shadow-indigo-500/10">
        <Compass className="w-10 h-10 animate-pulse" />
      </div>
      <h1 className="text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-2">404</h1>
      <h2 className="text-2xl font-bold mb-4">Page not found</h2>
      <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8 text-sm leading-relaxed">
        The destination you are looking for doesn't exist, has been moved, or requires different access credentials.
      </p>
      <div className="flex items-center gap-4">
        <Link to="/app/dashboard">
          <Button variant="primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <Link to="/">
          <Button variant="outline">
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

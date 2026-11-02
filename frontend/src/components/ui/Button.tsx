import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      primary:
        'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-sm shadow-indigo-950/50 border border-indigo-500/20',
      secondary:
        'bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-850 border border-slate-700/60',
      outline:
        'border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800/80 hover:text-white',
      ghost:
        'text-slate-300 hover:bg-slate-800/60 hover:text-white',
      destructive:
        'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-sm border border-rose-500/20',
      subtle:
        'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-9 px-4 text-sm rounded-lg gap-2',
      lg: 'h-11 px-6 text-base rounded-xl gap-2.5',
      icon: 'h-9 w-9 rounded-lg p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

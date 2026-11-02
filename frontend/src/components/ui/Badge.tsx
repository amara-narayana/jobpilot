import React from 'react';
import { cn } from '@/utils/cn';
import { ApplicationStatus } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: ApplicationStatus;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  status,
  variant,
  children,
  ...props
}) => {
  const getStatusStyles = (st?: ApplicationStatus) => {
    switch (st) {
      case 'SAVED':
        return 'bg-slate-800 text-slate-300 border-slate-700/60';
      case 'APPLIED':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'ASSESSMENT':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'INTERVIEW':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'OFFER':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'REJECTED':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'WITHDRAWN':
        return 'bg-zinc-800 text-zinc-400 border-zinc-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700/60';
    }
  };

  const getVariantStyles = (vt?: string) => {
    switch (vt) {
      case 'success':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'danger':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'info':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'outline':
        return 'bg-transparent text-slate-300 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const style = status ? getStatusStyles(status) : getVariantStyles(variant);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border',
        style,
        className
      )}
      {...props}
    >
      {status && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', {
            'bg-slate-400': status === 'SAVED',
            'bg-blue-400': status === 'APPLIED',
            'bg-amber-400': status === 'ASSESSMENT',
            'bg-indigo-400': status === 'INTERVIEW',
            'bg-emerald-400': status === 'OFFER',
            'bg-rose-400': status === 'REJECTED',
            'bg-zinc-400': status === 'WITHDRAWN',
          })}
        />
      )}
      {children || status}
    </span>
  );
};

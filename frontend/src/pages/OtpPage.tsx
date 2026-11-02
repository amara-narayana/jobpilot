import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ArrowRight, RefreshCw, KeyRound, AlertCircle } from 'lucide-react';

export const OtpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();

  const emailParam = searchParams.get('email') || '';
  const devOtpParam = searchParams.get('dev_otp') || '';

  const [email] = useState(emailParam);
  const [otp, setOtp] = useState(devOtpParam);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await verifyOtp({ email, otp });
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setResending(true);

    try {
      const res = await authService.resendOtp({ email });
      setSuccessMsg('New verification code sent to your email.');
      if (res.data?.dev_otp) {
        setOtp(res.data.dev_otp);
      }
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Email Verification</h2>
        <p className="text-xs text-slate-400 mt-1">
          We sent a 6-digit code to <span className="text-indigo-300 font-semibold">{email || 'your email'}</span>
        </p>
      </div>

      {devOtpParam && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Development Mode: Your verification code is <strong>{devOtpParam}</strong></span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
            Enter 6-Digit Code
          </label>
          <input
            type="text"
            maxLength={6}
            required
            autoFocus
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 transition-colors"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full gap-2 mt-4"
          size="lg"
          loading={loading}
        >
          <span>Verify & Activate Account</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>Didn't get the code?</span>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="text-indigo-400 hover:text-indigo-300 font-semibold disabled:text-slate-600 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
          <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
        </button>
      </div>
    </div>
  );
};

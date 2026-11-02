import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authService.forgotPassword({ email });
      setSubmitted(true);
      if (res.data?.dev_token) {
        setDevToken(res.data.dev_token);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Reset Password</h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter your registered email address to receive password recovery instructions
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {submitted ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
            <div className="flex items-center gap-2 font-semibold text-sm mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Recovery Link Generated</span>
            </div>
            <p className="text-slate-400">
              If an account with that email exists, password reset instructions have been dispatched.
            </p>
          </div>

          {devToken && (
            <div className="p-3 rounded-lg bg-slate-950 border border-indigo-500/40 text-xs">
              <span className="text-indigo-400 font-semibold block mb-1">Development Token Link:</span>
              <button
                type="button"
                onClick={() => navigate(`/reset-password?token=${devToken}`)}
                className="text-emerald-400 hover:underline break-all text-left"
              >
                Click to open /reset-password?token={devToken}
              </button>
            </div>
          )}

          <Link to="/login">
            <Button variant="secondary" className="w-full gap-2 mt-4">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="alex@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full gap-2 mt-2"
            size="lg"
            loading={loading}
          >
            <span>Send Reset Instructions</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="pt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

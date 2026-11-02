import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User as UserIcon, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        full_name: fullName,
        email,
        password,
      });

      // Pass email and potential dev_otp to the OTP page
      navigate(`/verify-otp?email=${encodeURIComponent(email)}${res.dev_otp ? `&dev_otp=${res.dev_otp}` : ''}`);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Create Your Account</h2>
        <p className="text-xs text-slate-400 mt-1">Start tracking your career journey with JobPilot</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          required
          placeholder="Alex Rivers"
          leftIcon={<UserIcon className="w-4 h-4" />}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <Input
          label="Email Address"
          type="email"
          required
          placeholder="alex@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password (min. 8 characters)"
          type={showPassword ? 'text' : 'password'}
          required
          placeholder="••••••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-slate-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Passwords are hashed with military-grade Argon2id</span>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full gap-2 mt-2"
          size="lg"
          loading={loading}
        >
          <span>Continue to Verification</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-800 text-center">
        <p className="text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const { resetPassword, isConfigured } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConfigured) {
      toast.error('Supabase is not configured');
      return;
    }

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email format');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await resetPassword(email);

      if (error) {
        toast.error(error.message);
        return;
      }

      setSubmitted(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center flex-1 w-full px-4 py-8">
        <div className="w-full max-w-md">
          <div className="p-8 text-center border rounded-xl bg-zinc-800/50 border-zinc-700">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/20">
              <svg
                className="w-8 h-8 text-teal-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-transparent bg-gradient-to-r from-teal-400 to-fuchsia-400 bg-clip-text">
              Check Your Email
            </h1>
            <p className="mb-6 text-zinc-400">
              We've sent a password reset link to{' '}
              <span className="font-medium text-white">{email}</span>
            </p>
            <p className="mb-6 text-sm text-zinc-500">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setSubmitted(false)}
                className="text-teal-400 hover:underline"
              >
                try again
              </button>
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-2 font-medium transition border rounded-lg text-zinc-300 border-zinc-600 hover:bg-zinc-700/50"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center flex-1 w-full px-4 py-8">
      <div className="w-full max-w-md">
        <div className="p-8 border rounded-xl bg-zinc-800/50 border-zinc-700">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-teal-400 to-fuchsia-400 bg-clip-text">
              Reset Password
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {!isConfigured && (
            <div className="p-3 mb-4 text-sm text-yellow-400 border rounded-lg bg-yellow-500/10 border-yellow-500/30">
              ⚠️ Supabase not configured
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm text-zinc-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className={`w-full px-4 py-2 rounded-lg bg-zinc-900 border ${
                  error ? 'border-red-500' : 'border-zinc-600'
                } focus:border-teal-500 focus:outline-none transition`}
                placeholder="you@example.com"
              />
              {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full py-3 font-semibold text-white transition rounded-lg bg-gradient-to-r from-teal-600 to-fuchsia-600 hover:from-teal-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-teal-400 hover:underline">
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const ResetPassword = () => {
  const { isConfigured, updatePassword } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [tokenReady, setTokenReady] = useState(false);

  // Get parameters from URL hash (Supabase uses hash fragments)
  const getHashParams = () => {
    const hash = window.location.hash.substring(1); // Remove #
    const params = new URLSearchParams(hash);
    return {
      type: params.get('type') || searchParams.get('type'),
      access_token: params.get('access_token') || searchParams.get('access_token'),
      refresh_token: params.get('refresh_token') || searchParams.get('refresh_token')
    };
  };

  const { type: recoveryType, access_token: accessToken, refresh_token: refreshToken } = getHashParams();

  const supabaseReady = useMemo(() => Boolean(isConfigured && recoveryType === 'recovery'), [isConfigured, recoveryType]);

  useEffect(() => {
    if (!supabaseReady) return;
    if (!accessToken || !refreshToken) {
      setTokenReady(false);
      return;
    }

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          toast.error('Session activation failed');
          setError('Link expired or already used. Request a new email.');
          setTokenReady(false);
        } else {
          setTokenReady(true);
        }
      })
      .catch(() => {
        toast.error('Unable to process reset link');
        setError('Unexpected error. Please request a new reset email.');
        setTokenReady(false);
      });
  }, [accessToken, refreshToken, supabaseReady]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConfigured) {
      toast.error('Supabase is not configured');
      return;
    }
    if (!tokenReady) {
      toast.error('Reset session not ready');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error(error.message || 'Reset failed');
        return;
      }
      toast.success('Password updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Unexpected error while updating password');
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center flex-1 w-full px-4 py-8">
        <div className="w-full max-w-md p-6 text-center border rounded-xl bg-zinc-800/50 border-zinc-700">
          <h1 className="text-xl font-semibold text-zinc-200">Reset Password Disabled</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Supabase credentials are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable password recovery.
          </p>
          <Link to="/" className="inline-block px-4 py-2 mt-6 text-sm text-teal-400 border border-teal-500/40 rounded-lg hover:bg-teal-500/10">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (recoveryType !== 'recovery') {
    return (
      <div className="flex items-center justify-center flex-1 w-full px-4 py-8">
        <div className="w-full max-w-md p-6 text-center border rounded-xl bg-zinc-800/50 border-zinc-700">
          <h1 className="text-xl font-semibold text-zinc-200">Invalid Reset Link</h1>
          <p className="mt-3 text-sm text-zinc-400">
            The link you used is invalid or missing required parameters. Please request a new password reset email.
          </p>
          <Link to="/forgot-password" className="inline-block px-4 py-2 mt-6 text-sm text-teal-400 border border-teal-500/40 rounded-lg hover:bg-teal-500/10">
            Request Reset Email
          </Link>
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
              Choose a New Password
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Enter a secure password you'll remember.
            </p>
          </div>

          {!tokenReady && (
            <div className="p-3 mb-4 text-sm text-yellow-400 border rounded-lg bg-yellow-500/10 border-yellow-500/30">
              Preparing your reset session...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm text-zinc-300">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-600 focus:border-teal-500 focus:outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-zinc-300">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-600 focus:border-teal-500 focus:outline-none transition"
                placeholder="Repeat password"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || !tokenReady}
              className="w-full py-3 font-semibold text-white transition rounded-lg bg-gradient-to-r from-teal-600 to-fuchsia-600 hover:from-teal-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-teal-400 hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

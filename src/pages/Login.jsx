import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isConfigured } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});

  // Redirect to original destination after login
  const from = location.state?.from?.pathname || '/';

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConfigured) {
      toast.error('Supabase is not configured. Please add credentials to .env.local');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await signIn(formData.email, formData.password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email before signing in');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center flex-1 w-full px-4 py-8">
      <div className="w-full max-w-md">
        <div className="p-8 border rounded-xl bg-zinc-800/50 border-zinc-700">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-teal-400 to-fuchsia-400 bg-clip-text">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Sign in to access your photos and profile
            </p>
          </div>

          {!isConfigured && (
            <div className="p-3 mb-4 text-sm text-yellow-400 border rounded-lg bg-yellow-500/10 border-yellow-500/30">
              ⚠️ Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block mb-1 text-sm text-zinc-300">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg bg-zinc-900 border ${
                  errors.email ? 'border-red-500' : 'border-zinc-600'
                } focus:border-teal-500 focus:outline-none transition`}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-zinc-300">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-teal-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg bg-zinc-900 border ${
                  errors.password ? 'border-red-500' : 'border-zinc-600'
                } focus:border-teal-500 focus:outline-none transition`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="rememberMe"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="rounded bg-zinc-900 border-zinc-600"
              />
              <label htmlFor="rememberMe" className="text-sm text-zinc-400">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full py-3 font-semibold text-white transition rounded-lg bg-gradient-to-r from-teal-600 to-fuchsia-600 hover:from-teal-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-zinc-500 bg-zinc-800">or continue with</span>
            </div>
          </div>

          {/* Wallet Connect Option */}
          <button
            type="button"
            className="flex items-center justify-center w-full gap-2 py-3 font-medium transition border rounded-lg text-zinc-300 border-zinc-600 hover:bg-zinc-700/50"
            onClick={() => toast.info('Connect your wallet first, then link it to your account')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
            Connect Wallet
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-teal-400 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp, isConfigured } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }

    if (formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters (letters, numbers, underscore)';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms';
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
    // Clear error when user starts typing
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
      const { data, error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        username: formData.username || undefined,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        toast.success('Account created! Please check your email to verify.');
        navigate('/login');
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
              Create Account
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Join PhotoBlock to secure your photos on the blockchain
            </p>
          </div>

          {!isConfigured && (
            <div className="p-3 mb-4 text-sm text-yellow-400 border rounded-lg bg-yellow-500/10 border-yellow-500/30">
              ⚠️ Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block mb-1 text-sm text-zinc-300">Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg bg-zinc-900 border ${
                  errors.fullName ? 'border-red-500' : 'border-zinc-600'
                } focus:border-teal-500 focus:outline-none transition`}
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block mb-1 text-sm text-zinc-300">
                Username <span className="text-zinc-500">(optional)</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg bg-zinc-900 border ${
                  errors.username ? 'border-red-500' : 'border-zinc-600'
                } focus:border-teal-500 focus:outline-none transition`}
                placeholder="johndoe"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-400">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block mb-1 text-sm text-zinc-300">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg bg-zinc-900 border ${
                  errors.email ? 'border-red-500' : 'border-zinc-600'
                } focus:border-teal-500 focus:outline-none transition`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block mb-1 text-sm text-zinc-300">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg bg-zinc-900 border ${
                  errors.password ? 'border-red-500' : 'border-zinc-600'
                } focus:border-teal-500 focus:outline-none transition`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-zinc-500">Minimum 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block mb-1 text-sm text-zinc-300">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg bg-zinc-900 border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-zinc-600'
                } focus:border-teal-500 focus:outline-none transition`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                name="agreeTerms"
                id="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-1 rounded bg-zinc-900 border-zinc-600"
              />
              <label htmlFor="agreeTerms" className="text-sm text-zinc-400">
                I agree to the{' '}
                <Link to="/terms" className="text-teal-400 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-teal-400 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="text-xs text-red-400">{errors.agreeTerms}</p>
            )}

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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-teal-400 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

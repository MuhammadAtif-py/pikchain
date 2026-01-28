import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccount } from 'wagmi';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const { user, profile, updateProfile, linkWallet, isConfigured } = useAuth();
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    bio: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        fullName: profile.full_name || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await updateProfile({
        username: formData.username || null,
        full_name: formData.fullName,
        bio: formData.bio || null,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Profile updated!');
      }
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const { error } = await linkWallet(address);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Wallet linked successfully!');
      }
    } catch (err) {
      toast.error('Failed to link wallet');
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="flex-1 w-full max-w-2xl px-4 py-8 mx-auto">
        <div className="p-6 text-center border rounded-xl bg-zinc-800/50 border-zinc-700">
          <p className="text-yellow-400">
            ⚠️ Profile management requires Supabase. Add credentials to .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-2xl px-4 py-8 mx-auto">
      <h1 className="mb-6 text-2xl font-bold text-transparent bg-gradient-to-r from-teal-400 to-fuchsia-400 bg-clip-text">
        My Profile
      </h1>

      <div className="space-y-6">
        {/* Profile Form */}
        <div className="p-6 border rounded-xl bg-zinc-800/50 border-zinc-700">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Profile Information</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm text-zinc-400">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 rounded-lg bg-zinc-900/50 border border-zinc-700 text-zinc-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-zinc-400">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-600 focus:border-teal-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-zinc-400">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-600 focus:border-teal-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-zinc-400">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-600 focus:border-teal-500 focus:outline-none transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 font-medium text-white transition rounded-lg bg-gradient-to-r from-teal-600 to-fuchsia-600 hover:from-teal-500 hover:to-fuchsia-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Wallet Section */}
        <div className="p-6 border rounded-xl bg-zinc-800/50 border-zinc-700">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Linked Wallets</h2>
          
          {profile?.wallet_address ? (
            <div className="p-3 mb-4 rounded-lg bg-zinc-900/50">
              <p className="text-sm text-zinc-400">Primary Wallet</p>
              <p className="font-mono text-sm text-teal-400 break-all">
                {profile.wallet_address}
              </p>
            </div>
          ) : (
            <p className="mb-4 text-sm text-zinc-500">No wallet linked yet</p>
          )}

          {isConnected && address && (
            <div className="p-3 mb-4 rounded-lg bg-zinc-900/50 border border-zinc-700">
              <p className="text-sm text-zinc-400">Connected Wallet</p>
              <p className="font-mono text-sm text-white break-all">{address}</p>
            </div>
          )}

          <button
            onClick={handleLinkWallet}
            disabled={!isConnected || loading}
            className="px-4 py-2 text-sm font-medium transition border rounded-lg text-zinc-300 border-zinc-600 hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isConnected ? 'Connect Wallet First' : loading ? 'Linking...' : 'Link Current Wallet'}
          </button>
        </div>

        {/* Account Info */}
        <div className="p-6 border rounded-xl bg-zinc-800/50 border-zinc-700">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Account</h2>
          
          <div className="space-y-2 text-sm">
            <p className="text-zinc-400">
              <span className="text-zinc-500">User ID:</span>{' '}
              <span className="font-mono">{user?.id}</span>
            </p>
            <p className="text-zinc-400">
              <span className="text-zinc-500">Created:</span>{' '}
              {new Date(user?.created_at).toLocaleDateString()}
            </p>
            <p className="text-zinc-400">
              <span className="text-zinc-500">Last Sign In:</span>{' '}
              {user?.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

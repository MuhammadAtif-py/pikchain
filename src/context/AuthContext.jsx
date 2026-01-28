import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { auditLog } from '../services/auditService';
import { DEFAULT_LOCAL_CHAIN_ID } from '../utils/networks';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = async (userId) => {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  };

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
        } else {
          setProfile(null);
        }

        // Log auth events
        if (event === 'SIGNED_IN') {
          auditLog('user.login', 'user', session?.user?.id);
        } else if (event === 'SIGNED_OUT') {
          auditLog('user.logout');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email and password
  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (!error && data.user) {
      await auditLog('user.signup', 'user', data.user.id, null, { email });
    }

    return { data, error };
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Reset password
  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (!error) {
      await auditLog('user.password_reset_request', 'user', null, null, { email });
    }

    return { data, error };
  };

  // Update password
  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (!error) {
      await auditLog('user.password_change', 'user', user?.id);
    }

    return { data, error };
  };

  // Update profile
  const updateProfile = async (updates) => {
    if (!user) return { error: { message: 'Not authenticated' } };

    const oldProfile = profile;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error) {
      setProfile(data);
      await auditLog('profile.update', 'profile', data.id, oldProfile, data);
    }

    return { data, error };
  };

  // Link wallet address to profile
  const linkWallet = async (walletAddress, chainId = DEFAULT_LOCAL_CHAIN_ID) => {
    if (!user) return { error: { message: 'Not authenticated' } };

    // Check if wallet already linked
    const { data: existing } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('address', walletAddress.toLowerCase())
      .eq('chain_id', chainId)
      .single();

    if (existing) {
      return { data: existing, error: null };
    }

    // Check if this is the first wallet (make it primary)
    const { count } = await supabase
      .from('wallets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data, error } = await supabase
      .from('wallets')
      .insert({
        user_id: user.id,
        address: walletAddress.toLowerCase(),
        chain_id: chainId,
        is_primary: count === 0,
        verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!error) {
      await auditLog('wallet.connect', 'wallet', data.id, null, { address: walletAddress, chainId });
      
      // Update profile with primary wallet if not set
      if (count === 0) {
        await updateProfile({ wallet_address: walletAddress.toLowerCase() });
      }
    }

    return { data, error };
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isAuthenticated: !!user,
    isConfigured: isSupabaseConfigured(),
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    linkWallet,
    refreshProfile: () => user && fetchProfile(user.id).then(setProfile),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

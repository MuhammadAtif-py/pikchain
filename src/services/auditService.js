import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Log an audit event to the database
 * @param {string} action - Action type (e.g., 'user.login', 'photo.upload')
 * @param {string} resourceType - Type of resource (e.g., 'user', 'photo')
 * @param {string} resourceId - ID of the affected resource
 * @param {object} oldData - Previous state (for updates)
 * @param {object} newData - New state
 * @param {object} metadata - Additional context
 */
export const auditLog = async (
  action,
  resourceType = null,
  resourceId = null,
  oldData = null,
  newData = null,
  metadata = {}
) => {
  if (!isSupabaseConfigured()) {
    console.log('[Audit Log - Local]', { action, resourceType, resourceId, metadata });
    return null;
  }

  try {
    // Get current user (may be null for anonymous actions)
    const { data: { user } } = await supabase.auth.getUser();

    // Collect client info
    const clientInfo = {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...metadata,
    };

    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user?.id || null,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_data: oldData,
        new_data: newData,
        user_agent: navigator.userAgent,
        metadata: clientInfo,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create audit log:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Audit logging error:', err);
    return null;
  }
};

/**
 * Get audit logs for the current user
 * @param {number} limit - Number of logs to fetch
 * @param {number} offset - Offset for pagination
 */
export const getUserAuditLogs = async (limit = 50, offset = 0) => {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  const { data, error, count } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return { data, error, count };
};

/**
 * Get audit logs filtered by action type
 * @param {string} action - Action type to filter by
 * @param {number} limit - Number of logs to fetch
 */
export const getAuditLogsByAction = async (action, limit = 50) => {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('action', action)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data, error };
};

/**
 * Get audit logs for a specific resource
 * @param {string} resourceType - Resource type
 * @param {string} resourceId - Resource ID
 */
export const getResourceAuditLogs = async (resourceType, resourceId) => {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false });

  return { data, error };
};

// Predefined action types for consistency
export const AUDIT_ACTIONS = {
  // User actions
  USER_SIGNUP: 'user.signup',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_PASSWORD_CHANGE: 'user.password_change',
  USER_PASSWORD_RESET_REQUEST: 'user.password_reset_request',
  
  // Profile actions
  PROFILE_UPDATE: 'profile.update',
  PROFILE_AVATAR_CHANGE: 'profile.avatar_change',
  
  // Wallet actions
  WALLET_CONNECT: 'wallet.connect',
  WALLET_DISCONNECT: 'wallet.disconnect',
  WALLET_VERIFY: 'wallet.verify',
  
  // Photo actions
  PHOTO_UPLOAD: 'photo.upload',
  PHOTO_SAVE_CHAIN: 'photo.save_chain',
  PHOTO_DELETE: 'photo.delete',
  PHOTO_SHARE: 'photo.share',
  PHOTO_UNSHARE: 'photo.unshare',
  
  // Verification actions
  PHOTO_VERIFY: 'photo.verify',
  PHOTO_VERIFY_FAIL: 'photo.verify_fail',
  
  // Session actions
  SESSION_CREATE: 'session.create',
  SESSION_EXPIRE: 'session.expire',
  SESSION_REVOKE: 'session.revoke',
};

export default {
  auditLog,
  getUserAuditLogs,
  getAuditLogsByAction,
  getResourceAuditLogs,
  AUDIT_ACTIONS,
};

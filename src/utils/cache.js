/**
 * PhotoBlock Cache Utility
 * Caches blockchain data locally to reduce RPC calls and handle network errors gracefully
 */

const CACHE_PREFIX = 'photoblock_';
const CACHE_VERSION = 'v1';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

// Cache keys
export const CACHE_KEYS = {
  CIDS: (address, chainId) => `${CACHE_PREFIX}${CACHE_VERSION}_cids_${chainId}_${address?.toLowerCase()}`,
  USERNAME: (address, chainId) => `${CACHE_PREFIX}${CACHE_VERSION}_username_${chainId}_${address?.toLowerCase()}`,
  TX_HISTORY: (address, chainId) => `${CACHE_PREFIX}${CACHE_VERSION}_tx_${chainId}_${address?.toLowerCase()}`,
  LAST_BLOCK: (chainId) => `${CACHE_PREFIX}${CACHE_VERSION}_block_${chainId}`,
};

/**
 * Get cached data
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in ms (default 5 min)
 * @returns {any|null} - Cached data or null if expired/missing
 */
export function getCache(key, ttl = DEFAULT_TTL) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    
    const { data, timestamp } = JSON.parse(raw);
    const age = Date.now() - timestamp;
    
    if (age > ttl) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export function setCache(key, data) {
  try {
    const payload = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.warn('Cache write error:', error);
  }
}

/**
 * Clear specific cache
 * @param {string} key - Cache key to clear
 */
export function clearCache(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Cache clear error:', error);
  }
}

/**
 * Clear all PhotoBlock cache
 */
export function clearAllCache() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('PhotoBlock cache cleared');
  } catch (error) {
    console.warn('Cache clear all error:', error);
  }
}

/**
 * Invalidate cache for address on new transaction
 * Call this after successful addCID or setUsername
 */
export function invalidateCacheForAddress(address, chainId) {
  clearCache(CACHE_KEYS.CIDS(address, chainId));
  clearCache(CACHE_KEYS.USERNAME(address, chainId));
}

/**
 * Get CIDs with cache fallback
 * @param {string} address - Wallet address
 * @param {number} chainId - Chain ID
 * @param {Function} fetchFn - Function to fetch fresh data
 * @returns {Promise<string[]>} - CIDs array
 */
export async function getCIDsWithCache(address, chainId, fetchFn) {
  const cacheKey = CACHE_KEYS.CIDS(address, chainId);
  
  // Try cache first
  const cached = getCache(cacheKey);
  
  try {
    // Always try to fetch fresh data
    const fresh = await fetchFn();
    const cids = Array.isArray(fresh) ? fresh : [];
    setCache(cacheKey, cids);
    return cids;
  } catch (error) {
    console.warn('RPC fetch failed, using cache:', error.message);
    // Return cached data on RPC error
    if (cached) {
      return cached;
    }
    throw error;
  }
}

/**
 * Get username with cache fallback
 */
export async function getUsernameWithCache(address, chainId, fetchFn) {
  const cacheKey = CACHE_KEYS.USERNAME(address, chainId);
  
  const cached = getCache(cacheKey);
  
  try {
    const fresh = await fetchFn();
    setCache(cacheKey, fresh);
    return fresh;
  } catch (error) {
    console.warn('RPC fetch failed, using cache:', error.message);
    if (cached !== null) {
      return cached;
    }
    throw error;
  }
}

export default {
  getCache,
  setCache,
  clearCache,
  clearAllCache,
  invalidateCacheForAddress,
  getCIDsWithCache,
  getUsernameWithCache,
  CACHE_KEYS,
};

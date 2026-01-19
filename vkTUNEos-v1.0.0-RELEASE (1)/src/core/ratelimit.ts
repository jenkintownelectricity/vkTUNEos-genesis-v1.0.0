/**
 * vkTUNEos Rate Limiting Module
 * Per-tier rate limiting with sliding window
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Request, Response, NextFunction } from 'express';
import { RequestWithLicense, TIER_LIMITS, LicenseTier } from './licensing.js';
import { createAuditEvent } from '../db/database.js';

// ============================================================================
// IN-MEMORY RATE LIMIT STORE
// ============================================================================

interface RateLimitEntry {
  count: number;
  reset_at: number; // Unix timestamp
  daily_count: number;
  daily_reset_at: number;
}

// In-memory store (would use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// ============================================================================
// RATE LIMIT CONFIGURATION
// ============================================================================

function getRateLimitConfig(tier: LicenseTier) {
  const limits = TIER_LIMITS[tier];
  return {
    requests_per_minute: limits.requests_per_minute,
    requests_per_day: limits.api_calls_per_day,
    window_ms: 60 * 1000, // 1 minute
    daily_window_ms: 24 * 60 * 60 * 1000 // 24 hours
  };
}

// ============================================================================
// RATE LIMIT MIDDLEWARE
// ============================================================================

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const typedReq = req as RequestWithLicense;
  
  if (!typedReq.license) {
    return next();
  }
  
  const { tenant_id, tier } = typedReq.license;
  const config = getRateLimitConfig(tier);
  const now = Date.now();
  const key = `rate:${tenant_id}`;
  
  // Get or create entry
  let entry = rateLimitStore.get(key);
  
  if (!entry) {
    entry = {
      count: 0,
      reset_at: now + config.window_ms,
      daily_count: 0,
      daily_reset_at: now + config.daily_window_ms
    };
  }
  
  // Reset minute window if expired
  if (now >= entry.reset_at) {
    entry.count = 0;
    entry.reset_at = now + config.window_ms;
  }
  
  // Reset daily window if expired
  if (now >= entry.daily_reset_at) {
    entry.daily_count = 0;
    entry.daily_reset_at = now + config.daily_window_ms;
  }
  
  // Check minute limit
  if (config.requests_per_minute !== -1 && entry.count >= config.requests_per_minute) {
    const retry_after = Math.ceil((entry.reset_at - now) / 1000);
    
    res.setHeader('X-RateLimit-Limit', config.requests_per_minute);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.reset_at / 1000));
    res.setHeader('Retry-After', retry_after);
    
    // Audit rate limit hit
    if (tenant_id !== 'anonymous') {
      createAuditEvent({
        tenant_id,
        event_type: 'API',
        event_category: 'rate_limit',
        resource_type: 'api',
        action: 'rate_limit_exceeded',
        metadata: {
          limit_type: 'per_minute',
          limit: config.requests_per_minute,
          tier
        }
      });
    }
    
    return res.status(429).json({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      limit_type: 'per_minute',
      limit: config.requests_per_minute,
      retry_after,
      current_tier: tier,
      upgrade_url: 'https://vktuneos.com/pricing'
    });
  }
  
  // Check daily limit
  if (config.requests_per_day !== -1 && entry.daily_count >= config.requests_per_day) {
    const retry_after = Math.ceil((entry.daily_reset_at - now) / 1000);
    
    res.setHeader('X-RateLimit-Daily-Limit', config.requests_per_day);
    res.setHeader('X-RateLimit-Daily-Remaining', 0);
    res.setHeader('X-RateLimit-Daily-Reset', Math.ceil(entry.daily_reset_at / 1000));
    res.setHeader('Retry-After', retry_after);
    
    // Audit rate limit hit
    if (tenant_id !== 'anonymous') {
      createAuditEvent({
        tenant_id,
        event_type: 'API',
        event_category: 'rate_limit',
        resource_type: 'api',
        action: 'daily_limit_exceeded',
        metadata: {
          limit_type: 'per_day',
          limit: config.requests_per_day,
          tier
        }
      });
    }
    
    return res.status(429).json({
      error: 'Daily rate limit exceeded',
      code: 'DAILY_LIMIT_EXCEEDED',
      limit_type: 'per_day',
      limit: config.requests_per_day,
      retry_after,
      current_tier: tier,
      upgrade_url: 'https://vktuneos.com/pricing'
    });
  }
  
  // Increment counters
  entry.count++;
  entry.daily_count++;
  rateLimitStore.set(key, entry);
  
  // Set headers
  if (config.requests_per_minute !== -1) {
    res.setHeader('X-RateLimit-Limit', config.requests_per_minute);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.requests_per_minute - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.reset_at / 1000));
  }
  
  if (config.requests_per_day !== -1) {
    res.setHeader('X-RateLimit-Daily-Limit', config.requests_per_day);
    res.setHeader('X-RateLimit-Daily-Remaining', Math.max(0, config.requests_per_day - entry.daily_count));
  }
  
  next();
}

// ============================================================================
// RATE LIMIT UTILITIES
// ============================================================================

export function getRateLimitStatus(tenant_id: string, tier: LicenseTier) {
  const config = getRateLimitConfig(tier);
  const key = `rate:${tenant_id}`;
  const entry = rateLimitStore.get(key);
  const now = Date.now();
  
  if (!entry) {
    return {
      minute: {
        limit: config.requests_per_minute,
        remaining: config.requests_per_minute,
        reset_at: null
      },
      daily: {
        limit: config.requests_per_day,
        remaining: config.requests_per_day,
        reset_at: null
      }
    };
  }
  
  return {
    minute: {
      limit: config.requests_per_minute,
      remaining: config.requests_per_minute === -1 ? -1 : Math.max(0, config.requests_per_minute - entry.count),
      reset_at: new Date(entry.reset_at).toISOString()
    },
    daily: {
      limit: config.requests_per_day,
      remaining: config.requests_per_day === -1 ? -1 : Math.max(0, config.requests_per_day - entry.daily_count),
      reset_at: new Date(entry.daily_reset_at).toISOString()
    }
  };
}

export function resetRateLimit(tenant_id: string): boolean {
  const key = `rate:${tenant_id}`;
  return rateLimitStore.delete(key);
}

export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * vkTUNEos Resource Tracking Module
 * Usage metering per tenant (API calls, storage, compute time)
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { getDatabase } from '../db/database.js';
import { LicenseTier, TIER_LIMITS } from './licensing.js';

// ============================================================================
// RESOURCE TYPES
// ============================================================================

export type ResourceType = 
  | 'api_calls'
  | 'voice_clones'
  | 'stem_separations'
  | 'music_generations'
  | 'storage_bytes'
  | 'compute_seconds';

export interface ResourceUsage {
  tenant_id: string;
  resource_type: ResourceType;
  period: string; // YYYY-MM format
  count: number;
  last_updated: string;
}

export interface UsageSummary {
  tenant_id: string;
  tier: LicenseTier;
  period: string;
  resources: {
    [K in ResourceType]?: {
      used: number;
      limit: number;
      remaining: number;
      percentage: number;
    };
  };
}

// ============================================================================
// DATABASE SCHEMA EXTENSION
// ============================================================================

export function initResourceTracking() {
  const db = getDatabase();
  
  db.run(`
    CREATE TABLE IF NOT EXISTS resource_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      period TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(tenant_id, resource_type, period)
    )
  `);
  
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_resource_usage_tenant 
    ON resource_usage(tenant_id, period)
  `);
}

// ============================================================================
// RESOURCE TRACKING FUNCTIONS
// ============================================================================

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Increment resource usage counter
 */
export function trackResourceUsage(
  tenant_id: string,
  resource_type: ResourceType,
  amount: number = 1
): ResourceUsage {
  const db = getDatabase();
  const period = getCurrentPeriod();
  const now = new Date().toISOString();
  
  // Upsert the usage record
  db.run(`
    INSERT INTO resource_usage (tenant_id, resource_type, period, count, last_updated)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(tenant_id, resource_type, period) DO UPDATE SET
      count = count + ?,
      last_updated = ?
  `, [tenant_id, resource_type, period, amount, now, amount, now]);
  
  // Return current usage
  return getResourceUsage(tenant_id, resource_type, period)!;
}

/**
 * Get resource usage for a specific type and period
 */
export function getResourceUsage(
  tenant_id: string,
  resource_type: ResourceType,
  period?: string
): ResourceUsage | null {
  const db = getDatabase();
  const targetPeriod = period || getCurrentPeriod();
  
  const result = db.exec(`
    SELECT * FROM resource_usage 
    WHERE tenant_id = ? AND resource_type = ? AND period = ?
  `, [tenant_id, resource_type, targetPeriod]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  const row = result[0].values[0];
  const cols = result[0].columns;
  
  return {
    tenant_id: row[cols.indexOf('tenant_id')] as string,
    resource_type: row[cols.indexOf('resource_type')] as ResourceType,
    period: row[cols.indexOf('period')] as string,
    count: row[cols.indexOf('count')] as number,
    last_updated: row[cols.indexOf('last_updated')] as string
  };
}

/**
 * Get all resource usage for a tenant in a period
 */
export function getTenantUsage(tenant_id: string, period?: string): ResourceUsage[] {
  const db = getDatabase();
  const targetPeriod = period || getCurrentPeriod();
  
  const result = db.exec(`
    SELECT * FROM resource_usage 
    WHERE tenant_id = ? AND period = ?
    ORDER BY resource_type
  `, [tenant_id, targetPeriod]);
  
  if (result.length === 0) {
    return [];
  }
  
  const cols = result[0].columns;
  return result[0].values.map((row: any[]) => ({
    tenant_id: row[cols.indexOf('tenant_id')] as string,
    resource_type: row[cols.indexOf('resource_type')] as ResourceType,
    period: row[cols.indexOf('period')] as string,
    count: row[cols.indexOf('count')] as number,
    last_updated: row[cols.indexOf('last_updated')] as string
  }));
}

/**
 * Get usage summary with limits comparison
 */
export function getUsageSummary(tenant_id: string, tier: LicenseTier, period?: string): UsageSummary {
  const targetPeriod = period || getCurrentPeriod();
  const usage = getTenantUsage(tenant_id, targetPeriod);
  const limits = TIER_LIMITS[tier];
  
  const resourceLimits: Record<ResourceType, number> = {
    api_calls: limits.api_calls_per_day * 30, // Monthly estimate
    voice_clones: limits.voice_clone_slots,
    stem_separations: -1, // Unlimited per-use
    music_generations: -1, // Limited by length, not count
    storage_bytes: limits.storage_gb * 1024 * 1024 * 1024,
    compute_seconds: -1 // Varies
  };
  
  const summary: UsageSummary = {
    tenant_id,
    tier,
    period: targetPeriod,
    resources: {}
  };
  
  // Process each resource type
  const allTypes: ResourceType[] = [
    'api_calls', 'voice_clones', 'stem_separations', 
    'music_generations', 'storage_bytes', 'compute_seconds'
  ];
  
  for (const resourceType of allTypes) {
    const usageRecord = usage.find(u => u.resource_type === resourceType);
    const used = usageRecord?.count || 0;
    const limit = resourceLimits[resourceType];
    
    summary.resources[resourceType] = {
      used,
      limit,
      remaining: limit === -1 ? -1 : Math.max(0, limit - used),
      percentage: limit === -1 ? 0 : Math.min(100, (used / limit) * 100)
    };
  }
  
  return summary;
}

/**
 * Check if resource limit is reached
 */
export function isLimitReached(
  tenant_id: string,
  resource_type: ResourceType,
  tier: LicenseTier
): boolean {
  const limits = TIER_LIMITS[tier];
  const usage = getResourceUsage(tenant_id, resource_type);
  const used = usage?.count || 0;
  
  let limit: number;
  switch (resource_type) {
    case 'api_calls':
      limit = limits.api_calls_per_day * 30;
      break;
    case 'voice_clones':
      limit = limits.voice_clone_slots;
      break;
    case 'storage_bytes':
      limit = limits.storage_gb * 1024 * 1024 * 1024;
      break;
    default:
      limit = -1;
  }
  
  if (limit === -1) return false;
  return used >= limit;
}

/**
 * Reset usage for a tenant (admin function)
 */
export function resetTenantUsage(tenant_id: string, period?: string): boolean {
  const db = getDatabase();
  const targetPeriod = period || getCurrentPeriod();
  
  db.run(`
    DELETE FROM resource_usage 
    WHERE tenant_id = ? AND period = ?
  `, [tenant_id, targetPeriod]);
  
  return true;
}

/**
 * Get usage history for a tenant
 */
export function getUsageHistory(tenant_id: string, months: number = 6): ResourceUsage[] {
  const db = getDatabase();
  
  // Generate list of periods
  const periods: string[] = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  
  const placeholders = periods.map(() => '?').join(',');
  
  const result = db.exec(`
    SELECT * FROM resource_usage 
    WHERE tenant_id = ? AND period IN (${placeholders})
    ORDER BY period DESC, resource_type
  `, [tenant_id, ...periods]);
  
  if (result.length === 0) {
    return [];
  }
  
  const cols = result[0].columns;
  return result[0].values.map((row: any[]) => ({
    tenant_id: row[cols.indexOf('tenant_id')] as string,
    resource_type: row[cols.indexOf('resource_type')] as ResourceType,
    period: row[cols.indexOf('period')] as string,
    count: row[cols.indexOf('count')] as number,
    last_updated: row[cols.indexOf('last_updated')] as string
  }));
}

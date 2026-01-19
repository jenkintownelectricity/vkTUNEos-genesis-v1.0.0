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

  // Create resource_usage table (fire-and-forget)
  db.execute({
    sql: `CREATE TABLE IF NOT EXISTS resource_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      period TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(tenant_id, resource_type, period)
    )`,
    args: []
  }).catch(err => console.error('[Resources] Table creation failed:', err));

  db.execute({
    sql: `CREATE INDEX IF NOT EXISTS idx_resource_usage_tenant
          ON resource_usage(tenant_id, period)`,
    args: []
  }).catch(err => console.error('[Resources] Index creation failed:', err));
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
export async function trackResourceUsage(
  tenant_id: string,
  resource_type: ResourceType,
  amount: number = 1
): Promise<ResourceUsage | null> {
  const db = getDatabase();
  const period = getCurrentPeriod();
  const now = new Date().toISOString();

  // Upsert the usage record
  await db.execute({
    sql: `INSERT INTO resource_usage (tenant_id, resource_type, period, count, last_updated)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(tenant_id, resource_type, period) DO UPDATE SET
            count = count + ?,
            last_updated = ?`,
    args: [tenant_id, resource_type, period, amount, now, amount, now]
  });

  // Return current usage
  return getResourceUsage(tenant_id, resource_type, period);
}

/**
 * Get resource usage for a specific type and period
 */
export async function getResourceUsage(
  tenant_id: string,
  resource_type: ResourceType,
  period?: string
): Promise<ResourceUsage | null> {
  const db = getDatabase();
  const targetPeriod = period || getCurrentPeriod();

  const result = await db.execute({
    sql: `SELECT * FROM resource_usage
          WHERE tenant_id = ? AND resource_type = ? AND period = ?`,
    args: [tenant_id, resource_type, targetPeriod]
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    tenant_id: row.tenant_id as string,
    resource_type: row.resource_type as ResourceType,
    period: row.period as string,
    count: row.count as number,
    last_updated: row.last_updated as string
  };
}

/**
 * Get all resource usage for a tenant in a period
 */
export async function getTenantUsage(tenant_id: string, period?: string): Promise<ResourceUsage[]> {
  const db = getDatabase();
  const targetPeriod = period || getCurrentPeriod();

  const result = await db.execute({
    sql: `SELECT * FROM resource_usage
          WHERE tenant_id = ? AND period = ?
          ORDER BY resource_type`,
    args: [tenant_id, targetPeriod]
  });

  return result.rows.map((row: any) => ({
    tenant_id: row.tenant_id as string,
    resource_type: row.resource_type as ResourceType,
    period: row.period as string,
    count: row.count as number,
    last_updated: row.last_updated as string
  }));
}

/**
 * Get usage summary with limits comparison
 */
export async function getUsageSummary(tenant_id: string, tier: LicenseTier, period?: string): Promise<UsageSummary> {
  const targetPeriod = period || getCurrentPeriod();
  const usage = await getTenantUsage(tenant_id, targetPeriod);
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
export async function isLimitReached(
  tenant_id: string,
  resource_type: ResourceType,
  tier: LicenseTier
): Promise<boolean> {
  const limits = TIER_LIMITS[tier];
  const usage = await getResourceUsage(tenant_id, resource_type);
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
export async function resetTenantUsage(tenant_id: string, period?: string): Promise<boolean> {
  const db = getDatabase();
  const targetPeriod = period || getCurrentPeriod();

  await db.execute({
    sql: `DELETE FROM resource_usage
          WHERE tenant_id = ? AND period = ?`,
    args: [tenant_id, targetPeriod]
  });

  return true;
}

/**
 * Get usage history for a tenant
 */
export async function getUsageHistory(tenant_id: string, months: number = 6): Promise<ResourceUsage[]> {
  const db = getDatabase();

  // Generate list of periods
  const periods: string[] = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const placeholders = periods.map(() => '?').join(',');

  const result = await db.execute({
    sql: `SELECT * FROM resource_usage
          WHERE tenant_id = ? AND period IN (${placeholders})
          ORDER BY period DESC, resource_type`,
    args: [tenant_id, ...periods]
  });

  return result.rows.map((row: any) => ({
    tenant_id: row.tenant_id as string,
    resource_type: row.resource_type as ResourceType,
    period: row.period as string,
    count: row.count as number,
    last_updated: row.last_updated as string
  }));
}

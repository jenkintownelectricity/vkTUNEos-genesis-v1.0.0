/**
 * vkTUNEos Database Layer
 * SQLite with Turso/LibSQL for serverless compatibility
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { createClient, Client } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import {
  Coordinate,
  CoordinateRecord,
  coordinateToString,
  getCoordinateKey
} from '../core/schema.js';

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

let db: Client | null = null;

export async function initDatabase(): Promise<Client> {
  try {
    console.log('[DB] Connecting to Turso database...');

    // Use Turso URL and token from environment variables
    const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

    if (!url) {
      console.log('[DB] No Turso URL found, using in-memory SQLite');
      // Fallback to local file for development
      db = createClient({
        url: 'file:local.db'
      });
    } else {
      console.log('[DB] Using Turso URL:', url);
      db = createClient({
        url,
        authToken
      });
    }

    // Create tables
    console.log('[DB] Running schema migration...');
    await db.executeMultiple(SCHEMA_SQL);
    console.log('[DB] Schema applied');

    // Seed default tenants for each tier
    console.log('[DB] Seeding default tenants...');
    await seedDefaultTenants();

    console.log('[DB] Database fully initialized with default tenants');
    return db;
  } catch (err: any) {
    console.error('[DB] Initialization failed:', err?.message || err);
    console.error('[DB] Stack:', err?.stack);
    throw new Error(`Database initialization failed: ${err?.message || 'Unknown error'}`);
  }
}

/**
 * Seed default tenants for each tier level
 * L0 AUTHORITATIVE: Preload FREE, PREMIUM, and ENTERPRISE tier tenants
 */
async function seedDefaultTenants(): Promise<void> {
  if (!db) {
    console.error('[DB] Cannot seed: database not initialized');
    return;
  }

  try {
    const now = new Date().toISOString();

    const defaultTenants = [
      {
        id: 'tenant-free-default',
        name: 'Free Tier Demo',
        slug: 'free-demo',
        tier: 'free',
        config: { description: 'Default Free tier tenant for testing basic features' }
      },
      {
        id: 'tenant-premium-default',
        name: 'Premium Tier Demo',
        slug: 'premium-demo',
        tier: 'premium',
        config: { description: 'Default Premium tier tenant with workflow access' }
      },
      {
        id: 'tenant-enterprise-default',
        name: 'Enterprise Tier Demo',
        slug: 'enterprise-demo',
        tier: 'enterprise',
        config: { description: 'Default Enterprise tier tenant with all features' }
      }
    ];

    for (const tenant of defaultTenants) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO tenants (id, name, slug, tier, config, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [tenant.id, tenant.name, tenant.slug, tenant.tier, JSON.stringify(tenant.config), now, now]
      });
    }

    // Seed sample coordinates for each tenant
    const sampleCoordinates = [
      { L1: 'VoiceCloning', L2: 'Tool', L3: 'ElevenLabs', L4: 'Languages', L5: 'Validated', value: '32', metadata: { languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'hi', 'ar', 'zh'] } },
      { L1: 'VoiceCloning', L2: 'Tool', L3: 'KitsAI', L4: 'Fidelity', L5: 'Validated', value: '8.5', metadata: { source_consent: true, neural_network_model: 'kits-v2' } },
      { L1: 'VoiceCloning', L2: 'Model', L3: 'InstantClone', L4: 'Latency', L5: 'Validated', value: '15', metadata: { unit: 'seconds' } },
      { L1: 'StemSeparation', L2: 'Model', L3: 'Phoenix', L4: 'Fidelity', L5: 'Validated', value: '9.2', metadata: { stems: 10 } },
      { L1: 'StemSeparation', L2: 'Tool', L3: 'LALALAI', L4: 'Stems', L5: 'Validated', value: '10', metadata: { formats: ['wav', 'mp3', 'flac'] } },
      { L1: 'MusicGeneration', L2: 'Tool', L3: 'Suno', L4: 'Pricing', L5: 'Validated', value: '$0.02/call', metadata: { pricing_model: 'subscription', billing_period: 'monthly' } },
      { L1: 'MusicGeneration', L2: 'Model', L3: 'SunoV5', L4: 'Fidelity', L5: 'Validated', value: '9.0', metadata: { max_duration: 300 } },
      { L1: 'AudioProduction', L2: 'Tool', L3: 'LANDR', L4: 'Pricing', L5: 'Validated', value: '$4.99/track', metadata: { pricing_model: 'subscription' } },
      { L1: 'Licensing', L2: 'Rights', L3: 'RoyaltyFree', L4: 'Commercial', L5: 'Validated', value: 'true', metadata: { attribution_required: false } },
    ];

    for (const tenant of defaultTenants) {
      for (const coord of sampleCoordinates) {
        const coordId = `${tenant.id}-${coord.L1}-${coord.L3}-${coord.L4}`.toLowerCase();
        await db.execute({
          sql: `INSERT OR IGNORE INTO coordinates (id, tenant_id, L1_category, L2_domain, L3_entity, L4_attribute, L5_state, value, metadata, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [coordId, tenant.id, coord.L1, coord.L2, coord.L3, coord.L4, coord.L5, coord.value, JSON.stringify(coord.metadata), now, now]
        });
      }
    }

    console.log('[DB] Seeded 3 default tenants (free, premium, enterprise) with sample coordinates');
  } catch (err) {
    console.error('[DB] Seed failed:', err);
  }
}

export function getDatabase(): Client {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

const SCHEMA_SQL = `
-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'enterprise')),
  isolation_level TEXT NOT NULL DEFAULT 'logical' CHECK (isolation_level IN ('logical', 'schema', 'database')),
  theme_id TEXT,
  config TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  audit_enabled INTEGER NOT NULL DEFAULT 1
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user', 'readonly')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, email)
);

-- Coordinates table (core data)
CREATE TABLE IF NOT EXISTS coordinates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  L1_category TEXT NOT NULL,
  L2_domain TEXT NOT NULL,
  L3_entity TEXT NOT NULL,
  L4_attribute TEXT NOT NULL,
  L5_state TEXT NOT NULL,
  value TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),
  UNIQUE(tenant_id, L1_category, L2_domain, L3_entity, L4_attribute, L5_state)
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  correlation_id TEXT,
  metadata TEXT DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coordinates_tenant ON coordinates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coordinates_category ON coordinates(L1_category);
CREATE INDEX IF NOT EXISTS idx_coordinates_domain ON coordinates(L2_domain);
CREATE INDEX IF NOT EXISTS idx_coordinates_entity ON coordinates(L3_entity);
CREATE INDEX IF NOT EXISTS idx_coordinates_state ON coordinates(L5_state);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
`;

// ============================================================================
// TENANT OPERATIONS
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  tier: 'free' | 'premium' | 'enterprise';
  isolation_level: 'logical' | 'schema' | 'database';
  theme_id?: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  audit_enabled: boolean;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  domain?: string;
  tier?: 'free' | 'premium' | 'enterprise';
  config?: Record<string, any>;
}

// ============================================================================
// ASYNC TENANT OPERATIONS (LibSQL)
// ============================================================================

export async function createTenantAsync(input: CreateTenantInput): Promise<Tenant> {
  const database = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  await database.execute({
    sql: `INSERT INTO tenants (id, name, slug, domain, tier, config, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.name, input.slug, input.domain || null, input.tier || 'free', JSON.stringify(input.config || {}), now, now]
  });

  return (await getTenantAsync(id))!;
}

export async function getTenantAsync(id: string): Promise<Tenant | null> {
  const database = getDatabase();
  const result = await database.execute({
    sql: `SELECT * FROM tenants WHERE id = ?`,
    args: [id]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return rowToTenant(result.rows[0]);
}

export async function getTenantBySlugAsync(slug: string): Promise<Tenant | null> {
  const database = getDatabase();
  const result = await database.execute({
    sql: `SELECT * FROM tenants WHERE slug = ?`,
    args: [slug]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return rowToTenant(result.rows[0]);
}

export async function listTenantsAsync(): Promise<Tenant[]> {
  const database = getDatabase();
  const result = await database.execute({
    sql: `SELECT * FROM tenants ORDER BY created_at DESC`,
    args: []
  });

  return result.rows.map(row => rowToTenant(row));
}

function rowToTenant(row: any): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    domain: row.domain,
    tier: row.tier,
    isolation_level: row.isolation_level,
    theme_id: row.theme_id,
    config: JSON.parse(row.config || '{}'),
    created_at: row.created_at,
    updated_at: row.updated_at,
    audit_enabled: Boolean(row.audit_enabled)
  };
}

// ============================================================================
// COORDINATE OPERATIONS
// ============================================================================

export interface CreateCoordinateInput {
  tenant_id: string;
  coordinate: Coordinate;
  value?: any;
  metadata?: Record<string, any>;
  created_by?: string;
}

export async function createCoordinateAsync(input: CreateCoordinateInput): Promise<CoordinateRecord> {
  const database = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  await database.execute({
    sql: `INSERT INTO coordinates
          (id, tenant_id, L1_category, L2_domain, L3_entity, L4_attribute, L5_state, value, metadata, created_at, updated_at, created_by, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.tenant_id,
      input.coordinate.L1_category,
      input.coordinate.L2_domain,
      input.coordinate.L3_entity,
      input.coordinate.L4_attribute,
      input.coordinate.L5_state,
      input.value !== undefined ? JSON.stringify(input.value) : null,
      JSON.stringify(input.metadata || {}),
      now,
      now,
      input.created_by || null,
      input.created_by || null
    ]
  });

  return (await getCoordinateAsync(id, input.tenant_id))!;
}

export async function getCoordinateAsync(id: string, tenant_id: string): Promise<CoordinateRecord | null> {
  const database = getDatabase();
  const result = await database.execute({
    sql: `SELECT * FROM coordinates WHERE id = ? AND tenant_id = ?`,
    args: [id, tenant_id]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return rowToCoordinateRecord(result.rows[0]);
}

export interface ListCoordinatesOptions {
  tenant_id: string;
  L1_category?: string | string[];
  L2_domain?: string | string[];
  L3_entity?: string | string[];
  L4_attribute?: string | string[];
  L5_state?: string | string[];
  limit?: number;
  offset?: number;
}

export async function listCoordinatesAsync(options: ListCoordinatesOptions): Promise<CoordinateRecord[]> {
  const database = getDatabase();
  const conditions: string[] = ['tenant_id = ?'];
  const params: any[] = [options.tenant_id];

  if (options.L1_category) {
    const cats = Array.isArray(options.L1_category) ? options.L1_category : [options.L1_category];
    conditions.push(`L1_category IN (${cats.map(() => '?').join(', ')})`);
    params.push(...cats);
  }

  if (options.L2_domain) {
    const doms = Array.isArray(options.L2_domain) ? options.L2_domain : [options.L2_domain];
    conditions.push(`L2_domain IN (${doms.map(() => '?').join(', ')})`);
    params.push(...doms);
  }

  if (options.L5_state) {
    const states = Array.isArray(options.L5_state) ? options.L5_state : [options.L5_state];
    conditions.push(`L5_state IN (${states.map(() => '?').join(', ')})`);
    params.push(...states);
  }

  let sql = `SELECT * FROM coordinates WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;

  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }
  if (options.offset) {
    sql += ` OFFSET ${options.offset}`;
  }

  const result = await database.execute({ sql, args: params });

  return result.rows.map(row => rowToCoordinateRecord(row));
}

export async function updateCoordinateAsync(input: {
  id: string;
  tenant_id: string;
  value?: any;
  metadata?: Record<string, any>;
  L5_state?: string;
  updated_by?: string;
}): Promise<CoordinateRecord | null> {
  const database = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = ['updated_at = ?'];
  const params: any[] = [now];

  if (input.value !== undefined) {
    updates.push('value = ?');
    params.push(JSON.stringify(input.value));
  }

  if (input.metadata !== undefined) {
    updates.push('metadata = ?');
    params.push(JSON.stringify(input.metadata));
  }

  if (input.L5_state !== undefined) {
    updates.push('L5_state = ?');
    params.push(input.L5_state);
  }

  params.push(input.id, input.tenant_id);

  await database.execute({
    sql: `UPDATE coordinates SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
    args: params
  });

  return getCoordinateAsync(input.id, input.tenant_id);
}

export async function deleteCoordinateAsync(id: string, tenant_id: string): Promise<boolean> {
  const database = getDatabase();

  const result = await database.execute({
    sql: `DELETE FROM coordinates WHERE id = ? AND tenant_id = ?`,
    args: [id, tenant_id]
  });

  return result.rowsAffected > 0;
}

export async function findCoordinateAsync(tenant_id: string, coordinate: Coordinate): Promise<CoordinateRecord | null> {
  const database = getDatabase();
  const result = await database.execute({
    sql: `SELECT * FROM coordinates WHERE tenant_id = ? AND L1_category = ? AND L2_domain = ? AND L3_entity = ? AND L4_attribute = ? AND L5_state = ?`,
    args: [tenant_id, coordinate.L1_category, coordinate.L2_domain, coordinate.L3_entity, coordinate.L4_attribute, coordinate.L5_state]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return rowToCoordinateRecord(result.rows[0]);
}

function rowToCoordinateRecord(row: any): CoordinateRecord {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    L1_category: row.L1_category,
    L2_domain: row.L2_domain,
    L3_entity: row.L3_entity,
    L4_attribute: row.L4_attribute,
    L5_state: row.L5_state,
    value: row.value ? JSON.parse(row.value) : undefined,
    metadata: JSON.parse(row.metadata || '{}'),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// ============================================================================
// AUDIT OPERATIONS
// ============================================================================

export interface AuditEvent {
  id: string;
  tenant_id: string;
  user_id?: string;
  event_type: string;
  event_category: string;
  resource_type: string;
  resource_id?: string;
  action: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  correlation_id?: string;
  metadata?: Record<string, any>;
}

export interface CreateAuditEventInput {
  tenant_id: string;
  user_id?: string;
  event_type: string;
  event_category: string;
  resource_type: string;
  resource_id?: string;
  action: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  correlation_id?: string;
  metadata?: Record<string, any>;
}

export async function createAuditEventAsync(input: CreateAuditEventInput): Promise<AuditEvent> {
  const database = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  await database.execute({
    sql: `INSERT INTO audit_log
          (id, tenant_id, user_id, event_type, event_category, resource_type, resource_id, action, old_value, new_value, ip_address, user_agent, timestamp, correlation_id, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.tenant_id,
      input.user_id || null,
      input.event_type,
      input.event_category,
      input.resource_type,
      input.resource_id || null,
      input.action,
      input.old_value ? JSON.stringify(input.old_value) : null,
      input.new_value ? JSON.stringify(input.new_value) : null,
      input.ip_address || null,
      input.user_agent || null,
      now,
      input.correlation_id || null,
      JSON.stringify(input.metadata || {})
    ]
  });

  return {
    id,
    tenant_id: input.tenant_id,
    user_id: input.user_id,
    event_type: input.event_type,
    event_category: input.event_category,
    resource_type: input.resource_type,
    resource_id: input.resource_id,
    action: input.action,
    old_value: input.old_value,
    new_value: input.new_value,
    ip_address: input.ip_address,
    user_agent: input.user_agent,
    timestamp: now,
    correlation_id: input.correlation_id,
    metadata: input.metadata
  };
}

export async function listAuditEventsAsync(options: {
  tenant_id: string;
  event_type?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditEvent[]> {
  const database = getDatabase();
  const conditions: string[] = ['tenant_id = ?'];
  const params: any[] = [options.tenant_id];

  if (options.event_type) {
    conditions.push('event_type = ?');
    params.push(options.event_type);
  }

  let sql = `SELECT * FROM audit_log WHERE ${conditions.join(' AND ')} ORDER BY timestamp DESC`;

  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }
  if (options.offset) {
    sql += ` OFFSET ${options.offset}`;
  }

  const result = await database.execute({ sql, args: params });

  return result.rows.map(row => ({
    id: row.id as string,
    tenant_id: row.tenant_id as string,
    user_id: row.user_id as string | undefined,
    event_type: row.event_type as string,
    event_category: row.event_category as string,
    resource_type: row.resource_type as string,
    resource_id: row.resource_id as string | undefined,
    action: row.action as string,
    old_value: row.old_value ? JSON.parse(row.old_value as string) : undefined,
    new_value: row.new_value ? JSON.parse(row.new_value as string) : undefined,
    ip_address: row.ip_address as string | undefined,
    user_agent: row.user_agent as string | undefined,
    timestamp: row.timestamp as string,
    correlation_id: row.correlation_id as string | undefined,
    metadata: JSON.parse((row.metadata as string) || '{}')
  }));
}

// ============================================================================
// LEGACY SYNC WRAPPERS (for backward compatibility)
// These call the async versions but are used by existing code
// ============================================================================

// Cache for sync operations
let tenantCache: Map<string, Tenant> = new Map();
let coordinateCache: Map<string, CoordinateRecord[]> = new Map();

export function createTenantSync(input: CreateTenantInput): Tenant {
  // This is a workaround - in practice, routes should use async versions
  throw new Error('Use createTenantAsync instead');
}

export { createTenantAsync as createTenant };
export { getTenantAsync as getTenant };
export { getTenantBySlugAsync as getTenantBySlug };
export { listTenantsAsync as listTenants };
export { createCoordinateAsync as createCoordinate };
export { getCoordinateAsync as getCoordinate };
export { listCoordinatesAsync as listCoordinates };
export { updateCoordinateAsync as updateCoordinate };
export { deleteCoordinateAsync as deleteCoordinate };
export { findCoordinateAsync as findCoordinate };
export { createAuditEventAsync as createAuditEvent };
export { listAuditEventsAsync as listAuditEvents };

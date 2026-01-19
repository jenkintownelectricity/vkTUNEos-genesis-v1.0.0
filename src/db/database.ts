/**
 * vkTUNEos Database Layer
 * SQLite with tenant isolation (Row-Level Security pattern)
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
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

let db: SqlJsDatabase | null = null;

export async function initDatabase(path?: string): Promise<SqlJsDatabase> {
  try {
    console.log('[DB] Loading sql.js from CDN...');
    // For serverless environments, load WASM from jsDelivr CDN (reliable and fast)
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}`
    });
    console.log('[DB] sql.js loaded successfully');

    console.log('[DB] Creating in-memory database...');
    db = new SQL.Database();
    console.log('[DB] Database created');

    // Create tables
    console.log('[DB] Running schema migration...');
    db.run(SCHEMA_SQL);
    console.log('[DB] Schema applied');

    // Seed default tenants for each tier
    console.log('[DB] Seeding default tenants...');
    seedDefaultTenants();

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
function seedDefaultTenants(): void {
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
    db.run(`
      INSERT OR IGNORE INTO tenants (id, name, slug, tier, config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      tenant.id,
      tenant.name,
      tenant.slug,
      tenant.tier,
      JSON.stringify(tenant.config),
      now,
      now
    ]);
  }

  // Seed sample coordinates for each tenant
  const sampleCoordinates = [
    // Voice Cloning coordinates
    { L1: 'VoiceCloning', L2: 'Tool', L3: 'ElevenLabs', L4: 'Languages', L5: 'Validated', value: '32', metadata: { languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'hi', 'ar', 'zh'] } },
    { L1: 'VoiceCloning', L2: 'Tool', L3: 'KitsAI', L4: 'Fidelity', L5: 'Validated', value: '8.5', metadata: { source_consent: true, neural_network_model: 'kits-v2' } },
    { L1: 'VoiceCloning', L2: 'Model', L3: 'InstantClone', L4: 'Latency', L5: 'Validated', value: '15', metadata: { unit: 'seconds' } },
    // Stem Separation coordinates
    { L1: 'StemSeparation', L2: 'Model', L3: 'Phoenix', L4: 'Fidelity', L5: 'Validated', value: '9.2', metadata: { stems: 10 } },
    { L1: 'StemSeparation', L2: 'Tool', L3: 'LALALAI', L4: 'Stems', L5: 'Validated', value: '10', metadata: { formats: ['wav', 'mp3', 'flac'] } },
    // Music Generation coordinates
    { L1: 'MusicGeneration', L2: 'Tool', L3: 'Suno', L4: 'Pricing', L5: 'Validated', value: '$0.02/call', metadata: { pricing_model: 'subscription', billing_period: 'monthly' } },
    { L1: 'MusicGeneration', L2: 'Model', L3: 'SunoV5', L4: 'Fidelity', L5: 'Validated', value: '9.0', metadata: { max_duration: 300 } },
    // Audio Production coordinates
    { L1: 'AudioProduction', L2: 'Tool', L3: 'LANDR', L4: 'Pricing', L5: 'Validated', value: '$4.99/track', metadata: { pricing_model: 'subscription' } },
    // Licensing coordinates
    { L1: 'Licensing', L2: 'Rights', L3: 'RoyaltyFree', L4: 'Commercial', L5: 'Validated', value: 'true', metadata: { attribution_required: false } },
  ];

  for (const tenant of defaultTenants) {
    for (const coord of sampleCoordinates) {
      const coordId = `${tenant.id}-${coord.L1}-${coord.L3}-${coord.L4}`.toLowerCase();
      db.run(`
        INSERT OR IGNORE INTO coordinates (id, tenant_id, L1_category, L2_domain, L3_entity, L4_attribute, L5_state, value, metadata, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        coordId,
        tenant.id,
        coord.L1,
        coord.L2,
        coord.L3,
        coord.L4,
        coord.L5,
        coord.value,
        JSON.stringify(coord.metadata),
        now,
        now
      ]);
    }
  }

    console.log('[DB] Seeded 3 default tenants (free, premium, enterprise) with sample coordinates');
  } catch (err) {
    console.error('[DB] Seed failed:', err);
  }
}

export function getDatabase(): SqlJsDatabase {
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

export function createTenant(input: CreateTenantInput): Tenant {
  const database = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  database.run(`
    INSERT INTO tenants (id, name, slug, domain, tier, config, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    input.name,
    input.slug,
    input.domain || null,
    input.tier || 'free',
    JSON.stringify(input.config || {}),
    now,
    now
  ]);
  
  return getTenant(id)!;
}

export function getTenant(id: string): Tenant | null {
  const database = getDatabase();
  const result = database.exec(`SELECT * FROM tenants WHERE id = ?`, [id]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  return rowToTenant(result[0].columns, result[0].values[0]);
}

export function getTenantBySlug(slug: string): Tenant | null {
  const database = getDatabase();
  const result = database.exec(`SELECT * FROM tenants WHERE slug = ?`, [slug]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  return rowToTenant(result[0].columns, result[0].values[0]);
}

export function listTenants(): Tenant[] {
  const database = getDatabase();
  const result = database.exec(`SELECT * FROM tenants ORDER BY created_at DESC`);
  
  if (result.length === 0) {
    return [];
  }
  
  return result[0].values.map((row: any[]) => rowToTenant(result[0].columns, row));
}

function rowToTenant(columns: string[], values: any[]): Tenant {
  const obj: any = {};
  columns.forEach((col, i) => obj[col] = values[i]);
  
  return {
    ...obj,
    config: JSON.parse(obj.config || '{}'),
    audit_enabled: Boolean(obj.audit_enabled)
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

export function createCoordinate(input: CreateCoordinateInput): CoordinateRecord {
  const database = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  database.run(`
    INSERT INTO coordinates 
    (id, tenant_id, L1_category, L2_domain, L3_entity, L4_attribute, L5_state, value, metadata, created_at, updated_at, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
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
  ]);
  
  return getCoordinate(id, input.tenant_id)!;
}

export function getCoordinate(id: string, tenant_id: string): CoordinateRecord | null {
  const database = getDatabase();
  const result = database.exec(
    `SELECT * FROM coordinates WHERE id = ? AND tenant_id = ?`,
    [id, tenant_id]
  );
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  return rowToCoordinateRecord(result[0].columns, result[0].values[0]);
}

export function findCoordinate(tenant_id: string, coord: Coordinate): CoordinateRecord | null {
  const database = getDatabase();
  const result = database.exec(`
    SELECT * FROM coordinates 
    WHERE tenant_id = ? 
      AND L1_category = ? 
      AND L2_domain = ? 
      AND L3_entity = ? 
      AND L4_attribute = ?
      AND L5_state = ?
  `, [
    tenant_id,
    coord.L1_category,
    coord.L2_domain,
    coord.L3_entity,
    coord.L4_attribute,
    coord.L5_state
  ]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  return rowToCoordinateRecord(result[0].columns, result[0].values[0]);
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

export function listCoordinates(options: ListCoordinatesOptions): CoordinateRecord[] {
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
  
  if (options.L3_entity) {
    const ents = Array.isArray(options.L3_entity) ? options.L3_entity : [options.L3_entity];
    conditions.push(`L3_entity IN (${ents.map(() => '?').join(', ')})`);
    params.push(...ents);
  }
  
  if (options.L4_attribute) {
    const attrs = Array.isArray(options.L4_attribute) ? options.L4_attribute : [options.L4_attribute];
    conditions.push(`L4_attribute IN (${attrs.map(() => '?').join(', ')})`);
    params.push(...attrs);
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
  
  const result = database.exec(sql, params);
  
  if (result.length === 0) {
    return [];
  }
  
  return result[0].values.map((row: any[]) => rowToCoordinateRecord(result[0].columns, row));
}

export interface UpdateCoordinateInput {
  id: string;
  tenant_id: string;
  value?: any;
  metadata?: Record<string, any>;
  L5_state?: string;
  updated_by?: string;
}

export function updateCoordinate(input: UpdateCoordinateInput): CoordinateRecord | null {
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
  
  if (input.updated_by) {
    updates.push('updated_by = ?');
    params.push(input.updated_by);
  }
  
  params.push(input.id, input.tenant_id);
  
  database.run(`
    UPDATE coordinates SET ${updates.join(', ')}
    WHERE id = ? AND tenant_id = ?
  `, params);
  
  return getCoordinate(input.id, input.tenant_id);
}

export function deleteCoordinate(id: string, tenant_id: string): boolean {
  const database = getDatabase();
  
  database.run(
    `DELETE FROM coordinates WHERE id = ? AND tenant_id = ?`,
    [id, tenant_id]
  );
  
  return database.getRowsModified() > 0;
}

function rowToCoordinateRecord(columns: string[], values: any[]): CoordinateRecord {
  const obj: any = {};
  columns.forEach((col, i) => obj[col] = values[i]);
  
  return {
    id: obj.id,
    tenant_id: obj.tenant_id,
    L1_category: obj.L1_category,
    L2_domain: obj.L2_domain,
    L3_entity: obj.L3_entity,
    L4_attribute: obj.L4_attribute,
    L5_state: obj.L5_state,
    value: obj.value ? JSON.parse(obj.value) : undefined,
    metadata: JSON.parse(obj.metadata || '{}'),
    created_at: obj.created_at,
    updated_at: obj.updated_at
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

export function createAuditEvent(input: CreateAuditEventInput): AuditEvent {
  const database = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  database.run(`
    INSERT INTO audit_log 
    (id, tenant_id, user_id, event_type, event_category, resource_type, resource_id, action, old_value, new_value, ip_address, user_agent, timestamp, correlation_id, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
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
  ]);
  
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

export interface ListAuditEventsOptions {
  tenant_id: string;
  event_type?: string;
  event_category?: string;
  resource_type?: string;
  resource_id?: string;
  user_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export function listAuditEvents(options: ListAuditEventsOptions): AuditEvent[] {
  const database = getDatabase();
  const conditions: string[] = ['tenant_id = ?'];
  const params: any[] = [options.tenant_id];
  
  if (options.event_type) {
    conditions.push('event_type = ?');
    params.push(options.event_type);
  }
  
  if (options.event_category) {
    conditions.push('event_category = ?');
    params.push(options.event_category);
  }
  
  if (options.resource_type) {
    conditions.push('resource_type = ?');
    params.push(options.resource_type);
  }
  
  if (options.resource_id) {
    conditions.push('resource_id = ?');
    params.push(options.resource_id);
  }
  
  if (options.user_id) {
    conditions.push('user_id = ?');
    params.push(options.user_id);
  }
  
  if (options.from_date) {
    conditions.push('timestamp >= ?');
    params.push(options.from_date);
  }
  
  if (options.to_date) {
    conditions.push('timestamp <= ?');
    params.push(options.to_date);
  }
  
  let sql = `SELECT * FROM audit_log WHERE ${conditions.join(' AND ')} ORDER BY timestamp DESC`;
  
  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }
  if (options.offset) {
    sql += ` OFFSET ${options.offset}`;
  }
  
  const result = database.exec(sql, params);
  
  if (result.length === 0) {
    return [];
  }
  
  return result[0].values.map((row: any[]) => {
    const obj: any = {};
    result[0].columns.forEach((col: string, i: number) => obj[col] = row[i]);
    
    return {
      ...obj,
      old_value: obj.old_value ? JSON.parse(obj.old_value) : undefined,
      new_value: obj.new_value ? JSON.parse(obj.new_value) : undefined,
      metadata: JSON.parse(obj.metadata || '{}')
    };
  });
}

// ============================================================================
// DATABASE EXPORT (for persistence)
// ============================================================================

export function exportDatabase(): Uint8Array {
  const database = getDatabase();
  return database.export();
}

export async function importDatabase(data: Uint8Array): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();
  db = new SQL.Database(data);
  return db;
}

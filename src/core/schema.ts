/**
 * vkTUNEos Music Kernel Schema
 * Vector Authority v1.0 Compliant
 * 
 * Domain: vkTUNEos.com
 * Parent Authority: VectorAuthority.com
 * Version: 1.0
 */

import { z } from 'zod';

// ============================================================================
// AXIS DEFINITIONS (Section 2 of L0 Command)
// ============================================================================

export const CategoryValues = [
  'VoiceCloning',
  'StemSeparation', 
  'MusicGeneration',
  'VocalProcessing',
  'AudioProduction',
  'Licensing'
] as const;

export const DomainValues = [
  'Model',
  'Tool',
  'Workflow',
  'Asset',
  'Rights',
  'Quality'
] as const;

export const AttributeValues = [
  'Fidelity',
  'Latency',
  'Languages',
  'Formats',
  'Pricing',
  'API',
  'Emotion',
  'Range',
  'Stems',
  'Commercial'
] as const;

export const StateValues = [
  'Draft',
  'Proposed',
  'Validated',
  'Deprecated',
  'Archived'
] as const;

// Entity pattern: PascalCase starting with uppercase letter
export const EntityPattern = /^[A-Z][a-zA-Z0-9_]+$/;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const CategorySchema = z.enum(CategoryValues);
export const DomainSchema = z.enum(DomainValues);
export const AttributeSchema = z.enum(AttributeValues);
export const StateSchema = z.enum(StateValues);
export const EntitySchema = z.string().regex(EntityPattern, 'Entity must be PascalCase starting with uppercase');

// Full coordinate schema
export const CoordinateSchema = z.object({
  L1_category: CategorySchema,
  L2_domain: DomainSchema,
  L3_entity: EntitySchema,
  L4_attribute: AttributeSchema,
  L5_state: StateSchema
});

// Coordinate with optional ID and metadata
export const CoordinateRecordSchema = CoordinateSchema.extend({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  value: z.any().optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

// ============================================================================
// TYPES
// ============================================================================

export type Category = z.infer<typeof CategorySchema>;
export type Domain = z.infer<typeof DomainSchema>;
export type Attribute = z.infer<typeof AttributeSchema>;
export type State = z.infer<typeof StateSchema>;
export type Coordinate = z.infer<typeof CoordinateSchema>;
export type CoordinateRecord = z.infer<typeof CoordinateRecordSchema>;

// ============================================================================
// AXIS SCHEMA DEFINITION (JSON format from L0 Command)
// ============================================================================

export const MusicKernelSchema = {
  domain: 'Music',
  version: '1.0',
  depth_limit: 5,
  axes: [
    {
      id: 'L1',
      name: 'Category',
      type: 'enum',
      values: CategoryValues
    },
    {
      id: 'L2', 
      name: 'Domain',
      type: 'enum',
      values: DomainValues
    },
    {
      id: 'L3',
      name: 'Entity',
      type: 'string',
      pattern: '^[A-Z][a-zA-Z0-9_]+$'
    },
    {
      id: 'L4',
      name: 'Attribute',
      type: 'enum',
      values: AttributeValues
    },
    {
      id: 'L5',
      name: 'State',
      type: 'enum',
      values: StateValues
    }
  ]
} as const;

// ============================================================================
// COORDINATE UTILITIES
// ============================================================================

/**
 * Parse a coordinate string into components
 * Format: Music.Category.Domain.Entity.Attribute.State
 */
export function parseCoordinate(coord: string): Coordinate | null {
  const parts = coord.split('.');
  
  // Must have exactly 6 parts: Music + 5 axes
  if (parts.length !== 6) return null;
  if (parts[0] !== 'Music') return null;
  
  try {
    return CoordinateSchema.parse({
      L1_category: parts[1],
      L2_domain: parts[2],
      L3_entity: parts[3],
      L4_attribute: parts[4],
      L5_state: parts[5]
    });
  } catch {
    return null;
  }
}

/**
 * Convert a coordinate object to string format
 */
export function coordinateToString(coord: Coordinate): string {
  return `Music.${coord.L1_category}.${coord.L2_domain}.${coord.L3_entity}.${coord.L4_attribute}.${coord.L5_state}`;
}

/**
 * Generate a unique coordinate key for storage
 */
export function getCoordinateKey(coord: Coordinate): string {
  return `${coord.L1_category}|${coord.L2_domain}|${coord.L3_entity}|${coord.L4_attribute}|${coord.L5_state}`;
}

// ============================================================================
// COORDINATE VALIDATION (Vector Authority Rules VA.01-VA.06)
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCoordinate(coord: Coordinate): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // VA.01: Axis values must be from defined enums
  if (!CategoryValues.includes(coord.L1_category as any)) {
    errors.push(`VA.01: Invalid category "${coord.L1_category}"`);
  }
  
  if (!DomainValues.includes(coord.L2_domain as any)) {
    errors.push(`VA.01: Invalid domain "${coord.L2_domain}"`);
  }
  
  if (!AttributeValues.includes(coord.L4_attribute as any)) {
    errors.push(`VA.01: Invalid attribute "${coord.L4_attribute}"`);
  }
  
  if (!StateValues.includes(coord.L5_state as any)) {
    errors.push(`VA.01: Invalid state "${coord.L5_state}"`);
  }
  
  // VA.02: Entity must match pattern
  if (!EntityPattern.test(coord.L3_entity)) {
    errors.push(`VA.02: Entity "${coord.L3_entity}" does not match PascalCase pattern`);
  }
  
  // VA.03: Depth limit = 5 (enforced by schema)
  // This is inherently satisfied by our 5-axis structure
  
  // VA.04: Orthogonality check (axes must be independent)
  // For now, we trust the enum definitions are orthogonal
  
  // VA.05: Domain-specific validation
  // Check logical consistency between category and domain
  if (coord.L1_category === 'Licensing' && !['Rights', 'Asset'].includes(coord.L2_domain)) {
    warnings.push(`VA.05: Licensing category typically uses Rights or Asset domain`);
  }
  
  if (coord.L1_category === 'StemSeparation' && coord.L2_domain === 'Rights') {
    warnings.push(`VA.05: StemSeparation rarely uses Rights domain`);
  }
  
  // VA.06: State transition validation
  // Draft → Proposed → Validated → Deprecated → Archived
  // (This would need historical data to validate properly)
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// PROJECTION TYPES (Section 9 of L0 Command)
// ============================================================================

export type ProjectionFilter = {
  L1_category?: Category | Category[];
  L2_domain?: Domain | Domain[];
  L3_entity?: string | string[];
  L4_attribute?: Attribute | Attribute[];
  L5_state?: State | State[];
};

export const ProjectionDefinitions = {
  voice_library: {
    name: 'Voice Library',
    filter: { L1_category: 'VoiceCloning', L2_domain: 'Model' },
    description: 'Browse voice clone models'
  },
  stem_splitter: {
    name: 'Stem Splitter',
    filter: { L1_category: 'StemSeparation', L2_domain: 'Asset' },
    description: 'Extract tracks'
  },
  music_studio: {
    name: 'Music Studio',
    filter: { L1_category: 'MusicGeneration', L2_domain: 'Workflow' },
    description: 'Create music'
  },
  licensing_hub: {
    name: 'Licensing Hub',
    filter: { L1_category: 'Licensing' },
    description: 'Rights management'
  },
  quality_dashboard: {
    name: 'Quality Dashboard',
    filter: { L4_attribute: 'Fidelity' },
    description: 'All quality metrics'
  },
  pricing_comparator: {
    name: 'Pricing Comparator',
    filter: { L2_domain: 'Tool', L4_attribute: 'Pricing' },
    description: 'Cost analysis'
  }
} as const;

export type ProjectionName = keyof typeof ProjectionDefinitions;

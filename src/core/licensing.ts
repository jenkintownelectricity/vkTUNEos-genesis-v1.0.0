/**
 * vkTUNEos License Tier Configuration & Enforcement
 * Implements tier-based feature flags and resource limits
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Request, Response, NextFunction } from 'express';
import { getTenant } from '../db/database.js';

// ============================================================================
// LICENSE TIER DEFINITIONS (Section 18 of L0 Command)
// ============================================================================

export type LicenseTier = 'free' | 'premium' | 'enterprise';

export interface TierLimits {
  // API Limits
  api_calls_per_day: number;
  requests_per_minute: number;
  
  // Voice Cloning
  voice_clone_slots: number;
  
  // Stem Separation
  stem_count: number;
  
  // Music Generation
  music_length_seconds: number;
  
  // Multi-tenant
  tenant_limit: number;
  
  // Storage
  storage_gb: number;
  max_file_mb: number;
  
  // Features
  white_label: boolean;
  custom_domain: boolean;
  advanced_audit: boolean;
  api_access: boolean;
  
  // LLM/Chat limits
  context_tokens: number;
  max_turns: number;
  response_tokens: number;
  monthly_budget_usd: number;
}

export const TIER_LIMITS: Record<LicenseTier, TierLimits> = {
  free: {
    api_calls_per_day: 100,
    requests_per_minute: 5,
    voice_clone_slots: 1,
    stem_count: 2,
    music_length_seconds: 120, // 2 minutes
    tenant_limit: 1,
    storage_gb: 1,
    max_file_mb: 25,
    white_label: false,
    custom_domain: false,
    advanced_audit: false,
    api_access: true,
    context_tokens: 4000,
    max_turns: 10,
    response_tokens: 1000,
    monthly_budget_usd: 0
  },
  premium: {
    api_calls_per_day: 5000,
    requests_per_minute: 30,
    voice_clone_slots: 10,
    stem_count: 10,
    music_length_seconds: 1800, // 30 minutes
    tenant_limit: 10,
    storage_gb: 50,
    max_file_mb: 500,
    white_label: true,
    custom_domain: true,
    advanced_audit: true,
    api_access: true,
    context_tokens: 16000,
    max_turns: 50,
    response_tokens: 4000,
    monthly_budget_usd: 50
  },
  enterprise: {
    api_calls_per_day: -1, // Unlimited
    requests_per_minute: 100,
    voice_clone_slots: -1, // Unlimited
    stem_count: 10,
    music_length_seconds: -1, // Unlimited
    tenant_limit: -1, // Unlimited
    storage_gb: 500,
    max_file_mb: 2000,
    white_label: true,
    custom_domain: true,
    advanced_audit: true,
    api_access: true,
    context_tokens: 128000,
    max_turns: 500,
    response_tokens: 16000,
    monthly_budget_usd: -1 // Custom
  }
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface FeatureFlags {
  voice_cloning: boolean;
  stem_separation: boolean;
  music_generation: boolean;
  vocal_processing: boolean;
  audio_production: boolean;
  licensing_management: boolean;
  workflow_engine: boolean;
  bulk_operations: boolean;
  export_data: boolean;
  webhooks: boolean;
  sso_saml: boolean;
  dedicated_infra: boolean;
  compliance_tools: boolean;
}

export const TIER_FEATURES: Record<LicenseTier, FeatureFlags> = {
  free: {
    voice_cloning: true,
    stem_separation: true,
    music_generation: true,
    vocal_processing: true,
    audio_production: true,
    licensing_management: false,
    workflow_engine: false,
    bulk_operations: false,
    export_data: false,
    webhooks: false,
    sso_saml: false,
    dedicated_infra: false,
    compliance_tools: false
  },
  premium: {
    voice_cloning: true,
    stem_separation: true,
    music_generation: true,
    vocal_processing: true,
    audio_production: true,
    licensing_management: true,
    workflow_engine: true,
    bulk_operations: true,
    export_data: true,
    webhooks: true,
    sso_saml: false,
    dedicated_infra: false,
    compliance_tools: false
  },
  enterprise: {
    voice_cloning: true,
    stem_separation: true,
    music_generation: true,
    vocal_processing: true,
    audio_production: true,
    licensing_management: true,
    workflow_engine: true,
    bulk_operations: true,
    export_data: true,
    webhooks: true,
    sso_saml: true,
    dedicated_infra: true,
    compliance_tools: true
  }
};

// ============================================================================
// LICENSE ENFORCEMENT MIDDLEWARE
// ============================================================================

export interface LicenseContext {
  tenant_id: string;
  tier: LicenseTier;
  limits: TierLimits;
  features: FeatureFlags;
}

export interface RequestWithLicense extends Request {
  license?: LicenseContext;
  tenant_id?: string;
}

/**
 * Middleware to load and attach license context to request
 */
export async function loadLicenseContext(req: Request, res: Response, next: NextFunction) {
  const typedReq = req as RequestWithLicense;
  const tenant_id = req.headers['x-tenant-id'] as string;

  if (!tenant_id) {
    // No tenant = free tier defaults
    typedReq.license = {
      tenant_id: 'anonymous',
      tier: 'free',
      limits: TIER_LIMITS.free,
      features: TIER_FEATURES.free
    };
    return next();
  }

  const tenant = await getTenant(tenant_id);

  if (!tenant) {
    return res.status(404).json({
      error: 'Tenant not found',
      code: 'TENANT_NOT_FOUND'
    });
  }

  const tier = tenant.tier as LicenseTier;

  typedReq.tenant_id = tenant_id;
  typedReq.license = {
    tenant_id,
    tier,
    limits: TIER_LIMITS[tier],
    features: TIER_FEATURES[tier]
  };

  next();
}

/**
 * Middleware factory to require a specific feature
 */
export function requireFeature(feature: keyof FeatureFlags) {
  return (req: Request, res: Response, next: NextFunction) => {
    const typedReq = req as RequestWithLicense;
    
    if (!typedReq.license) {
      return res.status(500).json({
        error: 'License context not loaded',
        code: 'LICENSE_CONTEXT_MISSING'
      });
    }
    
    if (!typedReq.license.features[feature]) {
      return res.status(403).json({
        error: `Feature "${feature}" not available in ${typedReq.license.tier} tier`,
        code: 'FEATURE_NOT_AVAILABLE',
        feature,
        current_tier: typedReq.license.tier,
        upgrade_url: 'https://vktuneos.com/pricing'
      });
    }
    
    next();
  };
}

/**
 * Middleware factory to check resource limit
 */
export function checkLimit(limitKey: keyof TierLimits, currentValue: () => number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const typedReq = req as RequestWithLicense;
    
    if (!typedReq.license) {
      return res.status(500).json({
        error: 'License context not loaded',
        code: 'LICENSE_CONTEXT_MISSING'
      });
    }
    
    const limit = typedReq.license.limits[limitKey];
    
    // -1 means unlimited
    if (limit === -1) {
      return next();
    }
    
    const current = currentValue();
    
    if (typeof limit === 'number' && current >= limit) {
      return res.status(429).json({
        error: `Limit reached for ${limitKey}`,
        code: 'LIMIT_REACHED',
        limit_key: limitKey,
        current: current,
        limit: limit,
        current_tier: typedReq.license.tier,
        upgrade_url: 'https://vktuneos.com/pricing'
      });
    }
    
    next();
  };
}

// ============================================================================
// TIER COMPARISON UTILITIES
// ============================================================================

export function getTierLimits(tier: LicenseTier): TierLimits {
  return TIER_LIMITS[tier];
}

export function getTierFeatures(tier: LicenseTier): FeatureFlags {
  return TIER_FEATURES[tier];
}

export function isFeatureAvailable(tier: LicenseTier, feature: keyof FeatureFlags): boolean {
  return TIER_FEATURES[tier][feature];
}

export function isWithinLimit(tier: LicenseTier, limitKey: keyof TierLimits, value: number): boolean {
  const limit = TIER_LIMITS[tier][limitKey];
  if (limit === -1) return true; // Unlimited
  if (typeof limit === 'boolean') return true; // Not a numeric limit
  return value <= limit;
}

export function getUpgradePath(currentTier: LicenseTier): LicenseTier | null {
  if (currentTier === 'free') return 'premium';
  if (currentTier === 'premium') return 'enterprise';
  return null;
}

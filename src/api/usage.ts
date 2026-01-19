/**
 * vkTUNEos API Routes - Usage & Licensing
 * Resource usage tracking and license information
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Router, Request, Response } from 'express';
import { 
  RequestWithLicense, 
  loadLicenseContext,
  TIER_LIMITS,
  TIER_FEATURES,
  LicenseTier,
  getUpgradePath
} from '../core/licensing.js';
import { getRateLimitStatus } from '../core/ratelimit.js';
import { 
  getUsageSummary, 
  getUsageHistory, 
  getTenantUsage 
} from '../core/resources.js';

const router = Router();

// Apply middleware
router.use(loadLicenseContext);

// ============================================================================
// USAGE ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/usage
 * Get current usage summary
 */
router.get('/', async (req: Request, res: Response) => {
  const typedReq = req as RequestWithLicense;
  
  if (!typedReq.license || typedReq.license.tenant_id === 'anonymous') {
    return res.status(401).json({
      error: 'Tenant required',
      code: 'TENANT_REQUIRED'
    });
  }
  
  const summary = getUsageSummary(
    typedReq.license.tenant_id,
    typedReq.license.tier
  );
  
  const rateLimit = getRateLimitStatus(
    typedReq.license.tenant_id,
    typedReq.license.tier
  );
  
  res.json({
    success: true,
    data: {
      ...summary,
      rate_limit: rateLimit
    }
  });
});

/**
 * GET /api/v1/usage/history
 * Get usage history
 */
router.get('/history', async (req: Request, res: Response) => {
  const typedReq = req as RequestWithLicense;
  
  if (!typedReq.license || typedReq.license.tenant_id === 'anonymous') {
    return res.status(401).json({
      error: 'Tenant required',
      code: 'TENANT_REQUIRED'
    });
  }
  
  const months = parseInt(req.query.months as string) || 6;
  const history = getUsageHistory(
    typedReq.license.tenant_id,
    Math.min(months, 12)
  );
  
  res.json({
    success: true,
    data: history
  });
});

// ============================================================================
// LICENSE ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/usage/license
 * Get current license info
 */
router.get('/license', async (req: Request, res: Response) => {
  const typedReq = req as RequestWithLicense;
  
  res.json({
    success: true,
    data: {
      tenant_id: typedReq.license?.tenant_id || 'anonymous',
      tier: typedReq.license?.tier || 'free',
      limits: typedReq.license?.limits || TIER_LIMITS.free,
      features: typedReq.license?.features || TIER_FEATURES.free,
      upgrade_path: getUpgradePath(typedReq.license?.tier || 'free')
    }
  });
});

/**
 * GET /api/v1/usage/tiers
 * Get all tier definitions
 */
router.get('/tiers', (req: Request, res: Response) => {
  const tiers: LicenseTier[] = ['free', 'premium', 'enterprise'];
  
  res.json({
    success: true,
    data: tiers.map(tier => ({
      tier,
      limits: TIER_LIMITS[tier],
      features: TIER_FEATURES[tier],
      pricing: getPricing(tier)
    }))
  });
});

/**
 * GET /api/v1/usage/compare
 * Compare current tier with upgrade options
 */
router.get('/compare', async (req: Request, res: Response) => {
  const typedReq = req as RequestWithLicense;
  const currentTier = typedReq.license?.tier || 'free';
  
  const comparison = {
    current: {
      tier: currentTier,
      limits: TIER_LIMITS[currentTier],
      features: TIER_FEATURES[currentTier]
    },
    upgrades: [] as any[]
  };
  
  if (currentTier === 'free') {
    comparison.upgrades.push({
      tier: 'premium',
      limits: TIER_LIMITS.premium,
      features: TIER_FEATURES.premium,
      pricing: getPricing('premium'),
      highlights: [
        '50x more API calls',
        '10 voice clone slots',
        'Full 10-stem separation',
        '30 min music generation',
        'White-label themes',
        'Multi-tenant support'
      ]
    });
  }
  
  if (currentTier !== 'enterprise') {
    comparison.upgrades.push({
      tier: 'enterprise',
      limits: TIER_LIMITS.enterprise,
      features: TIER_FEATURES.enterprise,
      pricing: getPricing('enterprise'),
      highlights: [
        'Unlimited everything',
        'Database-level isolation',
        'SSO/SAML',
        'SOC2/HIPAA compliance',
        'Dedicated support',
        'Custom development'
      ]
    });
  }
  
  res.json({
    success: true,
    data: comparison
  });
});

// ============================================================================
// HELPERS
// ============================================================================

function getPricing(tier: LicenseTier) {
  switch (tier) {
    case 'free':
      return { price: 0, period: null, description: 'Free forever' };
    case 'premium':
      return { 
        price: 49, 
        period: 'month', 
        annual_price: 490,
        description: '$49/month or $490/year' 
      };
    case 'enterprise':
      return { 
        price: 499, 
        period: 'month', 
        description: 'Starting at $499/month, custom pricing available',
        contact: 'enterprise@vktuneos.com'
      };
  }
}

export default router;

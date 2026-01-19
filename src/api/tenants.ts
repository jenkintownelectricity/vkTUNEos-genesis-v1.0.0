/**
 * vkTUNEos API Routes - Tenants
 * RESTful endpoints for tenant management
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  createTenant,
  getTenant,
  getTenantBySlug,
  listTenants,
  createAuditEvent
} from '../db/database.js';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateTenantBody = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  domain: z.string().optional(),
  tier: z.enum(['free', 'premium', 'enterprise']).optional(),
  config: z.record(z.any()).optional()
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/v1/tenants
 * List all tenants
 */
router.get('/', async (req: Request, res: Response) => {
  const tenants = await listTenants();

  res.json({
    success: true,
    data: tenants,
    meta: {
      count: tenants.length
    }
  });
});

/**
 * GET /api/v1/tenants/:id
 * Get a single tenant by ID or slug
 */
router.get('/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  // Try by ID first, then by slug
  let tenant = await getTenant(id);
  if (!tenant) {
    tenant = await getTenantBySlug(id);
  }

  if (!tenant) {
    return res.status(404).json({
      error: 'Tenant not found',
      code: 'NOT_FOUND'
    });
  }

  res.json({
    success: true,
    data: tenant
  });
});

/**
 * POST /api/v1/tenants
 * Create a new tenant
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = CreateTenantBody.parse(req.body);

    // Check for duplicate slug
    const existing = await getTenantBySlug(body.slug);
    if (existing) {
      return res.status(409).json({
        error: 'Tenant slug already exists',
        code: 'DUPLICATE_SLUG'
      });
    }

    const tenant = await createTenant(body);

    // Audit the creation
    await createAuditEvent({
      tenant_id: tenant.id,
      event_type: 'TENANT',
      event_category: 'lifecycle',
      resource_type: 'tenant',
      resource_id: tenant.id,
      action: 'create',
      new_value: tenant,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: tenant
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: err.errors
      });
    }
    throw err;
  }
});

export default router;

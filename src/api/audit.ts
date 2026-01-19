/**
 * vkTUNEos API Routes - Audit
 * RESTful endpoints for audit log access
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { listAuditEvents } from '../db/database.js';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ListAuditQuery = z.object({
  event_type: z.string().optional(),
  event_category: z.string().optional(),
  resource_type: z.string().optional(),
  resource_id: z.string().optional(),
  user_id: z.string().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().min(0).optional().default(0)
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

interface RequestWithTenant extends Request {
  tenant_id: string;
}

function requireTenant(req: Request, res: Response, next: NextFunction) {
  const tenant_id = req.headers['x-tenant-id'] as string;
  
  if (!tenant_id) {
    return res.status(400).json({
      error: 'Missing X-Tenant-ID header',
      code: 'TENANT_REQUIRED'
    });
  }
  
  (req as RequestWithTenant).tenant_id = tenant_id;
  next();
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/v1/audit
 * List audit events for the tenant
 */
router.get('/', requireTenant, async (req: Request, res: Response) => {
  try {
    const typedReq = req as RequestWithTenant;
    const query = ListAuditQuery.parse(req.query);

    const events = await listAuditEvents({
      tenant_id: typedReq.tenant_id,
      ...query
    });

    res.json({
      success: true,
      data: events,
      meta: {
        count: events.length,
        limit: query.limit,
        offset: query.offset
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: err.errors
      });
    }
    throw err;
  }
});

/**
 * GET /api/v1/audit/export
 * Export audit events as downloadable JSON
 */
router.get('/export', requireTenant, async (req: Request, res: Response) => {
  try {
    const typedReq = req as RequestWithTenant;
    const query = ListAuditQuery.parse(req.query);

    // Get all matching events (higher limit for export)
    const events = await listAuditEvents({
      tenant_id: typedReq.tenant_id,
      ...query,
      limit: 10000
    });

    const filename = `audit-export-${typedReq.tenant_id}-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.json({
      export_date: new Date().toISOString(),
      tenant_id: typedReq.tenant_id,
      filters: query,
      event_count: events.length,
      events
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: err.errors
      });
    }
    throw err;
  }
});

export default router;

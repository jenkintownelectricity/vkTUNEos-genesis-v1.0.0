/**
 * vkTUNEos API Routes - Coordinates
 * RESTful endpoints for coordinate CRUD operations
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  CoordinateSchema,
  CategorySchema,
  DomainSchema,
  AttributeSchema,
  StateSchema,
  coordinateToString,
  parseCoordinate
} from '../core/schema.js';
import { validateFull } from '../core/validation.js';
import {
  createCoordinate,
  getCoordinate,
  findCoordinate,
  listCoordinates,
  updateCoordinate,
  deleteCoordinate,
  createAuditEvent
} from '../db/database.js';

const router = Router();

// Helper to extract string from possibly array values (Express 5 typing)
function asString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : (value || '');
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateCoordinateBody = z.object({
  L1_category: CategorySchema,
  L2_domain: DomainSchema,
  L3_entity: z.string().regex(/^[A-Z][a-zA-Z0-9_]+$/),
  L4_attribute: AttributeSchema,
  L5_state: StateSchema,
  value: z.any().optional(),
  metadata: z.record(z.any()).optional()
});

const UpdateCoordinateBody = z.object({
  value: z.any().optional(),
  metadata: z.record(z.any()).optional(),
  L5_state: StateSchema.optional()
});

const ListCoordinatesQuery = z.object({
  L1_category: z.union([z.string(), z.array(z.string())]).optional(),
  L2_domain: z.union([z.string(), z.array(z.string())]).optional(),
  L3_entity: z.union([z.string(), z.array(z.string())]).optional(),
  L4_attribute: z.union([z.string(), z.array(z.string())]).optional(),
  L5_state: z.union([z.string(), z.array(z.string())]).optional(),
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().min(0).optional().default(0)
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

interface RequestWithTenant extends Request {
  tenant_id: string;
  user_id?: string;
  correlation_id: string;
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
  (req as RequestWithTenant).user_id = req.headers['x-user-id'] as string;
  (req as RequestWithTenant).correlation_id = (req.headers['x-correlation-id'] as string) || uuidv4();
  
  next();
}

function auditMiddleware(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    const typedReq = req as RequestWithTenant;
    
    res.json = (body: any) => {
      // Only audit successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          createAuditEvent({
            tenant_id: typedReq.tenant_id,
            user_id: typedReq.user_id,
            event_type: 'DATA',
            event_category: 'coordinate',
            resource_type: 'coordinate',
            resource_id: body?.data?.id || req.params.id,
            action,
            new_value: action === 'delete' ? undefined : body?.data,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            correlation_id: typedReq.correlation_id
          });
        } catch (err) {
          console.error('[Audit] Failed to log event:', err);
        }
      }
      
      return originalJson(body);
    };
    
    next();
  };
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/v1/coordinates
 * List coordinates with optional filtering
 */
router.get('/', requireTenant, async (req: Request, res: Response) => {
  try {
    const typedReq = req as RequestWithTenant;
    const query = ListCoordinatesQuery.parse(req.query);
    
    const coordinates = listCoordinates({
      tenant_id: typedReq.tenant_id,
      ...query
    });
    
    res.json({
      success: true,
      data: coordinates,
      meta: {
        count: coordinates.length,
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
 * GET /api/v1/coordinates/:id
 * Get a single coordinate by ID
 */
router.get('/:id', requireTenant, async (req: Request, res: Response) => {
  const typedReq = req as RequestWithTenant;
  const id = asString(req.params.id);

  const coordinate = getCoordinate(id, typedReq.tenant_id);
  
  if (!coordinate) {
    return res.status(404).json({
      error: 'Coordinate not found',
      code: 'NOT_FOUND'
    });
  }
  
  res.json({
    success: true,
    data: coordinate
  });
});

/**
 * GET /api/v1/coordinates/resolve/:path
 * Resolve a coordinate by path string (e.g., Music.VoiceCloning.Model.KitsAI.Fidelity.Validated)
 */
router.get('/resolve/:path(*)', requireTenant, async (req: Request, res: Response) => {
  const typedReq = req as RequestWithTenant;
  const path = asString(req.params.path);

  const parsed = parseCoordinate(path);
  
  if (!parsed) {
    return res.status(400).json({
      error: 'Invalid coordinate path',
      code: 'INVALID_PATH',
      hint: 'Format: Music.Category.Domain.Entity.Attribute.State'
    });
  }
  
  const coordinate = findCoordinate(typedReq.tenant_id, parsed);
  
  if (!coordinate) {
    return res.status(404).json({
      error: 'Coordinate not found',
      code: 'NOT_FOUND',
      path
    });
  }
  
  res.json({
    success: true,
    data: coordinate
  });
});

/**
 * POST /api/v1/coordinates
 * Create a new coordinate
 */
router.post('/', requireTenant, auditMiddleware('create'), async (req: Request, res: Response) => {
  try {
    const typedReq = req as RequestWithTenant;
    const body = CreateCoordinateBody.parse(req.body);
    
    const coord = {
      L1_category: body.L1_category,
      L2_domain: body.L2_domain,
      L3_entity: body.L3_entity,
      L4_attribute: body.L4_attribute,
      L5_state: body.L5_state
    };
    
    // Run full validation
    const validation = validateFull(coord, body.value, body.metadata);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        validation
      });
    }
    
    // Check for duplicates
    const existing = findCoordinate(typedReq.tenant_id, coord);
    if (existing) {
      return res.status(409).json({
        error: 'Coordinate already exists',
        code: 'DUPLICATE',
        existing_id: existing.id,
        coordinate: coordinateToString(coord)
      });
    }
    
    // Create the coordinate
    const created = createCoordinate({
      tenant_id: typedReq.tenant_id,
      coordinate: coord,
      value: body.value,
      metadata: body.metadata,
      created_by: typedReq.user_id
    });
    
    res.status(201).json({
      success: true,
      data: created,
      validation: {
        warnings: validation.all_warnings
      }
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

/**
 * PUT /api/v1/coordinates/:id
 * Update an existing coordinate
 */
router.put('/:id', requireTenant, auditMiddleware('update'), async (req: Request, res: Response) => {
  try {
    const typedReq = req as RequestWithTenant;
    const id = asString(req.params.id);
    const body = UpdateCoordinateBody.parse(req.body);
    
    // Check exists
    const existing = getCoordinate(id, typedReq.tenant_id);
    if (!existing) {
      return res.status(404).json({
        error: 'Coordinate not found',
        code: 'NOT_FOUND'
      });
    }
    
    // Validate the update
    const newCoord = {
      L1_category: existing.L1_category,
      L2_domain: existing.L2_domain,
      L3_entity: existing.L3_entity,
      L4_attribute: existing.L4_attribute,
      L5_state: body.L5_state || existing.L5_state
    };
    
    const newMetadata = body.metadata !== undefined 
      ? { ...existing.metadata, ...body.metadata }
      : existing.metadata;
    
    const validation = validateFull(newCoord, body.value ?? existing.value, newMetadata);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        validation
      });
    }
    
    // Update
    const updated = updateCoordinate({
      id,
      tenant_id: typedReq.tenant_id,
      value: body.value,
      metadata: body.metadata,
      L5_state: body.L5_state,
      updated_by: typedReq.user_id
    });
    
    res.json({
      success: true,
      data: updated,
      validation: {
        warnings: validation.all_warnings
      }
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

/**
 * DELETE /api/v1/coordinates/:id
 * Delete a coordinate
 */
router.delete('/:id', requireTenant, auditMiddleware('delete'), async (req: Request, res: Response) => {
  const typedReq = req as RequestWithTenant;
  const id = asString(req.params.id);

  // Check exists
  const existing = getCoordinate(id, typedReq.tenant_id);
  if (!existing) {
    return res.status(404).json({
      error: 'Coordinate not found',
      code: 'NOT_FOUND'
    });
  }
  
  const deleted = deleteCoordinate(id, typedReq.tenant_id);
  
  if (!deleted) {
    return res.status(500).json({
      error: 'Failed to delete coordinate',
      code: 'DELETE_FAILED'
    });
  }
  
  res.json({
    success: true,
    deleted: {
      id,
      coordinate: coordinateToString(existing)
    }
  });
});

/**
 * POST /api/v1/coordinates/validate
 * Validate a coordinate without creating it
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const body = CreateCoordinateBody.parse(req.body);
    
    const coord = {
      L1_category: body.L1_category,
      L2_domain: body.L2_domain,
      L3_entity: body.L3_entity,
      L4_attribute: body.L4_attribute,
      L5_state: body.L5_state
    };
    
    const validation = validateFull(coord, body.value, body.metadata);
    
    res.json({
      valid: validation.valid,
      coordinate: coordinateToString(coord),
      validation
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

/**
 * POST /api/v1/coordinates/bulk
 * Create multiple coordinates in a single request
 */
router.post('/bulk', requireTenant, async (req: Request, res: Response) => {
  try {
    const typedReq = req as RequestWithTenant;
    const items = z.array(CreateCoordinateBody).parse(req.body);
    
    const results: any[] = [];
    const errors: any[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const coord = {
        L1_category: item.L1_category,
        L2_domain: item.L2_domain,
        L3_entity: item.L3_entity,
        L4_attribute: item.L4_attribute,
        L5_state: item.L5_state
      };
      
      const validation = validateFull(coord, item.value, item.metadata);
      
      if (!validation.valid) {
        errors.push({
          index: i,
          coordinate: coordinateToString(coord),
          errors: validation.all_errors
        });
        continue;
      }
      
      const existing = findCoordinate(typedReq.tenant_id, coord);
      if (existing) {
        errors.push({
          index: i,
          coordinate: coordinateToString(coord),
          errors: ['Coordinate already exists']
        });
        continue;
      }
      
      const created = createCoordinate({
        tenant_id: typedReq.tenant_id,
        coordinate: coord,
        value: item.value,
        metadata: item.metadata,
        created_by: typedReq.user_id
      });
      
      results.push(created);
    }
    
    res.status(errors.length > 0 ? 207 : 201).json({
      success: errors.length === 0,
      created: results,
      errors,
      meta: {
        total: items.length,
        created: results.length,
        failed: errors.length
      }
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

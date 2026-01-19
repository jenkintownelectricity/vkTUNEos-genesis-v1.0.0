/**
 * vkTUNEos API Routes - Schema
 * Endpoints for schema introspection
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Router, Request, Response } from 'express';
import {
  MusicKernelSchema,
  CategoryValues,
  DomainValues,
  AttributeValues,
  StateValues,
  ProjectionDefinitions
} from '../core/schema.js';
import { MusicKernelRules } from '../core/validation.js';

const router = Router();

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/v1/schema
 * Get the full Music Kernel schema definition
 */
router.get('/', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: MusicKernelSchema
  });
});

/**
 * GET /api/v1/schema/axes
 * Get all axis definitions
 */
router.get('/axes', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      L1_category: {
        name: 'Category',
        type: 'enum',
        values: [...CategoryValues]
      },
      L2_domain: {
        name: 'Domain',
        type: 'enum',
        values: [...DomainValues]
      },
      L3_entity: {
        name: 'Entity',
        type: 'string',
        pattern: '^[A-Z][a-zA-Z0-9_]+$',
        description: 'PascalCase identifier'
      },
      L4_attribute: {
        name: 'Attribute',
        type: 'enum',
        values: [...AttributeValues]
      },
      L5_state: {
        name: 'State',
        type: 'enum',
        values: [...StateValues]
      }
    }
  });
});

/**
 * GET /api/v1/schema/categories
 * Get category values
 */
router.get('/categories', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [...CategoryValues]
  });
});

/**
 * GET /api/v1/schema/domains
 * Get domain values
 */
router.get('/domains', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [...DomainValues]
  });
});

/**
 * GET /api/v1/schema/attributes
 * Get attribute values
 */
router.get('/attributes', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [...AttributeValues]
  });
});

/**
 * GET /api/v1/schema/states
 * Get state values
 */
router.get('/states', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [...StateValues]
  });
});

/**
 * GET /api/v1/schema/rules
 * Get validation rules
 */
router.get('/rules', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: MusicKernelRules.map(rule => ({
      code: rule.code,
      description: rule.description
    }))
  });
});

/**
 * GET /api/v1/schema/projections
 * Get projection definitions
 */
router.get('/projections', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: ProjectionDefinitions
  });
});

export default router;

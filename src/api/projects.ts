/**
 * vkTUNEos API Routes - Projects (VKT Single-File Format)
 * Semantic compression with coordinate-based addressing
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { VKTFileManager, CoordinateQuery, SemanticBlock } from '../core/semantic-compression.js';
import { parseCoordinate, coordinateToString, Coordinate } from '../core/schema.js';

const router = Router();

// Helper to ensure string type from params
function asString(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

// In-memory project storage (would be file-based in production)
const activeProjects: Map<string, VKTFileManager> = new Map();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateProjectBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional()
});

const AddBlockBody = z.object({
  coordinate: z.string().regex(/^[A-Za-z]+\.[A-Za-z]+\.[A-Za-z0-9]+\.[A-Za-z0-9]+\.[A-Za-z]+$/),
  data: z.string(), // Base64 encoded
  type: z.enum(['audio', 'video', 'image', 'text', 'model', 'data']),
  metadata: z.record(z.any()).optional()
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/v1/projects
 * Create a new VKT project
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = CreateProjectBody.parse(req.body);
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const manager = new VKTFileManager();
    activeProjects.set(projectId, manager);

    res.status(201).json({
      success: true,
      data: {
        id: projectId,
        name: body.name,
        description: body.description,
        format: 'VKT1',
        created: new Date().toISOString()
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: err.errors
      });
    }
    throw err;
  }
});

/**
 * GET /api/v1/projects
 * List all active projects
 */
router.get('/', async (req: Request, res: Response) => {
  const projects = Array.from(activeProjects.entries()).map(([id, manager]) => {
    const stats = manager.getStats();
    return {
      id,
      entries: stats.totalEntries,
      compressedSize: stats.compressedSize,
      compressionRatio: stats.compressionRatio,
      categories: stats.byCategory
    };
  });

  res.json({
    success: true,
    data: projects
  });
});

/**
 * GET /api/v1/projects/:id
 * Get project details and stats
 */
router.get('/:id', async (req: Request, res: Response) => {
  const projectId = asString(req.params.id);
  const manager = activeProjects.get(projectId);

  if (!manager) {
    return res.status(404).json({
      error: 'Project not found',
      code: 'NOT_FOUND'
    });
  }

  const stats = manager.getStats();
  const query = new CoordinateQuery(manager);

  res.json({
    success: true,
    data: {
      id: projectId,
      stats,
      summary: {
        music: query.music().length,
        voiceModels: query.voiceModels().length,
        stems: query.stems().length,
        generated: query.generated().length,
        validated: query.validated().length
      }
    }
  });
});

/**
 * POST /api/v1/projects/:id/blocks
 * Add a block to the project
 */
router.post('/:id/blocks', async (req: Request, res: Response) => {
  try {
    const projectId = asString(req.params.id);
    const manager = activeProjects.get(projectId);

    if (!manager) {
      return res.status(404).json({
        error: 'Project not found',
        code: 'NOT_FOUND'
      });
    }

    const body = AddBlockBody.parse(req.body);
    const coordinate = parseCoordinate(body.coordinate);

    if (!coordinate) {
      return res.status(400).json({
        error: 'Invalid coordinate format',
        code: 'INVALID_COORDINATE',
        expected: 'L1.L2.L3.L4.L5'
      });
    }

    const data = Buffer.from(body.data, 'base64');

    const block: SemanticBlock = {
      coordinate,
      data,
      type: body.type,
      metadata: body.metadata
    };

    const entry = manager.addBlock(block);

    res.status(201).json({
      success: true,
      data: {
        coordinate: entry.coordinate,
        size: entry.size,
        originalSize: entry.originalSize,
        compression: entry.compression,
        compressionRatio: (entry.size / entry.originalSize * 100).toFixed(1) + '%',
        hash: entry.hash,
        deltaBase: entry.deltaBase
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: err.errors
      });
    }
    throw err;
  }
});

/**
 * GET /api/v1/projects/:id/blocks/:coordinate
 * Get a block by coordinate
 */
router.get('/:id/blocks/:coordinate(*)', async (req: Request, res: Response) => {
  const projectId = asString(req.params.id);
  const coordinateStr = asString(req.params.coordinate);
  const manager = activeProjects.get(projectId);

  if (!manager) {
    return res.status(404).json({
      error: 'Project not found',
      code: 'NOT_FOUND'
    });
  }

  const data = manager.getBlock(coordinateStr);

  if (!data) {
    return res.status(404).json({
      error: 'Block not found',
      code: 'BLOCK_NOT_FOUND',
      coordinate: coordinateStr
    });
  }

  // Return as base64 or raw depending on Accept header
  if (req.accepts('application/octet-stream')) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('X-Coordinate', coordinateStr);
    res.send(data);
  } else {
    res.json({
      success: true,
      data: {
        coordinate: coordinateStr,
        size: data.length,
        content: data.toString('base64')
      }
    });
  }
});

/**
 * GET /api/v1/projects/:id/query
 * Query blocks by coordinate prefix
 */
router.get('/:id/query', async (req: Request, res: Response) => {
  const projectId = asString(req.params.id);
  const prefix = req.query.prefix as string || '';
  const manager = activeProjects.get(projectId);

  if (!manager) {
    return res.status(404).json({
      error: 'Project not found',
      code: 'NOT_FOUND'
    });
  }

  const entries = manager.queryByPrefix(prefix);

  res.json({
    success: true,
    data: entries.map(e => ({
      coordinate: e.coordinate,
      size: e.size,
      originalSize: e.originalSize,
      compression: e.compression,
      hash: e.hash
    })),
    meta: {
      prefix,
      count: entries.length
    }
  });
});

/**
 * GET /api/v1/projects/:id/export
 * Export project as single .vkt file
 */
router.get('/:id/export', async (req: Request, res: Response) => {
  const projectId = asString(req.params.id);
  const manager = activeProjects.get(projectId);

  if (!manager) {
    return res.status(404).json({
      error: 'Project not found',
      code: 'NOT_FOUND'
    });
  }

  const vktBuffer = manager.exportToFile();
  const filename = `${projectId}.vkt`;

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('X-VKT-Version', 'VKT1');
  res.setHeader('X-VKT-Size', vktBuffer.length.toString());

  res.send(vktBuffer);
});

/**
 * POST /api/v1/projects/import
 * Import a .vkt file
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    // Expect raw VKT file in body
    if (!req.body || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        error: 'Expected raw VKT file in request body',
        code: 'INVALID_FORMAT'
      });
    }

    const manager = VKTFileManager.importFromFile(req.body);
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    activeProjects.set(projectId, manager);
    const stats = manager.getStats();

    res.status(201).json({
      success: true,
      data: {
        id: projectId,
        imported: true,
        stats
      }
    });
  } catch (err: any) {
    return res.status(400).json({
      error: 'Failed to import VKT file',
      message: err?.message
    });
  }
});

/**
 * DELETE /api/v1/projects/:id
 * Delete a project
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const projectId = asString(req.params.id);

  if (!activeProjects.has(projectId)) {
    return res.status(404).json({
      error: 'Project not found',
      code: 'NOT_FOUND'
    });
  }

  activeProjects.delete(projectId);

  res.json({
    success: true,
    deleted: projectId
  });
});

export default router;

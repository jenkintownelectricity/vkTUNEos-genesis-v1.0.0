/**
 * vkTUNEos API Routes - Workflows
 * Text-to-Music, Lyrics-to-Song, Remix pipeline endpoints
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { 
  RequestWithLicense, 
  loadLicenseContext, 
  requireFeature 
} from '../core/licensing.js';
import { rateLimitMiddleware } from '../core/ratelimit.js';
import { WorkflowEngine } from '../integrations/workflows.js';

const router = Router();

// Apply middleware
router.use(loadLicenseContext);
router.use(rateLimitMiddleware);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const TextToMusicBody = z.object({
  prompt: z.string().min(1).max(1000),
  duration_seconds: z.number().min(15).max(600).optional(),
  genre: z.string().optional(),
  mood: z.string().optional(),
  provider: z.enum(['Suno', 'Udio']).optional(),
  master: z.boolean().optional()
});

const LyricsToSongBody = z.object({
  lyrics: z.string().min(1).max(5000),
  voice_id: z.string().optional(),
  genre: z.string().optional(),
  mood: z.string().optional(),
  tempo: z.enum(['slow', 'medium', 'fast']).optional(),
  create_voice: z.object({
    name: z.string(),
    audio_url: z.string().url(),
    consent_verified: z.boolean()
  }).optional()
});

const RemixBody = z.object({
  audio_url: z.string().url(),
  style: z.string().min(1).max(200),
  preserve_vocals: z.boolean().optional(),
  tempo_change: z.number().min(-50).max(50).optional()
});

// ============================================================================
// WORKFLOW ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/workflows/text-to-music
 * Create a text-to-music workflow
 */
router.post('/text-to-music',
  requireFeature('workflow_engine'),
  async (req: Request, res: Response) => {
    try {
      const typedReq = req as RequestWithLicense;
      const body = TextToMusicBody.parse(req.body);
      
      // Check duration limit
      const maxDuration = typedReq.license!.limits.music_length_seconds;
      const requestedDuration = body.duration_seconds || 120;
      
      if (maxDuration !== -1 && requestedDuration > maxDuration) {
        return res.status(403).json({
          error: `Duration exceeds ${typedReq.license!.tier} tier limit`,
          code: 'DURATION_LIMIT_EXCEEDED',
          requested_seconds: requestedDuration,
          max_seconds: maxDuration,
          upgrade_url: 'https://vktuneos.com/pricing'
        });
      }
      
      const workflow = await WorkflowEngine.textToMusic(
        typedReq.license!.tenant_id,
        body
      );
      
      res.status(201).json({
        success: true,
        data: workflow
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: err.errors });
      }
      throw err;
    }
  }
);

/**
 * POST /api/v1/workflows/lyrics-to-song
 * Create a lyrics-to-song workflow
 */
router.post('/lyrics-to-song',
  requireFeature('workflow_engine'),
  async (req: Request, res: Response) => {
    try {
      const typedReq = req as RequestWithLicense;
      const body = LyricsToSongBody.parse(req.body);
      
      const workflow = await WorkflowEngine.lyricsToSong(
        typedReq.license!.tenant_id,
        body
      );
      
      res.status(201).json({
        success: true,
        data: workflow
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: err.errors });
      }
      throw err;
    }
  }
);

/**
 * POST /api/v1/workflows/remix
 * Create a remix workflow
 */
router.post('/remix',
  requireFeature('workflow_engine'),
  async (req: Request, res: Response) => {
    try {
      const typedReq = req as RequestWithLicense;
      const body = RemixBody.parse(req.body);
      
      const workflow = await WorkflowEngine.remix(
        typedReq.license!.tenant_id,
        body
      );
      
      res.status(201).json({
        success: true,
        data: workflow
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: err.errors });
      }
      throw err;
    }
  }
);

/**
 * GET /api/v1/workflows
 * List workflows for tenant
 */
router.get('/',
  requireFeature('workflow_engine'),
  async (req: Request, res: Response) => {
    const typedReq = req as RequestWithLicense;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const workflows = WorkflowEngine.listWorkflows(
      typedReq.license!.tenant_id,
      Math.min(limit, 100)
    );
    
    res.json({
      success: true,
      data: workflows,
      meta: { count: workflows.length }
    });
  }
);

/**
 * GET /api/v1/workflows/:id
 * Get workflow by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const workflow = WorkflowEngine.getWorkflow(id);
  
  if (!workflow) {
    return res.status(404).json({
      error: 'Workflow not found',
      code: 'NOT_FOUND'
    });
  }
  
  res.json({
    success: true,
    data: workflow
  });
});

/**
 * POST /api/v1/workflows/:id/cancel
 * Cancel a running workflow
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const cancelled = WorkflowEngine.cancelWorkflow(id);
  
  if (!cancelled) {
    return res.status(400).json({
      error: 'Cannot cancel workflow',
      code: 'CANCEL_FAILED',
      hint: 'Workflow may already be completed or not exist'
    });
  }
  
  res.json({
    success: true,
    message: 'Workflow cancelled'
  });
});

/**
 * GET /api/v1/workflows/types
 * List available workflow types
 */
router.get('/meta/types', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        type: 'text_to_music',
        name: 'Text to Music',
        description: 'Generate music from a text prompt',
        steps: ['generate_music', 'master_audio (optional)'],
        required_features: ['workflow_engine', 'music_generation']
      },
      {
        type: 'lyrics_to_song',
        name: 'Lyrics to Song',
        description: 'Create a full song from lyrics with optional voice cloning',
        steps: ['create_voice (optional)', 'generate_backing', 'synthesize_vocals'],
        required_features: ['workflow_engine', 'voice_cloning', 'music_generation']
      },
      {
        type: 'remix',
        name: 'Remix',
        description: 'Create a remix by separating stems and generating new backing',
        steps: ['separate_stems', 'generate_remix_backing', 'master_remix'],
        required_features: ['workflow_engine', 'stem_separation', 'music_generation']
      }
    ]
  });
});

export default router;

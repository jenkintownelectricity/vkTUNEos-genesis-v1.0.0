/**
 * vkTUNEos Killer Features API
 * Routes for Tier 3 killer features
 *
 * Endpoints:
 * - /api/v1/killer/collaborator - AI Collaborator Mode
 * - /api/v1/killer/copyright - Copyright Shield
 * - /api/v1/killer/mood - Mood-to-Music
 * - /api/v1/killer/marketplace - Voice Marketplace
 * - /api/v1/killer/rights - Remix Rights Tracking
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';

// Killer Feature Modules
import { AICollaboratorEngine } from '../ai/collaborator.js';
import { CopyrightShieldEngine } from '../ai/copyright-shield.js';
import { MoodToMusicEngine, MOOD_MAP, EMOTION_PARAMS, TONE_MODIFIERS, ERA_STYLES } from '../ai/mood-to-music.js';
import { VoiceMarketplaceEngine } from '../marketplace/voice-marketplace.js';
import { RemixRightsEngine } from '../core/remix-rights.js';
import { VersionControlEngine } from '../core/version-control.js';

const router = Router();

// Initialize engines
const collaborator = new AICollaboratorEngine();
const copyrightShield = new CopyrightShieldEngine();
const moodToMusic = new MoodToMusicEngine();
const voiceMarketplace = new VoiceMarketplaceEngine();
const remixRights = new RemixRightsEngine();
const versionControl = new VersionControlEngine();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CollaboratorRequestSchema = z.object({
  instruction: z.string().min(1).max(500),
  context: z.object({
    type: z.enum(['music', 'video', 'mixed']),
    tracks: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['vocals', 'drums', 'bass', 'melody', 'fx', 'video']),
      current_effects: z.array(z.string()).optional(),
      volume: z.number().optional(),
      pan: z.number().optional()
    })).optional(),
    current_time: z.number().optional(),
    selected_region: z.object({
      start: z.number(),
      end: z.number()
    }).optional(),
    bpm: z.number().optional(),
    key: z.string().optional(),
    genre: z.string().optional()
  }),
  mode: z.enum(['preview', 'apply']).optional(),
  confidence_threshold: z.number().min(0).max(1).optional()
});

const CopyrightScanSchema = z.object({
  audio: z.string().optional(),
  lyrics: z.string().optional(),
  deep_scan: z.boolean().optional()
});

const MoodRequestSchema = z.object({
  mood: z.union([
    z.object({
      energy: z.enum(['calm', 'peaceful', 'building', 'energetic', 'explosive']),
      emotion: z.enum(['happy', 'sad', 'angry', 'fearful', 'surprised', 'neutral', 'nostalgic', 'hopeful', 'melancholic']),
      tone: z.enum(['dark', 'light', 'mysterious', 'playful', 'epic', 'intimate', 'ethereal', 'aggressive']),
      era: z.enum(['retro', 'modern', 'futuristic', 'timeless', 'vintage', 'contemporary']).optional(),
      intensity: z.number().min(0).max(100).optional()
    }),
    z.object({
      energy: z.number().min(0).max(100),
      valence: z.number().min(0).max(100)
    })
  ]),
  duration: z.number().min(5).max(300).optional(),
  with_stems: z.boolean().optional(),
  style_hints: z.array(z.string()).optional()
});

// ============================================================================
// KILLER FEATURES INFO
// ============================================================================

router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'vkTUNEos Killer Features API',
      version: '1.0',
      features: {
        collaborator: {
          description: 'AI Collaborator Mode - Natural language control',
          endpoint: '/api/v1/killer/collaborator',
          examples: [
            'Make the chorus more energetic',
            'Add more bass to the drop',
            'The vocals feel flat, add some emotion'
          ]
        },
        copyright: {
          description: 'Copyright Shield - Scan before publishing',
          endpoint: '/api/v1/killer/copyright',
          detects: ['exact_match', 'melody_similarity', 'sample_detected', 'lyric_match']
        },
        mood: {
          description: 'Mood-to-Music - Generate from emotion',
          endpoint: '/api/v1/killer/mood',
          axes: {
            energy: ['calm', 'peaceful', 'building', 'energetic', 'explosive'],
            emotion: Object.keys(EMOTION_PARAMS),
            tone: Object.keys(TONE_MODIFIERS),
            era: Object.keys(ERA_STYLES)
          }
        },
        marketplace: {
          description: 'Voice Marketplace - Trade voice models',
          endpoint: '/api/v1/killer/marketplace',
          features: ['consent_verification', 'royalty_tracking', 'dmca_protection']
        },
        rights: {
          description: 'Remix Rights Tracking - Track all contributions',
          endpoint: '/api/v1/killer/rights',
          tracks: ['contributors', 'samples', 'licenses', 'splits']
        },
        version_control: {
          description: 'Git-like version control for projects',
          endpoint: '/api/v1/killer/versions',
          commands: ['commit', 'branch', 'checkout', 'merge', 'revert', 'diff']
        }
      },
      coordinate: 'vkTUNEos.Killer.API.Root.Validated'
    }
  });
});

// ============================================================================
// AI COLLABORATOR MODE
// ============================================================================

/**
 * POST /api/v1/killer/collaborator
 * Process natural language instruction
 */
router.post('/collaborator', async (req: Request, res: Response) => {
  try {
    const body = CollaboratorRequestSchema.parse(req.body);

    const result = await collaborator.process({
      instruction: body.instruction,
      context: body.context,
      mode: body.mode,
      confidence_threshold: body.confidence_threshold
    });

    res.json({
      success: result.success,
      data: result,
      meta: {
        module: 'collaborator',
        action: 'process'
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: err.errors });
    }
    throw err;
  }
});

/**
 * GET /api/v1/killer/collaborator/suggestions
 * Get suggested instructions based on context
 */
router.post('/collaborator/suggestions', (req: Request, res: Response) => {
  const context = req.body.context || { type: 'music' };
  const suggestions = collaborator.getSuggestions(context);

  res.json({
    success: true,
    data: suggestions
  });
});

// ============================================================================
// COPYRIGHT SHIELD
// ============================================================================

/**
 * POST /api/v1/killer/copyright/scan
 * Full copyright scan
 */
router.post('/copyright/scan', async (req: Request, res: Response) => {
  try {
    const body = CopyrightScanSchema.parse(req.body);

    if (!body.audio && !body.lyrics) {
      return res.status(400).json({
        error: 'Must provide audio or lyrics to scan'
      });
    }

    const result = await copyrightShield.scan({
      audio: body.audio,
      lyrics: body.lyrics,
      deep_scan: body.deep_scan
    });

    res.json({
      success: true,
      data: result,
      meta: {
        module: 'copyright',
        action: 'scan'
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: err.errors });
    }
    throw err;
  }
});

/**
 * POST /api/v1/killer/copyright/quick
 * Quick audio fingerprint scan
 */
router.post('/copyright/quick', async (req: Request, res: Response) => {
  const { audio } = req.body;

  if (!audio) {
    return res.status(400).json({ error: 'Audio required' });
  }

  const result = await copyrightShield.quickScan(audio);

  res.json({
    success: true,
    data: result
  });
});

/**
 * GET /api/v1/killer/copyright/samples
 * Get known sample database
 */
router.get('/copyright/samples', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: copyrightShield.getKnownSamples()
  });
});

// ============================================================================
// MOOD-TO-MUSIC
// ============================================================================

/**
 * GET /api/v1/killer/mood/map
 * Get the mood map for UI
 */
router.get('/mood/map', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      mood_map: MOOD_MAP,
      emotions: Object.keys(EMOTION_PARAMS),
      tones: Object.keys(TONE_MODIFIERS),
      eras: ERA_STYLES
    }
  });
});

/**
 * POST /api/v1/killer/mood/generate
 * Generate music from mood
 */
router.post('/mood/generate', async (req: Request, res: Response) => {
  try {
    const body = MoodRequestSchema.parse(req.body);

    const result = await moodToMusic.generate({
      mood: body.mood,
      duration: body.duration,
      with_stems: body.with_stems,
      style_hints: body.style_hints
    });

    res.json({
      success: result.success,
      data: result,
      meta: {
        module: 'mood',
        action: 'generate'
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: err.errors });
    }
    throw err;
  }
});

/**
 * POST /api/v1/killer/mood/position
 * Generate from 2D position (x: energy, y: valence)
 */
router.post('/mood/position', async (req: Request, res: Response) => {
  const { x, y, duration, with_stems, era } = req.body;

  if (x === undefined || y === undefined) {
    return res.status(400).json({ error: 'x and y coordinates required' });
  }

  const result = await moodToMusic.generateFromPosition(x, y, {
    duration,
    with_stems,
    era
  });

  res.json({
    success: result.success,
    data: result
  });
});

/**
 * POST /api/v1/killer/mood/describe
 * Get description for a mood combination
 */
router.post('/mood/describe', (req: Request, res: Response) => {
  const { energy, emotion, tone, era } = req.body;

  if (!energy || !emotion || !tone) {
    return res.status(400).json({ error: 'energy, emotion, and tone required' });
  }

  const description = moodToMusic.describeMood({ energy, emotion, tone, era });

  res.json({
    success: true,
    data: { description }
  });
});

// ============================================================================
// VOICE MARKETPLACE
// ============================================================================

/**
 * GET /api/v1/killer/marketplace
 * Search marketplace
 */
router.get('/marketplace', (req: Request, res: Response) => {
  const query = {
    query: req.query.q as string,
    language: req.query.language as string,
    gender: req.query.gender as string,
    max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
    min_rating: req.query.min_rating ? parseFloat(req.query.min_rating as string) : undefined,
    sort_by: req.query.sort_by as any,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0
  };

  const results = voiceMarketplace.search(query);

  res.json({
    success: true,
    data: results,
    meta: {
      total: results.length,
      limit: query.limit,
      offset: query.offset
    }
  });
});

/**
 * GET /api/v1/killer/marketplace/featured
 * Get featured voices
 */
router.get('/marketplace/featured', (req: Request, res: Response) => {
  const featured = voiceMarketplace.getFeatured();

  res.json({
    success: true,
    data: featured
  });
});

/**
 * GET /api/v1/killer/marketplace/:id
 * Get listing details
 */
router.get('/marketplace/:id', (req: Request, res: Response) => {
  const listing = voiceMarketplace.getListing(req.params.id as string);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  res.json({
    success: true,
    data: listing
  });
});

/**
 * POST /api/v1/killer/marketplace
 * Upload new voice model
 */
router.post('/marketplace', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'anonymous';
  const userName = req.headers['x-user-name'] as string || 'Anonymous';

  const result = await voiceMarketplace.uploadModel(req.body, userId, userName);

  if ('error' in result) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json({
    success: true,
    data: result
  });
});

/**
 * POST /api/v1/killer/marketplace/:id/use
 * Record voice model usage
 */
router.post('/marketplace/:id/use', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'anonymous';
  const { usage_type, duration_seconds, project_id } = req.body;

  const record = voiceMarketplace.recordUsage(
    req.params.id as string,
    userId,
    usage_type || 'conversion',
    duration_seconds || 0,
    project_id
  );

  res.json({
    success: true,
    data: record
  });
});

/**
 * GET /api/v1/killer/marketplace/tags
 * Get popular tags
 */
router.get('/marketplace/meta/tags', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: voiceMarketplace.getPopularTags()
  });
});

/**
 * GET /api/v1/killer/marketplace/languages
 * Get available languages
 */
router.get('/marketplace/meta/languages', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: voiceMarketplace.getLanguages()
  });
});

// ============================================================================
// REMIX RIGHTS TRACKING
// ============================================================================

/**
 * POST /api/v1/killer/rights/registry
 * Create rights registry for project
 */
router.post('/rights/registry', (req: Request, res: Response) => {
  const { project_id } = req.body;
  const userId = req.headers['x-user-id'] as string || 'anonymous';
  const userName = req.headers['x-user-name'] as string || 'Anonymous';

  if (!project_id) {
    return res.status(400).json({ error: 'project_id required' });
  }

  const registry = remixRights.createRegistry(project_id, userId, userName);

  res.status(201).json({
    success: true,
    data: registry
  });
});

/**
 * GET /api/v1/killer/rights/:projectId
 * Get rights registry
 */
router.get('/rights/:projectId', (req: Request, res: Response) => {
  const registry = remixRights.getRegistry(req.params.projectId as string);

  if (!registry) {
    return res.status(404).json({ error: 'Registry not found' });
  }

  res.json({
    success: true,
    data: registry
  });
});

/**
 * POST /api/v1/killer/rights/:projectId/contributor
 * Add contributor
 */
router.post('/rights/:projectId/contributor', (req: Request, res: Response) => {
  const contributor = remixRights.addContributor(req.params.projectId as string, req.body);

  if (!contributor) {
    return res.status(404).json({ error: 'Registry not found' });
  }

  res.status(201).json({
    success: true,
    data: contributor
  });
});

/**
 * POST /api/v1/killer/rights/:projectId/sample
 * Add sample usage
 */
router.post('/rights/:projectId/sample', (req: Request, res: Response) => {
  const sample = remixRights.addSample(req.params.projectId as string, req.body);

  if (!sample) {
    return res.status(404).json({ error: 'Registry not found' });
  }

  res.status(201).json({
    success: true,
    data: sample
  });
});

/**
 * POST /api/v1/killer/rights/:projectId/split
 * Propose split agreement
 */
router.post('/rights/:projectId/split', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'anonymous';
  const { splits } = req.body;

  const result = remixRights.proposeSplitAgreement(req.params.projectId as string, userId, splits);

  if ('error' in result) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    success: true,
    data: result
  });
});

/**
 * GET /api/v1/killer/rights/:projectId/report
 * Generate rights report
 */
router.get('/rights/:projectId/report', (req: Request, res: Response) => {
  const report = remixRights.generateReport(req.params.projectId as string);

  if (!report) {
    return res.status(404).json({ error: 'Registry not found' });
  }

  res.json({
    success: true,
    data: report
  });
});

/**
 * GET /api/v1/killer/rights/:projectId/export
 * Export for distribution
 */
router.get('/rights/:projectId/export', (req: Request, res: Response) => {
  const data = remixRights.exportForDistribution(req.params.projectId as string);

  if (!data) {
    return res.status(404).json({ error: 'Registry not found' });
  }

  res.json({
    success: true,
    data
  });
});

// ============================================================================
// VERSION CONTROL
// ============================================================================

/**
 * POST /api/v1/killer/versions/init
 * Initialize version control for project
 */
router.post('/versions/init', (req: Request, res: Response) => {
  const { project_id, snapshot } = req.body;

  if (!project_id || !snapshot) {
    return res.status(400).json({ error: 'project_id and snapshot required' });
  }

  const history = versionControl.init(project_id, snapshot);

  res.status(201).json({
    success: true,
    data: history
  });
});

/**
 * POST /api/v1/killer/versions/:projectId/commit
 * Create a commit
 */
router.post('/versions/:projectId/commit', (req: Request, res: Response) => {
  const { message, snapshot } = req.body;
  const author = req.headers['x-user-name'] as string;

  if (!message || !snapshot) {
    return res.status(400).json({ error: 'message and snapshot required' });
  }

  const commit = versionControl.commit(req.params.projectId as string, message, snapshot, author);

  if (!commit) {
    return res.status(404).json({ error: 'Project not found' });
  }

  res.status(201).json({
    success: true,
    data: commit
  });
});

/**
 * POST /api/v1/killer/versions/:projectId/branch
 * Create a branch
 */
router.post('/versions/:projectId/branch', (req: Request, res: Response) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Branch name required' });
  }

  const branch = versionControl.branch(req.params.projectId as string, name, description);

  if (!branch) {
    return res.status(400).json({ error: 'Branch already exists or project not found' });
  }

  res.status(201).json({
    success: true,
    data: branch
  });
});

/**
 * POST /api/v1/killer/versions/:projectId/checkout
 * Checkout a branch
 */
router.post('/versions/:projectId/checkout', (req: Request, res: Response) => {
  const { branch } = req.body;

  if (!branch) {
    return res.status(400).json({ error: 'Branch name required' });
  }

  const snapshot = versionControl.checkout(req.params.projectId as string, branch);

  if (!snapshot) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  res.json({
    success: true,
    data: snapshot
  });
});

/**
 * POST /api/v1/killer/versions/:projectId/merge
 * Merge a branch
 */
router.post('/versions/:projectId/merge', (req: Request, res: Response) => {
  const { source_branch } = req.body;

  if (!source_branch) {
    return res.status(400).json({ error: 'source_branch required' });
  }

  const result = versionControl.merge(req.params.projectId as string, source_branch);

  res.json({
    success: result.success,
    data: result
  });
});

/**
 * POST /api/v1/killer/versions/:projectId/revert
 * Revert to a commit
 */
router.post('/versions/:projectId/revert', (req: Request, res: Response) => {
  const { commit_id, count } = req.body;

  let commit;
  if (commit_id) {
    commit = versionControl.revert(req.params.projectId as string, commit_id);
  } else if (count) {
    commit = versionControl.revertHead(req.params.projectId as string, count);
  } else {
    return res.status(400).json({ error: 'commit_id or count required' });
  }

  if (!commit) {
    return res.status(404).json({ error: 'Commit not found' });
  }

  res.json({
    success: true,
    data: commit
  });
});

/**
 * GET /api/v1/killer/versions/:projectId/log
 * Get commit history
 */
router.get('/versions/:projectId/log', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const commits = versionControl.log(req.params.projectId as string, limit);

  res.json({
    success: true,
    data: commits
  });
});

/**
 * GET /api/v1/killer/versions/:projectId/branches
 * Get all branches
 */
router.get('/versions/:projectId/branches', (req: Request, res: Response) => {
  const branches = versionControl.listBranches(req.params.projectId as string);

  res.json({
    success: true,
    data: branches
  });
});

/**
 * GET /api/v1/killer/versions/:projectId/status
 * Get current status
 */
router.get('/versions/:projectId/status', (req: Request, res: Response) => {
  const status = versionControl.status(req.params.projectId as string);

  if (!status) {
    return res.status(404).json({ error: 'Project not found' });
  }

  res.json({
    success: true,
    data: status
  });
});

/**
 * GET /api/v1/killer/versions/:projectId/diff
 * Get diff between commits
 */
router.get('/versions/:projectId/diff', (req: Request, res: Response) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'from and to commit IDs required' });
  }

  const diff = versionControl.diff(req.params.projectId as string, from as string, to as string);

  res.json({
    success: true,
    data: diff
  });
});

export default router;

/**
 * vkTUNEos API Routes - Integrations
 * Voice cloning, stem separation, music generation endpoints
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { 
  RequestWithLicense, 
  loadLicenseContext, 
  requireFeature,
  checkLimit
} from '../core/licensing.js';
import { rateLimitMiddleware } from '../core/ratelimit.js';
import { trackResourceUsage, getResourceUsage } from '../core/resources.js';
import { KitsAI, ElevenLabs, LALALAI, Suno, Udio, LANDR } from './providers.js';

const router = Router();

// Apply middleware
router.use(loadLicenseContext);
router.use(rateLimitMiddleware);

// ============================================================================
// VOICE CLONING ENDPOINTS
// ============================================================================

const CreateVoiceCloneBody = z.object({
  name: z.string().min(1).max(100),
  audio_url: z.string().url(),
  description: z.string().optional(),
  consent_verified: z.boolean(),
  provider: z.enum(['KitsAI', 'ElevenLabs']).optional().default('ElevenLabs')
});

const SynthesizeVoiceBody = z.object({
  voice_id: z.string(),
  text: z.string().min(1).max(5000),
  language: z.string().optional(),
  emotion: z.number().min(0).max(100).optional(),
  speed: z.number().min(0.5).max(2.0).optional(),
  provider: z.enum(['KitsAI', 'ElevenLabs']).optional().default('ElevenLabs')
});

/**
 * POST /api/v1/integrations/voice/clone
 * Create a new voice clone
 */
router.post('/voice/clone', 
  requireFeature('voice_cloning'),
  async (req: Request, res: Response) => {
    try {
      const typedReq = req as RequestWithLicense;
      const body = CreateVoiceCloneBody.parse(req.body);
      
      // Check voice clone limit
      const usage = getResourceUsage(typedReq.license!.tenant_id, 'voice_clones');
      const limit = typedReq.license!.limits.voice_clone_slots;
      
      if (limit !== -1 && (usage?.count || 0) >= limit) {
        return res.status(429).json({
          error: 'Voice clone limit reached',
          code: 'LIMIT_REACHED',
          current: usage?.count || 0,
          limit,
          upgrade_url: 'https://vktuneos.com/pricing'
        });
      }
      
      const provider = body.provider === 'KitsAI' ? KitsAI : ElevenLabs;
      
      const result = await provider.createVoiceClone({
        tenant_id: typedReq.license!.tenant_id,
        name: body.name,
        audio_url: body.audio_url,
        description: body.description,
        consent_verified: body.consent_verified
      });
      
      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          code: 'CLONE_FAILED',
          provider: result.provider
        });
      }
      
      res.status(201).json({
        success: true,
        data: result.data,
        meta: {
          latency_ms: result.latency_ms,
          provider: result.provider,
          request_id: result.request_id
        }
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
 * POST /api/v1/integrations/voice/synthesize
 * Synthesize speech from text
 */
router.post('/voice/synthesize',
  requireFeature('voice_cloning'),
  async (req: Request, res: Response) => {
    try {
      const typedReq = req as RequestWithLicense;
      const body = SynthesizeVoiceBody.parse(req.body);
      
      const provider = body.provider === 'KitsAI' ? KitsAI : ElevenLabs;
      
      const result = await provider.synthesize({
        tenant_id: typedReq.license!.tenant_id,
        voice_id: body.voice_id,
        text: body.text,
        language: body.language,
        emotion: body.emotion,
        speed: body.speed
      });
      
      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          code: 'SYNTHESIS_FAILED',
          provider: result.provider
        });
      }
      
      res.json({
        success: true,
        data: result.data,
        meta: {
          latency_ms: result.latency_ms,
          provider: result.provider,
          request_id: result.request_id
        }
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: err.errors });
      }
      throw err;
    }
  }
);

// ============================================================================
// STEM SEPARATION ENDPOINTS
// ============================================================================

const StemSeparationBody = z.object({
  audio_url: z.string().url(),
  stem_count: z.enum(['2', '4', '6', '10']).transform(v => parseInt(v) as 2 | 4 | 6 | 10),
  output_format: z.enum(['mp3', 'wav', 'flac']).optional().default('mp3')
});

/**
 * POST /api/v1/integrations/stems/separate
 * Separate audio into stems
 */
router.post('/stems/separate',
  requireFeature('stem_separation'),
  async (req: Request, res: Response) => {
    try {
      const typedReq = req as RequestWithLicense;
      const body = StemSeparationBody.parse(req.body);
      
      // Check stem count limit
      const maxStems = typedReq.license!.limits.stem_count;
      if (body.stem_count > maxStems) {
        return res.status(403).json({
          error: `${body.stem_count}-stem separation not available in ${typedReq.license!.tier} tier`,
          code: 'STEM_LIMIT_EXCEEDED',
          requested: body.stem_count,
          max_allowed: maxStems,
          upgrade_url: 'https://vktuneos.com/pricing'
        });
      }
      
      const result = await LALALAI.separateStems({
        tenant_id: typedReq.license!.tenant_id,
        audio_url: body.audio_url,
        stem_count: body.stem_count,
        output_format: body.output_format
      });
      
      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          code: 'SEPARATION_FAILED',
          provider: result.provider
        });
      }
      
      res.json({
        success: true,
        data: result.data,
        meta: {
          latency_ms: result.latency_ms,
          provider: result.provider,
          request_id: result.request_id
        }
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: err.errors });
      }
      throw err;
    }
  }
);

// ============================================================================
// MUSIC GENERATION ENDPOINTS
// ============================================================================

const MusicGenerationBody = z.object({
  prompt: z.string().min(1).max(1000),
  duration_seconds: z.number().min(15).max(600).optional(),
  genre: z.string().optional(),
  mood: z.string().optional(),
  instrumental: z.boolean().optional(),
  lyrics: z.string().optional(),
  provider: z.enum(['Suno', 'Udio']).optional().default('Suno')
});

/**
 * POST /api/v1/integrations/music/generate
 * Generate music from text prompt
 */
router.post('/music/generate',
  requireFeature('music_generation'),
  async (req: Request, res: Response) => {
    try {
      const typedReq = req as RequestWithLicense;
      const body = MusicGenerationBody.parse(req.body);
      
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
      
      const provider = body.provider === 'Udio' ? Udio : Suno;
      
      const result = await provider.generate({
        tenant_id: typedReq.license!.tenant_id,
        prompt: body.prompt,
        duration_seconds: requestedDuration,
        genre: body.genre,
        mood: body.mood,
        instrumental: body.instrumental,
        lyrics: body.lyrics
      });
      
      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          code: 'GENERATION_FAILED',
          provider: result.provider
        });
      }
      
      res.json({
        success: true,
        data: result.data,
        meta: {
          latency_ms: result.latency_ms,
          provider: result.provider,
          request_id: result.request_id
        }
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: err.errors });
      }
      throw err;
    }
  }
);

// ============================================================================
// AUDIO PRODUCTION ENDPOINTS
// ============================================================================

const MasteringBody = z.object({
  audio_url: z.string().url(),
  style: z.enum(['balanced', 'warm', 'bright', 'punchy']).optional(),
  loudness_target: z.number().min(-20).max(-6).optional()
});

/**
 * POST /api/v1/integrations/production/master
 * AI mastering
 */
router.post('/production/master',
  requireFeature('audio_production'),
  async (req: Request, res: Response) => {
    try {
      const typedReq = req as RequestWithLicense;
      const body = MasteringBody.parse(req.body);
      
      const result = await LANDR.master({
        tenant_id: typedReq.license!.tenant_id,
        audio_url: body.audio_url,
        style: body.style,
        loudness_target: body.loudness_target
      });
      
      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          code: 'MASTERING_FAILED',
          provider: result.provider
        });
      }
      
      res.json({
        success: true,
        data: result.data,
        meta: {
          latency_ms: result.latency_ms,
          provider: result.provider,
          request_id: result.request_id
        }
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: err.errors });
      }
      throw err;
    }
  }
);

// ============================================================================
// PROVIDER INFO ENDPOINT
// ============================================================================

/**
 * GET /api/v1/integrations/providers
 * List available providers
 */
router.get('/providers', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      voice_cloning: [
        { name: 'KitsAI', features: ['instant_clone', 'voice_blending'], languages: 1 },
        { name: 'ElevenLabs', features: ['instant_clone', 'professional_clone', 'emotion'], languages: 32 }
      ],
      stem_separation: [
        { name: 'LALAL.AI', features: ['2-stem', '4-stem', '6-stem', '10-stem'], models: ['Phoenix', 'Orion'] }
      ],
      music_generation: [
        { name: 'Suno', features: ['text_to_music', 'lyrics_to_song'], max_duration: 240 },
        { name: 'Udio', features: ['text_to_music', 'style_transfer'], max_duration: 300 }
      ],
      audio_production: [
        { name: 'LANDR', features: ['ai_mastering'], styles: ['balanced', 'warm', 'bright', 'punchy'] }
      ]
    }
  });
});

export default router;

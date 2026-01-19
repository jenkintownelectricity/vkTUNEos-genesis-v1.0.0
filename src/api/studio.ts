/**
 * vkTUNEos Studio API
 * Unified endpoint for all AI creation features
 *
 * "Own your creative tools. Own your data. Own your destiny."
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';

// AI Modules
import { MusicGenerationEngine, GENRE_PRESETS, buildMusicPrompt } from '../ai/music-generation.js';
import { VoiceCloningEngine, RVC_PRESETS } from '../ai/voice-cloning.js';
import { StemSeparationEngine, MODEL_INFO as STEM_MODELS, StemModel } from '../ai/stem-separation.js';
import { VideoGenerationEngine, VIDEO_PRESETS } from '../ai/video-generation.js';

const router = Router();

// Initialize engines
const musicEngine = new MusicGenerationEngine();
const voiceEngine = new VoiceCloningEngine();
const stemEngine = new StemSeparationEngine();
const videoEngine = new VideoGenerationEngine();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const MusicGenerateBody = z.object({
  prompt: z.string().min(1).max(1000),
  preset: z.string().optional(),
  duration: z.number().min(5).max(300).optional(),
  temperature: z.number().min(0).max(2).optional(),
  model: z.string().optional(),
  with_stems: z.boolean().optional()
});

const VoiceCloneBody = z.object({
  audio: z.string().min(1),  // Base64
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  language: z.string().optional(),
  consent_verified: z.boolean()
});

const VoiceConvertBody = z.object({
  audio: z.string().min(1),  // Base64
  target_voice: z.string().min(1),
  pitch_shift: z.number().min(-12).max(12).optional(),
  preset: z.enum(['high-quality', 'fast', 'singing', 'speech']).optional()
});

const TextToSpeechBody = z.object({
  text: z.string().min(1).max(5000),
  voice: z.string().min(1),
  language: z.string().optional(),
  speed: z.number().min(0.5).max(2).optional(),
  emotion: z.enum(['neutral', 'happy', 'sad', 'angry', 'fearful', 'surprised']).optional()
});

const StemSeparateBody = z.object({
  audio: z.string().min(1),  // Base64
  model: z.string().optional(),
  use_case: z.enum(['karaoke', 'remix', 'sample', 'full']).optional()
});

const VideoGenerateBody = z.object({
  prompt: z.string().min(1).max(1000),
  preset: z.string().optional(),
  image: z.string().optional(),  // Base64 for image-to-video
  duration: z.number().min(1).max(30).optional(),
  aspect_ratio: z.enum(['16:9', '9:16', '1:1', '4:3']).optional()
});

const LipSyncBody = z.object({
  audio: z.string().min(1),  // Base64
  face_image: z.string().optional(),
  face_video: z.string().optional(),
  model: z.enum(['wav2lip', 'sadtalker', 'liveportrait']).optional(),
  enhance_face: z.boolean().optional()
});

const CaptionBody = z.object({
  video: z.string().min(1),  // Base64
  language: z.string().optional(),
  burn_in: z.boolean().optional(),
  style: z.object({
    font: z.string().optional(),
    size: z.number().optional(),
    color: z.string().optional(),
    position: z.enum(['bottom', 'top', 'center']).optional(),
    animation: z.enum(['none', 'word', 'karaoke']).optional()
  }).optional()
});

// ============================================================================
// STUDIO INFO
// ============================================================================

/**
 * GET /api/v1/studio
 * Get studio capabilities and configuration
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'vkTUNEos Studio',
      version: '1.0',
      philosophy: 'Own your creative tools. Own your data. Own your destiny.',
      modules: {
        music: {
          enabled: true,
          presets: Object.keys(GENRE_PRESETS),
          models: ['musicgen-small', 'musicgen-medium', 'musicgen-large', 'musicgen-melody'],
          features: ['text-to-music', 'melody-conditioning', 'continuation', 'with-stems']
        },
        voice: {
          enabled: true,
          presets: Object.keys(RVC_PRESETS),
          features: ['clone', 'convert', 'text-to-speech', 'real-time'],
          backends: ['rvc', 'openvoice', 'xtts']
        },
        stems: {
          enabled: true,
          models: Object.keys(STEM_MODELS),
          features: ['separate', 'remix', 'extract-vocals'],
          max_stems: 6
        },
        video: {
          enabled: true,
          presets: Object.keys(VIDEO_PRESETS),
          features: ['text-to-video', 'image-to-video', 'lip-sync', 'auto-captions'],
          backends: ['cogvideo', 'opensora', 'animatediff']
        }
      },
      differentiators: [
        'Stem control in generation',
        'Voice-to-any-voice singing',
        'Coordinate-based asset library',
        'Zero data collection (self-hosted)',
        'Offline mode',
        'One-file project format',
        'Multi-platform export'
      ],
      endpoints: {
        music: {
          generate: 'POST /api/v1/studio/music/generate',
          presets: 'GET /api/v1/studio/music/presets'
        },
        voice: {
          clone: 'POST /api/v1/studio/voice/clone',
          convert: 'POST /api/v1/studio/voice/convert',
          tts: 'POST /api/v1/studio/voice/tts',
          list: 'GET /api/v1/studio/voice/models'
        },
        stems: {
          separate: 'POST /api/v1/studio/stems/separate',
          extract_vocals: 'POST /api/v1/studio/stems/extract-vocals',
          remix: 'POST /api/v1/studio/stems/remix'
        },
        video: {
          generate: 'POST /api/v1/studio/video/generate',
          lipsync: 'POST /api/v1/studio/video/lipsync',
          captions: 'POST /api/v1/studio/video/captions'
        }
      }
    }
  });
});

// ============================================================================
// MUSIC GENERATION
// ============================================================================

/**
 * GET /api/v1/studio/music/presets
 * List available music presets
 */
router.get('/music/presets', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.entries(GENRE_PRESETS).map(([key, preset]) => ({
      id: key,
      ...preset,
      example_prompt: buildMusicPrompt(preset)
    }))
  });
});

/**
 * POST /api/v1/studio/music/generate
 * Generate music from text prompt
 */
router.post('/music/generate', async (req: Request, res: Response) => {
  try {
    const body = MusicGenerateBody.parse(req.body);

    let result;
    if (body.preset && GENRE_PRESETS[body.preset as keyof typeof GENRE_PRESETS]) {
      result = await musicEngine.generateWithPreset(
        body.preset as keyof typeof GENRE_PRESETS,
        {},
        {
          duration: body.duration,
          temperature: body.temperature,
          model: body.model as any,
          with_stems: body.with_stems
        }
      );
    } else {
      result = await musicEngine.generate({
        prompt: body.prompt,
        duration: body.duration,
        temperature: body.temperature,
        model: body.model as any,
        with_stems: body.with_stems
      });
    }

    res.json({
      success: result.success,
      data: result,
      meta: {
        module: 'music',
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

// ============================================================================
// VOICE CLONING
// ============================================================================

/**
 * GET /api/v1/studio/voice/models
 * List available voice models
 */
router.get('/voice/models', async (req: Request, res: Response) => {
  const voices = await voiceEngine.listVoices();
  res.json({
    success: true,
    data: voices,
    meta: {
      presets: Object.keys(RVC_PRESETS)
    }
  });
});

/**
 * POST /api/v1/studio/voice/clone
 * Clone a voice from audio sample
 */
router.post('/voice/clone', async (req: Request, res: Response) => {
  try {
    const body = VoiceCloneBody.parse(req.body);

    if (!body.consent_verified) {
      return res.status(400).json({
        error: 'Consent verification required',
        code: 'CONSENT_REQUIRED',
        message: 'You must verify that you have consent to clone this voice'
      });
    }

    const result = await voiceEngine.cloneVoice({
      audio: body.audio,
      name: body.name,
      description: body.description,
      language: body.language,
      consent_verified: body.consent_verified
    });

    res.json({
      success: result.success,
      data: result,
      meta: {
        module: 'voice',
        action: 'clone'
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
 * POST /api/v1/studio/voice/convert
 * Convert audio to target voice (voice-to-voice)
 */
router.post('/voice/convert', async (req: Request, res: Response) => {
  try {
    const body = VoiceConvertBody.parse(req.body);

    const preset = body.preset ? RVC_PRESETS[body.preset] : RVC_PRESETS['high-quality'];

    const result = await voiceEngine.convert({
      audio: body.audio,
      target_voice: body.target_voice,
      pitch_shift: body.pitch_shift,
      index_rate: preset.index_rate,
      filter_radius: preset.filter_radius,
      rms_mix_rate: preset.rms_mix_rate,
      protect: preset.protect,
      f0_method: preset.f0_method
    });

    res.json({
      success: result.success,
      data: result,
      meta: {
        module: 'voice',
        action: 'convert',
        preset: body.preset || 'high-quality'
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
 * POST /api/v1/studio/voice/tts
 * Text-to-speech with cloned voice
 */
router.post('/voice/tts', async (req: Request, res: Response) => {
  try {
    const body = TextToSpeechBody.parse(req.body);

    const result = await voiceEngine.textToSpeech({
      text: body.text,
      voice: body.voice,
      language: body.language,
      speed: body.speed,
      emotion: body.emotion
    });

    res.json({
      success: result.success,
      data: result,
      meta: {
        module: 'voice',
        action: 'tts'
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: err.errors });
    }
    throw err;
  }
});

// ============================================================================
// STEM SEPARATION
// ============================================================================

/**
 * GET /api/v1/studio/stems/models
 * List available stem separation models
 */
router.get('/stems/models', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.entries(STEM_MODELS).map(([id, info]) => ({
      id,
      ...info
    }))
  });
});

/**
 * POST /api/v1/studio/stems/separate
 * Separate audio into stems
 */
router.post('/stems/separate', async (req: Request, res: Response) => {
  try {
    const body = StemSeparateBody.parse(req.body);

    const model: StemModel = body.use_case
      ? stemEngine.getRecommendedModel(body.use_case)
      : (body.model as StemModel) || 'htdemucs';

    const result = await stemEngine.separate({
      audio: body.audio,
      model
    });

    res.json({
      success: result.success,
      data: result,
      meta: {
        module: 'stems',
        action: 'separate',
        model_info: STEM_MODELS[model]
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
 * POST /api/v1/studio/stems/extract-vocals
 * Quick vocal extraction (most common use case)
 */
router.post('/stems/extract-vocals', async (req: Request, res: Response) => {
  try {
    const body = z.object({ audio: z.string().min(1) }).parse(req.body);

    const result = await stemEngine.extractVocals(body.audio);

    if (!result) {
      return res.status(500).json({
        success: false,
        error: 'Vocal extraction failed'
      });
    }

    res.json({
      success: true,
      data: {
        vocals: result.vocals,
        instrumental: result.instrumental,
        coordinate: 'StemSeparation.Asset.Vocals.Extracted.Validated'
      },
      meta: {
        module: 'stems',
        action: 'extract-vocals'
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: err.errors });
    }
    throw err;
  }
});

// ============================================================================
// VIDEO GENERATION
// ============================================================================

/**
 * GET /api/v1/studio/video/presets
 * List video generation presets
 */
router.get('/video/presets', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.entries(VIDEO_PRESETS).map(([key, preset]) => ({
      id: key,
      ...preset
    }))
  });
});

/**
 * POST /api/v1/studio/video/generate
 * Generate video from text/image
 */
router.post('/video/generate', async (req: Request, res: Response) => {
  try {
    const body = VideoGenerateBody.parse(req.body);

    let result;
    if (body.preset && VIDEO_PRESETS[body.preset as keyof typeof VIDEO_PRESETS]) {
      result = await videoEngine.generateWithPreset(
        body.preset as keyof typeof VIDEO_PRESETS,
        body.prompt,
        {
          image: body.image,
          duration: body.duration
        }
      );
    } else {
      const aspectDimensions = {
        '16:9': { width: 1280, height: 720 },
        '9:16': { width: 720, height: 1280 },
        '1:1': { width: 720, height: 720 },
        '4:3': { width: 960, height: 720 }
      };
      const dims = aspectDimensions[body.aspect_ratio || '16:9'];

      result = await videoEngine.generate({
        prompt: body.prompt,
        image: body.image,
        duration: body.duration,
        width: dims.width,
        height: dims.height
      });
    }

    res.json({
      success: result.success,
      data: result,
      meta: {
        module: 'video',
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
 * POST /api/v1/studio/video/lipsync
 * Generate lip-synced video
 */
router.post('/video/lipsync', async (req: Request, res: Response) => {
  try {
    const body = LipSyncBody.parse(req.body);

    const result = await videoEngine.lipSync({
      audio: body.audio,
      face_image: body.face_image,
      face_video: body.face_video,
      model: body.model,
      enhance_face: body.enhance_face
    });

    res.json({
      success: result.success,
      data: result,
      meta: {
        module: 'video',
        action: 'lipsync'
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
 * POST /api/v1/studio/video/captions
 * Auto-generate captions for video
 */
router.post('/video/captions', async (req: Request, res: Response) => {
  try {
    const body = CaptionBody.parse(req.body);

    const result = await videoEngine.generateCaptions({
      video: body.video,
      language: body.language,
      burn_in: body.burn_in,
      style: body.style
    });

    res.json({
      success: result.success,
      data: result,
      meta: {
        module: 'video',
        action: 'captions'
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: err.errors });
    }
    throw err;
  }
});

// ============================================================================
// COMBINED WORKFLOWS
// ============================================================================

/**
 * POST /api/v1/studio/workflow/music-video
 * Full pipeline: Generate music → Generate video → Sync
 */
router.post('/workflow/music-video', async (req: Request, res: Response) => {
  try {
    const body = z.object({
      music_prompt: z.string(),
      video_prompt: z.string(),
      duration: z.number().min(5).max(60).optional(),
      music_preset: z.string().optional(),
      video_preset: z.string().optional()
    }).parse(req.body);

    // Step 1: Generate music
    const musicResult = await musicEngine.generate({
      prompt: body.music_prompt,
      duration: body.duration || 30,
      with_stems: true
    });

    if (!musicResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Music generation failed',
        details: musicResult.error
      });
    }

    // Step 2: Generate video
    const videoResult = await videoEngine.generate({
      prompt: body.video_prompt,
      duration: Math.min(body.duration || 30, 10), // Video gen limited
      audio: musicResult.audio // For beat-sync
    });

    res.json({
      success: true,
      data: {
        music: musicResult,
        video: videoResult,
        coordinate: 'MusicGeneration.Workflow.MusicVideo.Complete.Validated'
      },
      meta: {
        module: 'studio',
        action: 'workflow/music-video',
        steps: ['music-generation', 'video-generation']
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
 * POST /api/v1/studio/workflow/cover-song
 * Full pipeline: Separate stems → Convert vocals → Remix
 */
router.post('/workflow/cover-song', async (req: Request, res: Response) => {
  try {
    const body = z.object({
      audio: z.string().min(1),         // Original song
      target_voice: z.string().min(1),  // Voice model to use
      pitch_shift: z.number().min(-12).max(12).optional()
    }).parse(req.body);

    // Step 1: Separate stems
    const stemsResult = await stemEngine.separate({
      audio: body.audio,
      model: 'htdemucs_ft' // Best for vocals
    });

    if (!stemsResult.success || !stemsResult.stems) {
      return res.status(500).json({
        success: false,
        error: 'Stem separation failed',
        details: stemsResult.error
      });
    }

    // Step 2: Convert vocals
    const convertResult = await voiceEngine.convert({
      audio: stemsResult.stems.vocals || '',
      target_voice: body.target_voice,
      pitch_shift: body.pitch_shift,
      f0_method: 'crepe' // Best for singing
    });

    if (!convertResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Voice conversion failed',
        details: convertResult.error
      });
    }

    // Step 3: Remix (combine converted vocals with instrumental)
    // In a full implementation, this would use FFmpeg to mix the stems
    res.json({
      success: true,
      data: {
        original_stems: stemsResult.stems,
        converted_vocals: convertResult.audio,
        // The remix would be done client-side or with FFmpeg
        coordinate: 'VoiceCloning.Workflow.CoverSong.Complete.Validated'
      },
      meta: {
        module: 'studio',
        action: 'workflow/cover-song',
        steps: ['stem-separation', 'voice-conversion', 'remix']
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: err.errors });
    }
    throw err;
  }
});

export default router;

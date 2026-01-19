/**
 * vkTUNEos AI Music Generation Module
 * Self-hostable MusicGen/AudioCraft integration
 *
 * Replaces: Suno, Udio
 * Open-source backend: MusicGen (Meta), AudioCraft
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Coordinate, coordinateToString } from '../core/schema.js';

// ============================================================================
// TYPES
// ============================================================================

export interface MusicGenerationRequest {
  prompt: string;                    // Text description of desired music
  duration?: number;                 // Duration in seconds (default: 30)
  temperature?: number;              // Creativity (0.0-1.5, default: 1.0)
  top_k?: number;                    // Top-k sampling (default: 250)
  top_p?: number;                    // Top-p sampling (default: 0.0)
  cfg_coef?: number;                 // Classifier-free guidance (default: 3.0)
  model?: MusicModel;                // Which model to use
  continuation?: string;             // Base64 audio to continue from
  melody?: string;                   // Base64 melody to condition on
  output_format?: 'wav' | 'mp3';     // Output format
  with_stems?: boolean;              // Also return separated stems
  tenant_id?: string;
}

export interface MusicGenerationResult {
  success: boolean;
  audio?: string;                    // Base64 encoded audio
  stems?: {                          // If with_stems=true
    drums?: string;
    bass?: string;
    other?: string;
    melody?: string;
  };
  duration: number;
  model: MusicModel;
  prompt: string;
  seed?: number;
  coordinate?: string;               // vkTUNEos coordinate for this asset
  error?: string;
  provider: 'local' | 'replicate';
}

export type MusicModel =
  | 'musicgen-small'      // 300M params, fast
  | 'musicgen-medium'     // 1.5B params, balanced
  | 'musicgen-large'      // 3.3B params, highest quality
  | 'musicgen-melody'     // Melody-conditioned
  | 'audiocraft-stereo'   // Stereo output
  | 'stable-audio';       // Stability AI alternative

export interface MusicStyle {
  genre: string;
  mood: string;
  tempo?: 'slow' | 'medium' | 'fast';
  instruments?: string[];
  era?: string;
}

// ============================================================================
// PROMPT ENGINEERING
// ============================================================================

/**
 * Build optimized prompt for music generation
 * Based on research: specific, descriptive prompts work best
 */
export function buildMusicPrompt(style: MusicStyle): string {
  const parts: string[] = [];

  // Genre and mood first (most important)
  parts.push(`${style.mood} ${style.genre} music`);

  // Tempo
  if (style.tempo) {
    const tempoMap = {
      slow: '70-90 BPM, relaxed pace',
      medium: '100-120 BPM, moderate tempo',
      fast: '130-160 BPM, energetic'
    };
    parts.push(tempoMap[style.tempo]);
  }

  // Instruments
  if (style.instruments && style.instruments.length > 0) {
    parts.push(`featuring ${style.instruments.join(', ')}`);
  }

  // Era/style reference
  if (style.era) {
    parts.push(`${style.era} style`);
  }

  // Quality markers (helps model focus)
  parts.push('high quality, professional production, clear mix');

  return parts.join(', ');
}

// ============================================================================
// GENRE PRESETS (What users love from Suno/Udio)
// ============================================================================

export const GENRE_PRESETS: Record<string, MusicStyle> = {
  'lofi-hiphop': {
    genre: 'lo-fi hip hop',
    mood: 'chill relaxing',
    tempo: 'slow',
    instruments: ['Rhodes piano', 'vinyl crackle', 'soft drums', 'bass'],
    era: '2020s'
  },
  'epic-cinematic': {
    genre: 'cinematic orchestral',
    mood: 'epic powerful dramatic',
    tempo: 'medium',
    instruments: ['orchestra', 'brass', 'strings', 'percussion', 'choir'],
    era: 'Hollywood blockbuster'
  },
  'synthwave': {
    genre: 'synthwave retrowave',
    mood: 'nostalgic energetic',
    tempo: 'medium',
    instruments: ['analog synthesizers', 'drum machine', 'bass synth', 'arpeggios'],
    era: '1980s'
  },
  'acoustic-folk': {
    genre: 'acoustic folk',
    mood: 'warm intimate heartfelt',
    tempo: 'medium',
    instruments: ['acoustic guitar', 'vocals', 'harmonica', 'light percussion'],
    era: 'timeless'
  },
  'edm-drop': {
    genre: 'EDM electronic dance',
    mood: 'energetic euphoric building',
    tempo: 'fast',
    instruments: ['synth leads', 'supersaw', 'sidechained bass', '808 drums'],
    era: 'festival'
  },
  'jazz-smooth': {
    genre: 'smooth jazz',
    mood: 'sophisticated relaxing',
    tempo: 'medium',
    instruments: ['saxophone', 'piano', 'upright bass', 'brushed drums'],
    era: 'late night'
  },
  'metal-heavy': {
    genre: 'heavy metal',
    mood: 'aggressive powerful intense',
    tempo: 'fast',
    instruments: ['distorted guitars', 'double bass drums', 'bass guitar', 'screaming vocals'],
    era: 'modern'
  },
  'ambient-space': {
    genre: 'ambient electronic',
    mood: 'ethereal floating atmospheric',
    tempo: 'slow',
    instruments: ['pads', 'textures', 'field recordings', 'reverb'],
    era: 'cosmic'
  }
};

// ============================================================================
// MUSIC GENERATION ENGINE
// ============================================================================

export class MusicGenerationEngine {
  private localEndpoint: string | null;
  private replicateToken: string | null;

  constructor(config?: {
    localEndpoint?: string;      // e.g., 'http://localhost:8000'
    replicateToken?: string;     // Replicate API token for cloud fallback
  }) {
    this.localEndpoint = config?.localEndpoint || process.env.MUSICGEN_ENDPOINT || null;
    this.replicateToken = config?.replicateToken || process.env.REPLICATE_API_TOKEN || null;
  }

  /**
   * Generate music from text prompt
   */
  async generate(request: MusicGenerationRequest): Promise<MusicGenerationResult> {
    // Try local first, then Replicate fallback
    if (this.localEndpoint) {
      try {
        return await this.generateLocal(request);
      } catch (err) {
        console.warn('[MusicGen] Local generation failed, trying Replicate:', err);
      }
    }

    if (this.replicateToken) {
      return await this.generateReplicate(request);
    }

    // Demo mode - return placeholder
    return this.generateDemo(request);
  }

  /**
   * Generate using local MusicGen server
   */
  private async generateLocal(request: MusicGenerationRequest): Promise<MusicGenerationResult> {
    const response = await fetch(`${this.localEndpoint}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: request.prompt,
        duration: request.duration || 30,
        temperature: request.temperature || 1.0,
        top_k: request.top_k || 250,
        top_p: request.top_p || 0.0,
        cfg_coef: request.cfg_coef || 3.0,
        model: request.model || 'musicgen-medium',
        continuation: request.continuation,
        melody: request.melody,
        format: request.output_format || 'wav'
      })
    });

    if (!response.ok) {
      throw new Error(`Local MusicGen error: ${response.status}`);
    }

    const result: any = await response.json();

    // Generate coordinate for this asset
    const coordinate = `MusicGeneration.Asset.Generated.Track.Validated`;

    return {
      success: true,
      audio: result.audio,
      stems: request.with_stems ? result.stems : undefined,
      duration: request.duration || 30,
      model: request.model || 'musicgen-medium',
      prompt: request.prompt,
      seed: result.seed,
      coordinate,
      provider: 'local'
    };
  }

  /**
   * Generate using Replicate API (cloud fallback)
   */
  private async generateReplicate(request: MusicGenerationRequest): Promise<MusicGenerationResult> {
    const modelMap: Record<MusicModel, string> = {
      'musicgen-small': 'meta/musicgen:small',
      'musicgen-medium': 'meta/musicgen:medium',
      'musicgen-large': 'meta/musicgen:large',
      'musicgen-melody': 'meta/musicgen:melody',
      'audiocraft-stereo': 'meta/musicgen:stereo',
      'stable-audio': 'stability-ai/stable-audio-open'
    };

    const model = modelMap[request.model || 'musicgen-medium'];

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.replicateToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: model,
        input: {
          prompt: request.prompt,
          duration: Math.min(request.duration || 30, 30), // Replicate limit
          temperature: request.temperature || 1.0,
          top_k: request.top_k || 250,
          top_p: request.top_p || 0.0,
          classifier_free_guidance: request.cfg_coef || 3.0
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Replicate error: ${error}`);
    }

    const prediction = await response.json();

    // Poll for completion
    let result: any = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pollResponse = await fetch(result.urls.get, {
        headers: { 'Authorization': `Token ${this.replicateToken}` }
      });
      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      return {
        success: false,
        error: result.error || 'Generation failed',
        duration: 0,
        model: request.model || 'musicgen-medium',
        prompt: request.prompt,
        provider: 'replicate'
      };
    }

    // Fetch the audio and convert to base64
    const audioResponse = await fetch(result.output);
    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return {
      success: true,
      audio: audioBase64,
      duration: request.duration || 30,
      model: request.model || 'musicgen-medium',
      prompt: request.prompt,
      coordinate: `MusicGeneration.Asset.Generated.Track.Validated`,
      provider: 'replicate'
    };
  }

  /**
   * Demo mode - returns placeholder data
   */
  private generateDemo(request: MusicGenerationRequest): MusicGenerationResult {
    return {
      success: true,
      audio: '', // Empty in demo mode
      duration: request.duration || 30,
      model: request.model || 'musicgen-medium',
      prompt: request.prompt,
      coordinate: `MusicGeneration.Asset.Generated.Track.Draft`,
      provider: 'local',
      error: 'Demo mode: Configure MUSICGEN_ENDPOINT or REPLICATE_API_TOKEN for actual generation'
    };
  }

  /**
   * Generate with style preset
   */
  async generateWithPreset(
    preset: keyof typeof GENRE_PRESETS,
    customization?: Partial<MusicStyle>,
    options?: Omit<MusicGenerationRequest, 'prompt'>
  ): Promise<MusicGenerationResult> {
    const style = { ...GENRE_PRESETS[preset], ...customization };
    const prompt = buildMusicPrompt(style);

    return this.generate({
      ...options,
      prompt
    });
  }

  /**
   * Continue/extend existing audio
   */
  async extend(
    audioBase64: string,
    prompt: string,
    additionalSeconds: number = 30
  ): Promise<MusicGenerationResult> {
    return this.generate({
      prompt,
      duration: additionalSeconds,
      continuation: audioBase64,
      model: 'musicgen-melody'
    });
  }

  /**
   * Generate variations of a melody
   */
  async variations(
    melodyBase64: string,
    prompt: string,
    count: number = 3
  ): Promise<MusicGenerationResult[]> {
    const results: MusicGenerationResult[] = [];

    for (let i = 0; i < count; i++) {
      const result = await this.generate({
        prompt,
        melody: melodyBase64,
        temperature: 1.0 + (i * 0.2), // Increase variation
        model: 'musicgen-melody'
      });
      results.push(result);
    }

    return results;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const musicGen = new MusicGenerationEngine();

export default {
  MusicGenerationEngine,
  musicGen,
  buildMusicPrompt,
  GENRE_PRESETS
};

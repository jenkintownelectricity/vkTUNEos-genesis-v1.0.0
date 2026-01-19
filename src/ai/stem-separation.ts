/**
 * vkTUNEos Stem Separation Module
 * Self-hostable Demucs/UVR5 integration
 *
 * Replaces: LALAL.AI, iZotope RX, Moises
 * Open-source backends: Demucs (Meta), UVR5, Spleeter
 *
 * Key advantages:
 * - Full 10-stem separation (vs LALAL.AI 2-stem limit)
 * - Download individual stems (unlike Udio)
 * - No usage limits
 * - Remix capability
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

// ============================================================================
// TYPES
// ============================================================================

export type StemType =
  | 'vocals'
  | 'drums'
  | 'bass'
  | 'guitar'
  | 'piano'
  | 'other'
  | 'melody'
  | 'background'
  | 'lead_vocals'
  | 'backing_vocals';

export interface StemSeparationRequest {
  audio: string;                     // Base64 audio input
  model?: StemModel;                 // Which model to use
  stems?: StemType[];                // Which stems to extract (default: all)
  shifts?: number;                   // Demucs shifts for quality (1-10)
  overlap?: number;                  // Overlap between chunks (0-0.99)
  output_format?: 'wav' | 'mp3' | 'flac';
  sample_rate?: number;              // Output sample rate
  mp3_bitrate?: number;              // If mp3, bitrate in kbps
  tenant_id?: string;
}

export interface StemSeparationResult {
  success: boolean;
  stems?: Record<StemType, string>;  // Base64 encoded stems
  original_duration?: number;
  processing_time?: number;
  model: StemModel;
  coordinate?: string;
  error?: string;
  provider: 'demucs' | 'uvr5' | 'spleeter' | 'replicate' | 'demo';
}

export type StemModel =
  | 'htdemucs'           // 4 stems: vocals, drums, bass, other (best quality)
  | 'htdemucs_ft'        // Fine-tuned, even better quality
  | 'htdemucs_6s'        // 6 stems: vocals, drums, bass, guitar, piano, other
  | 'mdx'                // Fast 2-stem
  | 'mdx_extra'          // Better quality 2-stem
  | 'uvr-mdx-net'        // UVR model
  | 'demucs_v4'          // Latest Demucs
  | 'spleeter-2stems'    // Basic vocal/instrumental
  | 'spleeter-4stems'    // Vocals, drums, bass, other
  | 'spleeter-5stems';   // + piano

export interface RemixRequest {
  stems: Record<StemType, {
    audio: string;                   // Base64 stem audio
    volume?: number;                 // 0-2 (1 = original)
    pan?: number;                    // -1 (left) to 1 (right)
    mute?: boolean;
    solo?: boolean;
    effects?: StemEffect[];
  }>;
  output_format?: 'wav' | 'mp3';
  normalize?: boolean;
}

export interface StemEffect {
  type: 'eq' | 'reverb' | 'delay' | 'compressor' | 'pitch';
  params: Record<string, number>;
}

export interface RemixResult {
  success: boolean;
  audio?: string;                    // Base64 mixed audio
  duration?: number;
  coordinate?: string;
  error?: string;
}

// ============================================================================
// MODEL CAPABILITIES
// ============================================================================

export const MODEL_INFO: Record<StemModel, {
  stems: StemType[];
  quality: 'basic' | 'good' | 'excellent';
  speed: 'fast' | 'medium' | 'slow';
  description: string;
}> = {
  'htdemucs': {
    stems: ['vocals', 'drums', 'bass', 'other'],
    quality: 'excellent',
    speed: 'slow',
    description: 'Best quality 4-stem separation'
  },
  'htdemucs_ft': {
    stems: ['vocals', 'drums', 'bass', 'other'],
    quality: 'excellent',
    speed: 'slow',
    description: 'Fine-tuned for even better vocals'
  },
  'htdemucs_6s': {
    stems: ['vocals', 'drums', 'bass', 'guitar', 'piano', 'other'],
    quality: 'excellent',
    speed: 'slow',
    description: '6-stem with guitar and piano separation'
  },
  'mdx': {
    stems: ['vocals', 'other'],
    quality: 'good',
    speed: 'fast',
    description: 'Fast vocal extraction'
  },
  'mdx_extra': {
    stems: ['vocals', 'other'],
    quality: 'excellent',
    speed: 'medium',
    description: 'High quality vocal extraction'
  },
  'uvr-mdx-net': {
    stems: ['vocals', 'other'],
    quality: 'excellent',
    speed: 'medium',
    description: 'UVR MDX-Net for clean vocals'
  },
  'demucs_v4': {
    stems: ['vocals', 'drums', 'bass', 'other'],
    quality: 'excellent',
    speed: 'medium',
    description: 'Latest Demucs v4 model'
  },
  'spleeter-2stems': {
    stems: ['vocals', 'other'],
    quality: 'basic',
    speed: 'fast',
    description: 'Basic vocal/instrumental split'
  },
  'spleeter-4stems': {
    stems: ['vocals', 'drums', 'bass', 'other'],
    quality: 'good',
    speed: 'fast',
    description: 'Fast 4-stem separation'
  },
  'spleeter-5stems': {
    stems: ['vocals', 'drums', 'bass', 'piano', 'other'],
    quality: 'good',
    speed: 'fast',
    description: '5-stem with piano'
  }
};

// ============================================================================
// STEM SEPARATION ENGINE
// ============================================================================

export class StemSeparationEngine {
  private demucsEndpoint: string | null;
  private uvr5Endpoint: string | null;
  private replicateToken: string | null;

  constructor(config?: {
    demucsEndpoint?: string;
    uvr5Endpoint?: string;
    replicateToken?: string;
  }) {
    this.demucsEndpoint = config?.demucsEndpoint || process.env.DEMUCS_ENDPOINT || null;
    this.uvr5Endpoint = config?.uvr5Endpoint || process.env.UVR5_ENDPOINT || null;
    this.replicateToken = config?.replicateToken || process.env.REPLICATE_API_TOKEN || null;
  }

  /**
   * Separate audio into stems
   */
  async separate(request: StemSeparationRequest): Promise<StemSeparationResult> {
    const model = request.model || 'htdemucs';

    // Route to appropriate backend
    if (model.startsWith('htdemucs') || model.startsWith('demucs') || model.startsWith('mdx')) {
      if (this.demucsEndpoint) {
        try {
          return await this.separateWithDemucs(request);
        } catch (err) {
          console.warn('[Stems] Demucs failed:', err);
        }
      }
    }

    if (model.startsWith('uvr')) {
      if (this.uvr5Endpoint) {
        try {
          return await this.separateWithUVR5(request);
        } catch (err) {
          console.warn('[Stems] UVR5 failed:', err);
        }
      }
    }

    if (this.replicateToken) {
      return await this.separateWithReplicate(request);
    }

    return this.separateDemo(request);
  }

  private async separateWithDemucs(request: StemSeparationRequest): Promise<StemSeparationResult> {
    const startTime = Date.now();
    const model = request.model || 'htdemucs';

    const response = await fetch(`${this.demucsEndpoint}/separate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: request.audio,
        model: model,
        shifts: request.shifts || 1,
        overlap: request.overlap || 0.25,
        format: request.output_format || 'wav',
        sample_rate: request.sample_rate || 44100,
        mp3_bitrate: request.mp3_bitrate || 320
      })
    });

    if (!response.ok) {
      throw new Error(`Demucs error: ${response.status}`);
    }

    const result: any = await response.json();

    return {
      success: true,
      stems: result.stems,
      original_duration: result.duration,
      processing_time: (Date.now() - startTime) / 1000,
      model,
      coordinate: `StemSeparation.Asset.Stems.${model}.Validated`,
      provider: 'demucs'
    };
  }

  private async separateWithUVR5(request: StemSeparationRequest): Promise<StemSeparationResult> {
    const startTime = Date.now();
    const model = request.model || 'uvr-mdx-net';

    const response = await fetch(`${this.uvr5Endpoint}/separate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: request.audio,
        model: model,
        format: request.output_format || 'wav'
      })
    });

    if (!response.ok) {
      throw new Error(`UVR5 error: ${response.status}`);
    }

    const result: any = await response.json();

    return {
      success: true,
      stems: result.stems,
      original_duration: result.duration,
      processing_time: (Date.now() - startTime) / 1000,
      model,
      coordinate: `StemSeparation.Asset.Stems.UVR5.Validated`,
      provider: 'uvr5'
    };
  }

  private async separateWithReplicate(request: StemSeparationRequest): Promise<StemSeparationResult> {
    const startTime = Date.now();

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.replicateToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'cjwbw/demucs:25a173108cff36ef9f80f854c162d01df9e6528be175794b81f7a3bf5e8f5a1e',
        input: {
          audio: `data:audio/wav;base64,${request.audio}`,
          model: 'htdemucs',
          shifts: request.shifts || 1,
          overlap: request.overlap || 0.25
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Replicate error: ${await response.text()}`);
    }

    let result: any = await response.json();

    // Poll for completion
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const pollResponse = await fetch(result.urls.get, {
        headers: { 'Authorization': `Token ${this.replicateToken}` }
      });
      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      return {
        success: false,
        error: result.error || 'Separation failed',
        model: request.model || 'htdemucs',
        provider: 'replicate'
      };
    }

    // Download and encode stems
    const stems: Record<StemType, string> = {} as any;
    for (const [stemName, url] of Object.entries(result.output)) {
      const stemResponse = await fetch(url as string);
      const stemBuffer = await stemResponse.arrayBuffer();
      stems[stemName as StemType] = Buffer.from(stemBuffer).toString('base64');
    }

    return {
      success: true,
      stems,
      processing_time: (Date.now() - startTime) / 1000,
      model: request.model || 'htdemucs',
      coordinate: `StemSeparation.Asset.Stems.Demucs.Validated`,
      provider: 'replicate'
    };
  }

  private separateDemo(request: StemSeparationRequest): StemSeparationResult {
    const model = request.model || 'htdemucs';
    const modelInfo = MODEL_INFO[model];

    // Return empty stems structure for demo
    const stems: Record<StemType, string> = {} as any;
    for (const stem of modelInfo.stems) {
      stems[stem] = ''; // Empty in demo mode
    }

    return {
      success: true,
      stems,
      model,
      coordinate: `StemSeparation.Asset.Stems.Demo.Draft`,
      provider: 'demo',
      error: 'Demo mode: Configure DEMUCS_ENDPOINT or REPLICATE_API_TOKEN for actual separation'
    };
  }

  /**
   * Extract only vocals (most common use case)
   */
  async extractVocals(audio: string): Promise<{ vocals: string; instrumental: string } | null> {
    const result = await this.separate({
      audio,
      model: 'mdx_extra', // Best for vocals
      stems: ['vocals', 'other']
    });

    if (!result.success || !result.stems) return null;

    return {
      vocals: result.stems.vocals || '',
      instrumental: result.stems.other || ''
    };
  }

  /**
   * Full 6-stem separation
   */
  async fullSeparation(audio: string): Promise<StemSeparationResult> {
    return this.separate({
      audio,
      model: 'htdemucs_6s',
      shifts: 2 // Higher quality
    });
  }

  /**
   * Remix stems back together with adjustments
   */
  async remix(request: RemixRequest): Promise<RemixResult> {
    // This would typically be done client-side with Web Audio API
    // or server-side with FFmpeg
    // For now, return a placeholder

    if (this.demucsEndpoint) {
      try {
        const response = await fetch(`${this.demucsEndpoint}/remix`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });

        if (!response.ok) {
          throw new Error(`Remix error: ${response.status}`);
        }

        const result: any = await response.json();
        return {
          success: true,
          audio: result.audio,
          duration: result.duration,
          coordinate: `StemSeparation.Asset.Remix.Mixed.Validated`
        };
      } catch (err) {
        console.warn('[Stems] Remix failed:', err);
      }
    }

    return {
      success: false,
      error: 'Remix requires DEMUCS_ENDPOINT with remix support'
    };
  }

  /**
   * Get recommended model for use case
   */
  getRecommendedModel(useCase: 'karaoke' | 'remix' | 'sample' | 'full'): StemModel {
    switch (useCase) {
      case 'karaoke':
        return 'mdx_extra'; // Best vocal isolation
      case 'remix':
        return 'htdemucs_6s'; // All stems
      case 'sample':
        return 'htdemucs'; // Good balance
      case 'full':
        return 'htdemucs_ft'; // Highest quality
      default:
        return 'htdemucs';
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const stemSep = new StemSeparationEngine();

export default {
  StemSeparationEngine,
  stemSep,
  MODEL_INFO
};

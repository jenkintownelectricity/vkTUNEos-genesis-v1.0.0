/**
 * vkTUNEos Voice Cloning Module
 * Self-hostable RVC/OpenVoice integration
 *
 * Replaces: ElevenLabs, KitsAI, Resemble AI
 * Open-source backends: RVC (Retrieval Voice Conversion), OpenVoice, XTTS
 *
 * Key advantages over ElevenLabs:
 * - No "perpetual license" over your voice data
 * - Self-hosted = you own everything
 * - Real-time conversion (90ms latency with RVC)
 * - Unlimited usage
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceCloneRequest {
  audio: string;                     // Base64 audio sample for cloning
  name: string;                      // Name for the voice model
  description?: string;
  language?: string;                 // ISO language code
  gender?: 'male' | 'female' | 'neutral';
  age?: 'child' | 'young' | 'adult' | 'senior';
  consent_verified: boolean;         // Required: user has consent
  tenant_id?: string;
}

export interface VoiceCloneResult {
  success: boolean;
  model_id?: string;
  name: string;
  coordinate?: string;               // vkTUNEos coordinate
  training_time?: number;            // Seconds to train
  quality_score?: number;            // 0-100 quality estimate
  error?: string;
  provider: 'rvc' | 'openvoice' | 'xtts' | 'demo';
}

export interface VoiceConversionRequest {
  audio: string;                     // Base64 source audio
  target_voice: string;              // Voice model ID or coordinate
  pitch_shift?: number;              // Semitones (-12 to +12)
  index_rate?: number;               // RVC index influence (0-1)
  filter_radius?: number;            // Median filtering (0-7)
  rms_mix_rate?: number;             // Volume envelope (0-1)
  protect?: number;                  // Protect voiceless consonants (0-0.5)
  f0_method?: 'pm' | 'harvest' | 'crepe' | 'rmvpe';  // Pitch extraction
  output_format?: 'wav' | 'mp3';
}

export interface VoiceConversionResult {
  success: boolean;
  audio?: string;                    // Base64 converted audio
  duration?: number;
  latency_ms?: number;               // Processing time
  coordinate?: string;
  error?: string;
  provider: 'rvc' | 'openvoice' | 'xtts' | 'demo';
}

export interface TextToSpeechRequest {
  text: string;
  voice: string;                     // Voice model ID or coordinate
  language?: string;
  speed?: number;                    // 0.5-2.0
  pitch?: number;                    // -20 to +20 semitones
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'surprised';
  output_format?: 'wav' | 'mp3';
}

export interface TextToSpeechResult {
  success: boolean;
  audio?: string;
  duration?: number;
  coordinate?: string;
  error?: string;
  provider: 'xtts' | 'openvoice' | 'demo';
}

export interface VoiceModel {
  id: string;
  name: string;
  coordinate: string;
  created: string;
  language: string;
  gender?: string;
  quality_score?: number;
  sample_count: number;
  provider: string;
}

// ============================================================================
// RVC CONFIGURATION (Best settings from research)
// ============================================================================

export const RVC_PRESETS = {
  'high-quality': {
    f0_method: 'rmvpe' as const,     // Best pitch detection
    index_rate: 0.75,                // Good balance
    filter_radius: 3,
    rms_mix_rate: 0.25,
    protect: 0.33
  },
  'fast': {
    f0_method: 'pm' as const,        // Fastest
    index_rate: 0.5,
    filter_radius: 0,
    rms_mix_rate: 0.1,
    protect: 0.5
  },
  'singing': {
    f0_method: 'crepe' as const,     // Best for singing
    index_rate: 0.88,                // More voice character
    filter_radius: 3,
    rms_mix_rate: 0.21,
    protect: 0.33
  },
  'speech': {
    f0_method: 'harvest' as const,
    index_rate: 0.66,
    filter_radius: 3,
    rms_mix_rate: 0.25,
    protect: 0.45
  }
};

// ============================================================================
// VOICE CLONING ENGINE
// ============================================================================

export class VoiceCloningEngine {
  private rvcEndpoint: string | null;
  private openvoiceEndpoint: string | null;
  private xttsEndpoint: string | null;
  private replicateToken: string | null;

  constructor(config?: {
    rvcEndpoint?: string;            // Local RVC server
    openvoiceEndpoint?: string;      // Local OpenVoice server
    xttsEndpoint?: string;           // Local XTTS server
    replicateToken?: string;         // Cloud fallback
  }) {
    this.rvcEndpoint = config?.rvcEndpoint || process.env.RVC_ENDPOINT || null;
    this.openvoiceEndpoint = config?.openvoiceEndpoint || process.env.OPENVOICE_ENDPOINT || null;
    this.xttsEndpoint = config?.xttsEndpoint || process.env.XTTS_ENDPOINT || null;
    this.replicateToken = config?.replicateToken || process.env.REPLICATE_API_TOKEN || null;
  }

  // ==========================================================================
  // VOICE CLONING (Create new voice model)
  // ==========================================================================

  /**
   * Clone a voice from audio sample
   * RVC can clone from 10 seconds, OpenVoice from 5 seconds
   */
  async cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResult> {
    if (!request.consent_verified) {
      return {
        success: false,
        name: request.name,
        error: 'Consent verification required for voice cloning',
        provider: 'demo'
      };
    }

    // Try RVC first (best for singing), then OpenVoice
    if (this.rvcEndpoint) {
      try {
        return await this.cloneWithRVC(request);
      } catch (err) {
        console.warn('[Voice] RVC clone failed:', err);
      }
    }

    if (this.openvoiceEndpoint) {
      try {
        return await this.cloneWithOpenVoice(request);
      } catch (err) {
        console.warn('[Voice] OpenVoice clone failed:', err);
      }
    }

    if (this.replicateToken) {
      return await this.cloneWithReplicate(request);
    }

    return this.cloneDemo(request);
  }

  private async cloneWithRVC(request: VoiceCloneRequest): Promise<VoiceCloneResult> {
    const startTime = Date.now();

    const response = await fetch(`${this.rvcEndpoint}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: request.audio,
        name: request.name,
        epochs: 100,                   // Fast training
        batch_size: 8,
        sample_rate: 48000
      })
    });

    if (!response.ok) {
      throw new Error(`RVC training error: ${response.status}`);
    }

    const result: any = await response.json();
    const trainingTime = (Date.now() - startTime) / 1000;

    return {
      success: true,
      model_id: result.model_id,
      name: request.name,
      coordinate: `VoiceCloning.Model.RVC.${request.name.replace(/\s+/g, '')}.Validated`,
      training_time: trainingTime,
      quality_score: result.quality_score || 85,
      provider: 'rvc'
    };
  }

  private async cloneWithOpenVoice(request: VoiceCloneRequest): Promise<VoiceCloneResult> {
    const startTime = Date.now();

    const response = await fetch(`${this.openvoiceEndpoint}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: request.audio,
        name: request.name,
        language: request.language || 'en'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenVoice clone error: ${response.status}`);
    }

    const result: any = await response.json();

    return {
      success: true,
      model_id: result.model_id,
      name: request.name,
      coordinate: `VoiceCloning.Model.OpenVoice.${request.name.replace(/\s+/g, '')}.Validated`,
      training_time: (Date.now() - startTime) / 1000,
      quality_score: result.quality_score || 80,
      provider: 'openvoice'
    };
  }

  private async cloneWithReplicate(request: VoiceCloneRequest): Promise<VoiceCloneResult> {
    // Use OpenVoice on Replicate
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.replicateToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'myshell-ai/openvoice',
        input: {
          audio: `data:audio/wav;base64,${request.audio}`,
          language: request.language || 'en'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Replicate error: ${await response.text()}`);
    }

    const result: any = await response.json();

    return {
      success: true,
      model_id: result.id,
      name: request.name,
      coordinate: `VoiceCloning.Model.OpenVoice.${request.name.replace(/\s+/g, '')}.Validated`,
      provider: 'openvoice'
    };
  }

  private cloneDemo(request: VoiceCloneRequest): VoiceCloneResult {
    return {
      success: true,
      model_id: `demo_${Date.now()}`,
      name: request.name,
      coordinate: `VoiceCloning.Model.Demo.${request.name.replace(/\s+/g, '')}.Draft`,
      provider: 'demo',
      error: 'Demo mode: Configure RVC_ENDPOINT or OPENVOICE_ENDPOINT for actual cloning'
    };
  }

  // ==========================================================================
  // VOICE CONVERSION (Apply voice to audio)
  // ==========================================================================

  /**
   * Convert audio to target voice
   * This is what makes RVC special - real-time voice-to-voice
   */
  async convert(request: VoiceConversionRequest): Promise<VoiceConversionResult> {
    if (this.rvcEndpoint) {
      try {
        return await this.convertWithRVC(request);
      } catch (err) {
        console.warn('[Voice] RVC conversion failed:', err);
      }
    }

    if (this.openvoiceEndpoint) {
      try {
        return await this.convertWithOpenVoice(request);
      } catch (err) {
        console.warn('[Voice] OpenVoice conversion failed:', err);
      }
    }

    return this.convertDemo(request);
  }

  private async convertWithRVC(request: VoiceConversionRequest): Promise<VoiceConversionResult> {
    const startTime = Date.now();

    // Apply preset if not specified
    const preset = RVC_PRESETS['high-quality'];

    const response = await fetch(`${this.rvcEndpoint}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: request.audio,
        model_id: request.target_voice,
        pitch_shift: request.pitch_shift || 0,
        index_rate: request.index_rate ?? preset.index_rate,
        filter_radius: request.filter_radius ?? preset.filter_radius,
        rms_mix_rate: request.rms_mix_rate ?? preset.rms_mix_rate,
        protect: request.protect ?? preset.protect,
        f0_method: request.f0_method || preset.f0_method,
        format: request.output_format || 'wav'
      })
    });

    if (!response.ok) {
      throw new Error(`RVC conversion error: ${response.status}`);
    }

    const result: any = await response.json();

    return {
      success: true,
      audio: result.audio,
      duration: result.duration,
      latency_ms: Date.now() - startTime,
      coordinate: `VoiceCloning.Asset.Converted.Audio.Validated`,
      provider: 'rvc'
    };
  }

  private async convertWithOpenVoice(request: VoiceConversionRequest): Promise<VoiceConversionResult> {
    const startTime = Date.now();

    const response = await fetch(`${this.openvoiceEndpoint}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: request.audio,
        target_voice: request.target_voice,
        pitch_shift: request.pitch_shift || 0
      })
    });

    if (!response.ok) {
      throw new Error(`OpenVoice conversion error: ${response.status}`);
    }

    const result: any = await response.json();

    return {
      success: true,
      audio: result.audio,
      duration: result.duration,
      latency_ms: Date.now() - startTime,
      coordinate: `VoiceCloning.Asset.Converted.Audio.Validated`,
      provider: 'openvoice'
    };
  }

  private convertDemo(request: VoiceConversionRequest): VoiceConversionResult {
    return {
      success: true,
      audio: request.audio, // Return original in demo
      coordinate: `VoiceCloning.Asset.Converted.Audio.Draft`,
      provider: 'demo',
      error: 'Demo mode: Configure RVC_ENDPOINT for actual conversion'
    };
  }

  // ==========================================================================
  // TEXT-TO-SPEECH (Generate speech from text)
  // ==========================================================================

  /**
   * Generate speech with cloned voice
   * Uses XTTS or OpenVoice
   */
  async textToSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    if (this.xttsEndpoint) {
      try {
        return await this.ttsWithXTTS(request);
      } catch (err) {
        console.warn('[Voice] XTTS TTS failed:', err);
      }
    }

    if (this.openvoiceEndpoint) {
      try {
        return await this.ttsWithOpenVoice(request);
      } catch (err) {
        console.warn('[Voice] OpenVoice TTS failed:', err);
      }
    }

    return this.ttsDemo(request);
  }

  private async ttsWithXTTS(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const response = await fetch(`${this.xttsEndpoint}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: request.text,
        speaker_wav: request.voice, // Voice model or reference audio
        language: request.language || 'en',
        speed: request.speed || 1.0
      })
    });

    if (!response.ok) {
      throw new Error(`XTTS error: ${response.status}`);
    }

    const result: any = await response.json();

    return {
      success: true,
      audio: result.audio,
      duration: result.duration,
      coordinate: `VoiceCloning.Asset.TTS.Audio.Validated`,
      provider: 'xtts'
    };
  }

  private async ttsWithOpenVoice(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const response = await fetch(`${this.openvoiceEndpoint}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: request.text,
        voice: request.voice,
        language: request.language || 'en',
        emotion: request.emotion || 'neutral',
        speed: request.speed || 1.0
      })
    });

    if (!response.ok) {
      throw new Error(`OpenVoice TTS error: ${response.status}`);
    }

    const result: any = await response.json();

    return {
      success: true,
      audio: result.audio,
      duration: result.duration,
      coordinate: `VoiceCloning.Asset.TTS.Audio.Validated`,
      provider: 'openvoice'
    };
  }

  private ttsDemo(request: TextToSpeechRequest): TextToSpeechResult {
    return {
      success: true,
      audio: '',
      coordinate: `VoiceCloning.Asset.TTS.Audio.Draft`,
      provider: 'demo',
      error: 'Demo mode: Configure XTTS_ENDPOINT for actual TTS'
    };
  }

  // ==========================================================================
  // VOICE MODEL MANAGEMENT
  // ==========================================================================

  /**
   * List available voice models
   */
  async listVoices(): Promise<VoiceModel[]> {
    const voices: VoiceModel[] = [];

    // Get from RVC
    if (this.rvcEndpoint) {
      try {
        const response = await fetch(`${this.rvcEndpoint}/models`);
        const rvcModels: any = await response.json();
        voices.push(...rvcModels.map((m: any) => ({
          ...m,
          coordinate: `VoiceCloning.Model.RVC.${m.name}.Validated`,
          provider: 'rvc'
        })));
      } catch (err) {
        console.warn('[Voice] Failed to fetch RVC models:', err);
      }
    }

    // Get from OpenVoice
    if (this.openvoiceEndpoint) {
      try {
        const response = await fetch(`${this.openvoiceEndpoint}/models`);
        const ovModels: any = await response.json();
        voices.push(...ovModels.map((m: any) => ({
          ...m,
          coordinate: `VoiceCloning.Model.OpenVoice.${m.name}.Validated`,
          provider: 'openvoice'
        })));
      } catch (err) {
        console.warn('[Voice] Failed to fetch OpenVoice models:', err);
      }
    }

    return voices;
  }

  /**
   * Delete a voice model
   */
  async deleteVoice(modelId: string): Promise<boolean> {
    // Try RVC first
    if (this.rvcEndpoint) {
      try {
        const response = await fetch(`${this.rvcEndpoint}/models/${modelId}`, {
          method: 'DELETE'
        });
        if (response.ok) return true;
      } catch (err) {
        console.warn('[Voice] RVC delete failed:', err);
      }
    }

    // Try OpenVoice
    if (this.openvoiceEndpoint) {
      try {
        const response = await fetch(`${this.openvoiceEndpoint}/models/${modelId}`, {
          method: 'DELETE'
        });
        if (response.ok) return true;
      } catch (err) {
        console.warn('[Voice] OpenVoice delete failed:', err);
      }
    }

    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const voiceClone = new VoiceCloningEngine();

export default {
  VoiceCloningEngine,
  voiceClone,
  RVC_PRESETS
};

/**
 * vkTUNEos Mood-to-Music Generator
 * Select an emotion or mood, get matching soundtrack instantly
 *
 * Tier 3 Killer Feature: KILL-006
 *
 * Mood Categories:
 * - Energy: Calm → Explosive
 * - Emotion: Happy, Sad, Angry, etc.
 * - Tone: Dark, Light, Mysterious, etc.
 * - Era: Retro, Modern, Futuristic
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 * Coordinate: vkTUNEos.Killer.MoodToMusic.EmotionMap.Validated
 */

import { MusicGenerationEngine, MusicGenerationResult, MusicStyle } from './music-generation.js';

// ============================================================================
// TYPES
// ============================================================================

export interface MoodPosition {
  energy: number;      // 0-100: Calm (0) to Explosive (100)
  valence: number;     // 0-100: Sad/Negative (0) to Happy/Positive (100)
}

export interface MoodParameters {
  energy: EnergyLevel;
  emotion: Emotion;
  tone: Tone;
  era?: Era;
  intensity?: number;  // 0-100
}

export type EnergyLevel = 'calm' | 'peaceful' | 'building' | 'energetic' | 'explosive';
export type Emotion = 'happy' | 'sad' | 'angry' | 'fearful' | 'surprised' | 'neutral' | 'nostalgic' | 'hopeful' | 'melancholic';
export type Tone = 'dark' | 'light' | 'mysterious' | 'playful' | 'epic' | 'intimate' | 'ethereal' | 'aggressive';
export type Era = 'retro' | 'modern' | 'futuristic' | 'timeless' | 'vintage' | 'contemporary';

export interface MoodToMusicRequest {
  mood: MoodParameters | MoodPosition;
  duration?: number;
  with_stems?: boolean;
  style_hints?: string[];
}

export interface MoodMapPoint {
  x: number;  // Energy (0-1)
  y: number;  // Valence (0-1)
  genre: string;
  prompt_template: string;
}

// ============================================================================
// MOOD MAP (2D Grid of Music Styles)
// ============================================================================

export const MOOD_MAP: MoodMapPoint[] = [
  // Low Energy + Low Valence (Sad/Calm)
  { x: 0.1, y: 0.1, genre: 'ambient', prompt_template: 'melancholic ambient music, slow, atmospheric, introspective, minor key, soft pads, {era} style' },
  { x: 0.2, y: 0.2, genre: 'sad piano', prompt_template: 'emotional piano ballad, melancholic, slow tempo, reflective, {era} classical piano style' },

  // Low Energy + Mid Valence (Neutral/Calm)
  { x: 0.1, y: 0.5, genre: 'chill', prompt_template: 'chill lofi beats, relaxed, mellow, neutral mood, soft drums, {era} production' },
  { x: 0.2, y: 0.5, genre: 'acoustic', prompt_template: 'gentle acoustic music, warm, cozy, fingerpicked guitar, {era} folk style' },

  // Low Energy + High Valence (Happy/Calm)
  { x: 0.1, y: 0.9, genre: 'peaceful', prompt_template: 'peaceful ambient music, bright, uplifting, nature sounds, meditation, {era} new age style' },
  { x: 0.2, y: 0.8, genre: 'happy acoustic', prompt_template: 'cheerful acoustic guitar, bright, optimistic, light percussion, {era} indie folk' },

  // Mid Energy + Low Valence (Sad/Moderate)
  { x: 0.5, y: 0.2, genre: 'dark electronic', prompt_template: 'dark electronic music, brooding, minor key, synth pads, {era} darkwave style' },
  { x: 0.4, y: 0.3, genre: 'indie sad', prompt_template: 'melancholic indie rock, emotional, guitar driven, introspective lyrics, {era} indie style' },

  // Mid Energy + Mid Valence (Neutral/Moderate)
  { x: 0.5, y: 0.5, genre: 'pop', prompt_template: 'catchy pop music, balanced energy, modern production, memorable melody, {era} pop style' },
  { x: 0.5, y: 0.6, genre: 'rock', prompt_template: 'solid rock music, driving beat, guitar riffs, energetic drums, {era} rock style' },

  // Mid Energy + High Valence (Happy/Moderate)
  { x: 0.5, y: 0.8, genre: 'upbeat pop', prompt_template: 'upbeat pop music, bright, cheerful, danceable, catchy hooks, {era} pop production' },
  { x: 0.4, y: 0.9, genre: 'feel good', prompt_template: 'feel good music, positive vibes, sunny, acoustic elements, claps, {era} indie pop' },

  // High Energy + Low Valence (Angry/Intense)
  { x: 0.9, y: 0.1, genre: 'metal', prompt_template: 'aggressive heavy metal, intense, distorted guitars, powerful drums, {era} metal style' },
  { x: 0.8, y: 0.2, genre: 'industrial', prompt_template: 'industrial electronic music, harsh, mechanical, distorted, {era} industrial style' },

  // High Energy + Mid Valence (Neutral/Intense)
  { x: 0.9, y: 0.5, genre: 'techno', prompt_template: 'driving techno music, hypnotic, repetitive, powerful kick drum, {era} techno production' },
  { x: 0.8, y: 0.5, genre: 'drum and bass', prompt_template: 'high energy drum and bass, fast breakbeats, heavy bass, {era} dnb style' },

  // High Energy + High Valence (Happy/Intense)
  { x: 0.9, y: 0.9, genre: 'euphoric edm', prompt_template: 'euphoric EDM, uplifting, festival anthem, big drop, {era} dance music' },
  { x: 0.8, y: 0.8, genre: 'happy hardcore', prompt_template: 'happy hardcore music, fast tempo, cheerful synths, energetic, {era} rave style' },
  { x: 0.7, y: 0.85, genre: 'future bass', prompt_template: 'future bass, bright synths, emotional drops, uplifting chords, {era} electronic' }
];

// ============================================================================
// EMOTION TO MUSICAL PARAMETERS
// ============================================================================

export const EMOTION_PARAMS: Record<Emotion, {
  key_preference: 'major' | 'minor' | 'modal';
  tempo_range: [number, number];
  instrumentation: string[];
  adjectives: string[];
}> = {
  'happy': {
    key_preference: 'major',
    tempo_range: [110, 140],
    instrumentation: ['bright synths', 'acoustic guitar', 'upbeat drums', 'bells'],
    adjectives: ['cheerful', 'bright', 'uplifting', 'joyful']
  },
  'sad': {
    key_preference: 'minor',
    tempo_range: [60, 90],
    instrumentation: ['piano', 'strings', 'soft pads', 'cello'],
    adjectives: ['melancholic', 'emotional', 'reflective', 'somber']
  },
  'angry': {
    key_preference: 'minor',
    tempo_range: [120, 180],
    instrumentation: ['distorted guitar', 'heavy drums', 'aggressive bass', 'industrial sounds'],
    adjectives: ['aggressive', 'intense', 'powerful', 'raw']
  },
  'fearful': {
    key_preference: 'modal',
    tempo_range: [80, 120],
    instrumentation: ['dissonant strings', 'low drones', 'sparse percussion', 'dark pads'],
    adjectives: ['tense', 'unsettling', 'suspenseful', 'eerie']
  },
  'surprised': {
    key_preference: 'major',
    tempo_range: [100, 140],
    instrumentation: ['staccato strings', 'brass hits', 'percussion accents', 'synth stabs'],
    adjectives: ['unexpected', 'dynamic', 'dramatic', 'exciting']
  },
  'neutral': {
    key_preference: 'major',
    tempo_range: [90, 120],
    instrumentation: ['balanced mix', 'clean guitar', 'standard drums', 'soft synths'],
    adjectives: ['balanced', 'moderate', 'steady', 'calm']
  },
  'nostalgic': {
    key_preference: 'major',
    tempo_range: [80, 110],
    instrumentation: ['vintage synths', 'warm pads', 'soft drums', 'tape saturation'],
    adjectives: ['wistful', 'warm', 'dreamy', 'retro']
  },
  'hopeful': {
    key_preference: 'major',
    tempo_range: [100, 130],
    instrumentation: ['building strings', 'piano', 'choir', 'orchestral elements'],
    adjectives: ['inspiring', 'uplifting', 'optimistic', 'soaring']
  },
  'melancholic': {
    key_preference: 'minor',
    tempo_range: [70, 100],
    instrumentation: ['piano', 'solo violin', 'gentle guitar', 'ambient pads'],
    adjectives: ['bittersweet', 'thoughtful', 'gentle sadness', 'reflective']
  }
};

export const TONE_MODIFIERS: Record<Tone, {
  production_style: string;
  additional_elements: string[];
}> = {
  'dark': {
    production_style: 'heavy reverb, low frequencies emphasized, minor keys',
    additional_elements: ['deep bass', 'dark textures', 'subtle dissonance']
  },
  'light': {
    production_style: 'airy production, high frequencies, major keys',
    additional_elements: ['bright melodies', 'gentle harmonies', 'soft touches']
  },
  'mysterious': {
    production_style: 'ambient spaces, unexpected sounds, modal scales',
    additional_elements: ['ethereal pads', 'sparse elements', 'subtle tension']
  },
  'playful': {
    production_style: 'bouncy rhythms, quirky sounds, major keys',
    additional_elements: ['pizzicato', 'playful percussion', 'fun synths']
  },
  'epic': {
    production_style: 'big reverb, layered orchestration, dramatic dynamics',
    additional_elements: ['full orchestra', 'choir', 'powerful drums', 'brass fanfares']
  },
  'intimate': {
    production_style: 'close microphone placement, minimal reverb, subtle production',
    additional_elements: ['whispered vocals', 'fingerpicked guitar', 'soft piano']
  },
  'ethereal': {
    production_style: 'lots of reverb, dreamy textures, floating melodies',
    additional_elements: ['ambient pads', 'angelic voices', 'shimmering sounds']
  },
  'aggressive': {
    production_style: 'distortion, compression, powerful transients',
    additional_elements: ['heavy guitars', 'pounding drums', 'intense bass']
  }
};

export const ERA_STYLES: Record<Era, string> = {
  'retro': '1970s-1980s vintage analog',
  'modern': '2020s contemporary digital',
  'futuristic': 'sci-fi electronic cyberpunk',
  'timeless': 'classic orchestral evergreen',
  'vintage': '1960s warm tape',
  'contemporary': 'current trending'
};

// ============================================================================
// MOOD-TO-MUSIC ENGINE
// ============================================================================

export class MoodToMusicEngine {
  private musicEngine: MusicGenerationEngine;

  constructor(musicEngine?: MusicGenerationEngine) {
    this.musicEngine = musicEngine || new MusicGenerationEngine();
  }

  /**
   * Generate music from mood parameters
   */
  async generate(request: MoodToMusicRequest): Promise<MusicGenerationResult> {
    const prompt = this.buildPromptFromMood(request);

    return this.musicEngine.generate({
      prompt,
      duration: request.duration || 30,
      with_stems: request.with_stems,
      temperature: this.calculateTemperature(request)
    });
  }

  /**
   * Generate from 2D mood position (x: energy, y: valence)
   */
  async generateFromPosition(
    x: number,
    y: number,
    options?: { duration?: number; with_stems?: boolean; era?: Era }
  ): Promise<MusicGenerationResult> {
    const closestPoint = this.findClosestMoodPoint(x, y);
    const era = options?.era || 'modern';

    const prompt = closestPoint.prompt_template.replace('{era}', ERA_STYLES[era]);

    return this.musicEngine.generate({
      prompt,
      duration: options?.duration || 30,
      with_stems: options?.with_stems
    });
  }

  /**
   * Get multiple variations for a mood
   */
  async generateVariations(
    request: MoodToMusicRequest,
    count: number = 3
  ): Promise<MusicGenerationResult[]> {
    const results: MusicGenerationResult[] = [];

    for (let i = 0; i < count; i++) {
      const variation = await this.musicEngine.generate({
        prompt: this.buildPromptFromMood(request),
        duration: request.duration || 30,
        with_stems: request.with_stems,
        temperature: 1.0 + (i * 0.15) // Increase variation
      });
      results.push(variation);
    }

    return results;
  }

  /**
   * Build prompt from mood parameters
   */
  private buildPromptFromMood(request: MoodToMusicRequest): string {
    const parts: string[] = [];

    if (this.isMoodParameters(request.mood)) {
      const params = request.mood as MoodParameters;

      // Get emotion parameters
      const emotionParams = EMOTION_PARAMS[params.emotion];
      const toneModifier = TONE_MODIFIERS[params.tone];
      const eraStyle = ERA_STYLES[params.era || 'modern'];

      // Build prompt
      parts.push(emotionParams.adjectives.slice(0, 2).join(', '));
      parts.push(`${params.energy} energy`);
      parts.push(emotionParams.instrumentation.slice(0, 3).join(', '));
      parts.push(toneModifier.additional_elements.slice(0, 2).join(', '));
      parts.push(`${emotionParams.key_preference} key`);
      parts.push(`${emotionParams.tempo_range[0]}-${emotionParams.tempo_range[1]} BPM`);
      parts.push(eraStyle);
      parts.push('high quality production');

    } else {
      // It's a MoodPosition
      const pos = request.mood as MoodPosition;
      const closestPoint = this.findClosestMoodPoint(pos.energy / 100, pos.valence / 100);
      return closestPoint.prompt_template.replace('{era}', ERA_STYLES['modern']);
    }

    // Add style hints
    if (request.style_hints) {
      parts.push(...request.style_hints);
    }

    return parts.join(', ');
  }

  /**
   * Find closest mood point on the map
   */
  private findClosestMoodPoint(x: number, y: number): MoodMapPoint {
    let closest = MOOD_MAP[0];
    let minDist = Infinity;

    for (const point of MOOD_MAP) {
      const dist = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
      if (dist < minDist) {
        minDist = dist;
        closest = point;
      }
    }

    return closest;
  }

  /**
   * Calculate temperature based on mood
   */
  private calculateTemperature(request: MoodToMusicRequest): number {
    // Higher energy/intensity = more creative generation
    if (this.isMoodParameters(request.mood)) {
      const params = request.mood as MoodParameters;
      const energyMap: Record<EnergyLevel, number> = {
        'calm': 0.2,
        'peaceful': 0.3,
        'building': 0.5,
        'energetic': 0.7,
        'explosive': 0.9
      };
      const base = energyMap[params.energy] || 0.5;
      const intensity = (params.intensity || 50) / 100;
      return 0.8 + (base * intensity * 0.4);
    }

    return 1.0;
  }

  /**
   * Type guard for MoodParameters
   */
  private isMoodParameters(mood: MoodParameters | MoodPosition): mood is MoodParameters {
    return 'emotion' in mood;
  }

  /**
   * Get the mood map for UI display
   */
  getMoodMap(): MoodMapPoint[] {
    return MOOD_MAP;
  }

  /**
   * Get emotion options for UI
   */
  getEmotionOptions(): Emotion[] {
    return Object.keys(EMOTION_PARAMS) as Emotion[];
  }

  /**
   * Get tone options for UI
   */
  getToneOptions(): Tone[] {
    return Object.keys(TONE_MODIFIERS) as Tone[];
  }

  /**
   * Get era options for UI
   */
  getEraOptions(): Era[] {
    return Object.keys(ERA_STYLES) as Era[];
  }

  /**
   * Get description for a mood combination
   */
  describeMood(params: MoodParameters): string {
    const emotionParams = EMOTION_PARAMS[params.emotion];
    const toneModifier = TONE_MODIFIERS[params.tone];

    return `${params.tone}, ${params.emotion} music with ${params.energy} energy. ` +
      `Features ${emotionParams.instrumentation.slice(0, 2).join(' and ')}. ` +
      `${toneModifier.production_style}.`;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const moodToMusic = new MoodToMusicEngine();

export default {
  MoodToMusicEngine,
  moodToMusic,
  MOOD_MAP,
  EMOTION_PARAMS,
  TONE_MODIFIERS,
  ERA_STYLES
};

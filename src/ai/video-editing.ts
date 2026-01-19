/**
 * vkTUNEos Video Editing Module
 * FFmpeg-based video editing with AI auto-cut
 *
 * Tier 1 Feature: VID-EDT-001
 * Open-source backend: FFmpeg + Whisper
 *
 * Capabilities:
 * - Timeline-based editing
 * - AI auto-cut (detect beats, scenes)
 * - Auto scene detection
 * - Color grading presets
 * - Transition library
 * - Audio sync to video
 * - Multi-platform export
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TimelineProject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
  tracks: TimelineTrack[];
  coordinate: string;
}

export interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'effect';
  name: string;
  clips: TimelineClip[];
  muted?: boolean;
  locked?: boolean;
  visible?: boolean;
  volume?: number;
}

export interface TimelineClip {
  id: string;
  source: string;           // Base64 or file path
  start_time: number;       // Position on timeline (seconds)
  duration: number;         // Clip duration (seconds)
  in_point: number;         // Source in point (seconds)
  out_point: number;        // Source out point (seconds)
  effects?: ClipEffect[];
  transitions?: ClipTransition[];
}

export interface ClipEffect {
  type: 'color_grade' | 'filter' | 'speed' | 'crop' | 'opacity' | 'rotate';
  params: Record<string, any>;
}

export interface ClipTransition {
  type: 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom';
  position: 'start' | 'end';
  duration: number;
  params?: Record<string, any>;
}

export interface EditOperation {
  type: 'trim' | 'cut' | 'add_audio' | 'add_video' | 'add_text' |
        'apply_effect' | 'add_transition' | 'auto_cut' | 'beat_sync' |
        'scene_detect' | 'color_grade' | 'speed_change' | 'concat';
  params: Record<string, any>;
}

export interface ExportRequest {
  project: TimelineProject;
  preset?: ExportPreset;
  format?: 'mp4' | 'mov' | 'webm' | 'gif';
  quality?: 'draft' | 'standard' | 'high' | 'ultra';
  custom?: {
    width?: number;
    height?: number;
    fps?: number;
    bitrate?: string;
    codec?: string;
  };
}

export type ExportPreset =
  | 'tiktok'          // 1080x1920, 9:16, 60fps, H.265, <60s
  | 'youtube'         // 1920x1080, 16:9, 30fps, H.264
  | 'instagram_reel'  // 1080x1920, 9:16, 30fps
  | 'instagram_post'  // 1080x1080, 1:1, 30fps
  | 'instagram_story' // 1080x1920, 9:16, 30fps
  | 'youtube_shorts'  // 1080x1920, 9:16, <60s
  | 'twitter'         // 1280x720, 16:9, <140s
  | 'podcast'         // Audio only, MP3 320kbps
  | 'web_optimized';  // 720p, H.264, web-optimized

export interface ExportResult {
  success: boolean;
  video?: string;           // Base64 encoded
  audio?: string;           // For podcast export
  duration?: number;
  file_size?: number;
  format?: string;
  coordinate?: string;
  error?: string;
}

export interface AutoCutResult {
  success: boolean;
  cuts?: {
    timestamp: number;
    type: 'beat' | 'scene' | 'silence' | 'motion';
    confidence: number;
  }[];
  suggested_edits?: EditOperation[];
  coordinate?: string;
  error?: string;
}

export interface SceneDetectResult {
  success: boolean;
  scenes?: {
    start: number;
    end: number;
    type: string;
    thumbnail?: string;
  }[];
  coordinate?: string;
  error?: string;
}

// ============================================================================
// EXPORT PRESETS
// ============================================================================

export const EXPORT_PRESETS: Record<ExportPreset, {
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: string;
  max_duration?: number;
  description: string;
}> = {
  'tiktok': {
    width: 1080,
    height: 1920,
    fps: 60,
    codec: 'libx265',
    bitrate: '8M',
    max_duration: 60,
    description: 'TikTok vertical video (9:16, up to 60s)'
  },
  'youtube': {
    width: 1920,
    height: 1080,
    fps: 30,
    codec: 'libx264',
    bitrate: '12M',
    description: 'YouTube standard HD (16:9)'
  },
  'instagram_reel': {
    width: 1080,
    height: 1920,
    fps: 30,
    codec: 'libx264',
    bitrate: '6M',
    max_duration: 90,
    description: 'Instagram Reels (9:16, up to 90s)'
  },
  'instagram_post': {
    width: 1080,
    height: 1080,
    fps: 30,
    codec: 'libx264',
    bitrate: '5M',
    max_duration: 60,
    description: 'Instagram post (1:1 square)'
  },
  'instagram_story': {
    width: 1080,
    height: 1920,
    fps: 30,
    codec: 'libx264',
    bitrate: '5M',
    max_duration: 15,
    description: 'Instagram Story (9:16, 15s segments)'
  },
  'youtube_shorts': {
    width: 1080,
    height: 1920,
    fps: 30,
    codec: 'libx264',
    bitrate: '8M',
    max_duration: 60,
    description: 'YouTube Shorts (9:16, up to 60s)'
  },
  'twitter': {
    width: 1280,
    height: 720,
    fps: 30,
    codec: 'libx264',
    bitrate: '5M',
    max_duration: 140,
    description: 'Twitter/X video (16:9, up to 140s)'
  },
  'podcast': {
    width: 0,
    height: 0,
    fps: 0,
    codec: 'libmp3lame',
    bitrate: '320k',
    description: 'Audio only podcast (MP3 320kbps)'
  },
  'web_optimized': {
    width: 1280,
    height: 720,
    fps: 30,
    codec: 'libx264',
    bitrate: '4M',
    description: 'Web-optimized 720p (fast loading)'
  }
};

// ============================================================================
// COLOR GRADING PRESETS
// ============================================================================

export const COLOR_PRESETS: Record<string, {
  name: string;
  ffmpeg_filter: string;
  description: string;
}> = {
  'cinematic': {
    name: 'Cinematic',
    ffmpeg_filter: 'eq=contrast=1.1:saturation=0.9:brightness=0.05,colorbalance=rs=0.1:gs=-0.05:bs=0.15',
    description: 'Film-like color grading with teal/orange tones'
  },
  'vibrant': {
    name: 'Vibrant',
    ffmpeg_filter: 'eq=saturation=1.4:contrast=1.1,hue=s=1.2',
    description: 'Boosted colors for social media'
  },
  'vintage': {
    name: 'Vintage',
    ffmpeg_filter: 'colorbalance=rs=0.2:gs=0.1:bs=-0.1,eq=saturation=0.8,curves=vintage',
    description: 'Retro film look'
  },
  'black_white': {
    name: 'Black & White',
    ffmpeg_filter: 'format=gray,eq=contrast=1.2',
    description: 'Classic monochrome'
  },
  'warm': {
    name: 'Warm',
    ffmpeg_filter: 'colorbalance=rs=0.15:gs=0.05:bs=-0.1,eq=brightness=0.03',
    description: 'Golden hour warmth'
  },
  'cool': {
    name: 'Cool',
    ffmpeg_filter: 'colorbalance=rs=-0.1:gs=0:bs=0.15,eq=brightness=-0.02',
    description: 'Cool blue tones'
  },
  'night': {
    name: 'Night Mode',
    ffmpeg_filter: 'eq=brightness=-0.1:contrast=1.3:saturation=0.7,colorbalance=bs=0.2',
    description: 'Dark moody look'
  },
  'hdr_look': {
    name: 'HDR Look',
    ffmpeg_filter: 'eq=contrast=1.3:saturation=1.2,unsharp=5:5:1.5',
    description: 'High dynamic range simulation'
  }
};

// ============================================================================
// TRANSITION LIBRARY
// ============================================================================

export const TRANSITIONS: Record<string, {
  name: string;
  ffmpeg_filter: string;
  default_duration: number;
}> = {
  'fade': {
    name: 'Fade',
    ffmpeg_filter: 'xfade=transition=fade:duration={duration}:offset={offset}',
    default_duration: 0.5
  },
  'dissolve': {
    name: 'Dissolve',
    ffmpeg_filter: 'xfade=transition=dissolve:duration={duration}:offset={offset}',
    default_duration: 1.0
  },
  'wipe_left': {
    name: 'Wipe Left',
    ffmpeg_filter: 'xfade=transition=wipeleft:duration={duration}:offset={offset}',
    default_duration: 0.5
  },
  'wipe_right': {
    name: 'Wipe Right',
    ffmpeg_filter: 'xfade=transition=wiperight:duration={duration}:offset={offset}',
    default_duration: 0.5
  },
  'slide_left': {
    name: 'Slide Left',
    ffmpeg_filter: 'xfade=transition=slideleft:duration={duration}:offset={offset}',
    default_duration: 0.5
  },
  'slide_right': {
    name: 'Slide Right',
    ffmpeg_filter: 'xfade=transition=slideright:duration={duration}:offset={offset}',
    default_duration: 0.5
  },
  'zoom_in': {
    name: 'Zoom In',
    ffmpeg_filter: 'xfade=transition=zoomin:duration={duration}:offset={offset}',
    default_duration: 0.5
  },
  'circle_open': {
    name: 'Circle Open',
    ffmpeg_filter: 'xfade=transition=circleopen:duration={duration}:offset={offset}',
    default_duration: 0.75
  },
  'pixelize': {
    name: 'Pixelize',
    ffmpeg_filter: 'xfade=transition=pixelize:duration={duration}:offset={offset}',
    default_duration: 0.5
  }
};

// ============================================================================
// VIDEO EDITING ENGINE
// ============================================================================

export class VideoEditingEngine {
  private ffmpegEndpoint: string | null;
  private whisperEndpoint: string | null;

  constructor(config?: {
    ffmpegEndpoint?: string;
    whisperEndpoint?: string;
  }) {
    this.ffmpegEndpoint = config?.ffmpegEndpoint || process.env.FFMPEG_ENDPOINT || null;
    this.whisperEndpoint = config?.whisperEndpoint || process.env.WHISPER_ENDPOINT || null;
  }

  // ==========================================================================
  // PROJECT MANAGEMENT
  // ==========================================================================

  /**
   * Create a new timeline project
   */
  createProject(options: {
    name: string;
    width?: number;
    height?: number;
    fps?: number;
  }): TimelineProject {
    return {
      id: `proj_${Date.now()}`,
      name: options.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      duration: 0,
      fps: options.fps || 30,
      width: options.width || 1920,
      height: options.height || 1080,
      tracks: [
        { id: 'video_1', type: 'video', name: 'Video 1', clips: [] },
        { id: 'audio_1', type: 'audio', name: 'Audio 1', clips: [] }
      ],
      coordinate: `VideoEditing.Project.Timeline.${options.name.replace(/\s+/g, '')}.Draft`
    };
  }

  // ==========================================================================
  // BASIC EDITING OPERATIONS
  // ==========================================================================

  /**
   * Apply edit operations to a project
   */
  async edit(request: {
    project: TimelineProject;
    operations: EditOperation[];
  }): Promise<{ success: boolean; project?: TimelineProject; error?: string }> {
    const { project, operations } = request;
    let currentProject = { ...project };

    for (const op of operations) {
      try {
        switch (op.type) {
          case 'trim':
            currentProject = this.applyTrim(currentProject, op.params as { start: number; end: number });
            break;
          case 'cut':
            currentProject = this.applyCut(currentProject, op.params as { position: number; track_id: string });
            break;
          case 'add_audio':
            currentProject = this.addAudio(currentProject, op.params as { audio: string; start: number; duration?: number });
            break;
          case 'add_video':
            currentProject = this.addVideo(currentProject, op.params as { video: string; start: number; duration?: number });
            break;
          case 'color_grade':
            currentProject = this.applyColorGrade(currentProject, op.params as { preset: string; clip_id?: string });
            break;
          case 'speed_change':
            currentProject = this.applySpeedChange(currentProject, op.params as { speed: number; clip_id: string });
            break;
          case 'add_transition':
            currentProject = this.addTransition(currentProject, op.params as { clip_id: string; transition: string; position: 'start' | 'end'; duration?: number });
            break;
          default:
            console.warn(`[VideoEdit] Unknown operation: ${op.type}`);
        }
      } catch (err) {
        return { success: false, error: `Operation ${op.type} failed: ${err}` };
      }
    }

    currentProject.updated_at = new Date().toISOString();
    return { success: true, project: currentProject };
  }

  private applyTrim(project: TimelineProject, params: { start: number; end: number }): TimelineProject {
    // Update all clips to respect new timeline bounds
    const { start, end } = params;
    const newDuration = end - start;

    const updatedTracks = project.tracks.map(track => ({
      ...track,
      clips: track.clips
        .filter(clip => clip.start_time < end && clip.start_time + clip.duration > start)
        .map(clip => {
          const newStart = Math.max(0, clip.start_time - start);
          const clipEnd = Math.min(end - start, clip.start_time + clip.duration - start);
          return {
            ...clip,
            start_time: newStart,
            duration: clipEnd - newStart
          };
        })
    }));

    return { ...project, tracks: updatedTracks, duration: newDuration };
  }

  private applyCut(project: TimelineProject, params: { position: number; track_id: string }): TimelineProject {
    // Split clip at position
    const updatedTracks = project.tracks.map(track => {
      if (track.id !== params.track_id) return track;

      const newClips: TimelineClip[] = [];
      for (const clip of track.clips) {
        const clipEnd = clip.start_time + clip.duration;
        if (clip.start_time < params.position && clipEnd > params.position) {
          // Split this clip
          const firstDuration = params.position - clip.start_time;
          newClips.push({
            ...clip,
            id: `${clip.id}_a`,
            duration: firstDuration,
            out_point: clip.in_point + firstDuration
          });
          newClips.push({
            ...clip,
            id: `${clip.id}_b`,
            start_time: params.position,
            duration: clipEnd - params.position,
            in_point: clip.in_point + firstDuration
          });
        } else {
          newClips.push(clip);
        }
      }
      return { ...track, clips: newClips };
    });

    return { ...project, tracks: updatedTracks };
  }

  private addAudio(project: TimelineProject, params: { audio: string; start: number; duration?: number }): TimelineProject {
    const audioTrack = project.tracks.find(t => t.type === 'audio');
    if (!audioTrack) return project;

    const newClip: TimelineClip = {
      id: `clip_${Date.now()}`,
      source: params.audio,
      start_time: params.start || 0,
      duration: params.duration || 30,
      in_point: 0,
      out_point: params.duration || 30
    };

    audioTrack.clips.push(newClip);
    return project;
  }

  private addVideo(project: TimelineProject, params: { video: string; start: number; duration?: number }): TimelineProject {
    const videoTrack = project.tracks.find(t => t.type === 'video');
    if (!videoTrack) return project;

    const newClip: TimelineClip = {
      id: `clip_${Date.now()}`,
      source: params.video,
      start_time: params.start || 0,
      duration: params.duration || 10,
      in_point: 0,
      out_point: params.duration || 10
    };

    videoTrack.clips.push(newClip);
    project.duration = Math.max(project.duration, params.start + (params.duration || 10));
    return project;
  }

  private applyColorGrade(project: TimelineProject, params: { preset: string; clip_id?: string }): TimelineProject {
    const preset = COLOR_PRESETS[params.preset];
    if (!preset) return project;

    const effect: ClipEffect = {
      type: 'color_grade',
      params: { preset: params.preset, filter: preset.ffmpeg_filter }
    };

    const updatedTracks = project.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (params.clip_id && clip.id !== params.clip_id) return clip;
        return {
          ...clip,
          effects: [...(clip.effects || []), effect]
        };
      })
    }));

    return { ...project, tracks: updatedTracks };
  }

  private applySpeedChange(project: TimelineProject, params: { speed: number; clip_id: string }): TimelineProject {
    const effect: ClipEffect = {
      type: 'speed',
      params: { speed: params.speed }
    };

    const updatedTracks = project.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (clip.id !== params.clip_id) return clip;
        return {
          ...clip,
          duration: clip.duration / params.speed,
          effects: [...(clip.effects || []), effect]
        };
      })
    }));

    return { ...project, tracks: updatedTracks };
  }

  private addTransition(project: TimelineProject, params: {
    clip_id: string;
    transition: string;
    position: 'start' | 'end';
    duration?: number;
  }): TimelineProject {
    const transitionDef = TRANSITIONS[params.transition];
    if (!transitionDef) return project;

    const transition: ClipTransition = {
      type: params.transition as any,
      position: params.position,
      duration: params.duration || transitionDef.default_duration
    };

    const updatedTracks = project.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (clip.id !== params.clip_id) return clip;
        return {
          ...clip,
          transitions: [...(clip.transitions || []), transition]
        };
      })
    }));

    return { ...project, tracks: updatedTracks };
  }

  // ==========================================================================
  // AI AUTO-CUT (Beat/Scene Detection)
  // ==========================================================================

  /**
   * Auto-detect cuts based on beats, scenes, or motion
   */
  async autoCut(request: {
    video?: string;
    audio?: string;
    mode: 'beat' | 'scene' | 'silence' | 'all';
    sensitivity?: number;
  }): Promise<AutoCutResult> {
    if (this.ffmpegEndpoint) {
      try {
        const response = await fetch(`${this.ffmpegEndpoint}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video: request.video,
            audio: request.audio,
            mode: request.mode,
            sensitivity: request.sensitivity || 0.5
          })
        });

        if (response.ok) {
          const result: any = await response.json();
          return {
            success: true,
            cuts: result.cuts,
            suggested_edits: this.generateSuggestedEdits(result.cuts),
            coordinate: `VideoEditing.Analysis.AutoCut.${request.mode}.Validated`
          };
        }
      } catch (err) {
        console.warn('[VideoEdit] Auto-cut analysis failed:', err);
      }
    }

    // Demo response with simulated cuts
    const demoCuts = this.generateDemoCuts(request.mode);
    return {
      success: true,
      cuts: demoCuts,
      suggested_edits: this.generateSuggestedEdits(demoCuts),
      coordinate: `VideoEditing.Analysis.AutoCut.${request.mode}.Draft`,
      error: 'Demo mode: Configure FFMPEG_ENDPOINT for actual analysis'
    };
  }

  private generateDemoCuts(mode: string): Array<{ timestamp: number; type: 'beat' | 'scene' | 'silence' | 'motion'; confidence: number }> {
    // Simulate detected cuts for demo
    const cuts: Array<{ timestamp: number; type: 'beat' | 'scene' | 'silence' | 'motion'; confidence: number }> = [];
    const count = mode === 'beat' ? 16 : mode === 'scene' ? 5 : 8;
    const types: Array<'beat' | 'scene' | 'silence' | 'motion'> = ['beat', 'scene', 'silence', 'motion'];

    for (let i = 0; i < count; i++) {
      cuts.push({
        timestamp: i * (30 / count),
        type: mode === 'all' ? types[i % 3] : (mode as 'beat' | 'scene' | 'silence' | 'motion'),
        confidence: 0.7 + Math.random() * 0.3
      });
    }
    return cuts;
  }

  private generateSuggestedEdits(cuts: Array<{ timestamp: number; type: string; confidence: number }>): EditOperation[] {
    return cuts
      .filter(c => c.confidence > 0.8)
      .map(cut => ({
        type: 'cut' as const,
        params: { position: cut.timestamp, reason: cut.type }
      }));
  }

  /**
   * Detect scene changes in video
   */
  async detectScenes(video: string): Promise<SceneDetectResult> {
    if (this.ffmpegEndpoint) {
      try {
        const response = await fetch(`${this.ffmpegEndpoint}/scene-detect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video, threshold: 0.3 })
        });

        if (response.ok) {
          const result: any = await response.json();
          return {
            success: true,
            scenes: result.scenes,
            coordinate: `VideoEditing.Analysis.SceneDetect.Validated`
          };
        }
      } catch (err) {
        console.warn('[VideoEdit] Scene detection failed:', err);
      }
    }

    // Demo response
    return {
      success: true,
      scenes: [
        { start: 0, end: 5, type: 'intro' },
        { start: 5, end: 15, type: 'content' },
        { start: 15, end: 25, type: 'content' },
        { start: 25, end: 30, type: 'outro' }
      ],
      coordinate: `VideoEditing.Analysis.SceneDetect.Draft`,
      error: 'Demo mode: Configure FFMPEG_ENDPOINT for actual scene detection'
    };
  }

  // ==========================================================================
  // MULTI-PLATFORM EXPORT (Tier 2 Differentiator)
  // ==========================================================================

  /**
   * Export project for specific platform
   */
  async export(request: ExportRequest): Promise<ExportResult> {
    const preset = request.preset ? EXPORT_PRESETS[request.preset] : null;
    const config = preset || request.custom || EXPORT_PRESETS['youtube'];

    if (this.ffmpegEndpoint) {
      try {
        const response = await fetch(`${this.ffmpegEndpoint}/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: request.project,
            width: config.width,
            height: config.height,
            fps: config.fps,
            codec: config.codec,
            bitrate: config.bitrate,
            format: request.format || 'mp4',
            quality: request.quality || 'standard'
          })
        });

        if (response.ok) {
          const result: any = await response.json();
          return {
            success: true,
            video: result.video,
            duration: result.duration,
            file_size: result.file_size,
            format: request.format || 'mp4',
            coordinate: `VideoEditing.Export.${request.preset || 'custom'}.Validated`
          };
        }
      } catch (err) {
        console.warn('[VideoEdit] Export failed:', err);
      }
    }

    // Demo response
    return {
      success: true,
      video: '',
      duration: request.project.duration,
      format: request.format || 'mp4',
      coordinate: `VideoEditing.Export.${request.preset || 'custom'}.Draft`,
      error: 'Demo mode: Configure FFMPEG_ENDPOINT for actual export'
    };
  }

  /**
   * Export for all platforms at once
   */
  async exportAll(project: TimelineProject, platforms: ExportPreset[]): Promise<Record<ExportPreset, ExportResult>> {
    const results: Record<string, ExportResult> = {};

    for (const preset of platforms) {
      results[preset] = await this.export({ project, preset });
    }

    return results as Record<ExportPreset, ExportResult>;
  }

  /**
   * Smart crop for different aspect ratios
   * Uses AI to detect subject and keep them in frame
   */
  async smartCrop(video: string, targetRatio: '16:9' | '9:16' | '1:1' | '4:5'): Promise<{
    success: boolean;
    video?: string;
    crop_params?: { x: number; y: number; width: number; height: number };
    error?: string;
  }> {
    if (this.ffmpegEndpoint) {
      try {
        const response = await fetch(`${this.ffmpegEndpoint}/smart-crop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video, target_ratio: targetRatio })
        });

        if (response.ok) {
          return await response.json() as {
            success: boolean;
            video?: string;
            crop_params?: { x: number; y: number; width: number; height: number };
            error?: string;
          };
        }
      } catch (err) {
        console.warn('[VideoEdit] Smart crop failed:', err);
      }
    }

    return {
      success: true,
      crop_params: { x: 0, y: 0, width: 1920, height: 1080 },
      error: 'Demo mode: Smart crop requires FFMPEG_ENDPOINT'
    };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get available export presets
   */
  getExportPresets(): typeof EXPORT_PRESETS {
    return EXPORT_PRESETS;
  }

  /**
   * Get available color presets
   */
  getColorPresets(): typeof COLOR_PRESETS {
    return COLOR_PRESETS;
  }

  /**
   * Get available transitions
   */
  getTransitions(): typeof TRANSITIONS {
    return TRANSITIONS;
  }

  /**
   * Calculate project duration from clips
   */
  calculateDuration(project: TimelineProject): number {
    let maxEnd = 0;
    for (const track of project.tracks) {
      for (const clip of track.clips) {
        maxEnd = Math.max(maxEnd, clip.start_time + clip.duration);
      }
    }
    return maxEnd;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const videoEdit = new VideoEditingEngine();

export default {
  VideoEditingEngine,
  videoEdit,
  EXPORT_PRESETS,
  COLOR_PRESETS,
  TRANSITIONS
};

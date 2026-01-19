/**
 * vkTUNEos AI Collaborator Module
 * Natural language control of projects
 *
 * Tier 3 Killer Feature: KILL-001
 * "Make this chorus more energetic" → AI adjusts in real-time
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 * Coordinate: vkTUNEos.Killer.AICollaborator.NaturalLanguage.Validated
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CollaboratorRequest {
  instruction: string;          // Natural language instruction
  context: ProjectContext;      // Current project state
  mode?: 'preview' | 'apply';   // Preview changes or apply directly
  confidence_threshold?: number; // Min confidence to auto-apply (0-1)
}

export interface ProjectContext {
  type: 'music' | 'video' | 'mixed';
  tracks?: TrackContext[];
  current_time?: number;
  selected_region?: { start: number; end: number };
  bpm?: number;
  key?: string;
  genre?: string;
}

export interface TrackContext {
  id: string;
  name: string;
  type: 'vocals' | 'drums' | 'bass' | 'melody' | 'fx' | 'video';
  current_effects?: string[];
  volume?: number;
  pan?: number;
}

export interface CollaboratorResponse {
  success: boolean;
  interpretation: string;       // What the AI understood
  confidence: number;           // How confident (0-1)
  actions: CollaboratorAction[];
  preview_description?: string;
  applied?: boolean;
  error?: string;
}

export interface CollaboratorAction {
  type: ActionType;
  target: string;              // Track ID or 'master' or 'project'
  operation: string;
  params: Record<string, any>;
  description: string;
}

export type ActionType =
  | 'eq'
  | 'compression'
  | 'reverb'
  | 'delay'
  | 'volume'
  | 'pan'
  | 'tempo'
  | 'pitch'
  | 'add_element'
  | 'remove_element'
  | 'rearrange'
  | 'transition'
  | 'filter'
  | 'generate';

// ============================================================================
// INSTRUCTION PATTERNS
// ============================================================================

interface InstructionPattern {
  patterns: RegExp[];
  action_type: ActionType;
  target_hint: string;
  param_extractor: (match: RegExpMatchArray, instruction: string) => Record<string, any>;
}

const INSTRUCTION_PATTERNS: InstructionPattern[] = [
  // Energy/Dynamics
  {
    patterns: [
      /make.*more energetic/i,
      /add.*energy/i,
      /pump.*up/i,
      /more.*punch/i
    ],
    action_type: 'compression',
    target_hint: 'drums,bass,master',
    param_extractor: () => ({
      ratio: 4,
      attack: 10,
      release: 100,
      threshold: -12,
      additional: ['high_shelf_boost', 'transient_enhance']
    })
  },
  {
    patterns: [
      /make.*calmer/i,
      /more.*relaxed/i,
      /softer/i,
      /less.*intense/i
    ],
    action_type: 'compression',
    target_hint: 'master',
    param_extractor: () => ({
      ratio: 2,
      attack: 30,
      release: 200,
      threshold: -18,
      additional: ['high_cut', 'smooth']
    })
  },

  // EQ Adjustments
  {
    patterns: [
      /more.*bass/i,
      /boost.*low/i,
      /bigger.*bottom/i,
      /heavier/i
    ],
    action_type: 'eq',
    target_hint: 'bass,master',
    param_extractor: () => ({
      low_shelf: { freq: 100, gain: 4 },
      sub_boost: { freq: 60, gain: 3, q: 1.5 }
    })
  },
  {
    patterns: [
      /more.*bright/i,
      /add.*air/i,
      /crisper/i,
      /more.*presence/i
    ],
    action_type: 'eq',
    target_hint: 'vocals,master',
    param_extractor: () => ({
      high_shelf: { freq: 8000, gain: 3 },
      presence: { freq: 3000, gain: 2, q: 2 }
    })
  },
  {
    patterns: [
      /less.*muddy/i,
      /cleaner/i,
      /cut.*mud/i,
      /clearer/i
    ],
    action_type: 'eq',
    target_hint: 'master',
    param_extractor: () => ({
      low_cut: { freq: 80, slope: 12 },
      mud_cut: { freq: 250, gain: -3, q: 2 }
    })
  },

  // Spatial Effects
  {
    patterns: [
      /more.*reverb/i,
      /bigger.*space/i,
      /add.*room/i,
      /more.*atmospheric/i
    ],
    action_type: 'reverb',
    target_hint: 'vocals,melody',
    param_extractor: (match, instruction) => {
      const size = instruction.includes('hall') ? 'hall' :
                   instruction.includes('room') ? 'room' : 'plate';
      return {
        type: size,
        decay: size === 'hall' ? 3.5 : 1.5,
        mix: 0.3,
        predelay: 20
      };
    }
  },
  {
    patterns: [
      /drier/i,
      /less.*reverb/i,
      /more.*upfront/i,
      /closer/i
    ],
    action_type: 'reverb',
    target_hint: 'vocals,melody',
    param_extractor: () => ({
      mix: 0.1,
      decay: 0.5
    })
  },

  // Tempo/Time
  {
    patterns: [
      /faster/i,
      /speed.*up/i,
      /more.*tempo/i
    ],
    action_type: 'tempo',
    target_hint: 'project',
    param_extractor: (match, instruction) => {
      const percentMatch = instruction.match(/(\d+)%/);
      return {
        change_percent: percentMatch ? parseInt(percentMatch[1]) : 10
      };
    }
  },
  {
    patterns: [
      /slower/i,
      /slow.*down/i,
      /less.*tempo/i
    ],
    action_type: 'tempo',
    target_hint: 'project',
    param_extractor: (match, instruction) => {
      const percentMatch = instruction.match(/(\d+)%/);
      return {
        change_percent: -(percentMatch ? parseInt(percentMatch[1]) : 10)
      };
    }
  },

  // Volume
  {
    patterns: [
      /louder/i,
      /turn.*up/i,
      /boost/i
    ],
    action_type: 'volume',
    target_hint: 'context',
    param_extractor: (match, instruction) => {
      const dbMatch = instruction.match(/(\d+)\s*db/i);
      return {
        change_db: dbMatch ? parseInt(dbMatch[1]) : 3
      };
    }
  },
  {
    patterns: [
      /quieter/i,
      /turn.*down/i,
      /reduce/i,
      /lower/i
    ],
    action_type: 'volume',
    target_hint: 'context',
    param_extractor: (match, instruction) => {
      const dbMatch = instruction.match(/(\d+)\s*db/i);
      return {
        change_db: -(dbMatch ? parseInt(dbMatch[1]) : 3)
      };
    }
  },

  // Structure
  {
    patterns: [
      /add.*drop/i,
      /create.*drop/i,
      /needs.*drop/i
    ],
    action_type: 'add_element',
    target_hint: 'project',
    param_extractor: (match, instruction) => {
      const timeMatch = instruction.match(/at\s*(\d+):(\d+)/);
      return {
        element: 'drop',
        at: timeMatch ? parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]) : null,
        include: ['filter_sweep', 'buildup', 'impact']
      };
    }
  },
  {
    patterns: [
      /add.*buildup/i,
      /create.*tension/i,
      /build.*up/i
    ],
    action_type: 'add_element',
    target_hint: 'project',
    param_extractor: () => ({
      element: 'buildup',
      duration: 8,
      include: ['riser', 'snare_roll', 'filter']
    })
  },

  // Vocals
  {
    patterns: [
      /vocals.*flat/i,
      /add.*emotion/i,
      /more.*feeling/i
    ],
    action_type: 'pitch',
    target_hint: 'vocals',
    param_extractor: () => ({
      vibrato: { rate: 5, depth: 15 },
      pitch_variation: 10,
      dynamics_enhance: true
    })
  }
];

// ============================================================================
// AI COLLABORATOR ENGINE
// ============================================================================

export class AICollaboratorEngine {
  /**
   * Process a natural language instruction
   */
  async process(request: CollaboratorRequest): Promise<CollaboratorResponse> {
    const { instruction, context, mode, confidence_threshold } = request;

    // Parse the instruction
    const parsed = this.parseInstruction(instruction, context);

    if (!parsed.success) {
      return {
        success: false,
        interpretation: 'Could not understand the instruction',
        confidence: 0,
        actions: [],
        error: parsed.error
      };
    }

    // Build response
    const response: CollaboratorResponse = {
      success: true,
      interpretation: parsed.interpretation!,
      confidence: parsed.confidence!,
      actions: parsed.actions!,
      preview_description: this.generatePreviewDescription(parsed.actions!),
      applied: false
    };

    // Auto-apply if confidence is high enough and mode is 'apply'
    if (mode === 'apply' && parsed.confidence! >= (confidence_threshold || 0.8)) {
      response.applied = true;
    }

    return response;
  }

  /**
   * Parse instruction and generate actions
   */
  private parseInstruction(instruction: string, context: ProjectContext): {
    success: boolean;
    interpretation?: string;
    confidence?: number;
    actions?: CollaboratorAction[];
    error?: string;
  } {
    // Find matching pattern
    for (const pattern of INSTRUCTION_PATTERNS) {
      for (const regex of pattern.patterns) {
        const match = instruction.match(regex);
        if (match) {
          const params = pattern.param_extractor(match, instruction);
          const targets = this.resolveTargets(pattern.target_hint, context, instruction);

          const actions: CollaboratorAction[] = targets.map(target => ({
            type: pattern.action_type,
            target,
            operation: this.getOperationName(pattern.action_type),
            params,
            description: this.describeAction(pattern.action_type, target, params)
          }));

          return {
            success: true,
            interpretation: this.buildInterpretation(instruction, pattern.action_type, targets),
            confidence: this.calculateConfidence(match, instruction, context),
            actions
          };
        }
      }
    }

    // Try generic interpretation
    return this.tryGenericInterpretation(instruction, context);
  }

  /**
   * Resolve target tracks from hint
   */
  private resolveTargets(hint: string, context: ProjectContext, instruction: string): string[] {
    const hints = hint.split(',').map(h => h.trim());

    // Check if instruction mentions specific track
    const trackMention = context.tracks?.find(t =>
      instruction.toLowerCase().includes(t.name.toLowerCase()) ||
      instruction.toLowerCase().includes(t.type.toLowerCase())
    );

    if (trackMention) {
      return [trackMention.id];
    }

    // Use hints
    if (hints.includes('context') && context.tracks) {
      // Use context to pick most relevant track
      return [context.tracks[0]?.id || 'master'];
    }

    if (hints.includes('master')) {
      return ['master'];
    }

    if (hints.includes('project')) {
      return ['project'];
    }

    // Match track types
    const matchedTracks = context.tracks?.filter(t =>
      hints.some(h => t.type.includes(h) || t.name.toLowerCase().includes(h))
    ) || [];

    return matchedTracks.length > 0
      ? matchedTracks.map(t => t.id)
      : ['master'];
  }

  /**
   * Get human-readable operation name
   */
  private getOperationName(actionType: ActionType): string {
    const operations: Record<ActionType, string> = {
      eq: 'EQ adjustment',
      compression: 'Compression',
      reverb: 'Reverb',
      delay: 'Delay',
      volume: 'Volume change',
      pan: 'Pan adjustment',
      tempo: 'Tempo change',
      pitch: 'Pitch processing',
      add_element: 'Add element',
      remove_element: 'Remove element',
      rearrange: 'Rearrange',
      transition: 'Add transition',
      filter: 'Filter',
      generate: 'Generate new content'
    };
    return operations[actionType] || actionType;
  }

  /**
   * Describe an action in plain language
   */
  private describeAction(type: ActionType, target: string, params: Record<string, any>): string {
    switch (type) {
      case 'eq':
        if (params.low_shelf) return `Boost low frequencies on ${target}`;
        if (params.high_shelf) return `Add brightness to ${target}`;
        if (params.mud_cut) return `Clean up muddy frequencies on ${target}`;
        return `Apply EQ to ${target}`;

      case 'compression':
        if (params.additional?.includes('transient_enhance')) {
          return `Add punch and energy to ${target}`;
        }
        return `Apply compression to ${target}`;

      case 'reverb':
        if (params.mix > 0.2) return `Add spacious reverb to ${target}`;
        return `Adjust reverb on ${target}`;

      case 'volume':
        const direction = params.change_db > 0 ? 'Increase' : 'Decrease';
        return `${direction} volume of ${target} by ${Math.abs(params.change_db)}dB`;

      case 'tempo':
        const tempoDir = params.change_percent > 0 ? 'Speed up' : 'Slow down';
        return `${tempoDir} by ${Math.abs(params.change_percent)}%`;

      case 'add_element':
        return `Add ${params.element} to the arrangement`;

      default:
        return `Apply ${type} to ${target}`;
    }
  }

  /**
   * Build interpretation string
   */
  private buildInterpretation(instruction: string, actionType: ActionType, targets: string[]): string {
    const targetStr = targets.length > 1
      ? `${targets.slice(0, -1).join(', ')} and ${targets[targets.length - 1]}`
      : targets[0];

    return `Understood: Apply ${actionType} adjustments to ${targetStr}`;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(match: RegExpMatchArray, instruction: string, context: ProjectContext): number {
    let confidence = 0.7; // Base confidence for pattern match

    // Boost if instruction is short and clear
    if (instruction.split(' ').length <= 5) confidence += 0.1;

    // Boost if we have good context
    if (context.tracks && context.tracks.length > 0) confidence += 0.1;
    if (context.bpm) confidence += 0.05;
    if (context.genre) confidence += 0.05;

    return Math.min(confidence, 0.95);
  }

  /**
   * Try to interpret instruction generically
   */
  private tryGenericInterpretation(instruction: string, context: ProjectContext): {
    success: boolean;
    interpretation?: string;
    confidence?: number;
    actions?: CollaboratorAction[];
    error?: string;
  } {
    // Check for generic volume/intensity words
    const intensityUp = /more|bigger|louder|stronger|better|improve/i.test(instruction);
    const intensityDown = /less|smaller|quieter|weaker|reduce/i.test(instruction);

    if (intensityUp || intensityDown) {
      return {
        success: true,
        interpretation: `Understood: Generally ${intensityUp ? 'enhance' : 'reduce'} the mix`,
        confidence: 0.5,
        actions: [{
          type: 'compression',
          target: 'master',
          operation: 'Master processing',
          params: intensityUp
            ? { ratio: 2, makeup_gain: 2 }
            : { ratio: 1.5, makeup_gain: -2 },
          description: intensityUp
            ? 'Apply gentle enhancement to master'
            : 'Apply gentle reduction to master'
        }]
      };
    }

    return {
      success: false,
      error: 'Could not understand instruction. Try being more specific, e.g., "make the drums more punchy" or "add reverb to vocals"'
    };
  }

  /**
   * Generate preview description
   */
  private generatePreviewDescription(actions: CollaboratorAction[]): string {
    if (actions.length === 0) return 'No changes to apply';
    if (actions.length === 1) return actions[0].description;

    return `Will apply ${actions.length} changes:\n` +
      actions.map((a, i) => `${i + 1}. ${a.description}`).join('\n');
  }

  /**
   * Get suggested instructions based on context
   */
  getSuggestions(context: ProjectContext): string[] {
    const suggestions: string[] = [];

    if (context.type === 'music') {
      suggestions.push(
        'Make the chorus more energetic',
        'Add more bass to the drop',
        'Make the vocals more present',
        'Add reverb to the snare',
        'Create a build-up before the drop',
        'Make it sound more professional'
      );
    }

    if (context.type === 'video') {
      suggestions.push(
        'Make the transitions smoother',
        'Add a cinematic color grade',
        'Speed up the intro',
        'Add text overlay',
        'Sync to the beat'
      );
    }

    return suggestions;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const collaborator = new AICollaboratorEngine();

export default {
  AICollaboratorEngine,
  collaborator
};

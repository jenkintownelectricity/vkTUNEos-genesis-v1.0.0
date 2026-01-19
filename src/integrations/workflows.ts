/**
 * vkTUNEos Workflow Engine
 * Text-to-Music, Lyrics-to-Song, MIDI-to-Vocal pipelines
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { v4 as uuidv4 } from 'uuid';
import { trackResourceUsage } from '../core/resources.js';
import { Suno, Udio, KitsAI, ElevenLabs, LALALAI, LANDR } from './providers.js';

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

export type WorkflowType = 
  | 'text_to_music'
  | 'lyrics_to_song'
  | 'midi_to_vocal'
  | 'audio_extension'
  | 'style_transfer'
  | 'remix'
  | 'stem_to_master';

export type WorkflowStatus = 
  | 'pending'
  | 'running'
  | 'step_complete'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowStep {
  id: string;
  name: string;
  provider: string;
  status: WorkflowStatus;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
}

export interface Workflow {
  id: string;
  tenant_id: string;
  type: WorkflowType;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  total_duration_ms?: number;
}

// In-memory workflow store (would use database in production)
const workflowStore = new Map<string, Workflow>();

// ============================================================================
// WORKFLOW DEFINITIONS
// ============================================================================

export interface TextToMusicInput {
  prompt: string;
  duration_seconds?: number;
  genre?: string;
  mood?: string;
  provider?: 'Suno' | 'Udio';
  master?: boolean;
}

export interface LyricsToSongInput {
  lyrics: string;
  voice_id?: string;
  genre?: string;
  mood?: string;
  tempo?: 'slow' | 'medium' | 'fast';
  create_voice?: {
    name: string;
    audio_url: string;
    consent_verified: boolean;
  };
}

export interface MidiToVocalInput {
  midi_url: string;
  lyrics: string;
  voice_id: string;
  language?: string;
}

export interface RemixInput {
  audio_url: string;
  style: string;
  preserve_vocals?: boolean;
  tempo_change?: number; // percentage
}

// ============================================================================
// WORKFLOW ENGINE
// ============================================================================

export class WorkflowEngine {
  /**
   * Create and execute a Text-to-Music workflow
   */
  static async textToMusic(tenant_id: string, input: TextToMusicInput): Promise<Workflow> {
    const workflow = createWorkflow(tenant_id, 'text_to_music', input);
    
    // Step 1: Generate Music
    const generateStep = addStep(workflow, 'generate_music', input.provider || 'Suno');
    
    try {
      startStep(generateStep);
      
      const provider = input.provider === 'Udio' ? Udio : Suno;
      const result = await provider.generate({
        tenant_id,
        prompt: input.prompt,
        duration_seconds: input.duration_seconds || 120,
        genre: input.genre,
        mood: input.mood,
        instrumental: false
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      completeStep(generateStep, result.data);
      
      // Step 2: Master (optional)
      if (input.master) {
        const masterStep = addStep(workflow, 'master_audio', 'LANDR');
        startStep(masterStep);
        
        const masterResult = await LANDR.master({
          tenant_id,
          audio_url: result.data!.audio_url,
          style: 'balanced'
        });
        
        if (!masterResult.success) {
          throw new Error(masterResult.error);
        }
        
        completeStep(masterStep, masterResult.data);
        workflow.output = masterResult.data;
      } else {
        workflow.output = result.data;
      }
      
      completeWorkflow(workflow);
      
    } catch (err) {
      failWorkflow(workflow, (err as Error).message);
    }
    
    return workflow;
  }
  
  /**
   * Create and execute a Lyrics-to-Song workflow
   */
  static async lyricsToSong(tenant_id: string, input: LyricsToSongInput): Promise<Workflow> {
    const workflow = createWorkflow(tenant_id, 'lyrics_to_song', input);
    
    try {
      let voice_id = input.voice_id;
      
      // Step 1: Create Voice (if needed)
      if (input.create_voice) {
        const cloneStep = addStep(workflow, 'create_voice', 'ElevenLabs');
        startStep(cloneStep);
        
        const cloneResult = await ElevenLabs.createVoiceClone({
          tenant_id,
          name: input.create_voice.name,
          audio_url: input.create_voice.audio_url,
          consent_verified: input.create_voice.consent_verified
        });
        
        if (!cloneResult.success) {
          throw new Error(cloneResult.error);
        }
        
        voice_id = cloneResult.data!.voice_id;
        completeStep(cloneStep, cloneResult.data);
      }
      
      // Step 2: Generate Backing Track
      const backingStep = addStep(workflow, 'generate_backing', 'Suno');
      startStep(backingStep);
      
      const backingResult = await Suno.generate({
        tenant_id,
        prompt: `${input.genre || 'Pop'} instrumental backing track, ${input.mood || 'upbeat'}, ${input.tempo || 'medium'} tempo`,
        instrumental: true,
        duration_seconds: estimateDuration(input.lyrics)
      });
      
      if (!backingResult.success) {
        throw new Error(backingResult.error);
      }
      
      completeStep(backingStep, backingResult.data);
      
      // Step 3: Synthesize Vocals
      if (voice_id) {
        const vocalStep = addStep(workflow, 'synthesize_vocals', 'ElevenLabs');
        startStep(vocalStep);
        
        const vocalResult = await ElevenLabs.synthesize({
          tenant_id,
          voice_id,
          text: input.lyrics
        });
        
        if (!vocalResult.success) {
          throw new Error(vocalResult.error);
        }
        
        completeStep(vocalStep, vocalResult.data);
        
        // Final output combines backing + vocals (stub - would use audio mixer)
        workflow.output = {
          backing_track_url: backingResult.data!.audio_url,
          vocal_track_url: vocalResult.data!.audio_url,
          duration_seconds: backingResult.data!.duration_seconds,
          message: 'Tracks generated. Mix in your DAW for final result.'
        };
      } else {
        workflow.output = backingResult.data;
      }
      
      completeWorkflow(workflow);
      
    } catch (err) {
      failWorkflow(workflow, (err as Error).message);
    }
    
    return workflow;
  }
  
  /**
   * Create and execute a Remix workflow
   */
  static async remix(tenant_id: string, input: RemixInput): Promise<Workflow> {
    const workflow = createWorkflow(tenant_id, 'remix', input);
    
    try {
      // Step 1: Separate Stems
      const separateStep = addStep(workflow, 'separate_stems', 'LALAL.AI');
      startStep(separateStep);
      
      const stemResult = await LALALAI.separateStems({
        tenant_id,
        audio_url: input.audio_url,
        stem_count: input.preserve_vocals ? 4 : 2,
        output_format: 'wav'
      });
      
      if (!stemResult.success) {
        throw new Error(stemResult.error);
      }
      
      completeStep(separateStep, stemResult.data);
      
      // Step 2: Generate New Instrumental
      const generateStep = addStep(workflow, 'generate_remix_backing', 'Udio');
      startStep(generateStep);
      
      const genResult = await Udio.generate({
        tenant_id,
        prompt: `${input.style} remix instrumental`,
        instrumental: true,
        duration_seconds: stemResult.data!.original_duration_seconds
      });
      
      if (!genResult.success) {
        throw new Error(genResult.error);
      }
      
      completeStep(generateStep, genResult.data);
      
      // Step 3: Master
      const masterStep = addStep(workflow, 'master_remix', 'LANDR');
      startStep(masterStep);
      
      const masterResult = await LANDR.master({
        tenant_id,
        audio_url: genResult.data!.audio_url,
        style: 'punchy'
      });
      
      if (!masterResult.success) {
        throw new Error(masterResult.error);
      }
      
      completeStep(masterStep, masterResult.data);
      
      workflow.output = {
        original_stems: stemResult.data!.stems,
        remix_instrumental: genResult.data!.audio_url,
        mastered_remix: masterResult.data!.audio_url,
        message: 'Remix components ready. Combine vocals with new instrumental in your DAW.'
      };
      
      completeWorkflow(workflow);
      
    } catch (err) {
      failWorkflow(workflow, (err as Error).message);
    }
    
    return workflow;
  }
  
  /**
   * Get workflow by ID
   */
  static getWorkflow(workflow_id: string): Workflow | null {
    return workflowStore.get(workflow_id) || null;
  }
  
  /**
   * List workflows for a tenant
   */
  static listWorkflows(tenant_id: string, limit: number = 20): Workflow[] {
    return Array.from(workflowStore.values())
      .filter(w => w.tenant_id === tenant_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }
  
  /**
   * Cancel a running workflow
   */
  static cancelWorkflow(workflow_id: string): boolean {
    const workflow = workflowStore.get(workflow_id);
    if (!workflow || workflow.status === 'completed' || workflow.status === 'failed') {
      return false;
    }
    
    workflow.status = 'cancelled';
    workflow.updated_at = new Date().toISOString();
    workflowStore.set(workflow_id, workflow);
    return true;
  }
}

// ============================================================================
// WORKFLOW HELPERS
// ============================================================================

function createWorkflow(tenant_id: string, type: WorkflowType, input: Record<string, any>): Workflow {
  const workflow: Workflow = {
    id: uuidv4(),
    tenant_id,
    type,
    status: 'running',
    steps: [],
    input,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  workflowStore.set(workflow.id, workflow);
  return workflow;
}

function addStep(workflow: Workflow, name: string, provider: string): WorkflowStep {
  const step: WorkflowStep = {
    id: uuidv4(),
    name,
    provider,
    status: 'pending',
    input: {}
  };
  
  workflow.steps.push(step);
  workflow.updated_at = new Date().toISOString();
  workflowStore.set(workflow.id, workflow);
  
  return step;
}

function startStep(step: WorkflowStep): void {
  step.status = 'running';
  step.started_at = new Date().toISOString();
}

function completeStep(step: WorkflowStep, output: any): void {
  step.status = 'step_complete';
  step.output = output;
  step.completed_at = new Date().toISOString();
  step.duration_ms = new Date(step.completed_at).getTime() - new Date(step.started_at!).getTime();
}

function completeWorkflow(workflow: Workflow): void {
  workflow.status = 'completed';
  workflow.completed_at = new Date().toISOString();
  workflow.updated_at = workflow.completed_at;
  workflow.total_duration_ms = new Date(workflow.completed_at).getTime() - new Date(workflow.created_at).getTime();
  workflowStore.set(workflow.id, workflow);
}

function failWorkflow(workflow: Workflow, error: string): void {
  workflow.status = 'failed';
  workflow.error = error;
  workflow.updated_at = new Date().toISOString();
  
  // Mark current running step as failed
  const runningStep = workflow.steps.find(s => s.status === 'running');
  if (runningStep) {
    runningStep.status = 'failed';
    runningStep.error = error;
    runningStep.completed_at = new Date().toISOString();
  }
  
  workflowStore.set(workflow.id, workflow);
}

function estimateDuration(lyrics: string): number {
  // Rough estimate: ~3 words per second for singing
  const words = lyrics.split(/\s+/).length;
  return Math.max(60, Math.min(300, Math.ceil(words / 3)));
}

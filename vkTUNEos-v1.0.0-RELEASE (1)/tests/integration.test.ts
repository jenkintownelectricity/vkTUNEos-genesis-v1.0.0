/**
 * vkTUNEos Integration Tests
 * Tests for Session 2 features
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { initDatabase } from '../src/db/database.js';
import { initResourceTracking } from '../src/core/resources.js';
import {
  TIER_LIMITS,
  TIER_FEATURES,
  getTierLimits,
  getTierFeatures,
  isFeatureAvailable,
  isWithinLimit,
  getUpgradePath
} from '../src/core/licensing.js';
import { 
  KitsAI, 
  ElevenLabs, 
  LALALAI, 
  Suno, 
  Udio, 
  LANDR 
} from '../src/integrations/providers.js';
import { WorkflowEngine } from '../src/integrations/workflows.js';

// Initialize database before tests
beforeAll(async () => {
  await initDatabase();
  initResourceTracking();
});

// ============================================================================
// LICENSING TESTS
// ============================================================================

describe('License Tier System', () => {
  describe('Tier Limits', () => {
    it('should have correct free tier limits', () => {
      const limits = getTierLimits('free');
      expect(limits.api_calls_per_day).toBe(100);
      expect(limits.voice_clone_slots).toBe(1);
      expect(limits.stem_count).toBe(2);
      expect(limits.music_length_seconds).toBe(120);
    });

    it('should have correct premium tier limits', () => {
      const limits = getTierLimits('premium');
      expect(limits.api_calls_per_day).toBe(5000);
      expect(limits.voice_clone_slots).toBe(10);
      expect(limits.stem_count).toBe(10);
      expect(limits.music_length_seconds).toBe(1800);
    });

    it('should have unlimited enterprise limits', () => {
      const limits = getTierLimits('enterprise');
      expect(limits.api_calls_per_day).toBe(-1);
      expect(limits.voice_clone_slots).toBe(-1);
      expect(limits.music_length_seconds).toBe(-1);
    });
  });

  describe('Feature Flags', () => {
    it('should restrict workflow_engine to premium+', () => {
      expect(isFeatureAvailable('free', 'workflow_engine')).toBe(false);
      expect(isFeatureAvailable('premium', 'workflow_engine')).toBe(true);
      expect(isFeatureAvailable('enterprise', 'workflow_engine')).toBe(true);
    });

    it('should restrict sso_saml to enterprise', () => {
      expect(isFeatureAvailable('free', 'sso_saml')).toBe(false);
      expect(isFeatureAvailable('premium', 'sso_saml')).toBe(false);
      expect(isFeatureAvailable('enterprise', 'sso_saml')).toBe(true);
    });

    it('should allow voice_cloning for all tiers', () => {
      expect(isFeatureAvailable('free', 'voice_cloning')).toBe(true);
      expect(isFeatureAvailable('premium', 'voice_cloning')).toBe(true);
      expect(isFeatureAvailable('enterprise', 'voice_cloning')).toBe(true);
    });
  });

  describe('Limit Checking', () => {
    it('should check voice clone limits', () => {
      expect(isWithinLimit('free', 'voice_clone_slots', 1)).toBe(true);
      expect(isWithinLimit('free', 'voice_clone_slots', 2)).toBe(false);
      expect(isWithinLimit('premium', 'voice_clone_slots', 10)).toBe(true);
    });

    it('should handle unlimited (-1) values', () => {
      expect(isWithinLimit('enterprise', 'api_calls_per_day', 1000000)).toBe(true);
    });
  });

  describe('Upgrade Path', () => {
    it('should return correct upgrade path', () => {
      expect(getUpgradePath('free')).toBe('premium');
      expect(getUpgradePath('premium')).toBe('enterprise');
      expect(getUpgradePath('enterprise')).toBeNull();
    });
  });
});

// ============================================================================
// INTEGRATION STUB TESTS
// ============================================================================

describe('Integration Providers', () => {
  const testTenantId = 'test-tenant-123';

  describe('Voice Cloning - KitsAI', () => {
    it('should create voice clone with consent', async () => {
      const result = await KitsAI.createVoiceClone({
        tenant_id: testTenantId,
        name: 'Test Voice',
        audio_url: 'https://example.com/audio.mp3',
        consent_verified: true
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.voice_id).toMatch(/^kits_/);
      expect(result.data?.status).toBe('ready');
      expect(result.provider).toBe('KitsAI');
    });

    it('should fail without consent', async () => {
      const result = await KitsAI.createVoiceClone({
        tenant_id: testTenantId,
        name: 'Test Voice',
        audio_url: 'https://example.com/audio.mp3',
        consent_verified: false
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('consent');
    });
  });

  describe('Voice Cloning - ElevenLabs', () => {
    it('should create voice clone with multilingual support', async () => {
      const result = await ElevenLabs.createVoiceClone({
        tenant_id: testTenantId,
        name: 'Test Voice',
        audio_url: 'https://example.com/audio.mp3',
        consent_verified: true
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.voice_id).toMatch(/^eleven_/);
      expect(result.data?.languages.length).toBeGreaterThan(10);
    });
  });

  describe('Stem Separation - LALAL.AI', () => {
    it('should separate stems', async () => {
      const result = await LALALAI.separateStems({
        tenant_id: testTenantId,
        audio_url: 'https://example.com/song.mp3',
        stem_count: 4,
        output_format: 'wav'
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.stems).toHaveLength(4);
      expect(result.data?.stems[0].name).toBe('Vocals');
      expect(result.provider).toBe('LALAL.AI');
    });
  });

  describe('Music Generation - Suno', () => {
    it('should generate music from prompt', async () => {
      const result = await Suno.generate({
        tenant_id: testTenantId,
        prompt: 'Upbeat pop song about summer',
        duration_seconds: 60,
        genre: 'Pop'
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.duration_seconds).toBe(60);
      expect(result.data?.audio_url).toContain('suno.ai');
      expect(result.data?.bpm).toBeGreaterThan(0);
    });
  });

  describe('Music Generation - Udio', () => {
    it('should generate music with style transfer', async () => {
      const result = await Udio.generate({
        tenant_id: testTenantId,
        prompt: 'Electronic dance track',
        duration_seconds: 90
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.duration_seconds).toBe(90);
      expect(result.data?.audio_url).toContain('udio.com');
    }, 15000);
  });

  describe('Audio Production - LANDR', () => {
    it('should master audio', async () => {
      const result = await LANDR.master({
        tenant_id: testTenantId,
        audio_url: 'https://example.com/mix.wav',
        style: 'punchy',
        loudness_target: -14
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.loudness_lufs).toBe(-14);
      expect(result.data?.audio_url).toContain('landr.com');
    });
  });
});

// ============================================================================
// WORKFLOW TESTS
// ============================================================================

describe('Workflow Engine', () => {
  const testTenantId = 'test-workflow-tenant';

  describe('Text to Music Workflow', () => {
    it('should execute text-to-music workflow', async () => {
      const workflow = await WorkflowEngine.textToMusic(testTenantId, {
        prompt: 'Happy birthday song',
        duration_seconds: 60,
        genre: 'Pop'
      });
      
      expect(workflow.status).toBe('completed');
      expect(workflow.type).toBe('text_to_music');
      expect(workflow.steps.length).toBeGreaterThan(0);
      expect(workflow.output).toBeDefined();
    }, 15000);

    it('should include mastering step when requested', async () => {
      const workflow = await WorkflowEngine.textToMusic(testTenantId, {
        prompt: 'Rock anthem',
        master: true
      });
      
      expect(workflow.steps.length).toBe(2);
      expect(workflow.steps[1].name).toBe('master_audio');
    }, 15000);
  });

  describe('Remix Workflow', () => {
    it('should execute remix workflow', async () => {
      const workflow = await WorkflowEngine.remix(testTenantId, {
        audio_url: 'https://example.com/original.mp3',
        style: 'EDM remix'
      });
      
      expect(workflow.status).toBe('completed');
      expect(workflow.type).toBe('remix');
      expect(workflow.steps.length).toBe(3);
      expect(workflow.output?.original_stems).toBeDefined();
      expect(workflow.output?.mastered_remix).toBeDefined();
    }, 20000);
  });

  describe('Workflow Management', () => {
    it('should list workflows for tenant', async () => {
      // Create a few workflows
      await WorkflowEngine.textToMusic(testTenantId, { prompt: 'Test 1' });
      await WorkflowEngine.textToMusic(testTenantId, { prompt: 'Test 2' });
      
      const workflows = WorkflowEngine.listWorkflows(testTenantId);
      expect(workflows.length).toBeGreaterThanOrEqual(2);
    }, 20000);

    it('should get workflow by ID', async () => {
      const created = await WorkflowEngine.textToMusic(testTenantId, { 
        prompt: 'Findable workflow' 
      });
      
      const found = WorkflowEngine.getWorkflow(created.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });
  });
});

// ============================================================================
// RATE LIMIT TESTS (Unit level)
// ============================================================================

describe('Rate Limiting', () => {
  it('should have different limits per tier', () => {
    expect(TIER_LIMITS.free.requests_per_minute).toBe(5);
    expect(TIER_LIMITS.premium.requests_per_minute).toBe(30);
    expect(TIER_LIMITS.enterprise.requests_per_minute).toBe(100);
  });
});

/**
 * vkTUNEos Test Suite
 * Unit tests for schema and validation
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { describe, it, expect } from 'vitest';
import {
  CategoryValues,
  DomainValues,
  AttributeValues,
  StateValues,
  parseCoordinate,
  coordinateToString,
  validateCoordinate,
  MusicKernelSchema
} from '../src/core/schema.js';
import {
  validateFull,
  MusicKernelRules
} from '../src/core/validation.js';

// ============================================================================
// SCHEMA TESTS
// ============================================================================

describe('Music Kernel Schema', () => {
  describe('Axis Definitions', () => {
    it('should have 6 categories', () => {
      expect(CategoryValues).toHaveLength(6);
      expect(CategoryValues).toContain('VoiceCloning');
      expect(CategoryValues).toContain('StemSeparation');
      expect(CategoryValues).toContain('MusicGeneration');
      expect(CategoryValues).toContain('VocalProcessing');
      expect(CategoryValues).toContain('AudioProduction');
      expect(CategoryValues).toContain('Licensing');
    });

    it('should have 6 domains', () => {
      expect(DomainValues).toHaveLength(6);
      expect(DomainValues).toContain('Model');
      expect(DomainValues).toContain('Tool');
      expect(DomainValues).toContain('Workflow');
      expect(DomainValues).toContain('Asset');
      expect(DomainValues).toContain('Rights');
      expect(DomainValues).toContain('Quality');
    });

    it('should have 10 attributes', () => {
      expect(AttributeValues).toHaveLength(10);
      expect(AttributeValues).toContain('Fidelity');
      expect(AttributeValues).toContain('Latency');
      expect(AttributeValues).toContain('Languages');
      expect(AttributeValues).toContain('Formats');
      expect(AttributeValues).toContain('Pricing');
      expect(AttributeValues).toContain('API');
      expect(AttributeValues).toContain('Emotion');
      expect(AttributeValues).toContain('Range');
      expect(AttributeValues).toContain('Stems');
      expect(AttributeValues).toContain('Commercial');
    });

    it('should have 5 states', () => {
      expect(StateValues).toHaveLength(5);
      expect(StateValues).toContain('Draft');
      expect(StateValues).toContain('Proposed');
      expect(StateValues).toContain('Validated');
      expect(StateValues).toContain('Deprecated');
      expect(StateValues).toContain('Archived');
    });

    it('should have depth limit of 5', () => {
      expect(MusicKernelSchema.depth_limit).toBe(5);
    });
  });

  describe('Coordinate Parsing', () => {
    it('should parse valid coordinate string', () => {
      const coord = parseCoordinate('Music.VoiceCloning.Model.KitsAI.Fidelity.Validated');
      expect(coord).not.toBeNull();
      expect(coord?.L1_category).toBe('VoiceCloning');
      expect(coord?.L2_domain).toBe('Model');
      expect(coord?.L3_entity).toBe('KitsAI');
      expect(coord?.L4_attribute).toBe('Fidelity');
      expect(coord?.L5_state).toBe('Validated');
    });

    it('should return null for invalid coordinate string', () => {
      expect(parseCoordinate('Invalid.Coordinate')).toBeNull();
      expect(parseCoordinate('Music.Invalid.Model.Test.Fidelity.Validated')).toBeNull();
      expect(parseCoordinate('')).toBeNull();
    });

    it('should reject coordinates without Music prefix', () => {
      expect(parseCoordinate('Audio.VoiceCloning.Model.KitsAI.Fidelity.Validated')).toBeNull();
    });

    it('should reject coordinates with wrong depth', () => {
      expect(parseCoordinate('Music.VoiceCloning.Model.KitsAI.Fidelity')).toBeNull();
      expect(parseCoordinate('Music.VoiceCloning.Model.KitsAI.Fidelity.Validated.Extra')).toBeNull();
    });
  });

  describe('Coordinate String Conversion', () => {
    it('should convert coordinate object to string', () => {
      const coord = {
        L1_category: 'VoiceCloning' as const,
        L2_domain: 'Model' as const,
        L3_entity: 'KitsAI',
        L4_attribute: 'Fidelity' as const,
        L5_state: 'Validated' as const
      };
      
      expect(coordinateToString(coord)).toBe('Music.VoiceCloning.Model.KitsAI.Fidelity.Validated');
    });
  });

  describe('Coordinate Validation (VA Rules)', () => {
    it('should validate correct coordinate', () => {
      const coord = {
        L1_category: 'VoiceCloning' as const,
        L2_domain: 'Model' as const,
        L3_entity: 'KitsAI',
        L4_attribute: 'Fidelity' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateCoordinate(coord);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid entity pattern', () => {
      const coord = {
        L1_category: 'VoiceCloning' as const,
        L2_domain: 'Model' as const,
        L3_entity: 'kitsAI', // lowercase start
        L4_attribute: 'Fidelity' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateCoordinate(coord);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('VA.02'))).toBe(true);
    });

    it('should warn about inconsistent category/domain combinations', () => {
      const coord = {
        L1_category: 'StemSeparation' as const,
        L2_domain: 'Rights' as const,
        L3_entity: 'TestEntity',
        L4_attribute: 'Fidelity' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateCoordinate(coord);
      expect(result.warnings.some(w => w.includes('VA.05'))).toBe(true);
    });
  });
});

// ============================================================================
// VALIDATION RULES TESTS (MK.01 - MK.10)
// ============================================================================

describe('Music Kernel Validation Rules', () => {
  it('should have 10 validation rules', () => {
    expect(MusicKernelRules).toHaveLength(10);
  });

  describe('MK.01: Voice Clone Source Consent', () => {
    it('should require source_consent for voice clone models', () => {
      const coord = {
        L1_category: 'VoiceCloning' as const,
        L2_domain: 'Model' as const,
        L3_entity: 'TestVoice',
        L4_attribute: 'Fidelity' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateFull(coord, null, {});
      expect(result.all_errors.some(e => e.includes('MK.01'))).toBe(true);
    });

    it('should pass with source_consent flag', () => {
      const coord = {
        L1_category: 'VoiceCloning' as const,
        L2_domain: 'Model' as const,
        L3_entity: 'TestVoice',
        L4_attribute: 'Fidelity' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateFull(coord, null, { source_consent: true });
      expect(result.all_errors.filter(e => e.includes('MK.01'))).toHaveLength(0);
    });
  });

  describe('MK.02: Stem Separation Neural Network', () => {
    it('should require neural_network_model for stem separation models', () => {
      const coord = {
        L1_category: 'StemSeparation' as const,
        L2_domain: 'Model' as const,
        L3_entity: 'Phoenix',
        L4_attribute: 'Fidelity' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateFull(coord, null, {});
      expect(result.all_errors.some(e => e.includes('MK.02'))).toBe(true);
    });

    it('should pass with neural_network_model', () => {
      const coord = {
        L1_category: 'StemSeparation' as const,
        L2_domain: 'Model' as const,
        L3_entity: 'Phoenix',
        L4_attribute: 'Fidelity' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateFull(coord, null, { neural_network_model: 'Demucs v4' });
      expect(result.all_errors.filter(e => e.includes('MK.02'))).toHaveLength(0);
    });
  });

  describe('MK.03: Music Generation Training Data', () => {
    it('should require training_data_provenance for music generation models', () => {
      const coord = {
        L1_category: 'MusicGeneration' as const,
        L2_domain: 'Model' as const,
        L3_entity: 'SunoV5',
        L4_attribute: 'Fidelity' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateFull(coord, null, {});
      expect(result.all_errors.some(e => e.includes('MK.03'))).toBe(true);
    });
  });

  describe('MK.06: Emotion Parameters', () => {
    it('should reject emotion values outside 0-100 range', () => {
      const coord = {
        L1_category: 'VoiceCloning' as const,
        L2_domain: 'Model' as const,
        L3_entity: 'EmotiveVoice',
        L4_attribute: 'Emotion' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateFull(coord, 150, { source_consent: true });
      expect(result.all_errors.some(e => e.includes('MK.06'))).toBe(true);
    });

    it('should accept emotion values within 0-100 range', () => {
      const coord = {
        L1_category: 'VoiceCloning' as const,
        L2_domain: 'Model' as const,
        L3_entity: 'EmotiveVoice',
        L4_attribute: 'Emotion' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateFull(coord, 75, { source_consent: true });
      expect(result.all_errors.filter(e => e.includes('MK.06'))).toHaveLength(0);
    });
  });

  describe('MK.07: Language Codes', () => {
    it('should validate ISO 639-1 language codes', () => {
      const coord = {
        L1_category: 'VoiceCloning' as const,
        L2_domain: 'Tool' as const,
        L3_entity: 'ElevenLabs',
        L4_attribute: 'Languages' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateFull(coord, ['en', 'es', 'fr'], {});
      expect(result.all_errors.filter(e => e.includes('MK.07'))).toHaveLength(0);
    });

    it('should reject invalid language codes', () => {
      const coord = {
        L1_category: 'VoiceCloning' as const,
        L2_domain: 'Tool' as const,
        L3_entity: 'ElevenLabs',
        L4_attribute: 'Languages' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateFull(coord, ['en', 'invalid_lang'], {});
      expect(result.all_errors.some(e => e.includes('MK.07'))).toBe(true);
    });
  });

  describe('MK.09: Pricing Model', () => {
    it('should require pricing_model for Pricing attribute', () => {
      const coord = {
        L1_category: 'VoiceCloning' as const,
        L2_domain: 'Tool' as const,
        L3_entity: 'KitsAI',
        L4_attribute: 'Pricing' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateFull(coord, '$10-48/mo', {});
      expect(result.all_errors.some(e => e.includes('MK.09'))).toBe(true);
    });

    it('should accept valid pricing_model', () => {
      const coord = {
        L1_category: 'VoiceCloning' as const,
        L2_domain: 'Tool' as const,
        L3_entity: 'KitsAI',
        L4_attribute: 'Pricing' as const,
        L5_state: 'Validated' as const
      };
      
      const result = validateFull(coord, '$10-48/mo', { pricing_model: 'subscription', billing_period: 'monthly' });
      expect(result.all_errors.filter(e => e.includes('MK.09'))).toHaveLength(0);
    });
  });
});

// ============================================================================
// FULL COORDINATE TAXONOMY TESTS
// ============================================================================

describe('Coordinate Taxonomy Coverage', () => {
  const testCoordinates = [
    // VoiceCloning
    'Music.VoiceCloning.Model.InstantClone.Latency.Validated',
    'Music.VoiceCloning.Model.ProfessionalClone.Fidelity.Validated',
    'Music.VoiceCloning.Tool.KitsAI.Fidelity.Validated',
    'Music.VoiceCloning.Tool.ElevenLabs.Languages.Validated',
    
    // StemSeparation
    'Music.StemSeparation.Model.Phoenix.Fidelity.Validated',
    'Music.StemSeparation.Tool.LALALAI.Stems.Validated',
    'Music.StemSeparation.Asset.Vocals.Fidelity.Validated',
    
    // MusicGeneration
    'Music.MusicGeneration.Model.SunoV5.Fidelity.Validated',
    'Music.MusicGeneration.Tool.Suno.Pricing.Validated',
    'Music.MusicGeneration.Workflow.TextToMusic.Latency.Validated',
    
    // VocalProcessing
    'Music.VocalProcessing.Model.VoiceChanger.Fidelity.Validated',
    'Music.VocalProcessing.Tool.KitsAI.Fidelity.Validated',
    
    // AudioProduction
    'Music.AudioProduction.Model.AIMastering.Fidelity.Validated',
    'Music.AudioProduction.Tool.LANDR.Pricing.Validated',
    
    // Licensing
    'Music.Licensing.Rights.RoyaltyFree.Commercial.Validated',
    'Music.Licensing.Asset.VoiceModel.Commercial.Validated'
  ];

  testCoordinates.forEach(coordStr => {
    it(`should parse ${coordStr}`, () => {
      const coord = parseCoordinate(coordStr);
      expect(coord).not.toBeNull();
    });
  });
});

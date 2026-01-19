/**
 * vkTUNEos Validation Engine
 * Implements Music Kernel Validation Rules MK.01-MK.10
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { 
  Coordinate, 
  CoordinateRecord, 
  CategoryValues, 
  DomainValues, 
  AttributeValues,
  validateCoordinate,
  ValidationResult
} from './schema.js';

// ============================================================================
// VALIDATION RULE DEFINITIONS (Section 7 of L0 Command)
// ============================================================================

export interface ValidationRule {
  code: string;
  description: string;
  validate: (coord: Coordinate, value?: any, metadata?: Record<string, any>) => ValidationResult;
}

// MK.01: All voice clones MUST include source consent flag
const MK01: ValidationRule = {
  code: 'MK.01',
  description: 'All voice clones MUST include source consent flag',
  validate: (coord, value, metadata) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (coord.L1_category === 'VoiceCloning' && coord.L2_domain === 'Model') {
      if (!metadata?.source_consent) {
        errors.push('MK.01: Voice clone model requires source_consent flag in metadata');
      } else if (typeof metadata.source_consent !== 'boolean') {
        errors.push('MK.01: source_consent must be a boolean');
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
};

// MK.02: Stem separation MUST specify neural network model used
const MK02: ValidationRule = {
  code: 'MK.02',
  description: 'Stem separation MUST specify neural network model used',
  validate: (coord, value, metadata) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (coord.L1_category === 'StemSeparation' && coord.L2_domain === 'Model') {
      if (!metadata?.neural_network_model) {
        errors.push('MK.02: Stem separation model requires neural_network_model in metadata');
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
};

// MK.03: Generated music MUST declare training data provenance
const MK03: ValidationRule = {
  code: 'MK.03',
  description: 'Generated music MUST declare training data provenance',
  validate: (coord, value, metadata) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (coord.L1_category === 'MusicGeneration' && coord.L2_domain === 'Model') {
      if (!metadata?.training_data_provenance) {
        errors.push('MK.03: Music generation model requires training_data_provenance in metadata');
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
};

// MK.04: Commercial use MUST have Licensing.Rights coordinate
const MK04: ValidationRule = {
  code: 'MK.04',
  description: 'Commercial use MUST have Licensing.Rights coordinate',
  validate: (coord, value, metadata) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (coord.L4_attribute === 'Commercial') {
      if (coord.L1_category !== 'Licensing') {
        warnings.push('MK.04: Commercial attribute typically belongs under Licensing category');
      }
      if (!metadata?.licensing_coordinate) {
        warnings.push('MK.04: Commercial use should reference a Licensing.Rights coordinate');
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
};

// MK.05: API responses MUST include latency measurement
const MK05: ValidationRule = {
  code: 'MK.05',
  description: 'API responses MUST include latency measurement',
  validate: (coord, value, metadata) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (coord.L4_attribute === 'API') {
      if (metadata?.latency_ms === undefined) {
        warnings.push('MK.05: API attribute should include latency_ms measurement');
      } else if (typeof metadata.latency_ms !== 'number' || metadata.latency_ms < 0) {
        errors.push('MK.05: latency_ms must be a non-negative number');
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
};

// MK.06: Emotion parameters MUST be numeric (0-100 scale)
const MK06: ValidationRule = {
  code: 'MK.06',
  description: 'Emotion parameters MUST be numeric (0-100 scale)',
  validate: (coord, value, metadata) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (coord.L4_attribute === 'Emotion') {
      if (typeof value === 'number') {
        if (value < 0 || value > 100) {
          errors.push('MK.06: Emotion value must be between 0 and 100');
        }
      } else if (metadata?.emotion_value !== undefined) {
        if (typeof metadata.emotion_value !== 'number' || metadata.emotion_value < 0 || metadata.emotion_value > 100) {
          errors.push('MK.06: emotion_value must be a number between 0 and 100');
        }
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
};

// MK.07: Language codes MUST follow ISO 639-1
const ISO_639_1_CODES = new Set([
  'aa', 'ab', 'ae', 'af', 'ak', 'am', 'an', 'ar', 'as', 'av', 'ay', 'az',
  'ba', 'be', 'bg', 'bh', 'bi', 'bm', 'bn', 'bo', 'br', 'bs',
  'ca', 'ce', 'ch', 'co', 'cr', 'cs', 'cu', 'cv', 'cy',
  'da', 'de', 'dv', 'dz',
  'ee', 'el', 'en', 'eo', 'es', 'et', 'eu',
  'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy',
  'ga', 'gd', 'gl', 'gn', 'gu', 'gv',
  'ha', 'he', 'hi', 'ho', 'hr', 'ht', 'hu', 'hy', 'hz',
  'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'io', 'is', 'it', 'iu',
  'ja', 'jv',
  'ka', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky',
  'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv',
  'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my',
  'na', 'nb', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny',
  'oc', 'oj', 'om', 'or', 'os',
  'pa', 'pi', 'pl', 'ps', 'pt',
  'qu',
  'rm', 'rn', 'ro', 'ru', 'rw',
  'sa', 'sc', 'sd', 'se', 'sg', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw',
  'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty',
  'ug', 'uk', 'ur', 'uz',
  've', 'vi', 'vo',
  'wa', 'wo',
  'xh',
  'yi', 'yo',
  'za', 'zh', 'zu'
]);

const MK07: ValidationRule = {
  code: 'MK.07',
  description: 'Language codes MUST follow ISO 639-1',
  validate: (coord, value, metadata) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (coord.L4_attribute === 'Languages') {
      const languages = metadata?.languages || (Array.isArray(value) ? value : [value]);
      
      if (Array.isArray(languages)) {
        for (const lang of languages) {
          if (typeof lang === 'string' && !ISO_639_1_CODES.has(lang.toLowerCase())) {
            errors.push(`MK.07: "${lang}" is not a valid ISO 639-1 language code`);
          }
        }
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
};

// MK.08: Audio formats MUST specify bit depth and sample rate
const MK08: ValidationRule = {
  code: 'MK.08',
  description: 'Audio formats MUST specify bit depth and sample rate',
  validate: (coord, value, metadata) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (coord.L4_attribute === 'Formats') {
      if (!metadata?.bit_depth) {
        warnings.push('MK.08: Audio format should specify bit_depth (e.g., 16, 24, 32)');
      } else if (![8, 16, 24, 32].includes(metadata.bit_depth)) {
        warnings.push('MK.08: bit_depth should be 8, 16, 24, or 32');
      }
      
      if (!metadata?.sample_rate) {
        warnings.push('MK.08: Audio format should specify sample_rate (e.g., 44100, 48000)');
      } else if (![22050, 44100, 48000, 88200, 96000].includes(metadata.sample_rate)) {
        warnings.push('MK.08: Common sample rates are 22050, 44100, 48000, 88200, 96000 Hz');
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
};

// MK.09: Pricing MUST distinguish one-time vs subscription
const MK09: ValidationRule = {
  code: 'MK.09',
  description: 'Pricing MUST distinguish one-time vs subscription',
  validate: (coord, value, metadata) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (coord.L4_attribute === 'Pricing') {
      if (!metadata?.pricing_model) {
        errors.push('MK.09: Pricing requires pricing_model ("one-time" or "subscription")');
      } else if (!['one-time', 'subscription', 'usage', 'freemium'].includes(metadata.pricing_model)) {
        errors.push('MK.09: pricing_model must be "one-time", "subscription", "usage", or "freemium"');
      }
      
      if (metadata?.pricing_model === 'subscription' && !metadata?.billing_period) {
        warnings.push('MK.09: Subscription pricing should specify billing_period ("monthly" or "yearly")');
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
};

// MK.10: Quality scores MUST be reproducible benchmarks
const MK10: ValidationRule = {
  code: 'MK.10',
  description: 'Quality scores MUST be reproducible benchmarks',
  validate: (coord, value, metadata) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (coord.L4_attribute === 'Fidelity' && coord.L2_domain === 'Quality') {
      if (typeof value === 'number') {
        if (value < 0 || value > 10) {
          warnings.push('MK.10: Fidelity scores are typically on a 0-10 scale');
        }
      }
      
      if (!metadata?.benchmark_method) {
        warnings.push('MK.10: Quality scores should include benchmark_method for reproducibility');
      }
      
      if (!metadata?.benchmark_date) {
        warnings.push('MK.10: Quality scores should include benchmark_date');
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
};

// ============================================================================
// VALIDATION ENGINE
// ============================================================================

export const MusicKernelRules: ValidationRule[] = [
  MK01, MK02, MK03, MK04, MK05, MK06, MK07, MK08, MK09, MK10
];

export interface FullValidationResult {
  valid: boolean;
  coordinate_validation: ValidationResult;
  rule_validations: {
    rule: string;
    result: ValidationResult;
  }[];
  all_errors: string[];
  all_warnings: string[];
}

/**
 * Full validation of a coordinate with value and metadata
 * Runs both Vector Authority rules and Music Kernel rules
 */
export function validateFull(
  coord: Coordinate,
  value?: any,
  metadata?: Record<string, any>
): FullValidationResult {
  // First validate the coordinate structure
  const coordResult = validateCoordinate(coord);
  
  // Then run all Music Kernel rules
  const ruleResults = MusicKernelRules.map(rule => ({
    rule: rule.code,
    result: rule.validate(coord, value, metadata)
  }));
  
  // Aggregate all errors and warnings
  const allErrors = [
    ...coordResult.errors,
    ...ruleResults.flatMap(r => r.result.errors)
  ];
  
  const allWarnings = [
    ...coordResult.warnings,
    ...ruleResults.flatMap(r => r.result.warnings)
  ];
  
  return {
    valid: allErrors.length === 0,
    coordinate_validation: coordResult,
    rule_validations: ruleResults,
    all_errors: allErrors,
    all_warnings: allWarnings
  };
}

/**
 * Quick validation - only checks coordinate structure
 */
export function validateQuick(coord: Coordinate): boolean {
  return validateCoordinate(coord).valid;
}

/**
 * Get all applicable rules for a coordinate
 */
export function getApplicableRules(coord: Coordinate): ValidationRule[] {
  return MusicKernelRules.filter(rule => {
    const result = rule.validate(coord, undefined, undefined);
    // If the rule produces any output (errors or warnings), it's applicable
    return result.errors.length > 0 || result.warnings.length > 0;
  });
}

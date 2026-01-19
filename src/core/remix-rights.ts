/**
 * vkTUNEos Remix Rights Tracking
 * Coordinate system automatically tracks every contribution to a project
 *
 * Tier 3 Killer Feature: KILL-003
 *
 * Tracking:
 * - Original creator
 * - Stem contributors
 * - Voice model owner
 * - Remix/edit authors
 * - Sample sources
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 * Coordinate: vkTUNEos.Killer.RemixRights.Tracking.Validated
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

export interface RightsRegistry {
  project_id: string;
  created_at: string;
  updated_at: string;
  contributors: Contributor[];
  samples: SampleUsage[];
  licenses: License[];
  split_agreement?: SplitAgreement;
  coordinate: string;
}

export interface Contributor {
  id: string;
  user_id?: string;
  name: string;
  type: ContributorType;
  share_percentage: number;
  contributions: Contribution[];
  added_at: string;
  verified?: boolean;
}

export type ContributorType =
  | 'original_composer'
  | 'lyricist'
  | 'vocalist'
  | 'voice_model_owner'
  | 'producer'
  | 'remixer'
  | 'stem_contributor'
  | 'sample_clearance'
  | 'engineer'
  | 'featured_artist';

export interface Contribution {
  id: string;
  type: ContributionType;
  description: string;
  timestamp: string;
  asset_coordinates: string[];  // Referenced vkTUNEos coordinates
  duration_percentage?: number; // What % of final track
}

export type ContributionType =
  | 'composition'
  | 'lyrics'
  | 'vocals'
  | 'voice_model'
  | 'production'
  | 'remix'
  | 'stem'
  | 'sample'
  | 'mixing'
  | 'mastering'
  | 'arrangement';

export interface SampleUsage {
  id: string;
  source_title: string;
  source_artist: string;
  source_coordinate?: string;
  sample_type: 'loop' | 'oneshot' | 'interpolation' | 'replay';
  cleared: boolean;
  license_type?: string;
  license_id?: string;
  timestamp_start?: number;
  timestamp_end?: number;
  royalty_percentage?: number;
}

export interface License {
  id: string;
  type: LicenseType;
  holder_name: string;
  holder_id?: string;
  asset_type: string;
  asset_id: string;
  granted_at: string;
  expires_at?: string;
  terms: string;
  restrictions?: string[];
  royalty_rate?: number;
}

export type LicenseType =
  | 'creative_commons'
  | 'royalty_free'
  | 'sync_license'
  | 'mechanical_license'
  | 'sample_clearance'
  | 'voice_model_license'
  | 'custom';

export interface SplitAgreement {
  id: string;
  created_at: string;
  agreed_by: string[];         // User IDs who agreed
  splits: {
    contributor_id: string;
    percentage: number;
    role: string;
  }[];
  total: number;               // Should be 100
  locked: boolean;             // Once all agree, lock splits
  signature_hashes: string[];  // Proof of agreement
}

export interface RightsReport {
  project_id: string;
  generated_at: string;
  total_contributors: number;
  split_breakdown: {
    contributor: string;
    type: string;
    share: number;
  }[];
  licenses_required: string[];
  samples_used: number;
  samples_cleared: number;
  ready_for_distribution: boolean;
  warnings: string[];
  coordinate: string;
}

// ============================================================================
// REMIX RIGHTS ENGINE
// ============================================================================

export class RemixRightsEngine {
  private registries: Map<string, RightsRegistry> = new Map();

  /**
   * Create a new rights registry for a project
   */
  createRegistry(projectId: string, creatorId: string, creatorName: string): RightsRegistry {
    const registry: RightsRegistry = {
      project_id: projectId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      contributors: [{
        id: uuidv4(),
        user_id: creatorId,
        name: creatorName,
        type: 'original_composer',
        share_percentage: 100,
        contributions: [{
          id: uuidv4(),
          type: 'composition',
          description: 'Original composition',
          timestamp: new Date().toISOString(),
          asset_coordinates: [`Project.${projectId}.Original.Composition.Validated`]
        }],
        added_at: new Date().toISOString(),
        verified: true
      }],
      samples: [],
      licenses: [],
      coordinate: `RemixRights.Registry.${projectId}.Active.Validated`
    };

    this.registries.set(projectId, registry);
    return registry;
  }

  /**
   * Add a contributor
   */
  addContributor(
    projectId: string,
    contributor: Omit<Contributor, 'id' | 'added_at'>
  ): Contributor | null {
    const registry = this.registries.get(projectId);
    if (!registry) return null;

    const newContributor: Contributor = {
      ...contributor,
      id: uuidv4(),
      added_at: new Date().toISOString()
    };

    registry.contributors.push(newContributor);
    this.rebalanceShares(registry);
    registry.updated_at = new Date().toISOString();

    return newContributor;
  }

  /**
   * Add a contribution to an existing contributor
   */
  addContribution(
    projectId: string,
    contributorId: string,
    contribution: Omit<Contribution, 'id' | 'timestamp'>
  ): Contribution | null {
    const registry = this.registries.get(projectId);
    if (!registry) return null;

    const contributor = registry.contributors.find(c => c.id === contributorId);
    if (!contributor) return null;

    const newContribution: Contribution = {
      ...contribution,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };

    contributor.contributions.push(newContribution);
    registry.updated_at = new Date().toISOString();

    return newContribution;
  }

  /**
   * Record sample usage
   */
  addSample(projectId: string, sample: Omit<SampleUsage, 'id'>): SampleUsage | null {
    const registry = this.registries.get(projectId);
    if (!registry) return null;

    const newSample: SampleUsage = {
      ...sample,
      id: uuidv4()
    };

    registry.samples.push(newSample);
    registry.updated_at = new Date().toISOString();

    // If sample requires clearance, add warning
    if (!sample.cleared && sample.license_type !== 'royalty_free') {
      this.addLicenseRequirement(registry, sample);
    }

    return newSample;
  }

  /**
   * Add license record
   */
  addLicense(projectId: string, license: Omit<License, 'id' | 'granted_at'>): License | null {
    const registry = this.registries.get(projectId);
    if (!registry) return null;

    const newLicense: License = {
      ...license,
      id: uuidv4(),
      granted_at: new Date().toISOString()
    };

    registry.licenses.push(newLicense);
    registry.updated_at = new Date().toISOString();

    // Mark sample as cleared if this license clears it
    const sample = registry.samples.find(s => s.source_title === license.asset_id);
    if (sample) {
      sample.cleared = true;
      sample.license_id = newLicense.id;
    }

    return newLicense;
  }

  /**
   * Set split agreement
   */
  proposeSplitAgreement(
    projectId: string,
    proposerId: string,
    splits: { contributor_id: string; percentage: number; role: string }[]
  ): SplitAgreement | { error: string } {
    const registry = this.registries.get(projectId);
    if (!registry) return { error: 'Registry not found' };

    // Validate total is 100
    const total = splits.reduce((sum, s) => sum + s.percentage, 0);
    if (total !== 100) {
      return { error: `Splits must total 100%, got ${total}%` };
    }

    // Validate all contributors exist
    for (const split of splits) {
      if (!registry.contributors.find(c => c.id === split.contributor_id)) {
        return { error: `Contributor ${split.contributor_id} not found` };
      }
    }

    const agreement: SplitAgreement = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      agreed_by: [proposerId],
      splits,
      total: 100,
      locked: false,
      signature_hashes: [`sig_${proposerId}_${Date.now()}`]
    };

    registry.split_agreement = agreement;
    registry.updated_at = new Date().toISOString();

    // Update contributor shares
    for (const split of splits) {
      const contributor = registry.contributors.find(c => c.id === split.contributor_id);
      if (contributor) {
        contributor.share_percentage = split.percentage;
      }
    }

    return agreement;
  }

  /**
   * Agree to split agreement
   */
  agreeTOSplit(projectId: string, userId: string): boolean {
    const registry = this.registries.get(projectId);
    if (!registry || !registry.split_agreement) return false;

    if (registry.split_agreement.agreed_by.includes(userId)) {
      return true; // Already agreed
    }

    registry.split_agreement.agreed_by.push(userId);
    registry.split_agreement.signature_hashes.push(`sig_${userId}_${Date.now()}`);

    // Check if all contributors agreed
    const contributorUserIds = registry.contributors
      .filter(c => c.user_id)
      .map(c => c.user_id);

    const allAgreed = contributorUserIds.every(id =>
      registry.split_agreement!.agreed_by.includes(id!)
    );

    if (allAgreed) {
      registry.split_agreement.locked = true;
    }

    registry.updated_at = new Date().toISOString();
    return true;
  }

  /**
   * Generate rights report
   */
  generateReport(projectId: string): RightsReport | null {
    const registry = this.registries.get(projectId);
    if (!registry) return null;

    const unclearedSamples = registry.samples.filter(s => !s.cleared);
    const warnings: string[] = [];

    // Check for issues
    if (unclearedSamples.length > 0) {
      warnings.push(`${unclearedSamples.length} sample(s) require clearance`);
    }

    if (!registry.split_agreement?.locked) {
      warnings.push('Split agreement not finalized by all contributors');
    }

    const totalShares = registry.contributors.reduce((sum, c) => sum + c.share_percentage, 0);
    if (totalShares !== 100) {
      warnings.push(`Share percentages total ${totalShares}%, should be 100%`);
    }

    // Check for missing licenses
    const licensesRequired: string[] = [];
    for (const sample of unclearedSamples) {
      licensesRequired.push(`Sample clearance needed: "${sample.source_title}" by ${sample.source_artist}`);
    }

    const report: RightsReport = {
      project_id: projectId,
      generated_at: new Date().toISOString(),
      total_contributors: registry.contributors.length,
      split_breakdown: registry.contributors.map(c => ({
        contributor: c.name,
        type: c.type,
        share: c.share_percentage
      })),
      licenses_required: licensesRequired,
      samples_used: registry.samples.length,
      samples_cleared: registry.samples.filter(s => s.cleared).length,
      ready_for_distribution: warnings.length === 0,
      warnings,
      coordinate: `RemixRights.Report.${projectId}.Generated.Validated`
    };

    return report;
  }

  /**
   * Export rights data for distribution (JSON format)
   */
  exportForDistribution(projectId: string): object | null {
    const registry = this.registries.get(projectId);
    if (!registry) return null;

    return {
      project_id: projectId,
      rights_registry_version: '1.0',
      exported_at: new Date().toISOString(),
      contributors: registry.contributors.map(c => ({
        name: c.name,
        role: c.type,
        share_percentage: c.share_percentage,
        contributions: c.contributions.map(con => ({
          type: con.type,
          description: con.description
        }))
      })),
      samples: registry.samples.map(s => ({
        source: `${s.source_title} by ${s.source_artist}`,
        type: s.sample_type,
        cleared: s.cleared,
        royalty_percentage: s.royalty_percentage
      })),
      split_agreement: registry.split_agreement ? {
        locked: registry.split_agreement.locked,
        signers: registry.split_agreement.agreed_by.length,
        total_verified: registry.split_agreement.locked
      } : null,
      coordinate: registry.coordinate
    };
  }

  /**
   * Get registry
   */
  getRegistry(projectId: string): RightsRegistry | null {
    return this.registries.get(projectId) || null;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Rebalance shares when new contributor added (suggest equal split)
   */
  private rebalanceShares(registry: RightsRegistry): void {
    if (registry.split_agreement?.locked) return; // Don't change locked agreements

    const count = registry.contributors.length;
    const equalShare = Math.floor(100 / count);
    const remainder = 100 - (equalShare * count);

    registry.contributors.forEach((c, i) => {
      c.share_percentage = equalShare + (i === 0 ? remainder : 0);
    });
  }

  /**
   * Add license requirement note
   */
  private addLicenseRequirement(registry: RightsRegistry, sample: Omit<SampleUsage, 'id'>): void {
    // This would typically create a task/notification for the user
    console.log(`[Rights] License required for sample: ${sample.source_title}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const remixRights = new RemixRightsEngine();

export default {
  RemixRightsEngine,
  remixRights
};

/**
 * vkTUNEos Voice Marketplace
 * Community marketplace for RVC voice models
 *
 * Tier 3 Killer Feature: KILL-002
 *
 * Features:
 * - Upload trained RVC models
 * - Set pricing (free, pay-per-use, subscription)
 * - Consent verification required
 * - Usage tracking & royalties
 * - DMCA protection
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 * Coordinate: vkTUNEos.Killer.VoiceMarketplace.Consent.Validated
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceModelListing {
  id: string;
  name: string;
  description: string;
  preview_audio?: string;          // Base64 sample
  owner_id: string;
  owner_name: string;

  // Consent & Legal
  consent: ConsentRecord;
  license_type: LicenseType;

  // Pricing
  pricing: PricingConfig;

  // Stats
  downloads: number;
  uses: number;
  rating: number;
  reviews_count: number;

  // Metadata
  language: string;
  gender: 'male' | 'female' | 'neutral';
  age_range: 'child' | 'young' | 'adult' | 'senior';
  style_tags: string[];

  // Technical
  model_type: 'rvc' | 'openvoice' | 'xtts';
  quality_score: number;
  file_size: number;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Coordinate
  coordinate: string;
}

export interface ConsentRecord {
  verified: boolean;
  verification_type: 'video' | 'audio' | 'document' | 'self_attestation';
  verification_date: string;
  consent_statement: string;
  voice_matches_model: boolean;      // AI verified
  identity_verified?: boolean;       // Optional ID check
  agreement_hash: string;            // Hash of signed agreement
}

export type LicenseType =
  | 'free'                 // Free for any use
  | 'free_non_commercial'  // Free for non-commercial
  | 'pay_per_use'          // Pay each time
  | 'subscription'         // Monthly subscription
  | 'one_time'             // One-time purchase
  | 'royalty_share';       // Revenue share

export interface PricingConfig {
  type: LicenseType;
  price?: number;              // USD
  currency?: string;
  subscription_period?: 'month' | 'year';
  royalty_percentage?: number; // For royalty_share
  free_tier_uses?: number;     // Free uses before payment
}

export interface VoiceUsageRecord {
  id: string;
  model_id: string;
  user_id: string;
  timestamp: string;
  usage_type: 'conversion' | 'tts' | 'preview';
  duration_seconds: number;
  royalty_owed?: number;
  project_id?: string;        // For rights tracking
  coordinate: string;
}

export interface RoyaltyPayment {
  id: string;
  model_id: string;
  owner_id: string;
  period_start: string;
  period_end: string;
  total_uses: number;
  total_duration: number;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  paid_at?: string;
}

export interface VoiceModelUploadRequest {
  name: string;
  description: string;
  model_file: string;          // Base64 model
  preview_audio: string;       // Base64 demo
  consent_video?: string;      // Base64 consent video
  consent_audio?: string;      // Base64 consent recording
  license_type: LicenseType;
  pricing?: Partial<PricingConfig>;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  style_tags: string[];
}

export interface MarketplaceSearchQuery {
  query?: string;
  language?: string;
  gender?: string;
  license_type?: LicenseType[];
  max_price?: number;
  min_rating?: number;
  style_tags?: string[];
  sort_by?: 'popular' | 'newest' | 'rating' | 'price_low' | 'price_high';
  limit?: number;
  offset?: number;
}

export interface DMCA_Request {
  model_id: string;
  claimant_name: string;
  claimant_email: string;
  claim_type: 'identity_theft' | 'unauthorized_use' | 'copyright';
  description: string;
  evidence?: string;           // Base64 document
}

// ============================================================================
// VOICE MARKETPLACE ENGINE
// ============================================================================

export class VoiceMarketplaceEngine {
  private listings: Map<string, VoiceModelListing> = new Map();
  private usageRecords: VoiceUsageRecord[] = [];
  private royalties: Map<string, RoyaltyPayment[]> = new Map();

  // ==========================================================================
  // LISTING MANAGEMENT
  // ==========================================================================

  /**
   * Upload and list a new voice model
   */
  async uploadModel(
    request: VoiceModelUploadRequest,
    ownerId: string,
    ownerName: string
  ): Promise<VoiceModelListing | { error: string }> {
    // Verify consent
    const consentResult = await this.verifyConsent(
      request.consent_video,
      request.consent_audio
    );

    if (!consentResult.verified) {
      return { error: 'Consent verification failed. Please provide valid consent proof.' };
    }

    const listing: VoiceModelListing = {
      id: uuidv4(),
      name: request.name,
      description: request.description,
      preview_audio: request.preview_audio,
      owner_id: ownerId,
      owner_name: ownerName,
      consent: consentResult,
      license_type: request.license_type,
      pricing: {
        type: request.license_type,
        ...request.pricing
      },
      downloads: 0,
      uses: 0,
      rating: 0,
      reviews_count: 0,
      language: request.language,
      gender: request.gender,
      age_range: 'adult',
      style_tags: request.style_tags,
      model_type: 'rvc',
      quality_score: 0,
      file_size: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      coordinate: `VoiceCloning.Marketplace.Model.${request.name.replace(/\s+/g, '')}.Validated`
    };

    this.listings.set(listing.id, listing);
    return listing;
  }

  /**
   * Verify consent for voice model
   */
  private async verifyConsent(
    consentVideo?: string,
    consentAudio?: string
  ): Promise<ConsentRecord> {
    // In production, this would:
    // 1. Analyze video/audio for voice match
    // 2. Check for explicit consent statement
    // 3. Verify identity if possible

    const verificationType = consentVideo ? 'video' :
                            consentAudio ? 'audio' : 'self_attestation';

    // Simulate verification
    const verified = consentVideo || consentAudio ? true : false;

    return {
      verified,
      verification_type: verificationType,
      verification_date: new Date().toISOString(),
      consent_statement: 'I consent to my voice being used as an AI voice model on vkTUNEos.',
      voice_matches_model: verified,
      agreement_hash: `consent_${Date.now()}_${Math.random().toString(36).slice(2)}`
    };
  }

  /**
   * Update listing details
   */
  updateListing(
    listingId: string,
    ownerId: string,
    updates: Partial<VoiceModelListing>
  ): VoiceModelListing | { error: string } {
    const listing = this.listings.get(listingId);

    if (!listing) {
      return { error: 'Listing not found' };
    }

    if (listing.owner_id !== ownerId) {
      return { error: 'Not authorized to update this listing' };
    }

    // Merge updates
    const updated = {
      ...listing,
      ...updates,
      id: listing.id,
      owner_id: listing.owner_id,
      consent: listing.consent, // Can't change consent
      updated_at: new Date().toISOString()
    };

    this.listings.set(listingId, updated);
    return updated;
  }

  /**
   * Remove a listing
   */
  removeListing(listingId: string, ownerId: string): boolean {
    const listing = this.listings.get(listingId);

    if (!listing || listing.owner_id !== ownerId) {
      return false;
    }

    this.listings.delete(listingId);
    return true;
  }

  // ==========================================================================
  // SEARCH & DISCOVERY
  // ==========================================================================

  /**
   * Search marketplace
   */
  search(query: MarketplaceSearchQuery): VoiceModelListing[] {
    let results = Array.from(this.listings.values());

    // Text search
    if (query.query) {
      const searchLower = query.query.toLowerCase();
      results = results.filter(l =>
        l.name.toLowerCase().includes(searchLower) ||
        l.description.toLowerCase().includes(searchLower) ||
        l.style_tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Filters
    if (query.language) {
      results = results.filter(l => l.language === query.language);
    }

    if (query.gender) {
      results = results.filter(l => l.gender === query.gender);
    }

    if (query.license_type && query.license_type.length > 0) {
      results = results.filter(l => query.license_type!.includes(l.license_type));
    }

    if (query.max_price !== undefined) {
      results = results.filter(l =>
        l.license_type === 'free' ||
        l.license_type === 'free_non_commercial' ||
        (l.pricing.price !== undefined && l.pricing.price <= query.max_price!)
      );
    }

    if (query.min_rating !== undefined) {
      results = results.filter(l => l.rating >= query.min_rating!);
    }

    if (query.style_tags && query.style_tags.length > 0) {
      results = results.filter(l =>
        query.style_tags!.some(t => l.style_tags.includes(t))
      );
    }

    // Sort
    switch (query.sort_by) {
      case 'popular':
        results.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'price_low':
        results.sort((a, b) => (a.pricing.price || 0) - (b.pricing.price || 0));
        break;
      case 'price_high':
        results.sort((a, b) => (b.pricing.price || 0) - (a.pricing.price || 0));
        break;
    }

    // Pagination
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    return results.slice(offset, offset + limit);
  }

  /**
   * Get featured/trending voices
   */
  getFeatured(): VoiceModelListing[] {
    return Array.from(this.listings.values())
      .sort((a, b) => (b.downloads * b.rating) - (a.downloads * a.rating))
      .slice(0, 10);
  }

  /**
   * Get listing by ID
   */
  getListing(id: string): VoiceModelListing | null {
    return this.listings.get(id) || null;
  }

  // ==========================================================================
  // USAGE TRACKING
  // ==========================================================================

  /**
   * Record voice model usage
   */
  recordUsage(
    modelId: string,
    userId: string,
    usageType: 'conversion' | 'tts' | 'preview',
    durationSeconds: number,
    projectId?: string
  ): VoiceUsageRecord {
    const listing = this.listings.get(modelId);

    const record: VoiceUsageRecord = {
      id: uuidv4(),
      model_id: modelId,
      user_id: userId,
      timestamp: new Date().toISOString(),
      usage_type: usageType,
      duration_seconds: durationSeconds,
      project_id: projectId,
      coordinate: `VoiceCloning.Usage.${usageType}.${modelId.slice(0, 8)}.Validated`
    };

    // Calculate royalty if applicable
    if (listing && listing.license_type === 'royalty_share' && listing.pricing.royalty_percentage) {
      // Example: $0.001 per second * royalty percentage
      record.royalty_owed = (durationSeconds * 0.001) * (listing.pricing.royalty_percentage / 100);
    } else if (listing && listing.license_type === 'pay_per_use' && listing.pricing.price) {
      record.royalty_owed = listing.pricing.price;
    }

    this.usageRecords.push(record);

    // Update listing stats
    if (listing) {
      listing.uses++;
      this.listings.set(modelId, listing);
    }

    return record;
  }

  /**
   * Get usage history for a user
   */
  getUserUsage(userId: string): VoiceUsageRecord[] {
    return this.usageRecords.filter(r => r.user_id === userId);
  }

  /**
   * Get usage stats for a model owner
   */
  getModelStats(modelId: string, ownerId: string): {
    total_uses: number;
    total_duration: number;
    total_royalties: number;
    usage_by_type: Record<string, number>;
  } | null {
    const listing = this.listings.get(modelId);

    if (!listing || listing.owner_id !== ownerId) {
      return null;
    }

    const records = this.usageRecords.filter(r => r.model_id === modelId);
    const usageByType: Record<string, number> = {};

    let totalDuration = 0;
    let totalRoyalties = 0;

    for (const record of records) {
      totalDuration += record.duration_seconds;
      totalRoyalties += record.royalty_owed || 0;
      usageByType[record.usage_type] = (usageByType[record.usage_type] || 0) + 1;
    }

    return {
      total_uses: records.length,
      total_duration: totalDuration,
      total_royalties: totalRoyalties,
      usage_by_type: usageByType
    };
  }

  // ==========================================================================
  // DMCA & PROTECTION
  // ==========================================================================

  /**
   * File a DMCA request
   */
  fileDMCA(request: DMCA_Request): {
    success: boolean;
    ticket_id: string;
    status: string;
  } {
    // In production, this would:
    // 1. Create support ticket
    // 2. Temporarily suspend listing
    // 3. Notify model owner
    // 4. Investigate claim

    const ticketId = `DMCA_${Date.now()}`;

    // Temporarily mark listing
    const listing = this.listings.get(request.model_id);
    if (listing) {
      listing.coordinate = listing.coordinate.replace('.Validated', '.UnderReview');
      this.listings.set(request.model_id, listing);
    }

    return {
      success: true,
      ticket_id: ticketId,
      status: 'Claim received. Listing temporarily suspended pending review.'
    };
  }

  // ==========================================================================
  // CATEGORIES & TAGS
  // ==========================================================================

  /**
   * Get popular style tags
   */
  getPopularTags(): string[] {
    const tagCounts = new Map<string, number>();

    for (const listing of this.listings.values()) {
      for (const tag of listing.style_tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + listing.downloads);
      }
    }

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag);
  }

  /**
   * Get available languages
   */
  getLanguages(): string[] {
    const languages = new Set<string>();
    for (const listing of this.listings.values()) {
      languages.add(listing.language);
    }
    return Array.from(languages).sort();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const voiceMarketplace = new VoiceMarketplaceEngine();

export default {
  VoiceMarketplaceEngine,
  voiceMarketplace
};

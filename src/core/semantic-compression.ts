/**
 * vkTUNEos Semantic Compression Engine
 * Single-file storage with coordinate-based addressing
 *
 * The coordinate system IS the compression scheme:
 * - Similar assets share coordinate prefixes → delta encoding
 * - Coordinate = semantic address = O(1) lookup
 * - Single file = atomic truth = portable
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Coordinate, coordinateToString } from './schema.js';
import * as zlib from 'zlib';
import * as crypto from 'crypto';

// ============================================================================
// FILE FORMAT CONSTANTS
// ============================================================================

const MAGIC = 'VKT1';
const VERSION = [1, 0, 0];
const HEADER_SIZE = 64;
const INDEX_ENTRY_SIZE = 128; // coordinate path + offset + size + hash

// ============================================================================
// TYPES
// ============================================================================

export interface VKTHeader {
  magic: string;
  version: [number, number, number];
  indexOffset: number;
  indexCount: number;
  dataOffset: number;
  checksum: string;
  created: string;
  modified: string;
}

export interface IndexEntry {
  coordinate: string;        // L1.L2.L3.L4.L5 path
  offset: number;            // Byte offset in data section
  size: number;              // Compressed size
  originalSize: number;      // Uncompressed size
  hash: string;              // SHA-256 for truth verification
  compression: CompressionType;
  deltaBase?: string;        // Coordinate of base (if delta compressed)
  metadata: Record<string, any>;
}

export type CompressionType =
  | 'none'           // Raw storage
  | 'zstd'           // General compression
  | 'delta'          // Delta from another coordinate
  | 'spectral'       // Audio spectral compression
  | 'latent'         // Image latent space
  | 'quantized';     // Model quantization

export interface SemanticBlock {
  coordinate: Coordinate;
  data: Buffer;
  type: 'audio' | 'video' | 'image' | 'text' | 'model' | 'data';
  metadata?: Record<string, any>;
}

export interface VKTFile {
  header: VKTHeader;
  index: Map<string, IndexEntry>;
  // Data is read on-demand, not loaded into memory
}

// ============================================================================
// SEMANTIC COMPRESSION ENGINE
// ============================================================================

export class SemanticCompressionEngine {
  private index: Map<string, IndexEntry> = new Map();
  private dataBlocks: Map<string, Buffer> = new Map();
  private baseModels: Map<string, Buffer> = new Map(); // For delta compression

  /**
   * Compress data based on its semantic category (L1)
   * L1_category in vkTUNEos: VoiceCloning, StemSeparation, MusicGeneration, etc.
   */
  compress(block: SemanticBlock): { data: Buffer; compression: CompressionType; deltaBase?: string } {
    const coordStr = coordinateToString(block.coordinate);
    const category = block.coordinate.L1_category;

    // Check for delta compression opportunity
    const deltaResult = this.tryDeltaCompression(block);
    if (deltaResult) {
      return deltaResult;
    }

    // Category-specific compression based on block type
    switch (block.type) {
      case 'audio':
        return this.compressAudio(block);
      case 'video':
        return this.compressVideo(block);
      case 'image':
        return this.compressImage(block);
      case 'text':
        return this.compressText(block);
      case 'model':
        return this.compressModel(block);
      case 'data':
      default:
        return this.compressGeneric(block);
    }
  }

  /**
   * Try delta compression against similar coordinates
   */
  private tryDeltaCompression(block: SemanticBlock): { data: Buffer; compression: CompressionType; deltaBase: string } | null {
    const coordStr = coordinateToString(block.coordinate);

    // Find potential base with same L1.L2.L3 prefix
    const prefix = `${block.coordinate.L1_category}.${block.coordinate.L2_domain}.${block.coordinate.L3_entity}`;

    for (const [existingCoord, existingData] of this.dataBlocks) {
      if (existingCoord.startsWith(prefix) && existingCoord !== coordStr) {
        const delta = this.computeDelta(existingData, block.data);

        // Only use delta if it's significantly smaller
        if (delta.length < block.data.length * 0.7) {
          return {
            data: delta,
            compression: 'delta',
            deltaBase: existingCoord
          };
        }
      }
    }

    return null;
  }

  /**
   * Compute binary delta between two buffers
   */
  private computeDelta(base: Buffer, target: Buffer): Buffer {
    // Simple XOR delta with run-length encoding
    const maxLen = Math.max(base.length, target.length);
    const delta: number[] = [];

    // Header: target length
    delta.push(...this.encodeVarint(target.length));

    let i = 0;
    while (i < target.length) {
      if (i < base.length && base[i] === target[i]) {
        // Count matching bytes
        let matchLen = 0;
        while (i + matchLen < target.length &&
               i + matchLen < base.length &&
               base[i + matchLen] === target[i + matchLen]) {
          matchLen++;
        }
        // Encode: 0x00 + length (copy from base)
        delta.push(0x00);
        delta.push(...this.encodeVarint(matchLen));
        i += matchLen;
      } else {
        // Count differing bytes
        let diffLen = 0;
        const diffStart = i;
        while (i + diffLen < target.length &&
               (i + diffLen >= base.length || base[i + diffLen] !== target[i + diffLen])) {
          diffLen++;
          if (diffLen >= 127) break; // Limit run length
        }
        // Encode: 0x01 + length + literal bytes
        delta.push(0x01);
        delta.push(...this.encodeVarint(diffLen));
        for (let j = 0; j < diffLen; j++) {
          delta.push(target[diffStart + j]);
        }
        i += diffLen;
      }
    }

    return Buffer.from(delta);
  }

  /**
   * Apply delta to reconstruct original
   */
  applyDelta(base: Buffer, delta: Buffer): Buffer {
    let pos = 0;
    const [targetLen, bytesRead] = this.decodeVarint(delta, pos);
    pos += bytesRead;

    const result: number[] = [];
    let basePos = 0;

    while (pos < delta.length && result.length < targetLen) {
      const op = delta[pos++];
      const [len, lenBytes] = this.decodeVarint(delta, pos);
      pos += lenBytes;

      if (op === 0x00) {
        // Copy from base
        for (let i = 0; i < len && basePos < base.length; i++) {
          result.push(base[basePos++]);
        }
      } else if (op === 0x01) {
        // Literal bytes
        for (let i = 0; i < len && pos < delta.length; i++) {
          result.push(delta[pos++]);
          basePos++;
        }
      }
    }

    return Buffer.from(result);
  }

  private encodeVarint(value: number): number[] {
    const bytes: number[] = [];
    while (value > 127) {
      bytes.push((value & 0x7F) | 0x80);
      value >>>= 7;
    }
    bytes.push(value & 0x7F);
    return bytes;
  }

  private decodeVarint(buffer: Buffer, offset: number): [number, number] {
    let value = 0;
    let shift = 0;
    let pos = offset;

    while (pos < buffer.length) {
      const byte = buffer[pos++];
      value |= (byte & 0x7F) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }

    return [value, pos - offset];
  }

  /**
   * Audio compression (spectral domain)
   */
  private compressAudio(block: SemanticBlock): { data: Buffer; compression: CompressionType } {
    // For now, use ZSTD compression
    // TODO: Implement spectral compression for audio
    const compressed = zlib.deflateSync(block.data, { level: 9 });
    return { data: compressed, compression: 'zstd' };
  }

  /**
   * Video compression
   */
  private compressVideo(block: SemanticBlock): { data: Buffer; compression: CompressionType } {
    // For now, use ZSTD compression
    // TODO: Implement keyframe + motion vector compression
    const compressed = zlib.deflateSync(block.data, { level: 9 });
    return { data: compressed, compression: 'zstd' };
  }

  /**
   * Image compression (latent space)
   */
  private compressImage(block: SemanticBlock): { data: Buffer; compression: CompressionType } {
    // For now, use ZSTD compression
    // TODO: Implement VAE latent space compression
    const compressed = zlib.deflateSync(block.data, { level: 9 });
    return { data: compressed, compression: 'zstd' };
  }

  /**
   * Text compression
   */
  private compressText(block: SemanticBlock): { data: Buffer; compression: CompressionType } {
    const compressed = zlib.deflateSync(block.data, { level: 9 });
    return { data: compressed, compression: 'zstd' };
  }

  /**
   * Model compression (quantization)
   */
  private compressModel(block: SemanticBlock): { data: Buffer; compression: CompressionType } {
    // For now, use ZSTD compression
    // TODO: Implement model quantization (INT8/INT4)
    const compressed = zlib.deflateSync(block.data, { level: 9 });
    return { data: compressed, compression: 'quantized' };
  }

  /**
   * Generic compression
   */
  private compressGeneric(block: SemanticBlock): { data: Buffer; compression: CompressionType } {
    const compressed = zlib.deflateSync(block.data, { level: 9 });
    return { data: compressed, compression: 'zstd' };
  }

  /**
   * Decompress data based on compression type
   */
  decompress(data: Buffer, compression: CompressionType, deltaBase?: Buffer): Buffer {
    switch (compression) {
      case 'none':
        return data;
      case 'delta':
        if (!deltaBase) throw new Error('Delta compression requires base data');
        return this.applyDelta(deltaBase, data);
      case 'zstd':
      case 'spectral':
      case 'latent':
      case 'quantized':
        return zlib.inflateSync(data);
      default:
        return data;
    }
  }
}

// ============================================================================
// VKT FILE OPERATIONS
// ============================================================================

export class VKTFileManager {
  private engine = new SemanticCompressionEngine();
  private index: Map<string, IndexEntry> = new Map();
  private dataBuffer: Buffer[] = [];
  private currentOffset = 0;

  /**
   * Add a block to the VKT file
   */
  addBlock(block: SemanticBlock): IndexEntry {
    const coordStr = coordinateToString(block.coordinate);
    const hash = crypto.createHash('sha256').update(block.data).digest('hex');

    // Compress
    const { data: compressed, compression, deltaBase } = this.engine.compress(block);

    // Create index entry
    const entry: IndexEntry = {
      coordinate: coordStr,
      offset: this.currentOffset,
      size: compressed.length,
      originalSize: block.data.length,
      hash,
      compression,
      deltaBase,
      metadata: block.metadata || {}
    };

    // Store
    this.index.set(coordStr, entry);
    this.dataBuffer.push(compressed);
    this.currentOffset += compressed.length;

    return entry;
  }

  /**
   * Get a block by coordinate
   */
  getBlock(coordinate: Coordinate | string): Buffer | null {
    const coordStr = typeof coordinate === 'string' ? coordinate : coordinateToString(coordinate);
    const entry = this.index.get(coordStr);

    if (!entry) return null;

    // Find the data (in a real implementation, this would seek in the file)
    let dataOffset = 0;
    for (const [coord, e] of this.index) {
      if (coord === coordStr) break;
      dataOffset += e.size;
    }

    // Get compressed data
    let compressed = Buffer.alloc(0);
    let currentPos = 0;
    for (const buf of this.dataBuffer) {
      if (currentPos >= dataOffset && currentPos < dataOffset + entry.size) {
        compressed = Buffer.concat([compressed, buf]);
      }
      currentPos += buf.length;
      if (currentPos >= dataOffset + entry.size) break;
    }

    // Handle delta decompression
    let deltaBase: Buffer | undefined;
    if (entry.compression === 'delta' && entry.deltaBase) {
      deltaBase = this.getBlock(entry.deltaBase) || undefined;
    }

    return this.engine.decompress(compressed, entry.compression, deltaBase);
  }

  /**
   * Query coordinates by prefix (fast L1/L2/L3 filtering)
   */
  queryByPrefix(prefix: string): IndexEntry[] {
    const results: IndexEntry[] = [];
    for (const [coord, entry] of this.index) {
      if (coord.startsWith(prefix)) {
        results.push(entry);
      }
    }
    return results;
  }

  /**
   * Export to single .vkt file
   */
  exportToFile(): Buffer {
    const now = new Date().toISOString();

    // Build index buffer
    const indexEntries = Array.from(this.index.values());
    const indexJson = JSON.stringify(indexEntries);
    const indexBuffer = zlib.deflateSync(Buffer.from(indexJson));

    // Build data buffer
    const dataBuffer = Buffer.concat(this.dataBuffer);

    // Calculate offsets
    const indexOffset = HEADER_SIZE;
    const dataOffset = indexOffset + indexBuffer.length;

    // Build header
    const header: VKTHeader = {
      magic: MAGIC,
      version: VERSION as [number, number, number],
      indexOffset,
      indexCount: indexEntries.length,
      dataOffset,
      checksum: crypto.createHash('sha256').update(dataBuffer).digest('hex'),
      created: now,
      modified: now
    };

    const headerJson = JSON.stringify(header);
    const headerBuffer = Buffer.alloc(HEADER_SIZE);
    headerBuffer.write(headerJson, 0, 'utf8');

    // Combine all parts
    return Buffer.concat([headerBuffer, indexBuffer, dataBuffer]);
  }

  /**
   * Import from .vkt file
   */
  static importFromFile(buffer: Buffer): VKTFileManager {
    const manager = new VKTFileManager();

    // Read header
    const headerJson = buffer.slice(0, HEADER_SIZE).toString('utf8').replace(/\0+$/, '');
    const header: VKTHeader = JSON.parse(headerJson);

    if (header.magic !== MAGIC) {
      throw new Error('Invalid VKT file: bad magic number');
    }

    // Read index
    const indexBuffer = buffer.slice(header.indexOffset, header.dataOffset);
    const indexJson = zlib.inflateSync(indexBuffer).toString('utf8');
    const indexEntries: IndexEntry[] = JSON.parse(indexJson);

    for (const entry of indexEntries) {
      manager.index.set(entry.coordinate, entry);
    }

    // Store data reference (lazy loading in real implementation)
    manager.dataBuffer = [buffer.slice(header.dataOffset)];

    // Verify checksum
    const dataChecksum = crypto.createHash('sha256').update(buffer.slice(header.dataOffset)).digest('hex');
    if (dataChecksum !== header.checksum) {
      throw new Error('VKT file corrupted: checksum mismatch');
    }

    return manager;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEntries: number;
    totalSize: number;
    compressedSize: number;
    compressionRatio: number;
    byCategory: Record<string, number>;
  } {
    let totalSize = 0;
    let compressedSize = 0;
    const byCategory: Record<string, number> = {};

    for (const entry of this.index.values()) {
      totalSize += entry.originalSize;
      compressedSize += entry.size;

      const category = entry.coordinate.split('.')[0];
      byCategory[category] = (byCategory[category] || 0) + 1;
    }

    return {
      totalEntries: this.index.size,
      totalSize,
      compressedSize,
      compressionRatio: totalSize > 0 ? compressedSize / totalSize : 0,
      byCategory
    };
  }
}

// ============================================================================
// COORDINATE-BASED QUERY INTERFACE
// ============================================================================

export class CoordinateQuery {
  constructor(private manager: VKTFileManager) {}

  /**
   * Get all music assets
   */
  music(): IndexEntry[] {
    return this.manager.queryByPrefix('Music.');
  }

  /**
   * Get all voice cloning models
   */
  voiceModels(): IndexEntry[] {
    return this.manager.queryByPrefix('Music.VoiceCloning.');
  }

  /**
   * Get all stems
   */
  stems(): IndexEntry[] {
    return this.manager.queryByPrefix('Music.StemSeparation.');
  }

  /**
   * Get all generated content
   */
  generated(): IndexEntry[] {
    return this.manager.queryByPrefix('Audio.Generated.');
  }

  /**
   * Get by exact coordinate path
   */
  exact(path: string): IndexEntry | undefined {
    return this.manager.queryByPrefix(path).find(e => e.coordinate === path);
  }

  /**
   * Get all validated assets
   */
  validated(): IndexEntry[] {
    return Array.from(this.manager.queryByPrefix('')).filter(
      e => e.coordinate.endsWith('.Validated')
    );
  }
}

export default {
  SemanticCompressionEngine,
  VKTFileManager,
  CoordinateQuery
};

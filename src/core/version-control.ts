/**
 * vkTUNEos Version Control System
 * Git-like history for projects
 *
 * Tier 2 Differentiator: DIFF-008
 *
 * Features:
 * - Every change tracked
 * - Branch experiments
 * - Merge successful experiments
 * - Undo anything
 * - Full revert capability
 * - Diff viewer for audio/video changes
 *
 * Domain: vkTUNEos.com
 * Version: 1.0
 * Coordinate: vkTUNEos.Differentiator.VersionControl.GitLike.Validated
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

export interface VKTCommit {
  id: string;
  parent_id: string | null;
  branch: string;
  message: string;
  author?: string;
  timestamp: string;
  snapshot: ProjectSnapshot;
  changes: ChangeRecord[];
}

export interface ProjectSnapshot {
  id: string;
  name: string;
  tracks: any[];
  assets: AssetReference[];
  settings: Record<string, any>;
  coordinate: string;
}

export interface AssetReference {
  id: string;
  type: 'audio' | 'video' | 'voice' | 'stem' | 'image';
  hash: string;           // Content hash for deduplication
  path: string;           // Virtual path within project
  metadata?: Record<string, any>;
}

export interface ChangeRecord {
  type: 'add' | 'modify' | 'delete' | 'move';
  path: string;
  asset_type?: string;
  before_hash?: string;
  after_hash?: string;
  description?: string;
}

export interface Branch {
  name: string;
  head_commit_id: string;
  created_at: string;
  description?: string;
}

export interface VersionHistory {
  project_id: string;
  current_branch: string;
  branches: Branch[];
  commits: VKTCommit[];
  tags: Record<string, string>;  // tag name -> commit id
}

export interface DiffResult {
  type: 'audio' | 'video' | 'project';
  changes: Array<{
    path: string;
    change_type: 'added' | 'modified' | 'deleted';
    details?: string;
  }>;
  audio_diff?: {
    waveform_similarity: number;
    duration_change: number;
    level_change_db: number;
  };
}

export interface MergeResult {
  success: boolean;
  merged_commit?: VKTCommit;
  conflicts?: MergeConflict[];
  error?: string;
}

export interface MergeConflict {
  path: string;
  type: 'content' | 'delete_modify' | 'add_add';
  ours: any;
  theirs: any;
  resolution?: 'ours' | 'theirs' | 'manual';
}

// ============================================================================
// VERSION CONTROL ENGINE
// ============================================================================

export class VersionControlEngine {
  private histories: Map<string, VersionHistory> = new Map();

  /**
   * Initialize version control for a project
   */
  init(projectId: string, initialSnapshot: ProjectSnapshot): VersionHistory {
    const initialCommit: VKTCommit = {
      id: uuidv4(),
      parent_id: null,
      branch: 'main',
      message: 'Initial commit',
      timestamp: new Date().toISOString(),
      snapshot: initialSnapshot,
      changes: [{
        type: 'add',
        path: '/',
        description: 'Initial project creation'
      }]
    };

    const history: VersionHistory = {
      project_id: projectId,
      current_branch: 'main',
      branches: [{
        name: 'main',
        head_commit_id: initialCommit.id,
        created_at: new Date().toISOString()
      }],
      commits: [initialCommit],
      tags: {}
    };

    this.histories.set(projectId, history);
    return history;
  }

  /**
   * Create a new commit
   */
  commit(projectId: string, message: string, snapshot: ProjectSnapshot, author?: string): VKTCommit | null {
    const history = this.histories.get(projectId);
    if (!history) return null;

    const currentBranch = history.branches.find(b => b.name === history.current_branch);
    if (!currentBranch) return null;

    const parentCommit = history.commits.find(c => c.id === currentBranch.head_commit_id);
    const changes = parentCommit ? this.detectChanges(parentCommit.snapshot, snapshot) : [];

    const newCommit: VKTCommit = {
      id: uuidv4(),
      parent_id: currentBranch.head_commit_id,
      branch: history.current_branch,
      message,
      author,
      timestamp: new Date().toISOString(),
      snapshot: this.cloneSnapshot(snapshot),
      changes
    };

    history.commits.push(newCommit);
    currentBranch.head_commit_id = newCommit.id;

    return newCommit;
  }

  /**
   * Create a new branch
   */
  branch(projectId: string, branchName: string, description?: string): Branch | null {
    const history = this.histories.get(projectId);
    if (!history) return null;

    // Check if branch exists
    if (history.branches.find(b => b.name === branchName)) {
      return null; // Branch already exists
    }

    const currentBranch = history.branches.find(b => b.name === history.current_branch);
    if (!currentBranch) return null;

    const newBranch: Branch = {
      name: branchName,
      head_commit_id: currentBranch.head_commit_id,
      created_at: new Date().toISOString(),
      description
    };

    history.branches.push(newBranch);
    return newBranch;
  }

  /**
   * Switch to a branch
   */
  checkout(projectId: string, branchName: string): ProjectSnapshot | null {
    const history = this.histories.get(projectId);
    if (!history) return null;

    const branch = history.branches.find(b => b.name === branchName);
    if (!branch) return null;

    history.current_branch = branchName;

    const headCommit = history.commits.find(c => c.id === branch.head_commit_id);
    return headCommit ? this.cloneSnapshot(headCommit.snapshot) : null;
  }

  /**
   * Checkout a specific commit
   */
  checkoutCommit(projectId: string, commitId: string): ProjectSnapshot | null {
    const history = this.histories.get(projectId);
    if (!history) return null;

    const commit = history.commits.find(c => c.id === commitId);
    return commit ? this.cloneSnapshot(commit.snapshot) : null;
  }

  /**
   * Merge a branch into current branch
   */
  merge(projectId: string, sourceBranch: string): MergeResult {
    const history = this.histories.get(projectId);
    if (!history) return { success: false, error: 'Project not found' };

    const source = history.branches.find(b => b.name === sourceBranch);
    const target = history.branches.find(b => b.name === history.current_branch);

    if (!source || !target) {
      return { success: false, error: 'Branch not found' };
    }

    const sourceCommit = history.commits.find(c => c.id === source.head_commit_id);
    const targetCommit = history.commits.find(c => c.id === target.head_commit_id);

    if (!sourceCommit || !targetCommit) {
      return { success: false, error: 'Commit not found' };
    }

    // Detect conflicts
    const conflicts = this.detectConflicts(targetCommit.snapshot, sourceCommit.snapshot);

    if (conflicts.length > 0) {
      return { success: false, conflicts };
    }

    // Simple merge: apply source changes to target
    const mergedSnapshot = this.mergeSnapshots(targetCommit.snapshot, sourceCommit.snapshot);

    const mergeCommit = this.commit(
      projectId,
      `Merge branch '${sourceBranch}' into ${history.current_branch}`,
      mergedSnapshot
    );

    return { success: true, merged_commit: mergeCommit || undefined };
  }

  /**
   * Revert to a previous commit
   */
  revert(projectId: string, commitId: string): VKTCommit | null {
    const history = this.histories.get(projectId);
    if (!history) return null;

    const targetCommit = history.commits.find(c => c.id === commitId);
    if (!targetCommit) return null;

    return this.commit(
      projectId,
      `Revert to commit ${commitId.substring(0, 8)}`,
      targetCommit.snapshot
    );
  }

  /**
   * Revert N commits back
   */
  revertHead(projectId: string, count: number): VKTCommit | null {
    const history = this.histories.get(projectId);
    if (!history) return null;

    // Walk back through commits
    let currentCommit = history.commits.find(c =>
      c.id === history.branches.find(b => b.name === history.current_branch)?.head_commit_id
    );

    for (let i = 0; i < count && currentCommit?.parent_id; i++) {
      currentCommit = history.commits.find(c => c.id === currentCommit!.parent_id);
    }

    if (!currentCommit) return null;
    return this.revert(projectId, currentCommit.id);
  }

  /**
   * Get diff between two commits
   */
  diff(projectId: string, commitIdA: string, commitIdB: string): DiffResult {
    const history = this.histories.get(projectId);
    if (!history) {
      return { type: 'project', changes: [] };
    }

    const commitA = history.commits.find(c => c.id === commitIdA);
    const commitB = history.commits.find(c => c.id === commitIdB);

    if (!commitA || !commitB) {
      return { type: 'project', changes: [] };
    }

    const changes = this.detectChanges(commitA.snapshot, commitB.snapshot);

    return {
      type: 'project',
      changes: changes.map(c => ({
        path: c.path,
        change_type: c.type === 'add' ? 'added' : c.type === 'delete' ? 'deleted' : 'modified',
        details: c.description
      }))
    };
  }

  /**
   * Tag a commit (e.g., v1.0, v2.0)
   */
  tag(projectId: string, tagName: string, commitId?: string): boolean {
    const history = this.histories.get(projectId);
    if (!history) return false;

    const targetCommitId = commitId ||
      history.branches.find(b => b.name === history.current_branch)?.head_commit_id;

    if (!targetCommitId) return false;

    history.tags[tagName] = targetCommitId;
    return true;
  }

  /**
   * Get commit history for current branch
   */
  log(projectId: string, limit: number = 50): VKTCommit[] {
    const history = this.histories.get(projectId);
    if (!history) return [];

    const currentBranch = history.branches.find(b => b.name === history.current_branch);
    if (!currentBranch) return [];

    // Walk the commit history
    const commits: VKTCommit[] = [];
    let currentId: string | null = currentBranch.head_commit_id;

    while (currentId && commits.length < limit) {
      const commit = history.commits.find(c => c.id === currentId);
      if (!commit) break;
      commits.push(commit);
      currentId = commit.parent_id;
    }

    return commits;
  }

  /**
   * Get all branches
   */
  listBranches(projectId: string): Branch[] {
    const history = this.histories.get(projectId);
    return history?.branches || [];
  }

  /**
   * Get current status
   */
  status(projectId: string): {
    branch: string;
    head: string;
    ahead: number;
    modified: boolean;
  } | null {
    const history = this.histories.get(projectId);
    if (!history) return null;

    const currentBranch = history.branches.find(b => b.name === history.current_branch);
    if (!currentBranch) return null;

    return {
      branch: history.current_branch,
      head: currentBranch.head_commit_id,
      ahead: 0, // Would need remote tracking
      modified: false // Would need working copy tracking
    };
  }

  /**
   * Delete a branch
   */
  deleteBranch(projectId: string, branchName: string): boolean {
    const history = this.histories.get(projectId);
    if (!history) return false;

    if (branchName === 'main' || branchName === history.current_branch) {
      return false; // Can't delete main or current branch
    }

    const index = history.branches.findIndex(b => b.name === branchName);
    if (index === -1) return false;

    history.branches.splice(index, 1);
    return true;
  }

  /**
   * Get complete history
   */
  getHistory(projectId: string): VersionHistory | null {
    return this.histories.get(projectId) || null;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private detectChanges(before: ProjectSnapshot, after: ProjectSnapshot): ChangeRecord[] {
    const changes: ChangeRecord[] = [];
    const beforeAssets = new Map(before.assets.map(a => [a.path, a]));
    const afterAssets = new Map(after.assets.map(a => [a.path, a]));

    // Check for additions and modifications
    for (const [path, asset] of afterAssets) {
      const beforeAsset = beforeAssets.get(path);
      if (!beforeAsset) {
        changes.push({
          type: 'add',
          path,
          asset_type: asset.type,
          after_hash: asset.hash,
          description: `Added ${asset.type}: ${path}`
        });
      } else if (beforeAsset.hash !== asset.hash) {
        changes.push({
          type: 'modify',
          path,
          asset_type: asset.type,
          before_hash: beforeAsset.hash,
          after_hash: asset.hash,
          description: `Modified ${asset.type}: ${path}`
        });
      }
    }

    // Check for deletions
    for (const [path, asset] of beforeAssets) {
      if (!afterAssets.has(path)) {
        changes.push({
          type: 'delete',
          path,
          asset_type: asset.type,
          before_hash: asset.hash,
          description: `Deleted ${asset.type}: ${path}`
        });
      }
    }

    // Check for settings changes
    if (JSON.stringify(before.settings) !== JSON.stringify(after.settings)) {
      changes.push({
        type: 'modify',
        path: '/settings',
        description: 'Project settings modified'
      });
    }

    return changes;
  }

  private detectConflicts(ours: ProjectSnapshot, theirs: ProjectSnapshot): MergeConflict[] {
    const conflicts: MergeConflict[] = [];
    const ourAssets = new Map(ours.assets.map(a => [a.path, a]));
    const theirAssets = new Map(theirs.assets.map(a => [a.path, a]));

    for (const [path, ourAsset] of ourAssets) {
      const theirAsset = theirAssets.get(path);
      if (theirAsset && ourAsset.hash !== theirAsset.hash) {
        // Both modified the same file
        conflicts.push({
          path,
          type: 'content',
          ours: ourAsset,
          theirs: theirAsset
        });
      }
    }

    return conflicts;
  }

  private mergeSnapshots(target: ProjectSnapshot, source: ProjectSnapshot): ProjectSnapshot {
    // Simple merge: prefer source for new/modified assets
    const mergedAssets = new Map<string, AssetReference>();

    // Add all target assets
    for (const asset of target.assets) {
      mergedAssets.set(asset.path, asset);
    }

    // Overlay source assets
    for (const asset of source.assets) {
      mergedAssets.set(asset.path, asset);
    }

    return {
      ...target,
      assets: Array.from(mergedAssets.values()),
      settings: { ...target.settings, ...source.settings }
    };
  }

  private cloneSnapshot(snapshot: ProjectSnapshot): ProjectSnapshot {
    return JSON.parse(JSON.stringify(snapshot));
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const versionControl = new VersionControlEngine();

export default {
  VersionControlEngine,
  versionControl
};

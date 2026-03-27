export type GitFileBadge = 'M' | 'A' | 'U' | 'D' | 'R' | 'C';

export interface GitStatusEntry {
  path: string;
  indexStatus: string;
  workTreeStatus: string;
  badge: GitFileBadge;
  staged: boolean;
}

export interface GitStatusSnapshot {
  isRepository: boolean;
  branch: string;
  entries: GitStatusEntry[];
  raw: string;
}


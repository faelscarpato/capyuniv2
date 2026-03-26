export type CollaborationRole = 'owner' | 'editor' | 'viewer';

export interface CollaborationSession {
  sessionId: string;
  workspaceId: string;
  userId: string;
  role: CollaborationRole;
  createdAt: number;
}

export interface CollaborationOperation {
  id: string;
  actorId: string;
  timestamp: number;
  path: string;
  type: 'create' | 'update' | 'delete' | 'rename' | 'move';
  payload: Record<string, unknown>;
}

export interface CollaborationTransport {
  connect: (session: CollaborationSession) => Promise<void>;
  disconnect: () => Promise<void>;
  publish: (operation: CollaborationOperation) => Promise<void>;
}


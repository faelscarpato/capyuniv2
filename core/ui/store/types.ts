export type SidebarViewType =
  | 'explorer'
  | 'search'
  | 'settings'
  | 'docs'
  | 'community'
  | 'blog'
  | 'pricing'
  | 'extensions'
  | 'run'
  | 'grounding'
  | 'source_control';

export type RightSidebarViewType = 'chat' | 'preview' | 'capyuniverse' | 'none';
export type Language = 'pt' | 'en';
export type PanelTabType = 'TERMINAL' | 'PREVIEW' | 'OUTPUT' | 'PROBLEMS' | string;

export interface MarkerData {
  owner: string;
  code?: string | { value: string; target: any };
  severity: number;
  message: string;
  source?: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  resource: string;
}


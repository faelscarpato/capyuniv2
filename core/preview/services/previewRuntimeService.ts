import type { FileSystem } from '../../../types';

export interface PreviewBuildResult {
  html: string;
  warnings: string[];
}

export const previewRuntimeService = {
  buildFromWorkspace: (_files: FileSystem): PreviewBuildResult => {
    return {
      html: '<!doctype html><html><body><h1>Preview TODO</h1></body></html>',
      warnings: ['TODO: migrar pipeline atual de preview para serviço isolado e testável.']
    };
  }
};


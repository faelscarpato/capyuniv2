import type { FileSystem } from '../../../types';

export interface PackageJsonScript {
  name: string;
  command: string;
}

export const packageJsonService = {
  parseScripts: (files: FileSystem): PackageJsonScript[] => {
    const packageJson = files['package.json'];
    if (!packageJson || !packageJson.content) return [];

    try {
      const pkg = JSON.parse(packageJson.content);
      const scripts = pkg.scripts;
      if (!scripts || typeof scripts !== 'object') return [];

      return Object.entries(scripts).map(([name, command]) => ({
        name,
        command: String(command)
      }));
    } catch {
      return [];
    }
  },

  findPackageJson: (files: FileSystem): string | null => {
    const rootFiles = Object.values(files).filter(
      (node) => node.parentId === 'root' && node.name === 'package.json'
    );
    return rootFiles.length > 0 ? 'package.json' : null;
  },

  detectDevServer: (scripts: PackageJsonScript[]): PackageJsonScript | null => {
    const devPatterns = ['dev', 'start', 'serve', 'preview'];
    for (const pattern of devPatterns) {
      const found = scripts.find(s => s.name === pattern || s.name.startsWith(`${pattern}:`));
      if (found) return found;
    }
    return null;
  },

  detectTestRunner: (scripts: PackageJsonScript[]): PackageJsonScript | null => {
    const testPatterns = ['test', 'test:watch', 'test:run'];
    for (const pattern of testPatterns) {
      const found = scripts.find(s => s.name === pattern);
      if (found) return found;
    }
    return null;
  },

  detectBuildRunner: (scripts: PackageJsonScript[]): PackageJsonScript | null => {
    const buildPatterns = ['build', 'build:prod'];
    for (const pattern of buildPatterns) {
      const found = scripts.find(s => s.name === pattern);
      if (found) return found;
    }
    return null;
  },

  getRecommendedScript: (scripts: PackageJsonScript[]): PackageJsonScript | null => {
    return packageJsonService.detectDevServer(scripts)
      || packageJsonService.detectBuildRunner(scripts)
      || packageJsonService.detectTestRunner(scripts)
      || scripts[0]
      || null;
  }
};
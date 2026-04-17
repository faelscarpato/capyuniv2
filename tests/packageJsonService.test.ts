import { describe, it, expect } from 'vitest';
import { packageJsonService, type PackageJsonScript } from '../core/workspace/services/packageJsonService';
import type { FileSystem } from '../types';

describe('packageJsonService', () => {
  const createPackageJson = (scripts: Record<string, string>): FileSystem => ({
    'package.json': {
      id: 'package.json',
      name: 'package.json',
      type: 'file',
      parentId: 'root',
      content: JSON.stringify({ scripts }, null, 2),
      createdAt: Date.now()
    }
  } as any);

  describe('parseScripts', () => {
    it('should parse scripts from package.json', () => {
      const files = createPackageJson({
        dev: 'vite',
        build: 'vite build',
        test: 'vitest'
      });
      
      const scripts = packageJsonService.parseScripts(files);
      
      expect(scripts).toHaveLength(3);
      expect(scripts[0].name).toBe('dev');
      expect(scripts[0].command).toBe('vite');
    });

    it('should return empty array when no package.json', () => {
      const files: FileSystem = {};
      
      const scripts = packageJsonService.parseScripts(files);
      
      expect(scripts).toHaveLength(0);
    });

    it('should return empty array for invalid JSON', () => {
      const files: FileSystem = {
        'package.json': {
          id: 'package.json',
          name: 'package.json',
          type: 'file',
          parentId: 'root',
          content: 'invalid json',
          createdAt: Date.now()
        }
      } as any;
      
      const scripts = packageJsonService.parseScripts(files);
      
      expect(scripts).toHaveLength(0);
    });
  });

  describe('findPackageJson', () => {
    it('should find package.json in root', () => {
      const files = createPackageJson({});
      
      const result = packageJsonService.findPackageJson(files);
      
      expect(result).toBe('package.json');
    });

    it('should return null when no package.json', () => {
      const files: FileSystem = {};
      
      const result = packageJsonService.findPackageJson(files);
      
      expect(result).toBeNull();
    });
  });

  describe('detectDevServer', () => {
    it('should detect dev script', () => {
      const scripts: PackageJsonScript[] = [
        { name: 'dev', command: 'vite' },
        { name: 'build', command: 'vite build' }
      ];
      
      const result = packageJsonService.detectDevServer(scripts);
      
      expect(result?.name).toBe('dev');
    });

    it('should detect start script', () => {
      const scripts: PackageJsonScript[] = [
        { name: 'start', command: 'vite' }
      ];
      
      const result = packageJsonService.detectDevServer(scripts);
      
      expect(result?.name).toBe('start');
    });

    it('should return null when no dev script', () => {
      const scripts: PackageJsonScript[] = [
        { name: 'build', command: 'vite build' }
      ];
      
      const result = packageJsonService.detectDevServer(scripts);
      
      expect(result).toBeNull();
    });
  });

  describe('detectTestRunner', () => {
    it('should detect test script', () => {
      const scripts: PackageJsonScript[] = [
        { name: 'test', command: 'vitest' }
      ];
      
      const result = packageJsonService.detectTestRunner(scripts);
      
      expect(result?.name).toBe('test');
    });

    it('should return null when no test script', () => {
      const scripts: PackageJsonScript[] = [
        { name: 'dev', command: 'vite' }
      ];
      
      const result = packageJsonService.detectTestRunner(scripts);
      
      expect(result).toBeNull();
    });
  });

  describe('detectBuildRunner', () => {
    it('should detect build script', () => {
      const scripts: PackageJsonScript[] = [
        { name: 'build', command: 'vite build' }
      ];
      
      const result = packageJsonService.detectBuildRunner(scripts);
      
      expect(result?.name).toBe('build');
    });
  });

  describe('getRecommendedScript', () => {
    it('should prefer dev over build', () => {
      const scripts: PackageJsonScript[] = [
        { name: 'dev', command: 'vite' },
        { name: 'build', command: 'vite build' }
      ];
      
      const result = packageJsonService.getRecommendedScript(scripts);
      
      expect(result?.name).toBe('dev');
    });

    it('should fall back to build when no dev', () => {
      const scripts: PackageJsonScript[] = [
        { name: 'build', command: 'vite build' }
      ];
      
      const result = packageJsonService.getRecommendedScript(scripts);
      
      expect(result?.name).toBe('build');
    });

    it('should return first script when only test', () => {
      const scripts: PackageJsonScript[] = [
        { name: 'test', command: 'vitest' }
      ];
      
      const result = packageJsonService.getRecommendedScript(scripts);
      
      expect(result?.name).toBe('test');
    });

    it('should return null for empty array', () => {
      const scripts: PackageJsonScript[] = [];
      
      const result = packageJsonService.getRecommendedScript(scripts);
      
      expect(result).toBeNull();
    });
  });
});
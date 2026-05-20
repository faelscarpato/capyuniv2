import type { FileNode, FileSystem } from '../../../types';

export type DotnetProjectKind = 'solution' | 'project' | 'source';

export interface DotnetProjectCandidate {
  name: string;
  path: string;
  kind: DotnetProjectKind;
  runnable: boolean;
}

export interface DotnetProjectCommands {
  restore: string;
  build: string;
  run: string | null;
  test: string;
}

const getPathForId = (files: FileSystem, id: string): string => {
  let current: FileNode | undefined = files[id];
  if (!current || id === 'root') return '';

  const parts = [current.name];
  while (current.parentId && current.parentId !== 'root') {
    current = files[current.parentId];
    if (!current) break;
    parts.unshift(current.name);
  }

  return parts.join('/');
};

const quote = (value: string): string => JSON.stringify(value);

export const csharpProjectService = {
  findProjects: (files: FileSystem): DotnetProjectCandidate[] => {
    const candidates = Object.values(files)
      .filter((node) => node.type === 'file')
      .map((node) => {
        const path = getPathForId(files, node.id);
        const lowerName = node.name.toLowerCase();

        if (lowerName.endsWith('.csproj')) {
          return { name: node.name, path, kind: 'project' as const, runnable: true };
        }

        if (lowerName.endsWith('.sln')) {
          return { name: node.name, path, kind: 'solution' as const, runnable: false };
        }

        if (lowerName === 'program.cs') {
          return { name: node.name, path, kind: 'source' as const, runnable: true };
        }

        return null;
      })
      .filter((candidate): candidate is DotnetProjectCandidate => Boolean(candidate));

    const priority: Record<DotnetProjectKind, number> = { project: 0, solution: 1, source: 2 };
    return candidates.sort((a, b) => priority[a.kind] - priority[b.kind] || a.path.localeCompare(b.path));
  },

  getMainProject: (files: FileSystem): DotnetProjectCandidate | null => {
    return csharpProjectService.findProjects(files)[0] || null;
  },

  hasDotnetProject: (files: FileSystem): boolean => {
    return csharpProjectService.findProjects(files).length > 0;
  },

  getCommands: (candidate: DotnetProjectCandidate): DotnetProjectCommands => {
    const target = quote(candidate.path);

    if (candidate.kind === 'source') {
      return { restore: 'dotnet restore', build: 'dotnet build', run: 'dotnet run', test: 'dotnet test' };
    }

    if (candidate.kind === 'solution') {
      return {
        restore: `dotnet restore ${target}`,
        build: `dotnet build ${target}`,
        run: null,
        test: `dotnet test ${target}`
      };
    }

    return {
      restore: `dotnet restore ${target}`,
      build: `dotnet build ${target}`,
      run: `dotnet run --project ${target}`,
      test: `dotnet test ${target}`
    };
  },

  getRecommendedRunCommand: (files: FileSystem): string | null => {
    const project = csharpProjectService.getMainProject(files);
    if (!project) return null;
    const commands = csharpProjectService.getCommands(project);
    return commands.run || commands.build;
  },

  getRecommendedTestCommand: (files: FileSystem): string | null => {
    const project = csharpProjectService.getMainProject(files);
    if (!project) return null;
    return csharpProjectService.getCommands(project).test;
  }
};

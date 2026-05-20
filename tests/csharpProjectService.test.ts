import { describe, expect, it } from 'vitest';
import { csharpProjectService } from '../core/workspace/services/csharpProjectService';
import type { FileSystem } from '../types';

const createFiles = (): FileSystem => ({
  root: {
    id: 'root',
    name: 'root',
    type: 'folder',
    parentId: null,
    childrenIds: ['src', 'solution'] as string[],
    createdAt: Date.now()
  },
  src: {
    id: 'src',
    name: 'src',
    type: 'folder',
    parentId: 'root',
    childrenIds: ['project', 'program'] as string[],
    createdAt: Date.now()
  },
  project: {
    id: 'project',
    name: 'App.csproj',
    type: 'file',
    parentId: 'src',
    childrenIds: [],
    content: '<Project Sdk="Microsoft.NET.Sdk"></Project>',
    createdAt: Date.now()
  },
  program: {
    id: 'program',
    name: 'Program.cs',
    type: 'file',
    parentId: 'src',
    childrenIds: [],
    content: 'Console.WriteLine("Hello");',
    createdAt: Date.now()
  },
  solution: {
    id: 'solution',
    name: 'App.sln',
    type: 'file',
    parentId: 'root',
    childrenIds: [],
    content: '',
    createdAt: Date.now()
  }
});

describe('csharpProjectService', () => {
  it('detects csproj, sln and Program.cs files', () => {
    const projects = csharpProjectService.findProjects(createFiles());

    expect(projects).toHaveLength(3);
    expect(projects[0]).toMatchObject({ name: 'App.csproj', path: 'src/App.csproj', kind: 'project' });
    expect(projects[1]).toMatchObject({ name: 'App.sln', path: 'App.sln', kind: 'solution' });
    expect(projects[2]).toMatchObject({ name: 'Program.cs', path: 'src/Program.cs', kind: 'source' });
  });

  it('generates runnable dotnet commands for csproj', () => {
    const main = csharpProjectService.getMainProject(createFiles());

    expect(main?.kind).toBe('project');
    expect(csharpProjectService.getRecommendedRunCommand(createFiles())).toBe('dotnet run --project "src/App.csproj"');
    expect(main ? csharpProjectService.getCommands(main).build : null).toBe('dotnet build "src/App.csproj"');
  });

  it('returns null when no C# project exists', () => {
    expect(csharpProjectService.getMainProject({})).toBeNull();
    expect(csharpProjectService.getRecommendedRunCommand({})).toBeNull();
  });
});

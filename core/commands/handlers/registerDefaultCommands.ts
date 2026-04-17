import { commandRegistry } from '../registry/commandRegistry';
import { useUIStore } from '../../../stores/uiStore';
import { useWorkspaceStore } from '../../../stores/workspaceStore';
import { useWorkspaceActionDialogStore } from '../../../features/productivity/workspace-actions/store/workspaceActionDialogStore';
import { useConfirmDialogStore } from '../../../features/productivity/workspace-actions/store/confirmDialogStore';
import { workspacePackageService } from '../../../features/productivity/import-export/workspacePackageService';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useTerminalStore } from '../../terminal/store/terminalStore';
import { setTerminalCwd } from '../../../lib/terminalEngine';
import { emitTerminalSetCwd } from '../../../lib/terminalBridge';
import { workspacePathService } from '../../workspace/services/workspacePathService';
import { workspaceSnapshotService } from '../../workspace/services/workspaceSnapshotService';
import { packageJsonService } from '../../workspace/services/packageJsonService';
import { telemetry } from '../../../shared/telemetry';
import { useRuntimeModeStore } from '../../../features/local-runtime/store/runtimeModeStore';
import { useLocalRuntimeStore } from '../../../features/local-runtime/store/localRuntimeStore';
import { useSourceControlStore } from '../../../features/source-control/store/sourceControlStore';

let registered = false;

const runCommand = (id: string, source: 'menu' | 'palette' | 'keyboard' | 'api', payload?: unknown): void => {
  commandRegistry.execute(id, { source, payload }).catch(() => {
    // noop
  });
};

const ensureTerminalReady = (targetId: string): void => {
  const workspace = useWorkspaceStore.getState();
  const ui = useUIStore.getState();
  const terminal = useTerminalStore.getState();
  const localRuntime = useLocalRuntimeStore.getState();
  const absolutePath = workspacePathService.getAbsolutePathForId(workspace.files, targetId);
  const sessionId = terminal.ensureSession();
  setTerminalCwd(targetId, sessionId);
  emitTerminalSetCwd({ terminalId: sessionId, cwd: absolutePath });

  terminal.setActiveSession(sessionId);
  terminal.setSessionCwd(sessionId, absolutePath);
  localRuntime.ensureSession(sessionId, absolutePath);
  localRuntime.setActiveSession(sessionId);
  localRuntime.setSessionCwd(sessionId, absolutePath);

  ui.setPanelOpen(true);
  ui.setActivePanelTab('TERMINAL');
};

export const registerDefaultCommands = (): void => {
  if (registered) return;
  registered = true;

  commandRegistry.register('ui.toggleSidebar', () => {
    useUIStore.getState().toggleSidebar();
  });

  commandRegistry.register('ui.togglePanel', () => {
    useUIStore.getState().togglePanel();
  });

  commandRegistry.register('ui.openExplorer', () => {
    const ui = useUIStore.getState();
    ui.setActiveSidebarView('explorer');
    ui.setSidebarOpen(true);
  });

  commandRegistry.register('ui.openSearch', () => {
    const ui = useUIStore.getState();
    ui.setActiveSidebarView('search');
    ui.setSidebarOpen(true);
  });

  commandRegistry.register('ui.openExtensions', () => {
    const ui = useUIStore.getState();
    ui.setActiveSidebarView('extensions');
    ui.setSidebarOpen(true);
  });

  commandRegistry.register('ui.openGrounding', () => {
    const ui = useUIStore.getState();
    ui.setActiveSidebarView('grounding');
    ui.setSidebarOpen(true);
  });

  commandRegistry.register('ui.openSourceControl', () => {
    const ui = useUIStore.getState();
    ui.setActiveSidebarView('source_control');
    ui.setSidebarOpen(true);
  });

  commandRegistry.register('ui.openChat', () => {
    const ui = useUIStore.getState();
    ui.setActiveRightSidebarView('chat');
    ui.setRightSidebarOpen(true);
  });

  commandRegistry.register('ui.openPreviewRight', () => {
    const ui = useUIStore.getState();
    ui.setActiveRightSidebarView('preview');
    ui.setRightSidebarOpen(true);
  });

  commandRegistry.register('ui.openCapyUniverse', () => {
    const ui = useUIStore.getState();
    ui.setActiveRightSidebarView('capyuniverse');
    ui.setRightSidebarOpen(true);
  });

  commandRegistry.register('ui.openCommandPalette', () => {
    useUIStore.getState().setCommandPalette(true);
  });

  commandRegistry.register('ui.openSnapshots', () => {
    useUIStore.getState().setSnapshotsOpen(true);
  });

  commandRegistry.register('workspace.createFile', () => {
    const workspace = useWorkspaceStore.getState();
    const activeId = workspace.activeTabId;
    const activeNode = activeId ? workspace.files[activeId] : null;
    const parentId = activeNode ? activeNode.parentId || 'root' : 'root';
    useWorkspaceActionDialogStore.getState().openCreateFile(parentId);
  });

  commandRegistry.register('workspace.createFolder', () => {
    const workspace = useWorkspaceStore.getState();
    const activeId = workspace.activeTabId;
    const activeNode = activeId ? workspace.files[activeId] : null;
    const parentId = activeNode ? activeNode.parentId || 'root' : 'root';
    useWorkspaceActionDialogStore.getState().openCreateFolder(parentId);
  });

  commandRegistry.register('workspace.createFileInParent', (ctx) => {
    const payload = (ctx.payload || {}) as { parentId?: string };
    useWorkspaceActionDialogStore.getState().openCreateFile(payload.parentId || 'root');
  });

  commandRegistry.register('workspace.createFolderInParent', (ctx) => {
    const payload = (ctx.payload || {}) as { parentId?: string };
    useWorkspaceActionDialogStore.getState().openCreateFolder(payload.parentId || 'root');
  });

  commandRegistry.register('workspace.renameActive', () => {
    const workspace = useWorkspaceStore.getState();
    if (!workspace.activeTabId) {
      useNotificationStore.getState().addNotification('warning', 'Selecione um arquivo para renomear.');
      return;
    }
    const node = workspace.files[workspace.activeTabId];
    if (!node) {
      useNotificationStore.getState().addNotification('warning', 'Arquivo ativo não encontrado.');
      return;
    }
    useWorkspaceActionDialogStore.getState().openRenameNode(node.id, node.name);
  });

  commandRegistry.register('workspace.renameNode', (ctx) => {
    const payload = (ctx.payload || {}) as { nodeId?: string };
    if (!payload.nodeId) return;
    const workspace = useWorkspaceStore.getState();
    const node = workspace.files[payload.nodeId];
    if (!node) return;
    useWorkspaceActionDialogStore.getState().openRenameNode(node.id, node.name);
  });

  commandRegistry.register('workspace.deleteActive', () => {
    const workspace = useWorkspaceStore.getState();
    if (!workspace.activeTabId) {
      useNotificationStore.getState().addNotification('warning', 'Selecione um arquivo para excluir.');
      return;
    }
    const node = workspace.files[workspace.activeTabId];
    if (!node) {
      useNotificationStore.getState().addNotification('warning', 'Arquivo ativo não encontrado.');
      return;
    }
    useWorkspaceActionDialogStore.getState().openDeleteNode(node.id, node.name);
  });

  commandRegistry.register('workspace.deleteNode', (ctx) => {
    const payload = (ctx.payload || {}) as { nodeId?: string };
    if (!payload.nodeId) return;
    const workspace = useWorkspaceStore.getState();
    const node = workspace.files[payload.nodeId];
    if (!node) return;
    useWorkspaceActionDialogStore.getState().openDeleteNode(node.id, node.name);
  });

  commandRegistry.register('workspace.openNode', (ctx) => {
    const payload = (ctx.payload || {}) as { nodeId?: string };
    if (!payload.nodeId) return;
    const workspace = useWorkspaceStore.getState();
    const node = workspace.files[payload.nodeId];
    if (!node || node.type !== 'file') return;
    workspace.openFile(node.id);
  });

  commandRegistry.register('workspace.toggleFolder', (ctx) => {
    const payload = (ctx.payload || {}) as { nodeId?: string };
    if (!payload.nodeId) return;
    const workspace = useWorkspaceStore.getState();
    const node = workspace.files[payload.nodeId];
    if (!node || node.type !== 'folder') return;
    workspace.toggleFolder(node.id);
  });

  commandRegistry.register('workspace.moveNode', (ctx) => {
    const payload = (ctx.payload || {}) as { nodeId?: string; newParentId?: string };
    if (!payload.nodeId || !payload.newParentId) return;
    useWorkspaceStore.getState().moveNode(payload.nodeId, payload.newParentId);
  });

  commandRegistry.register('workspace.previewNode', (ctx) => {
    const payload = (ctx.payload || {}) as { nodeId?: string };
    if (!payload.nodeId) return;
    const ui = useUIStore.getState();
    ui.setPreviewFileId(payload.nodeId);
    ui.setPanelOpen(true);
    ui.setActivePanelTab('PREVIEW');
  });

  commandRegistry.register('workspace.openInTerminal', (ctx) => {
    const payload = (ctx.payload || {}) as { nodeId?: string };
    const workspace = useWorkspaceStore.getState();
    let targetId = payload.nodeId || 'root';
    const target = workspace.files[targetId];

    if (target && target.type === 'file') {
      targetId = target.parentId || 'root';
    }
    ensureTerminalReady(targetId);
  });

  commandRegistry.register('workspace.syncFromPTY', () => {
    useWorkspaceStore.getState().refreshFromPTY();
  });

  commandRegistry.register('workspace.save', () => {
    useWorkspaceStore.getState().saveAll();
  });

  commandRegistry.register('project.webPreview', () => {
    const ui = useUIStore.getState();
    const runtime = useRuntimeModeStore.getState();
    
    if (runtime.mode === 'local-runtime') {
      useConfirmDialogStore.getState().open({
        title: 'Modo Local Ativo',
        description: 'Deseja usar Web Preview in-browser ou continuar com Runtime Local?',
        confirmLabel: 'Web Preview',
        onConfirm: () => {
          runtime.setMode('online');
          ui.setPanelOpen(true);
          ui.setActivePanelTab('PREVIEW');
          useNotificationStore.getState().addNotification('info', 'Web Preview aberto (in-browser)');
        }
      });
      return;
    }
    
    ui.setPanelOpen(true);
    ui.setActivePanelTab('PREVIEW');
    useNotificationStore.getState().addNotification('info', 'Web Preview aberto');
  });

  const KEYBOARD_SHORTCUTS = [
    { keys: 'Ctrl+B', action: 'Toggle Sidebar' },
    { keys: 'Ctrl+P', action: 'Quick Open File' },
    { keys: 'Ctrl+Shift+P', action: 'Command Palette' },
    { keys: 'Ctrl+`', action: 'Toggle Terminal' },
    { keys: 'Ctrl+S', action: 'Save Workspace (Auto)' },
    { keys: 'Ctrl+N', action: 'New File' },
    { keys: 'Ctrl+Shift+N', action: 'New Folder' },
    { keys: 'Ctrl+W', action: 'Close Tab' },
    { keys: 'Ctrl+Tab', action: 'Next Tab' },
    { keys: 'Ctrl+Shift+Tab', action: 'Previous Tab' },
  ];

  commandRegistry.register('ui.showKeyboardShortcuts', () => {
    const shortcutsList = KEYBOARD_SHORTCUTS.map(s => `${s.keys} → ${s.action}`).join('\n');
    useNotificationStore.getState().addNotification('info', `Atalhos: ${KEYBOARD_SHORTCUTS.length} disponiveis`);
    useConfirmDialogStore.getState().open({
      title: ' Atalhos de Teclado',
      description: shortcutsList,
      confirmLabel: 'Fechar',
      onConfirm: () => {}
    });
  });

  commandRegistry.register('auth.openLogin', () => {
    useUIStore.getState().setAuthOpen(true);
  });

  commandRegistry.register('ui.openSettings', () => {
    useUIStore.getState().setSettingsOpen(true);
  });

  commandRegistry.register('project.runDev', () => {
    const ui = useUIStore.getState();
    const runtime = useRuntimeModeStore.getState();
    const workspace = useWorkspaceStore.getState();
    
    const scripts = packageJsonService.parseScripts(workspace.files);
    const recommended = packageJsonService.getRecommendedScript(scripts);
    
    const handleRun = (command: string) => {
      emitTerminalSendCommand({ command });
      ui.setPanelOpen(true);
      ui.setActivePanelTab(command.includes('dev') || command.includes('preview') ? 'PREVIEW' : 'TERMINAL');
      useNotificationStore.getState().addNotification('info', `Executando ${command}...`);
    };
    
    if (runtime.mode !== 'local-runtime') {
      ui.setPanelOpen(true);
      ui.setActivePanelTab('PREVIEW');
      useNotificationStore.getState().addNotification('info', 'Web Preview aberto (modo in-browser). Clique em Run Project para ver opcoes.');
      return;
    }
    
    if (recommended) {
      useNotificationStore.getState().addNotification('info', `Executando npm run ${recommended.name}...`);
      handleRun(`npm run ${recommended.name}`);
      telemetry.trackFeature('project_run', { script: recommended.name });
    } else {
      useNotificationStore.getState().addNotification('warning', 'Nenhum script npm encontrado no package.json');
    }
  });

  commandRegistry.register('project.runTest', () => {
    const ui = useUIStore.getState();
    const runtime = useRuntimeModeStore.getState();
    
    if (runtime.mode !== 'local-runtime') {
      useConfirmDialogStore.getState().open({
        title: 'Modo Local Necessario',
        description: 'Run Test requer o modo local-runtime. Deseja ativar?',
        confirmLabel: 'Ativar',
        onConfirm: () => {
          runtime.setMode('local-runtime');
          setTimeout(() => {
            emitTerminalSendCommand({ command: 'npm test' });
            ui.setPanelOpen(true);
            ui.setActivePanelTab('TERMINAL');
          }, 500);
        }
      });
      return;
    }
    
    emitTerminalSendCommand({ command: 'npm test' });
    ui.setPanelOpen(true);
    ui.setActivePanelTab('TERMINAL');
  });

  commandRegistry.register('snapshot.create', async () => {
    const files = useWorkspaceStore.getState().files;
    try {
      await workspaceSnapshotService.createManual(files);
      useNotificationStore.getState().addNotification('success', 'Snapshot created');
      telemetry.trackAction('snapshot_create');
    } catch {
      useNotificationStore.getState().addNotification('error', 'Failed to create snapshot');
      telemetry.trackError('snapshot_create_failed');
    }
  });

  commandRegistry.register('snapshot.createManual', async () => {
    const workspace = useWorkspaceStore.getState();
    useConfirmDialogStore.getState().open({
      title: 'Criar Snapshot',
      description: 'Criar um snapshot manual do workspace atual?',
      confirmLabel: 'Criar',
      onConfirm: async () => {
        try {
          await workspaceSnapshotService.createManual(workspace.files);
          useNotificationStore.getState().addNotification('success', 'Snapshot criado com sucesso');
        } catch {
          useNotificationStore.getState().addNotification('error', 'Falha ao criar snapshot');
        }
      }
    });
  });

  commandRegistry.register('snapshot.restore', async (payload: { snapshotId: string }) => {
    const snapshotId = payload?.snapshotId;
    if (!snapshotId) {
      useNotificationStore.getState().addNotification('warning', 'Snapshot ID required');
      return;
    }
    const snapshotFiles = await workspaceSnapshotService.restoreSnapshot(snapshotId);
    if (!snapshotFiles) {
      useNotificationStore.getState().addNotification('error', 'Snapshot not found');
      return;
    }
    useConfirmDialogStore.getState().open({
      title: 'Restaurar Snapshot',
      description: 'Isso ira substituir o workspace atual. Deseja continuar?',
      confirmLabel: 'Restaurar',
      onConfirm: () => {
        useWorkspaceStore.getState().importWorkspaceData(snapshotFiles);
        useNotificationStore.getState().addNotification('success', 'Workspace restaurado');
      }
    });
  });

  commandRegistry.register('workspace.exportZip', () => {
    const files = useWorkspaceStore.getState().files;
    workspacePackageService.exportZip(files);
  });

  commandRegistry.register('workspace.reload', () => {
    useConfirmDialogStore.getState().open({
      title: 'Recarregar Workspace',
      description:
        'Recarregar pode descartar alteracoes nao sincronizadas. Exporte o workspace antes de continuar.',
      confirmLabel: 'Recarregar',
      onConfirm: () => {
        window.location.reload();
      }
    });
  });

  commandRegistry.register('workspace.close', () => {
    useConfirmDialogStore.getState().open({
      title: 'Fechar Workspace',
      description: 'Deseja fechar o workspace atual? Alteracoes nao salvas serao perdidas.',
      confirmLabel: 'Fechar',
      danger: true,
      onConfirm: () => useWorkspaceStore.getState().closeWorkspace()
    });
  });

  commandRegistry.register('panel.openPreview', () => {
    const ui = useUIStore.getState();
    ui.setPanelOpen(true);
    ui.setActivePanelTab('PREVIEW');
  });

  commandRegistry.register('panel.openTerminal', () => {
    const ui = useUIStore.getState();
    useTerminalStore.getState().ensureSession();
    ui.setPanelOpen(true);
    ui.setActivePanelTab('TERMINAL');
  });

  commandRegistry.register('panel.toggleTerminal', () => {
    const ui = useUIStore.getState();
    if (!ui.isPanelOpen) {
      useTerminalStore.getState().ensureSession();
      ui.setPanelOpen(true);
      ui.setActivePanelTab('TERMINAL');
      return;
    }
    if (ui.activePanelTab !== 'TERMINAL') {
      useTerminalStore.getState().ensureSession();
      ui.setActivePanelTab('TERMINAL');
      return;
    }
    ui.setPanelOpen(false);
  });

  commandRegistry.register('runtime.activateLocal', () => {
    const language = useUIStore.getState().language;
    useRuntimeModeStore.getState().requestActivation({
      requestedBy: 'Command',
      actionLabel: language === 'pt' ? 'Ativar Modo Runtime Local' : 'Activate Local Runtime Mode'
    });
  });

  commandRegistry.register('runtime.disconnect', () => {
    useRuntimeModeStore.getState().requestDisconnect();
  });

  commandRegistry.register('runtime.stopCurrentProcess', () => {
    const activeSession = useTerminalStore.getState().activeSessionId;
    useLocalRuntimeStore.getState().stopCurrentProcess(activeSession);
  });

  commandRegistry.register('runtime.stopAllProcesses', () => {
    useLocalRuntimeStore.getState().stopAllProcesses();
  });

  commandRegistry.register('sourceControl.refresh', () => {
    void useSourceControlStore.getState().refreshStatus();
  });

  commandRegistry.register('templates.scaffoldDocs', () => {
    const workspace = useWorkspaceStore.getState();
    const notification = useNotificationStore.getState();
    const docsFiles: Array<{ path: string; content: string }> = [
      {
        path: 'docs/README.md',
        content:
          '# Project Docs\n\n## Overview\nDescribe your project scope and goals.\n\n## Modules\n- core\n- features\n- platform\n'
      },
      {
        path: 'docs/ARCHITECTURE.md',
        content:
          '# Architecture\n\n## Boundaries\n- UI -> Commands -> Store -> Services -> Adapters\n\n## Decisions\nDocument main technical decisions and trade-offs.\n'
      },
      {
        path: 'docs/DECISIONS.md',
        content:
          '# Architecture Decisions\n\n## ADR-001\n- Context:\n- Decision:\n- Consequences:\n'
      }
    ];

    let createdCount = 0;
    docsFiles.forEach((file) => {
      const existing = workspace.getFileByPath(file.path);
      if (existing) return;
      workspace.createFileByPath(file.path, file.content);
      createdCount += 1;
    });

    if (createdCount === 0) {
      notification.addNotification('info', 'Arquivos de docs já existem.');
      return;
    }

    notification.addNotification('success', `${createdCount} arquivo(s) de documentação criados.`);
  });

  commandRegistry.register('templates.applyCommunityTemplate', (ctx) => {
    const payload = (ctx.payload || {}) as { fileName?: string; content?: string };
    const fileName = payload.fileName?.trim();
    if (!fileName) return;

    const workspace = useWorkspaceStore.getState();
    workspace.createFileByPath(fileName, payload.content || '');
    useNotificationStore.getState().addNotification('success', `Template aplicado: ${fileName}`);
  });

  commandRegistry.register('templates.list', () => {
    // This would show a list of available templates
    useNotificationStore.getState().addNotification('info', 'Use templates via contexto ou Command Palette');
  });

  commandRegistry.register('templates.applyQuickStart', (ctx) => {
    const payload = (ctx.payload || {}) as { templateId?: string };
    const templateId = payload?.templateId;
    
    if (!templateId) {
      useNotificationStore.getState().addNotification('warning', 'Template ID requerido');
      return;
    }

    const templates: Record<string, Array<{ path: string; content: string }>> = {
      'react-basic': [
        { path: 'src/main.tsx', content: "import { createRoot } from 'react-dom/client';\nimport { App } from './App';\n\ncreateRoot(document.getElementById('root')!).render(<App />);\n" },
        { path: 'src/App.tsx', content: "export const App = () => <h1>Hello CapyUNI</h1>;\n" },
        { path: 'src/index.html', content: '<!doctype html><html><body><div id="root"></div></body></html>' }
      ],
      'node-cli': [
        { path: 'src/index.ts', content: "console.log('CapyUNI CLI ready');\n" }
      ]
    };
    
    const template = templates[templateId];
    if (!template) {
      useNotificationStore.getState().addNotification('error', 'Template nao encontrado');
      return;
    }

    const workspace = useWorkspaceStore.getState();
    let created = 0;
    template.forEach(file => {
      const existing = workspace.getFileByPath(file.path);
      if (!existing) {
        workspace.createFileByPath(file.path, file.content);
        created++;
      }
    });
    
    useNotificationStore.getState().addNotification('success', `${created} arquivo(s) criado(s) com template`);
    telemetry.trackFeature('template_apply', { templateId });
  });

  commandRegistry.register('templates.addPlaybook', (ctx) => {
    const payload = (ctx.payload || {}) as { slug?: string };
    const slug = payload.slug?.trim();
    if (!slug) return;

    const path = `PLAYBOOK_${slug}.md`;
    const content = `# Playbook: ${slug}\n\n## Goal\n\n## Steps\n1. \n2. \n3. \n\n## Notes\n`;
    useWorkspaceStore.getState().createFileByPath(path, content);
    useNotificationStore.getState().addNotification('success', `Playbook criado: ${path}`);
  });
};

export const executeMenuCommand = (id: string, payload?: unknown): void => {
  runCommand(id, 'menu', payload);
};

export const executePaletteCommand = (id: string, payload?: unknown): void => {
  runCommand(id, 'palette', payload);
};

export const executeAppCommand = (id: string, payload?: unknown): void => {
  runCommand(id, 'api', payload);
};

export const executeContextCommand = (id: string, payload?: unknown): void => {
  runCommand(id, 'api', payload);
};

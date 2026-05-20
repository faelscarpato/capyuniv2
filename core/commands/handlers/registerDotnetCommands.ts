import { commandRegistry } from '../registry/commandRegistry';
import { useUIStore } from '../../../stores/uiStore';
import { useWorkspaceStore } from '../../../stores/workspaceStore';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useTerminalStore } from '../../terminal/store/terminalStore';
import { useRuntimeModeStore } from '../../../features/local-runtime/store/runtimeModeStore';
import { emitTerminalSendCommand } from '../../../lib/terminalBridge';
import { csharpProjectService } from '../../workspace/services/csharpProjectService';

let registered = false;

const ensureLocalRuntime = (): boolean => {
  const runtime = useRuntimeModeStore.getState();
  const language = useUIStore.getState().language;

  if (runtime.mode === 'local-runtime') return true;

  runtime.requestActivation({
    requestedBy: 'C# / .NET',
    actionLabel: language === 'pt' ? 'Ativar Runtime Local para C#' : 'Activate Local Runtime for C#'
  });

  useNotificationStore.getState().addNotification(
    'info',
    language === 'pt'
      ? 'Ative o Runtime Local e execute novamente o comando C#/.NET.'
      : 'Activate Local Runtime and run the C#/.NET command again.'
  );

  return false;
};

const openTerminal = (): void => {
  const ui = useUIStore.getState();
  const terminal = useTerminalStore.getState();

  terminal.ensureSession();
  ui.setPanelOpen(true);
  ui.setActivePanelTab('TERMINAL');
};

const runDotnetCommand = (command: string | null, successMessage: string, missingMessage: string): void => {
  if (!command) {
    useNotificationStore.getState().addNotification('warning', missingMessage);
    return;
  }

  if (!ensureLocalRuntime()) return;

  openTerminal();
  emitTerminalSendCommand({ command: command.endsWith('\r') ? command : `${command}\r` });
  useNotificationStore.getState().addNotification('info', successMessage);
};

export const registerDotnetCommands = (): void => {
  if (registered) return;
  registered = true;

  commandRegistry.register('project.dotnetRun', () => {
    const files = useWorkspaceStore.getState().files;
    const command = csharpProjectService.getRecommendedRunCommand(files);

    runDotnetCommand(
      command,
      `Executando ${command || 'dotnet'}...`,
      'Nenhum projeto C# encontrado. Abra/importe um .csproj, .sln ou Program.cs.'
    );
  });

  commandRegistry.register('project.dotnetBuild', () => {
    const project = csharpProjectService.getMainProject(useWorkspaceStore.getState().files);
    const command = project ? csharpProjectService.getCommands(project).build : null;

    runDotnetCommand(
      command,
      `Executando ${command || 'dotnet build'}...`,
      'Nenhum projeto C# encontrado para build.'
    );
  });

  commandRegistry.register('project.dotnetRestore', () => {
    const project = csharpProjectService.getMainProject(useWorkspaceStore.getState().files);
    const command = project ? csharpProjectService.getCommands(project).restore : null;

    runDotnetCommand(
      command,
      `Executando ${command || 'dotnet restore'}...`,
      'Nenhum projeto C# encontrado para restore.'
    );
  });

  commandRegistry.register('project.dotnetTest', () => {
    const files = useWorkspaceStore.getState().files;
    const command = csharpProjectService.getRecommendedTestCommand(files);

    runDotnetCommand(
      command,
      `Executando ${command || 'dotnet test'}...`,
      'Nenhum projeto C# encontrado para testes.'
    );
  });
};

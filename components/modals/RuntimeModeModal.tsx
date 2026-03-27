import React from 'react';
import { Icon } from '../ui/Icon';
import { useRuntimeModeStore } from '../../features/local-runtime/store/runtimeModeStore';
import { useUIStore } from '../../stores/uiStore';

export const RuntimeModeModal: React.FC = () => {
  const {
    isActivationModalOpen,
    activationRequest,
    isDisconnectModalOpen,
    acceptActivation,
    rejectActivation,
    cancelDisconnect,
    confirmDisconnect
  } = useRuntimeModeStore();
  const { language } = useUIStore();
  const tt = (pt: string, en: string) => (language === 'pt' ? pt : en);

  if (!isActivationModalOpen && !isDisconnectModalOpen) return null;

  if (isActivationModalOpen) {
    return (
      <div
        className="fixed inset-0 z-[180] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={rejectActivation}
      >
        <div
          className="w-full max-w-[620px] bg-ide-activity border border-ide-border rounded-2xl p-6 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{tt('Ativar Runtime Local', 'Activate Local Runtime')}</h3>
              <p className="text-sm text-ide-muted mt-1">
                {tt(
                  'O Modo Runtime Local é separado do ambiente controlado do Online IDE.',
                  'Local Runtime Mode is separate from the controlled Online IDE environment.'
                )}
              </p>
            </div>
            <button onClick={rejectActivation} className="text-ide-muted hover:text-white transition-colors">
              <Icon name="X" size={18} />
            </button>
          </div>

          <div className="space-y-3 text-sm text-ide-muted mb-6">
            <p className="text-white/90 font-medium">
              {tt(
                'Você está habilitando seu ambiente local real com execução completa de comandos.',
                'You are enabling your real local environment with full command execution.'
              )}
            </p>
            <p>{tt('- Comandos reais de terminal local (Node/npm/pnpm/yarn/git/npx/vite/next)', '- Real local terminal commands (Node/npm/pnpm/yarn/git/npx/vite/next)')}</p>
            <p>{tt('- Acesso real ao sistema de arquivos local', '- Real local file system access')}</p>
            <p>{tt('- Preview real em localhost para servidores locais', '- Real localhost preview for local servers')}</p>
            <p>{tt('- Integração real com Git local e fluxos de clone para local', '- Real local Git integration and clone-to-local workflows')}</p>
            <p className="text-amber-300/90">
              {tt(
                'O CapyUNI não expõe hosts de rede públicos automaticamente. O runtime local permanece na sua máquina.',
                'CapyUNI will not auto-expose public network hosts. Local runtime remains on your machine.'
              )}
            </p>
          </div>

          {activationRequest?.actionLabel && (
            <div className="mb-5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-ide-muted">
              {tt('Ação solicitada', 'Requested action')}: <span className="text-white">{activationRequest.actionLabel}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={rejectActivation}
              className="px-3 py-2 text-sm rounded-lg border border-ide-border text-ide-muted hover:text-white hover:border-white/20 transition-colors"
            >
              {tt('Permanecer no Online IDE', 'Stay in Online IDE')}
            </button>
            <button
              onClick={acceptActivation}
              className="px-3 py-2 text-sm rounded-lg font-semibold bg-ide-accent hover:bg-opacity-90 text-white transition-colors"
            >
              {tt('Ativar Runtime Local', 'Activate Local Runtime')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={cancelDisconnect}
    >
      <div
        className="w-full max-w-[640px] bg-ide-activity border border-ide-border rounded-2xl p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">{tt('Desconectar Runtime Local', 'Disconnect Local Runtime')}</h3>
            <p className="text-sm text-ide-muted mt-1">{tt('Escolha como os processos locais devem ser tratados.', 'Choose how local processes should be handled.')}</p>
          </div>
          <button onClick={cancelDisconnect} className="text-ide-muted hover:text-white transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6 text-sm">
          <button
            onClick={() => confirmDisconnect('keep-processes')}
            className="rounded-xl border border-ide-border px-3 py-3 text-left hover:border-white/30 transition-colors"
          >
            <div className="font-semibold text-white">{tt('Manter Processos', 'Keep Processes')}</div>
            <div className="text-ide-muted text-xs mt-1">{tt('Voltar ao modo Online IDE mantendo os processos locais atuais em execução.', 'Return to Online IDE Mode but keep current local processes running.')}</div>
          </button>
          <button
            onClick={() => confirmDisconnect('kill-current')}
            className="rounded-xl border border-ide-border px-3 py-3 text-left hover:border-white/30 transition-colors"
          >
            <div className="font-semibold text-white">{tt('Parar Processo Atual', 'Stop Current Process')}</div>
            <div className="text-ide-muted text-xs mt-1">{tt('Enviar interrupção para o processo local ativo do terminal.', 'Send interrupt to the active local terminal process.')}</div>
          </button>
          <button
            onClick={() => confirmDisconnect('kill-all')}
            className="rounded-xl border border-red-500/40 px-3 py-3 text-left hover:border-red-400 transition-colors"
          >
            <div className="font-semibold text-red-300">{tt('Parar Todos os Processos Locais', 'Stop All Local Processes')}</div>
            <div className="text-ide-muted text-xs mt-1">{tt('Interromper todas as sessões conhecidas de terminal antes de desconectar.', 'Interrupt all known terminal sessions before disconnecting.')}</div>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={cancelDisconnect}
            className="px-3 py-2 text-sm rounded-lg border border-ide-border text-ide-muted hover:text-white hover:border-white/20 transition-colors"
          >
            {tt('Cancelar', 'Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

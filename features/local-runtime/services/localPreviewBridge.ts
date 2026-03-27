import { runtimeSessionService } from './runtimeSessionService';
import { useLocalPreviewStore } from '../store/localPreviewStore';

export const localPreviewBridge = {
  ingestTerminalOutput: (chunk: string): void => {
    const urls = runtimeSessionService.extractLocalPreviewUrls(chunk);
    if (urls.length === 0) return;
    useLocalPreviewStore.getState().registerDetectedUrls(urls);
  }
};


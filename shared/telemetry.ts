export type TelemetryEvent = {
  name: string;
  timestamp: number;
  payload?: Record<string, unknown>;
};

const TELEMETRY_KEY = 'capy_telemetry_v1';
const MAX_EVENTS = 100;

export const telemetry = {
  track: (name: string, payload?: Record<string, unknown>): void => {
    try {
      const event: TelemetryEvent = {
        name,
        timestamp: Date.now(),
        payload
      };
      
      const existing = localStorage.getItem(TELEMETRY_KEY);
      const events: TelemetryEvent[] = existing ? JSON.parse(existing) : [];
      
      events.push(event);
      
      if (events.length > MAX_EVENTS) {
        events.splice(0, events.length - MAX_EVENTS);
      }
      
      localStorage.setItem(TELEMETRY_KEY, JSON.stringify(events));
    } catch {
      // Silently fail - telemetry should never break the app
    }
  },

  getEvents: (): TelemetryEvent[] => {
    try {
      const existing = localStorage.getItem(TELEMETRY_KEY);
      return existing ? JSON.parse(existing) : [];
    } catch {
      return [];
    }
  },

  clear: (): void => {
    localStorage.removeItem(TELEMETRY_KEY);
  },

  trackAction: (action: string, details?: Record<string, unknown>): void => {
    telemetry.track(`action_${action}`, details);
  },

  trackFeature: (feature: string, details?: Record<string, unknown>): void => {
    telemetry.track(`feature_${feature}`, details);
  },

  trackError: (error: string, details?: Record<string, unknown>): void => {
    telemetry.track(`error_${error}`, details);
  }
};
// Performance monitoring utilities
export const performanceMonitor = {
  start: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
    }
  },

  end: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-end`);
      try {
        performance.measure(label, `${label}-start`, `${label}-end`);
        const measure = performance.getEntriesByName(label)[0];
        console.log(`Performance: ${label} took ${measure.duration}ms`);
      } catch (e) {
        // Measurement failed
      }
    }
  },

  measure: (label: string, fn: () => void) => {
    performanceMonitor.start(label);
    fn();
    performanceMonitor.end(label);
  }
};
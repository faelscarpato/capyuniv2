import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    getCLS(onPerfEntry);
    getFID(onPerfEntry);
    getFCP(onPerfEntry);
    getLCP(onPerfEntry);
    getTTFB(onPerfEntry);
  }
};

// Usage in main.tsx
if (typeof window !== 'undefined') {
  reportWebVitals((metric) => {
    console.log('Web Vitals:', metric);
    // Send to analytics service
  });
}
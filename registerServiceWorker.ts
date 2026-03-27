// CapyUNI IDE - Service worker registration helper
export default function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      void (async () => {
        try {
          const response = await fetch('/service-worker.js', { cache: 'no-store' });
          const contentType = response.headers.get('content-type') || '';
          if (!response.ok || (!contentType.includes('javascript') && !contentType.includes('ecmascript'))) {
            console.warn('Service worker skipped: /service-worker.js is missing or not a JavaScript file.');
            return;
          }

          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('Service worker registered:', registration);
        } catch (error) {
          console.error('Service worker registration failed:', error);
        }
      })();
    });
  }
}

import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

export const useDynamicTheme = () => {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Detect system preference
  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

      const handleChange = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (error) {
      console.warn('System theme detection failed:', error);
      setSystemTheme('light');
    }
  }, []);

  // Update hour every minute
  useEffect(() => {
    const updateHour = () => setCurrentHour(new Date().getHours());
    updateHour();

    const interval = setInterval(updateHour, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Determine theme based on time and system preference
  const getDynamicTheme = (): 'light' | 'dark' => {
    // Night hours: 18:00 to 06:00
    const isNightTime = currentHour >= 18 || currentHour < 6;

    if (isNightTime) {
      return 'dark';
    }

    // Day time: respect system preference, default to light
    return systemTheme === 'dark' ? 'dark' : 'light';
  };

  return {
    theme: getDynamicTheme(),
    systemTheme,
    currentHour,
    isNightTime: currentHour >= 18 || currentHour < 6
  };
};
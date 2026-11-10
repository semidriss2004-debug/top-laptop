import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeConfig, ThemeId, ThemeSettings } from '../types';
import { THEMES_LIST, DEFAULT_ROTATION_ORDER } from '../themes/themesConfig';

interface ThemeContextType {
  activeTheme: ThemeConfig;
  activeThemeId: ThemeId;
  previewThemeId: ThemeId | null;
  setTheme: (themeId: ThemeId) => void;
  startPreview: (themeId: ThemeId) => void;
  stopPreview: () => void;
  themeSettings: ThemeSettings;
  updateThemeSettings: (settings: Partial<ThemeSettings>) => void;
  allThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_theme_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      activeThemeId: 'cyber-neon',
      autoRotateWeekly: true,
      rotationOrder: DEFAULT_ROTATION_ORDER,
      lastRotatedDate: new Date().toISOString()
    };
  });

  const [previewThemeId, setPreviewThemeId] = useState<ThemeId | null>(null);

  // Check Weekly Auto Rotation
  useEffect(() => {
    if (themeSettings.autoRotateWeekly && themeSettings.rotationOrder.length > 1) {
      const lastDate = themeSettings.lastRotatedDate ? new Date(themeSettings.lastRotatedDate) : new Date(0);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays >= 7) {
        const currentIndex = themeSettings.rotationOrder.indexOf(themeSettings.activeThemeId);
        const nextIndex = (currentIndex + 1) % themeSettings.rotationOrder.length;
        const nextTheme = themeSettings.rotationOrder[nextIndex];

        setThemeSettings(prev => {
          const updated = {
            ...prev,
            activeThemeId: nextTheme,
            lastRotatedDate: now.toISOString()
          };
          localStorage.setItem('top_laptop_theme_settings', JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [themeSettings.autoRotateWeekly, themeSettings.rotationOrder, themeSettings.activeThemeId, themeSettings.lastRotatedDate]);

  // Persist theme settings
  useEffect(() => {
    try {
      localStorage.setItem('top_laptop_theme_settings', JSON.stringify(themeSettings));
    } catch (e) {
      console.error(e);
    }
  }, [themeSettings]);

  const effectiveThemeId = previewThemeId || themeSettings.activeThemeId;
  const activeTheme = THEMES_LIST.find(t => t.id === effectiveThemeId) || THEMES_LIST[0];

  // Apply theme CSS variables to :root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', activeTheme.id);
    root.style.setProperty('--color-primary', activeTheme.primaryColor);
    root.style.setProperty('--color-accent', activeTheme.accentColor);
    root.style.setProperty('--color-bg', activeTheme.bgColor);
    root.style.setProperty('--color-card-bg', activeTheme.cardBgColor);
    root.style.setProperty('--color-border', activeTheme.borderColor);
    root.style.setProperty('--glow-effect', activeTheme.glowEffect);
  }, [activeTheme]);

  const setTheme = (themeId: ThemeId) => {
    setThemeSettings(prev => ({
      ...prev,
      activeThemeId: themeId,
      lastRotatedDate: new Date().toISOString()
    }));
    setPreviewThemeId(null);
  };

  const startPreview = (themeId: ThemeId) => {
    setPreviewThemeId(themeId);
  };

  const stopPreview = () => {
    setPreviewThemeId(null);
  };

  const updateThemeSettings = (newSettings: Partial<ThemeSettings>) => {
    setThemeSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        activeThemeId: themeSettings.activeThemeId,
        previewThemeId,
        setTheme,
        startPreview,
        stopPreview,
        themeSettings,
        updateThemeSettings,
        allThemes: THEMES_LIST
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

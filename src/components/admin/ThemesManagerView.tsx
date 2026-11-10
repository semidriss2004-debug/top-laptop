import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { ThemeId } from '../../types';
import { 
  Palette, 
  Check, 
  Eye, 
  RotateCw, 
  Sparkles, 
  ArrowRight, 
  Layers 
} from 'lucide-react';

export const ThemesManagerView: React.FC = () => {
  const { 
    activeTheme, 
    activeThemeId, 
    setTheme, 
    themeSettings, 
    updateThemeSettings, 
    allThemes,
    startPreview,
    stopPreview,
    previewThemeId
  } = useTheme();

  const { t, language } = useLanguage();
  const [rotationOrder, setRotationOrder] = useState<ThemeId[]>(themeSettings.rotationOrder);

  const handleToggleAutoRotate = () => {
    updateThemeSettings({ autoRotateWeekly: !themeSettings.autoRotateWeekly });
  };

  const moveThemeInOrder = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...rotationOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setRotationOrder(newOrder);
    updateThemeSettings({ rotationOrder: newOrder });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Weekly Rotation Controls */}
      <div className="bg-[#080F1C] p-5 rounded-2xl border border-blue-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-cyan-400" />
              <span>Gestion des Thèmes Visuels & Identité de Marque</span>
            </h3>
            <p className="text-xs text-slate-400">
              Basculez entre 6 thèmes exclusifs conçus pour TOP LAPTOP avec maintien strict du logo officiel et rotation hebdomadaire automatique.
            </p>
          </div>

          {/* Auto Rotation Switch */}
          <div className="flex items-center gap-3 bg-[#050A14] px-4 py-2.5 rounded-xl border border-blue-900/60">
            <RotateCw className={`w-4 h-4 text-cyan-400 ${themeSettings.autoRotateWeekly ? 'animate-spin' : ''}`} />
            <div>
              <div className="text-xs font-bold text-white">Rotation Hebdomadaire</div>
              <div className="text-[10px] text-slate-400">Change automatiquement chaque semaine</div>
            </div>
            <button
              onClick={handleToggleAutoRotate}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ms-2 ${
                themeSettings.autoRotateWeekly ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform transform mt-1 ${
                  themeSettings.autoRotateWeekly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Live Preview Notification Bar */}
        {previewThemeId && (
          <div className="p-3 bg-cyan-950/80 border border-cyan-400 text-cyan-200 text-xs rounded-xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>
                Mode prévisualisation actif : <strong>{allThemes.find(t => t.id === previewThemeId)?.nameFr}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(previewThemeId)}
                className="px-3 py-1 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-lg text-xs"
              >
                Appliquer définitivement
              </button>
              <button
                onClick={stopPreview}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs hover:text-white"
              >
                Quitter l'aperçu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {allThemes.map(theme => {
          const isActive = theme.id === activeThemeId;
          const isPreviewing = theme.id === previewThemeId;

          return (
            <div
              key={theme.id}
              className={`relative rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                isActive
                  ? 'border-cyan-400 bg-[#0A1428] shadow-[0_0_30px_rgba(0,140,255,0.3)] ring-2 ring-cyan-400/50'
                  : 'border-blue-900/40 bg-[#080F1C] hover:border-slate-600'
              }`}
            >
              {/* Theme Color Showcase Strip */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span 
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                    <span 
                      className="w-4 h-4 rounded-full border border-slate-700 shadow-sm"
                      style={{ backgroundColor: theme.bgColor }}
                    />
                  </div>

                  {isActive && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Actif</span>
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-base font-black text-white">
                    {language === 'ar' ? theme.nameAr : theme.nameFr}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {language === 'ar' ? theme.descriptionAr : theme.descriptionFr}
                  </p>
                </div>

                {/* Micro Component Preview */}
                <div 
                  className="p-3 rounded-xl border text-xs space-y-2"
                  style={{ backgroundColor: theme.cardBgColor, borderColor: theme.borderColor }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold" style={{ color: theme.textColor }}>TOP LAPTOP</span>
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                    >
                      APERÇU BOUTON
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden bg-black/40">
                    <div 
                      className="h-full rounded-full"
                      style={{ width: '70%', backgroundColor: theme.primaryColor }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-blue-900/30 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => startPreview(theme.id)}
                  className="px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Prévisualiser</span>
                </button>

                <button
                  type="button"
                  disabled={isActive}
                  onClick={() => setTheme(theme.id)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 cursor-default'
                      : 'bg-blue-600 hover:bg-cyan-500 hover:text-black text-white shadow-md'
                  }`}
                >
                  {isActive ? 'Thème En Cours' : 'Activer ce Thème'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rotation Order Configuration */}
      <div className="bg-[#080F1C] p-5 rounded-2xl border border-blue-900/40 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Ordre de Rotation Automatique des Thèmes</span>
        </h4>
        <p className="text-xs text-slate-400">
          Définissez l'ordre chronologique des thèmes qui se succéderont chaque semaine.
        </p>

        <div className="space-y-2">
          {rotationOrder.map((themeId, idx) => {
            const th = allThemes.find(t => t.id === themeId);
            return (
              <div
                key={themeId}
                className="flex items-center justify-between bg-[#050A14] p-3 rounded-xl border border-blue-900/30 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-950 border border-blue-800 text-cyan-300 flex items-center justify-center font-mono font-bold text-xs">
                    {idx + 1}
                  </span>
                  <span 
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: th?.primaryColor }}
                  />
                  <span className="font-bold text-white">{th?.nameFr}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveThemeInOrder(idx, 'up')}
                    className="px-2 py-1 bg-blue-950 text-slate-300 hover:text-white rounded disabled:opacity-30"
                  >
                    ↑ Monter
                  </button>
                  <button
                    disabled={idx === rotationOrder.length - 1}
                    onClick={() => moveThemeInOrder(idx, 'down')}
                    className="px-2 py-1 bg-blue-950 text-slate-300 hover:text-white rounded disabled:opacity-30"
                  >
                    ↓ Descendre
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

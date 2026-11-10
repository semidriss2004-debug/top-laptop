import React, { useState } from 'react';
import { Logo } from './Logo';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ShoppingCart, 
  Search, 
  Languages, 
  ShieldCheck, 
  Menu, 
  X, 
  Laptop, 
  Gamepad2, 
  Briefcase, 
  Sparkles,
  Key,
  Truck 
} from 'lucide-react';

interface HeaderProps {
  onOpenAdmin: () => void;
  onOpenTracking: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedCondition: string;
  setSelectedCondition: (cond: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdmin,
  onOpenTracking,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedCondition,
  setSelectedCondition,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { activeTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#080F1C]/95 backdrop-blur-md border-b border-blue-900/40">
      {/* Top micro banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900/60 to-black px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs text-slate-300 border-b border-blue-900/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="flex h-2 w-2 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="font-medium text-cyan-300 truncate hidden md:inline">{t('badgeOfficialStore')}</span>
            <span className="font-bold text-blue-400 md:hidden">🇩🇿 69 Wilayas</span>
            <span className="hidden lg:inline text-slate-500">•</span>
            <span className="hidden lg:inline text-slate-400">{t('slogan')}</span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs font-semibold flex-shrink-0">
            {/* Order Tracking Button */}
            <button
              onClick={onOpenTracking}
              className="flex items-center gap-1 text-cyan-400 hover:text-white transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>{language === 'ar' ? 'تتبع طلبيتي' : 'Suivre ma commande'}</span>
            </button>

            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-blue-400">🇩🇿 69 Wilayas Express</span>
            <span className="text-slate-600">|</span>

            {/* Admin Portal Shortcut */}
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>{t('adminPortal')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo - Official and consistent across all themes */}
        <a href="#" className="flex-shrink-0 cursor-pointer">
          <Logo size="sm" className="sm:hidden" />
          <Logo size="md" className="hidden sm:flex" />
        </a>

        {/* Live Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-[#050505]/80 text-sm text-white placeholder-slate-500 rounded-xl ps-10 pe-4 py-2 border border-blue-900/50 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1B33] border border-blue-800/40 hover:border-cyan-400/60 text-xs font-bold text-slate-200 transition-all"
            title="Changer la langue / تغيير اللغة"
          >
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'fr' ? 'العربية' : 'Français'}</span>
            <span className="text-[10px] text-cyan-300 font-mono bg-blue-950/80 px-1 py-0.5 rounded">
              {language.toUpperCase()}
            </span>
          </button>

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-white font-bold text-sm shadow-lg transition-all transform active:scale-95 cursor-pointer"
            style={{ 
              background: `linear-gradient(135deg, ${activeTheme.primaryColor}, ${activeTheme.accentColor})`,
              boxShadow: activeTheme.glowEffect
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">{t('cart')}</span>
            {totalItemsCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-black bg-white text-blue-950 rounded-full shadow-sm animate-pulse">
                {totalItemsCount}
              </span>
            )}
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#0F1B33] text-slate-300 hover:text-white border border-blue-900/40"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Category Quick Ribbon (Swipeable on Mobile & Desktop) */}
      <div className="bg-[#050B16] border-t border-blue-950/70 px-3 sm:px-4 py-2 block">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto text-xs font-medium no-scrollbar whitespace-nowrap">
          <button
            onClick={() => { setSelectedCategory('all'); setSelectedCondition('all'); }}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedCategory === 'all' && selectedCondition === 'all'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('catAll')}</span>
          </button>

          <button
            onClick={() => { setSelectedCategory('gaming'); }}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedCategory === 'gaming'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('catGaming')}</span>
          </button>

          <button
            onClick={() => { setSelectedCategory('professional'); }}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedCategory === 'professional'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('catProfessional')}</span>
          </button>

          <button
            onClick={() => { setSelectedCategory('software_digital'); }}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedCategory === 'software_digital'
                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-indigo-400 hover:bg-blue-950/40'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === 'ar' ? 'برامج ورخص رقمية' : 'Logiciels & Licences'}</span>
          </button>

          <button
            onClick={() => { setSelectedCategory('laptop_bags_cases'); }}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedCategory === 'laptop_bags_cases'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-amber-400 hover:bg-blue-950/40'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'ar' ? 'حقائب وحوافظ PC' : 'Sacs & Housses'}</span>
          </button>

          <button
            onClick={() => { setSelectedCategory('business'); }}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedCategory === 'business'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('catBusiness')}</span>
          </button>

          <div className="h-4 w-px bg-blue-900/50 mx-1" />

          <button
            onClick={() => setSelectedCondition(selectedCondition === 'used' ? 'all' : 'used')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedCondition === 'used'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-amber-400 hover:bg-blue-950/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{t('condUsed')}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#080F1C] border-b border-blue-900/60 p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-[#050505] text-sm text-white rounded-lg ps-9 pe-4 py-2 border border-blue-900/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2">
            <button
              onClick={() => { setSelectedCategory('all'); setMobileMenuOpen(false); }}
              className="p-2 rounded bg-blue-950/40 text-slate-200 text-start"
            >
              {t('catAll')}
            </button>
            <button
              onClick={() => { setSelectedCategory('gaming'); setMobileMenuOpen(false); }}
              className="p-2 rounded bg-blue-950/40 text-cyan-300 text-start"
            >
              {t('catGaming')}
            </button>
            <button
              onClick={() => { setSelectedCategory('software_digital'); setMobileMenuOpen(false); }}
              className="p-2 rounded bg-blue-950/40 text-indigo-300 text-start"
            >
              Logiciels & Licences
            </button>
            <button
              onClick={() => { setSelectedCategory('laptop_bags_cases'); setMobileMenuOpen(false); }}
              className="p-2 rounded bg-blue-950/40 text-amber-300 text-start"
            >
              Sacs & Housses
            </button>
            <button
              onClick={() => { onOpenTracking(); setMobileMenuOpen(false); }}
              className="p-2 col-span-2 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-500/40 text-center"
            >
              🚚 Suivre ma commande en direct
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

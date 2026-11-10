import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/StoreContext';
import { 
  Cpu, 
  Truck, 
  ShieldCheck, 
  Headphones, 
  Flame, 
  MessageCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface HeroProps {
  onScrollToCatalog: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onScrollToCatalog }) => {
  const { t, language } = useLanguage();
  const { settings } = useStore();

  const handleWhatsAppClick = () => {
    const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const message = language === 'ar'
      ? 'السلام عليكم، أرغب في الاستفسار عن الأجهزة المتوفرة في TOP LAPTOP.'
      : 'Bonjour TOP LAPTOP, je souhaite me renseigner sur les ordinateurs portables disponibles.';
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#080F1C] via-[#060B14] to-[#050505] pt-8 pb-16 border-b border-blue-900/30">
      {/* Background cyber grid & glow effects */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-10 end-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Main Hero Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
            {/* Top Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 shadow-[0_0_15px_rgba(0,140,255,0.2)]">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-black tracking-widest text-cyan-300 uppercase">
                {t('slogan')}
              </span>
            </div>

            {/* Bold Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              <span className="block">{t('heroHeadline')}</span>
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 glow-text-cyan">
                {language === 'ar' ? 'أقوى أجهزة الكمبيوتر في الجزائر' : 'Performance Sans Compromis'}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed mx-auto lg:mx-0">
              {t('heroSubheadline')}
            </p>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onScrollToCatalog}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm sm:text-base shadow-[0_0_25px_rgba(0,140,255,0.5)] hover:shadow-[0_0_35px_rgba(0,212,255,0.6)] transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer"
              >
                <span>{t('catalogBtn')}</span>
                <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={handleWhatsAppClick}
                className="px-6 py-3.5 rounded-xl bg-[#0F223D] hover:bg-[#142C4F] border border-green-500/40 hover:border-green-400 text-green-400 hover:text-green-300 font-bold text-sm sm:text-base shadow-[0_0_15px_rgba(34,197,94,0.15)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-green-400" />
                <span>{t('orderWhatsApp')}</span>
              </button>
            </div>

            {/* Mini Trust Badges */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-blue-900/30">
              <div className="text-center lg:text-start">
                <div className="flex items-center justify-center lg:justify-start gap-1.5 text-cyan-400 font-black text-base sm:text-lg">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span>69 Wilayas</span>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">{t('statWilayasDesc')}</div>
              </div>

              <div className="text-center lg:text-start">
                <div className="flex items-center justify-center lg:justify-start gap-1.5 text-cyan-400 font-black text-base sm:text-lg">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>100% Neuf & Certifié</span>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">{t('statOriginalDesc')}</div>
              </div>

              <div className="text-center lg:text-start">
                <div className="flex items-center justify-center lg:justify-start gap-1.5 text-cyan-400 font-black text-base sm:text-lg">
                  <Headphones className="w-4 h-4 text-indigo-400" />
                  <span>SAV 7j/7</span>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">{t('statSupportDesc')}</div>
              </div>
            </div>
          </div>

          {/* Futuristic Visual Hardware Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-gradient-to-b from-[#0F1E38] via-[#0A1426] to-[#070D18] rounded-2xl p-5 border border-blue-500/40 shadow-[0_0_40px_rgba(0,140,255,0.25)]">
              {/* Header inside card */}
              <div className="flex items-center justify-between pb-3 border-b border-blue-900/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold ps-2">
                    TOP-PERFORMANCE 2026
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  <Flame className="w-3.5 h-3.5" />
                  <span>PROMO DU MOIS</span>
                </div>
              </div>

              {/* Hardware showcase image */}
              <div className="relative my-4 aspect-[16/10] rounded-xl overflow-hidden bg-black/60 border border-blue-900/40 group">
                <img
                  src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80"
                  alt="ASUS ROG Strix TOP LAPTOP"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-3 start-3 end-3 flex items-center justify-between text-white">
                  <div>
                    <span className="text-xs font-mono text-cyan-300 font-semibold block">RTX 4070 • i9-14900HX</span>
                    <span className="text-sm font-bold">ASUS ROG Strix G16</span>
                  </div>
                  <div className="text-end">
                    <span className="text-xs text-slate-400 line-through block">265 000 DZD</span>
                    <span className="text-base font-black text-cyan-400">245 000 DZD</span>
                  </div>
                </div>
              </div>

              {/* Telemetry specs row */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-[#050A14] p-2.5 rounded-lg border border-blue-900/30 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-[10px] text-slate-400">Processeur</div>
                    <div className="font-bold text-white">Core i9 24-Cores</div>
                  </div>
                </div>

                <div className="bg-[#050A14] p-2.5 rounded-lg border border-blue-900/30 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-[10px] text-slate-400">Écran Gaming</div>
                    <div className="font-bold text-white">240Hz Nebula 2.5K</div>
                  </div>
                </div>
              </div>

              {/* Quick dispatch note */}
              <div className="mt-4 pt-3 border-t border-blue-900/30 flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Stock disponible à Alger</span>
                </span>
                <span className="font-semibold text-slate-400">Garantie 12 Mois</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

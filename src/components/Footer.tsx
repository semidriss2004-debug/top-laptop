import React from 'react';
import { Logo } from './Logo';
import { SocialIcons } from './SocialIcons';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { buildTelUrl } from '../utils/contactLinks';
import { getEffectiveSiteConfig } from '../config/siteConfig';
import { trackContact } from '../utils/metaPixel';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  MessageCircle 
} from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenTracking: () => void;
  onOpenContact?: () => void;
  onSelectCategory: (cat: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onOpenAdmin, 
  onOpenTracking, 
  onOpenContact,
  onSelectCategory 
}) => {
  const { t, language } = useLanguage();
  const { settings } = useStore();
  const { activeTheme } = useTheme();
  const siteConfig = getEffectiveSiteConfig(settings);

  return (
    <footer className="bg-[#050A14] border-t border-blue-900/40 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          
          {/* Brand Info & Mission */}
          <div className="lg:col-span-5 space-y-4">
            <Logo size="md" />
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              {t('aboutText')}
            </p>

            {/* Official Social Media SVG Icons */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                {language === 'ar' ? 'تابعنا على مواقع التواصل:' : 'Rejoignez notre communauté :'}
              </span>
              <SocialIcons
                socialLinks={{
                  facebook: siteConfig.facebook,
                  instagram: siteConfig.instagram,
                  tiktok: siteConfig.tiktok,
                  youtube: siteConfig.youtube,
                  linkedin: siteConfig.linkedin,
                  whatsapp: siteConfig.whatsappUrl,
                }}
                size="md"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs font-mono">
              {t('quickLinks')}
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onSelectCategory('all')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {t('catAll')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('gaming')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {t('catGaming')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('professional')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {t('catProfessional')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('software_digital')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'برامج ورخص رقمية' : 'Logiciels & Licences'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('laptop_bags_cases')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'حقائب وحوافظ PC' : 'Sacs & Housses PC'}
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTracking}
                  className="hover:text-cyan-300 transition-colors text-cyan-400 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تتبع طلبيتي مباشرة' : 'Suivre ma commande en direct'}</span>
                </button>
              </li>
              {onOpenContact && (
                <li>
                  <button
                    onClick={onOpenContact}
                    className="hover:text-cyan-300 transition-colors text-emerald-400 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'اتصل بنا' : 'Contactez-nous'}</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={onOpenAdmin}
                  className="hover:text-cyan-300 transition-colors text-blue-400 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t('adminPortal')}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details in Algeria */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs font-mono">
              {t('customerService')}
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{siteConfig.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a
                  href={buildTelUrl(siteConfig.phone)}
                  onClick={() => trackContact('phone', siteConfig.phone)}
                  className="font-mono hover:text-cyan-300 transition-colors"
                  dir="ltr"
                >
                  {siteConfig.phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <a
                  href={`mailto:${siteConfig.email}`}
                  onClick={() => trackContact('email', siteConfig.email)}
                  className="hover:text-cyan-300 transition-colors"
                >
                  {siteConfig.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-green-400">
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <a
                  href={siteConfig.whatsappUrl}
                  onClick={() => trackContact('whatsapp', siteConfig.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-300 transition-colors font-mono"
                >
                  WhatsApp: <span dir="ltr">{siteConfig.whatsappNumber}</span>
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-cyan-300">
                <Truck className="w-4 h-4 flex-shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'توصيل سريع لجميع 69 ولاية في الجزائر (Yalidine, ZR Express)'
                    : "Couverture des 69 Wilayas d'Algérie (Yalidine, ZR Express)"}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-blue-950/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © 2026 {settings.storeName || 'TOP LAPTOP Algérie'} • RC: {settings.tradeRegisterRC || '16/00-9876543B20'} • NIF: {settings.taxNumberNIF || '001916012345678'}
          </div>
          <div className="flex items-center gap-4">
            <span 
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: activeTheme.badgeBg, color: activeTheme.badgeText }}
            >
              {language === 'ar' ? `المظهر: ${activeTheme.nameAr}` : `Thème : ${activeTheme.nameFr}`}
            </span>
            <span>•</span>
            <span className="text-cyan-400 font-mono font-bold">BUY • UPGRADE • PERFORM</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

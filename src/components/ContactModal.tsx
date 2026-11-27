import React from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { getEffectiveSiteConfig } from '../config/siteConfig';
import { buildTelUrl } from '../utils/contactLinks';
import { trackContact } from '../utils/metaPixel';
import { SocialIcons } from './SocialIcons';
import {
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Truck,
  X,
} from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useStore();
  const { language } = useLanguage();

  if (!isOpen) return null;

  const siteConfig = getEffectiveSiteConfig(settings);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#091122] rounded-3xl border border-cyan-500/40 shadow-[0_0_50px_rgba(0,140,255,0.3)] overflow-hidden my-auto p-6 sm:p-8 space-y-6"
      >
        <button
          onClick={onClose}
          className="absolute top-5 end-5 p-2 rounded-lg bg-blue-950/60 text-slate-400 hover:text-white border border-blue-900/40 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-md">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-white">
            {language === 'ar' ? 'اتصل بنا — خدمة الزبائن' : 'Contactez-nous — Service Client'}
          </h3>
          <p className="text-xs text-slate-400">
            {siteConfig.storeName}
          </p>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          {/* Phone Call */}
          <a
            href={buildTelUrl(siteConfig.phone)}
            onClick={() => trackContact('phone', siteConfig.phone)}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#050A14] border border-blue-900/50 hover:border-cyan-400/60 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-950 text-cyan-400">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">
                  {language === 'ar' ? 'الهاتف المباشر' : 'Téléphone Direct'}
                </div>
                <div className="font-mono font-bold text-white" dir="ltr">
                  {siteConfig.phone}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-400">
              {language === 'ar' ? 'اتصال' : 'Appeler'}
            </span>
          </a>

          {/* WhatsApp */}
          <a
            href={siteConfig.whatsappUrl}
            onClick={() => trackContact('whatsapp', siteConfig.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#050A14] border border-emerald-500/40 hover:border-emerald-400 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">WhatsApp</div>
                <div className="font-mono font-bold text-emerald-300" dir="ltr">
                  {siteConfig.whatsappNumber}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400">
              {language === 'ar' ? 'مراسلة' : 'Discuter'}
            </span>
          </a>

          {/* Email */}
          {siteConfig.email && (
            <a
              href={`mailto:${siteConfig.email}`}
              onClick={() => trackContact('email', siteConfig.email)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#050A14] border border-blue-900/50 hover:border-indigo-400/60 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Email</div>
                  <div className="font-semibold text-white">{siteConfig.email}</div>
                </div>
              </div>
            </a>
          )}

          {/* Address */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#050A14] border border-blue-900/50">
            <div className="p-2 rounded-xl bg-blue-950 text-cyan-400 flex-shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">
                {language === 'ar' ? 'العنوان' : 'Adresse Showroom'}
              </div>
              <div className="text-white text-xs sm:text-sm mt-0.5">{siteConfig.address}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-cyan-300 px-1">
            <Truck className="w-4 h-4 flex-shrink-0" />
            <span>
              {language === 'ar'
                ? 'توصيل متاح لجميع 69 ولاية في الجزائر'
                : "Livraison disponible vers les 69 Wilayas d'Algérie"}
            </span>
          </div>
        </div>

        {/* Social Media Icons reading directly from central siteConfig */}
        <div className="pt-4 border-t border-blue-900/40 flex flex-col items-center gap-2.5">
          <span className="text-xs text-slate-400 font-bold">
            {language === 'ar' ? 'تواصل معنا عبر الشبكات الاجتماعية :' : 'Retrouvez-nous sur les réseaux :'}
          </span>
          <SocialIcons size="lg" />
        </div>
      </div>
    </div>
  );
};

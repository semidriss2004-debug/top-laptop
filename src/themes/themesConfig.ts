import { ThemeConfig, ThemeId } from '../types';

export const THEMES_LIST: ThemeConfig[] = [
  {
    id: 'cyber-neon',
    nameFr: 'Cyber Neon (Bleu Électrique)',
    nameAr: 'سايبر نيون (أزرق كهربائي)',
    descriptionFr: 'L\'identité originale emblématique de TOP LAPTOP avec néon bleu et noir spatial.',
    descriptionAr: 'الهوية البصرية الأصلية لمتجر توب لابتوب باللون الأزرق النيون والفضاء الكحلي.',
    primaryColor: '#008CFF',
    accentColor: '#00D4FF',
    bgColor: '#050505',
    cardBgColor: '#091122',
    borderColor: '#1E3A8A',
    textColor: '#FFFFFF',
    badgeBg: 'rgba(0, 140, 255, 0.2)',
    badgeText: '#00D4FF',
    glowEffect: '0 0 25px rgba(0, 140, 255, 0.45)'
  },
  {
    id: 'stealth-titanium',
    nameFr: 'Stealth Titanium (Argent & Carbone)',
    nameAr: 'تيتانيوم الشبح (فضي وكربون)',
    descriptionFr: 'Design minimaliste haut de gamme inspiré des ultraportables en magnésium et fibre de carbone.',
    descriptionAr: 'تصميم فخم مستوحى من أجهزة الأعمال المصنوعة من ألياف الكربون والمغنيسيوم.',
    primaryColor: '#64748B',
    accentColor: '#38BDF8',
    bgColor: '#090D16',
    cardBgColor: '#111827',
    borderColor: '#334155',
    textColor: '#F8FAFC',
    badgeBg: 'rgba(100, 116, 139, 0.2)',
    badgeText: '#38BDF8',
    glowEffect: '0 0 25px rgba(56, 189, 248, 0.35)'
  },
  {
    id: 'emerald-matrix',
    nameFr: 'Emerald Matrix (Vert Terminal)',
    nameAr: 'ماتريكس الزمردي (أخضر تيرمينال)',
    descriptionFr: 'Atmosphère technologique cyberpunk inspirée des serveurs haute performance.',
    descriptionAr: 'أجواء التشفير والخوادم فائقة الأداء باللون الأخضر المضيء.',
    primaryColor: '#10B981',
    accentColor: '#34D399',
    bgColor: '#020B06',
    cardBgColor: '#071A10',
    borderColor: '#065F46',
    textColor: '#ECFDF5',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeText: '#34D399',
    glowEffect: '0 0 25px rgba(16, 185, 129, 0.45)'
  },
  {
    id: 'hyper-amber',
    nameFr: 'Hyper Amber (Or & Obsidienne)',
    nameAr: 'هايبر عنبري (ذهبي وبرونزي)',
    descriptionFr: 'Palette luxueuse et chaleureuse pour les éditions collectors et stations de travail.',
    descriptionAr: 'مظهر فخم ومميز لمحطات العمل والمعدات الاحترافية النادرة.',
    primaryColor: '#F59E0B',
    accentColor: '#FBBF24',
    bgColor: '#0B0803',
    cardBgColor: '#1C1306',
    borderColor: '#78350F',
    textColor: '#FFFBEB',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeText: '#FBBF24',
    glowEffect: '0 0 25px rgba(245, 158, 11, 0.45)'
  },
  {
    id: 'crimson-rog',
    nameFr: 'Crimson ROG (Écarlate Gaming)',
    nameAr: 'روج القرمزي (أحمر جيمنج ناري)',
    descriptionFr: 'Inspiré de l\'univers e-Sport agressif et des bêtes de course ROG / MSI Dragon.',
    descriptionAr: 'مستوحى من حلبات الرياضات الإلكترونية والأجهزة الهجومية الجريئة.',
    primaryColor: '#EF4444',
    accentColor: '#F87171',
    bgColor: '#0C0303',
    cardBgColor: '#1E0909',
    borderColor: '#7F1D1D',
    textColor: '#FEF2F2',
    badgeBg: 'rgba(239, 68, 68, 0.2)',
    badgeText: '#F87171',
    glowEffect: '0 0 25px rgba(239, 68, 68, 0.45)'
  },
  {
    id: 'aurora-cyan',
    nameFr: 'Aurora Cyan (Indigo & Boréal)',
    nameAr: 'الشفق القطبي (نيلي وسيبراني)',
    descriptionFr: 'Lumières boréales futuristes combinant cyan cristallin et violet profond.',
    descriptionAr: 'ألوان الشفق القطبي المستقبلي بمزيج من السيان الكريستالي والنيلي العميق.',
    primaryColor: '#06B6D4',
    accentColor: '#818CF8',
    bgColor: '#050814',
    cardBgColor: '#0E1530',
    borderColor: '#312E81',
    textColor: '#F0F9FF',
    badgeBg: 'rgba(6, 182, 212, 0.2)',
    badgeText: '#818CF8',
    glowEffect: '0 0 25px rgba(6, 182, 212, 0.45)'
  }
];

export const DEFAULT_ROTATION_ORDER: ThemeId[] = [
  'cyber-neon',
  'crimson-rog',
  'emerald-matrix',
  'stealth-titanium',
  'hyper-amber',
  'aurora-cyan'
];

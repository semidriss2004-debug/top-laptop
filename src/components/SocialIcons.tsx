import React from 'react';

interface SocialIconsProps {
  socialLinks: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
    whatsapp?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SocialIcons: React.FC<SocialIconsProps> = ({
  socialLinks,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 p-1.5',
    md: 'w-9 h-9 p-2',
    lg: 'w-11 h-11 p-2.5'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const items = [
    {
      key: 'facebook',
      url: socialLinks.facebook,
      title: 'Facebook',
      bgHover: 'hover:bg-[#1877F2] hover:border-[#1877F2]',
      color: 'text-[#1877F2] group-hover:text-white',
      svg: (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconSizes[size]}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    },
    {
      key: 'instagram',
      url: socialLinks.instagram,
      title: 'Instagram',
      bgHover: 'hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] hover:border-pink-500',
      color: 'text-[#E4405F] group-hover:text-white',
      svg: (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconSizes[size]}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      )
    },
    {
      key: 'tiktok',
      url: socialLinks.tiktok,
      title: 'TikTok',
      bgHover: 'hover:bg-black hover:border-slate-400',
      color: 'text-slate-200 group-hover:text-white',
      svg: (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconSizes[size]}>
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.98v8.66c-.02 2.51-1.12 4.96-3.08 6.55-1.95 1.59-4.63 2.28-7.1 1.78-2.47-.49-4.64-2.12-5.75-4.32-1.11-2.2-1.07-4.88.11-7.05 1.18-2.17 3.42-3.66 5.89-3.95.84-.1 1.69-.03 2.52.19v4.18c-.85-.31-1.8-.32-2.65-.03-.85.29-1.55.93-1.91 1.74-.37.82-.35 1.78.04 2.58.39.81 1.15 1.41 2.03 1.61.88.21 1.83.05 2.58-.42.75-.48 1.25-1.29 1.33-2.18.06-1.04.03-2.09.03-3.13V.02h-.58z" />
        </svg>
      )
    },
    {
      key: 'youtube',
      url: socialLinks.youtube,
      title: 'YouTube',
      bgHover: 'hover:bg-[#FF0000] hover:border-[#FF0000]',
      color: 'text-[#FF0000] group-hover:text-white',
      svg: (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconSizes[size]}>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    },
    {
      key: 'linkedin',
      url: socialLinks.linkedin,
      title: 'LinkedIn',
      bgHover: 'hover:bg-[#0A66C2] hover:border-[#0A66C2]',
      color: 'text-[#0A66C2] group-hover:text-white',
      svg: (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconSizes[size]}>
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      )
    },
    {
      key: 'whatsapp',
      url: socialLinks.whatsapp ? (socialLinks.whatsapp.startsWith('http') ? socialLinks.whatsapp : `https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, '')}`) : undefined,
      title: 'WhatsApp',
      bgHover: 'hover:bg-[#25D366] hover:border-[#25D366]',
      color: 'text-[#25D366] group-hover:text-white',
      svg: (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconSizes[size]}>
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      )
    }
  ];

  // Only render icons that have a valid configured URL
  const visibleItems = items.filter(i => i.url && i.url.trim().length > 0);

  if (visibleItems.length === 0) return null;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {visibleItems.map(item => (
        <a
          key={item.key}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          title={item.title}
          className={`group flex items-center justify-center rounded-xl bg-[#091122] border border-blue-900/50 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg ${sizeClasses[size]} ${item.bgHover}`}
        >
          <span className={`transition-colors duration-200 ${item.color}`}>
            {item.svg}
          </span>
        </a>
      ))}
    </div>
  );
};

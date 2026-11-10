import { DeliveryCompany } from '../types';

// Helper to generate default pricing across all 69 wilayas
const generatePricing = (homeBase: number, deskBase: number) => {
  const map: Record<number, { homePriceDZD: number; stopDeskPriceDZD: number; isSupported: boolean }> = {};
  for (let i = 1; i <= 69; i++) {
    // Algiers, Blida, Tipaza, Boumerdes
    const isCapitalRegion = [16, 9, 35, 42].includes(i);
    // Northern Wilayas
    const isNorth = i <= 48 && !isCapitalRegion;
    // Southern distant wilayas
    const isFarSouth = [1, 8, 11, 30, 33, 37, 47, 49, 50, 52, 53, 54, 56, 58].includes(i);

    let home = homeBase;
    let desk = deskBase;

    if (isCapitalRegion) {
      home = Math.max(400, homeBase - 300);
      desk = Math.max(300, deskBase - 200);
    } else if (isFarSouth) {
      home = homeBase + 400;
      desk = deskBase + 300;
    } else if (isNorth) {
      home = homeBase;
      desk = deskBase;
    }

    map[i] = {
      homePriceDZD: home,
      stopDeskPriceDZD: desk,
      isSupported: true
    };
  }
  return map;
};

export const INITIAL_DELIVERY_COMPANIES: DeliveryCompany[] = [
  {
    id: 'yalidine',
    name: 'Yalidine Express',
    logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80',
    phone: '0982 40 40 40',
    website: 'https://yalidine.com',
    isActive: true,
    priority: 1,
    trackingUrlTemplate: 'https://yalidine.com/app/tracking/?tracking={TRACKING}',
    supportsHomeDelivery: true,
    supportsStopDesk: true,
    wilayaPricing: generatePricing(850, 500)
  },
  {
    id: 'zr-express',
    name: 'ZR Express',
    logoUrl: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=200&q=80',
    phone: '0770 00 22 44',
    website: 'https://zrexpress.dz',
    isActive: true,
    priority: 2,
    trackingUrlTemplate: 'https://zrexpress.dz/tracking/{TRACKING}',
    supportsHomeDelivery: true,
    supportsStopDesk: true,
    wilayaPricing: generatePricing(800, 450)
  },
  {
    id: 'procolis',
    name: 'Procolis Livraison',
    logoUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=200&q=80',
    phone: '0560 99 88 77',
    website: 'https://procolis.com',
    isActive: true,
    priority: 3,
    supportsHomeDelivery: true,
    supportsStopDesk: true,
    wilayaPricing: generatePricing(900, 550)
  },
  {
    id: 'top-express-direct',
    name: 'TOP LAPTOP Coursier Express (Centre)',
    logoUrl: '/logo.svg',
    phone: '0555 12 34 56',
    isActive: true,
    priority: 4,
    supportsHomeDelivery: true,
    supportsStopDesk: false,
    wilayaPricing: {
      16: { homePriceDZD: 500, stopDeskPriceDZD: 0, isSupported: true }, // Alger
      9: { homePriceDZD: 600, stopDeskPriceDZD: 0, isSupported: true },  // Blida
      35: { homePriceDZD: 600, stopDeskPriceDZD: 0, isSupported: true }, // Boumerdes
      42: { homePriceDZD: 600, stopDeskPriceDZD: 0, isSupported: true }  // Tipaza
    }
  }
];

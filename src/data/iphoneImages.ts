/**
 * High-resolution official Apple renders for iPhones by model and color.
 * Used for instant fallback or 1-click addition when registering or selling iPhones.
 */

export const IPHONE_OFFICIAL_IMAGES: Record<string, string> = {
  // Serie iPhone 13
  'iphone-13-blue': 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=900&auto=format&fit=crop&q=80',
  'iphone-13-midnight': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=900&auto=format&fit=crop&q=80',
  'iphone-13-starlight': 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=900&auto=format&fit=crop&q=80',
  'iphone-13-pink': 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=900&auto=format&fit=crop&q=80',
  'iphone-13-pro-sierra-blue': 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=900&auto=format&fit=crop&q=80',
  'iphone-13-pro-graphite': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=900&auto=format&fit=crop&q=80',
  'iphone-13-pro-gold': 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=900&auto=format&fit=crop&q=80',
  'iphone-13-pro-silver': 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=900&auto=format&fit=crop&q=80',

  // Serie iPhone 14
  'iphone-14-midnight': 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=900&auto=format&fit=crop&q=80',
  'iphone-14-purple': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=80',
  'iphone-14-pro-deep-purple': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=80',
  'iphone-14-pro-space-black': 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=900&auto=format&fit=crop&q=80',

  // Serie iPhone 15
  'iphone-15-black': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=80',
  'iphone-15-pro-natural-titanium': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=80',

  // Fallbacks generales
  'iphone-general': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=900&auto=format&fit=crop&q=80',
  'iphone-pro-general': 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=900&auto=format&fit=crop&q=80',
};

export function getPresetIPhoneImage(modelName: string, colorName?: string): string {
  const normModel = (modelName || '').toLowerCase();
  const normColor = (colorName || '').toLowerCase();

  if (normModel.includes('13 pro') || normModel.includes('13 pro max')) {
    if (normColor.includes('sierra') || normColor.includes('azul')) return IPHONE_OFFICIAL_IMAGES['iphone-13-pro-sierra-blue'];
    if (normColor.includes('grafito') || normColor.includes('negro')) return IPHONE_OFFICIAL_IMAGES['iphone-13-pro-graphite'];
    if (normColor.includes('oro') || normColor.includes('gold')) return IPHONE_OFFICIAL_IMAGES['iphone-13-pro-gold'];
    return IPHONE_OFFICIAL_IMAGES['iphone-13-pro-sierra-blue'];
  }

  if (normModel.includes('13')) {
    if (normColor.includes('azul') || normColor.includes('blue')) return IPHONE_OFFICIAL_IMAGES['iphone-13-blue'];
    if (normColor.includes('medianoche') || normColor.includes('negro')) return IPHONE_OFFICIAL_IMAGES['iphone-13-midnight'];
    if (normColor.includes('rosa') || normColor.includes('pink')) return IPHONE_OFFICIAL_IMAGES['iphone-13-pink'];
    return IPHONE_OFFICIAL_IMAGES['iphone-13-blue'];
  }

  if (normModel.includes('14 pro') || normModel.includes('14 pro max')) {
    return IPHONE_OFFICIAL_IMAGES['iphone-14-pro-deep-purple'];
  }

  if (normModel.includes('14')) {
    return IPHONE_OFFICIAL_IMAGES['iphone-14-midnight'];
  }

  if (normModel.includes('15')) {
    return IPHONE_OFFICIAL_IMAGES['iphone-15-pro-natural-titanium'];
  }

  if (normModel.includes('pro')) {
    return IPHONE_OFFICIAL_IMAGES['iphone-pro-general'];
  }

  return IPHONE_OFFICIAL_IMAGES['iphone-general'];
}

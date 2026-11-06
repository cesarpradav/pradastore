export interface IPhoneColor {
  name: string;
  nameEn: string;
  hex: string;
  borderClass?: string;
}

export interface IPhonePresetModel {
  id: string;
  series: 'iPhone 13' | 'iPhone 14' | 'iPhone 15' | 'iPhone 12' | 'iPhone 11';
  name: string;
  isPriority: boolean;
  screenSize: string;
  storages: string[];
  colors: IPhoneColor[];
}

export const IPHONE_PRESETS: IPhonePresetModel[] = [
  // ===================== PRIORIDAD: SERIE iPHONE 13 =====================
  {
    id: 'iphone-13',
    series: 'iPhone 13',
    name: 'iPhone 13',
    isPriority: true,
    screenSize: '6.1"',
    storages: ['128GB', '256GB', '512GB'],
    colors: [
      { name: 'Medianoche', nameEn: 'Midnight', hex: '#1e242b' },
      { name: 'Blanco Estelar', nameEn: 'Starlight', hex: '#f0ece8', borderClass: 'border-slate-400' },
      { name: 'Azul', nameEn: 'Blue', hex: '#276787' },
      { name: 'Rosa', nameEn: 'Pink', hex: '#fae1dc' },
      { name: 'Verde', nameEn: 'Green', hex: '#394c38' },
      { name: '(PRODUCT)RED', nameEn: 'Red', hex: '#ba0c2f' },
    ],
  },
  {
    id: 'iphone-13-pro',
    series: 'iPhone 13',
    name: 'iPhone 13 Pro',
    isPriority: true,
    screenSize: '6.1" ProMotion',
    storages: ['128GB', '256GB', '512GB', '1TB'],
    colors: [
      { name: 'Azul Sierra', nameEn: 'Sierra Blue', hex: '#9bb5ce' },
      { name: 'Grafito', nameEn: 'Graphite', hex: '#54524f' },
      { name: 'Oro', nameEn: 'Gold', hex: '#fae7cf' },
      { name: 'Plata', nameEn: 'Silver', hex: '#f1f2ed', borderClass: 'border-slate-400' },
      { name: 'Verde Alpino', nameEn: 'Alpine Green', hex: '#505c4e' },
    ],
  },
  {
    id: 'iphone-13-pro-max',
    series: 'iPhone 13',
    name: 'iPhone 13 Pro Max',
    isPriority: true,
    screenSize: '6.7" ProMotion',
    storages: ['128GB', '256GB', '512GB', '1TB'],
    colors: [
      { name: 'Azul Sierra', nameEn: 'Sierra Blue', hex: '#9bb5ce' },
      { name: 'Grafito', nameEn: 'Graphite', hex: '#54524f' },
      { name: 'Oro', nameEn: 'Gold', hex: '#fae7cf' },
      { name: 'Plata', nameEn: 'Silver', hex: '#f1f2ed', borderClass: 'border-slate-400' },
      { name: 'Verde Alpino', nameEn: 'Alpine Green', hex: '#505c4e' },
    ],
  },
  {
    id: 'iphone-13-mini',
    series: 'iPhone 13',
    name: 'iPhone 13 mini',
    isPriority: true,
    screenSize: '5.4"',
    storages: ['128GB', '256GB', '512GB'],
    colors: [
      { name: 'Medianoche', nameEn: 'Midnight', hex: '#1e242b' },
      { name: 'Blanco Estelar', nameEn: 'Starlight', hex: '#f0ece8', borderClass: 'border-slate-400' },
      { name: 'Azul', nameEn: 'Blue', hex: '#276787' },
      { name: 'Rosa', nameEn: 'Pink', hex: '#fae1dc' },
      { name: 'Verde', nameEn: 'Green', hex: '#394c38' },
      { name: '(PRODUCT)RED', nameEn: 'Red', hex: '#ba0c2f' },
    ],
  },

  // ===================== PRIORIDAD: SERIE iPHONE 14 =====================
  {
    id: 'iphone-14',
    series: 'iPhone 14',
    name: 'iPhone 14',
    isPriority: true,
    screenSize: '6.1"',
    storages: ['128GB', '256GB', '512GB'],
    colors: [
      { name: 'Medianoche', nameEn: 'Midnight', hex: '#1f2022' },
      { name: 'Blanco Estelar', nameEn: 'Starlight', hex: '#faf6f2', borderClass: 'border-slate-400' },
      { name: 'Azul', nameEn: 'Blue', hex: '#a0b4c7' },
      { name: 'Púrpura', nameEn: 'Purple', hex: '#e3dbe5' },
      { name: 'Amarillo', nameEn: 'Yellow', hex: '#f9e479' },
      { name: '(PRODUCT)RED', nameEn: 'Red', hex: '#e11c2a' },
    ],
  },
  {
    id: 'iphone-14-plus',
    series: 'iPhone 14',
    name: 'iPhone 14 Plus',
    isPriority: true,
    screenSize: '6.7"',
    storages: ['128GB', '256GB', '512GB'],
    colors: [
      { name: 'Medianoche', nameEn: 'Midnight', hex: '#1f2022' },
      { name: 'Blanco Estelar', nameEn: 'Starlight', hex: '#faf6f2', borderClass: 'border-slate-400' },
      { name: 'Azul', nameEn: 'Blue', hex: '#a0b4c7' },
      { name: 'Púrpura', nameEn: 'Purple', hex: '#e3dbe5' },
      { name: 'Amarillo', nameEn: 'Yellow', hex: '#f9e479' },
      { name: '(PRODUCT)RED', nameEn: 'Red', hex: '#e11c2a' },
    ],
  },
  {
    id: 'iphone-14-pro',
    series: 'iPhone 14',
    name: 'iPhone 14 Pro',
    isPriority: true,
    screenSize: '6.1" Dynamic Island',
    storages: ['128GB', '256GB', '512GB', '1TB'],
    colors: [
      { name: 'Morado Oscuro', nameEn: 'Deep Purple', hex: '#4a434e' },
      { name: 'Negro Espacial', nameEn: 'Space Black', hex: '#39383b' },
      { name: 'Oro', nameEn: 'Gold', hex: '#f4e8ce' },
      { name: 'Plata', nameEn: 'Silver', hex: '#f1f2ed', borderClass: 'border-slate-400' },
    ],
  },
  {
    id: 'iphone-14-pro-max',
    series: 'iPhone 14',
    name: 'iPhone 14 Pro Max',
    isPriority: true,
    screenSize: '6.7" Dynamic Island',
    storages: ['128GB', '256GB', '512GB', '1TB'],
    colors: [
      { name: 'Morado Oscuro', nameEn: 'Deep Purple', hex: '#4a434e' },
      { name: 'Negro Espacial', nameEn: 'Space Black', hex: '#39383b' },
      { name: 'Oro', nameEn: 'Gold', hex: '#f4e8ce' },
      { name: 'Plata', nameEn: 'Silver', hex: '#f1f2ed', borderClass: 'border-slate-400' },
    ],
  },

  // ===================== OTRAS SERIES (iPHONE 15, 12, 11) =====================
  {
    id: 'iphone-15',
    series: 'iPhone 15',
    name: 'iPhone 15',
    isPriority: false,
    screenSize: '6.1" Dynamic Island',
    storages: ['128GB', '256GB', '512GB'],
    colors: [
      { name: 'Negro', nameEn: 'Black', hex: '#35393b' },
      { name: 'Azul', nameEn: 'Blue', hex: '#d2dbe0' },
      { name: 'Verde', nameEn: 'Green', hex: '#d6ded2' },
      { name: 'Amarillo', nameEn: 'Yellow', hex: '#ede8d0' },
      { name: 'Rosa', nameEn: 'Pink', hex: '#e8d2d1' },
    ],
  },
  {
    id: 'iphone-15-pro',
    series: 'iPhone 15',
    name: 'iPhone 15 Pro',
    isPriority: false,
    screenSize: '6.1" Titanio',
    storages: ['128GB', '256GB', '512GB', '1TB'],
    colors: [
      { name: 'Titanio Natural', nameEn: 'Natural Titanium', hex: '#9c958c' },
      { name: 'Titanio Azul', nameEn: 'Blue Titanium', hex: '#3c4451' },
      { name: 'Titanio Blanco', nameEn: 'White Titanium', hex: '#e3e4e5' },
      { name: 'Titanio Negro', nameEn: 'Black Titanium', hex: '#444446' },
    ],
  },
  {
    id: 'iphone-15-pro-max',
    series: 'iPhone 15',
    name: 'iPhone 15 Pro Max',
    isPriority: false,
    screenSize: '6.7" Titanio',
    storages: ['256GB', '512GB', '1TB'],
    colors: [
      { name: 'Titanio Natural', nameEn: 'Natural Titanium', hex: '#9c958c' },
      { name: 'Titanio Azul', nameEn: 'Blue Titanium', hex: '#3c4451' },
      { name: 'Titanio Blanco', nameEn: 'White Titanium', hex: '#e3e4e5' },
      { name: 'Titanio Negro', nameEn: 'Black Titanium', hex: '#444446' },
    ],
  },
  {
    id: 'iphone-12',
    series: 'iPhone 12',
    name: 'iPhone 12',
    isPriority: false,
    screenSize: '6.1"',
    storages: ['64GB', '128GB', '256GB'],
    colors: [
      { name: 'Negro', nameEn: 'Black', hex: '#1f2020' },
      { name: 'Blanco', nameEn: 'White', hex: '#fbf7f4', borderClass: 'border-slate-400' },
      { name: 'Azul', nameEn: 'Blue', hex: '#02334f' },
      { name: 'Verde', nameEn: 'Green', hex: '#dbeade' },
      { name: 'Púrpura', nameEn: 'Purple', hex: '#b7b4df' },
      { name: '(PRODUCT)RED', nameEn: 'Red', hex: '#ba0c2f' },
    ],
  },
  {
    id: 'iphone-12-pro-max',
    series: 'iPhone 12',
    name: 'iPhone 12 Pro Max',
    isPriority: false,
    screenSize: '6.7"',
    storages: ['128GB', '256GB', '512GB'],
    colors: [
      { name: 'Azul Pacífico', nameEn: 'Pacific Blue', hex: '#2f4451' },
      { name: 'Grafito', nameEn: 'Graphite', hex: '#54524f' },
      { name: 'Oro', nameEn: 'Gold', hex: '#fae7cf' },
      { name: 'Plata', nameEn: 'Silver', hex: '#f1f2ed', borderClass: 'border-slate-400' },
    ],
  },
  {
    id: 'iphone-11',
    series: 'iPhone 11',
    name: 'iPhone 11',
    isPriority: false,
    screenSize: '6.1"',
    storages: ['64GB', '128GB', '256GB'],
    colors: [
      { name: 'Negro', nameEn: 'Black', hex: '#1f2020' },
      { name: 'Blanco', nameEn: 'White', hex: '#fbf7f4', borderClass: 'border-slate-400' },
      { name: 'Verde', nameEn: 'Green', hex: '#aee1cd' },
      { name: 'Amarillo', nameEn: 'Yellow', hex: '#ffe681' },
      { name: 'Morado', nameEn: 'Purple', hex: '#d1cdda' },
      { name: '(PRODUCT)RED', nameEn: 'Red', hex: '#ba0c2f' },
    ],
  },
];

/**
 * Encuentra el modelo predeterminado que mejor coincide con el texto escrito
 */
export function findPresetModel(modelName: string): IPhonePresetModel | undefined {
  if (!modelName) return undefined;
  const clean = modelName.toLowerCase().trim();

  // Match exact name first
  const exact = IPHONE_PRESETS.find(p => p.name.toLowerCase() === clean);
  if (exact) return exact;

  // Specific matches for 14 Pro Max / 13 Pro Max / 14 Pro / 13 Pro etc.
  if (clean.includes('14 pro max')) return IPHONE_PRESETS.find(p => p.id === 'iphone-14-pro-max');
  if (clean.includes('13 pro max')) return IPHONE_PRESETS.find(p => p.id === 'iphone-13-pro-max');
  if (clean.includes('14 pro')) return IPHONE_PRESETS.find(p => p.id === 'iphone-14-pro');
  if (clean.includes('13 pro')) return IPHONE_PRESETS.find(p => p.id === 'iphone-13-pro');
  if (clean.includes('14 plus')) return IPHONE_PRESETS.find(p => p.id === 'iphone-14-plus');
  if (clean.includes('13 mini')) return IPHONE_PRESETS.find(p => p.id === 'iphone-13-mini');
  if (clean.includes('14')) return IPHONE_PRESETS.find(p => p.id === 'iphone-14');
  if (clean.includes('13')) return IPHONE_PRESETS.find(p => p.id === 'iphone-13');
  if (clean.includes('15 pro max')) return IPHONE_PRESETS.find(p => p.id === 'iphone-15-pro-max');
  if (clean.includes('15 pro')) return IPHONE_PRESETS.find(p => p.id === 'iphone-15-pro');
  if (clean.includes('15')) return IPHONE_PRESETS.find(p => p.id === 'iphone-15');
  if (clean.includes('12 pro max')) return IPHONE_PRESETS.find(p => p.id === 'iphone-12-pro-max');
  if (clean.includes('12')) return IPHONE_PRESETS.find(p => p.id === 'iphone-12');
  if (clean.includes('11')) return IPHONE_PRESETS.find(p => p.id === 'iphone-11');

  return undefined;
}

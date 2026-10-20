export type WalletItemType =
  | 'payment'
  | 'id_card'
  | 'membership'
  | 'loyalty'
  | 'transit'
  | 'custom';

export interface WalletItem {
  id: string;
  type: WalletItemType;
  name: string;
  issuer?: string;
  holderName?: string;
  identifier?: string; // For payment: last 4 digits only
  expiryDate?: string;
  color: string; // Theme key, e.g. 'onyx', 'emerald', 'sapphire', etc.
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
  note?: string;
}

export interface WalletItemInput {
  id?: string;
  type: WalletItemType;
  name: string;
  issuer?: string;
  holderName?: string;
  identifier?: string;
  expiryDate?: string;
  color: string;
  isPinned: boolean;
  note?: string;
}

export interface WalletTypeMeta {
  type: WalletItemType;
  label: string;
  icon: string;
  badgeText: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  issuerLabel: string;
  issuerPlaceholder: string;
  holderLabel: string;
  holderPlaceholder: string;
  expiryLabel: string;
}

export const WALLET_TYPES: Record<WalletItemType, WalletTypeMeta> = {
  payment: {
    type: 'payment',
    label: 'Payment Card',
    icon: '▤',
    badgeText: 'CARD REF',
    identifierLabel: 'Last 4 Digits',
    identifierPlaceholder: 'e.g. 4829',
    issuerLabel: 'Bank / Issuer',
    issuerPlaceholder: 'e.g. HDFC Bank, Chase, SBI',
    holderLabel: 'Name on Card',
    holderPlaceholder: 'e.g. Alex Morgan',
    expiryLabel: 'Expiry (MM/YY)',
  },
  id_card: {
    type: 'id_card',
    label: 'ID Card / Badge',
    icon: '▣',
    badgeText: 'IDENTITY',
    identifierLabel: 'ID / Badge Number',
    identifierPlaceholder: 'e.g. EMP-94821 or STU-2024',
    issuerLabel: 'Organization / Institution',
    issuerPlaceholder: 'e.g. TechCorp, City University',
    holderLabel: 'Full Legal Name',
    holderPlaceholder: 'e.g. Alex Morgan',
    expiryLabel: 'Valid Until / Expiry',
  },
  membership: {
    type: 'membership',
    label: 'Membership',
    icon: '◇',
    badgeText: 'MEMBER',
    identifierLabel: 'Member ID / Account #',
    identifierPlaceholder: 'e.g. MEM-883921',
    issuerLabel: 'Club / Gym / Organization',
    issuerPlaceholder: 'e.g. Gold Gym, City Library',
    holderLabel: 'Member Name',
    holderPlaceholder: 'e.g. Alex Morgan',
    expiryLabel: 'Renewal Date',
  },
  loyalty: {
    type: 'loyalty',
    label: 'Loyalty & Rewards',
    icon: '★',
    badgeText: 'REWARDS',
    identifierLabel: 'Card / Barcode #',
    identifierPlaceholder: 'e.g. 9928172648',
    issuerLabel: 'Brand / Store / Airline',
    issuerPlaceholder: 'e.g. Starbucks, Air India, Tata Neu',
    holderLabel: 'Account Holder',
    holderPlaceholder: 'e.g. Alex Morgan',
    expiryLabel: 'Tier Expiry',
  },
  transit: {
    type: 'transit',
    label: 'Transit & Travel Pass',
    icon: '►',
    badgeText: 'TRANSIT',
    identifierLabel: 'SmartCard / Pass Number',
    identifierPlaceholder: 'e.g. METRO-0982',
    issuerLabel: 'Transit Agency / Authority',
    issuerPlaceholder: 'e.g. Namma Metro, TFL, MTA',
    holderLabel: 'Pass Holder',
    holderPlaceholder: 'e.g. Alex Morgan',
    expiryLabel: 'Pass Expiry',
  },
  custom: {
    type: 'custom',
    label: 'Custom Pass / Other',
    icon: '✦',
    badgeText: 'PASS',
    identifierLabel: 'Identifier / Reference #',
    identifierPlaceholder: 'e.g. REF-2026-X',
    issuerLabel: 'Issuer / Provider',
    issuerPlaceholder: 'e.g. Community Gate, Event Pass',
    holderLabel: 'Holder Name',
    holderPlaceholder: 'e.g. Alex Morgan',
    expiryLabel: 'Expiration Date',
  },
};

export interface CardThemeMeta {
  key: string;
  name: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  borderColor: string;
  accentColor: string;
  chipColor: string;
}

export const CARD_THEMES: Record<string, CardThemeMeta> = {
  onyx: {
    key: 'onyx',
    name: 'Onyx Black',
    bgGradientStart: '#181A1F',
    bgGradientEnd: '#0F1115',
    borderColor: '#2A2F3A',
    accentColor: '#94A3B8',
    chipColor: '#333A48',
  },
  emerald: {
    key: 'emerald',
    name: 'Deep Emerald',
    bgGradientStart: '#0C2B1D',
    bgGradientEnd: '#06170F',
    borderColor: '#154D34',
    accentColor: '#22C55E',
    chipColor: '#1A593D',
  },
  sapphire: {
    key: 'sapphire',
    name: 'Royal Sapphire',
    bgGradientStart: '#0F233E',
    bgGradientEnd: '#081322',
    borderColor: '#1C3E6E',
    accentColor: '#38BDF8',
    chipColor: '#1A4378',
  },
  ruby: {
    key: 'ruby',
    name: 'Crimson Ruby',
    bgGradientStart: '#300F17',
    bgGradientEnd: '#17060A',
    borderColor: '#63212E',
    accentColor: '#F87171',
    chipColor: '#6B202F',
  },
  amethyst: {
    key: 'amethyst',
    name: 'Purple Velvet',
    bgGradientStart: '#251239',
    bgGradientEnd: '#13081E',
    borderColor: '#542880',
    accentColor: '#C084FC',
    chipColor: '#582787',
  },
  amber: {
    key: 'amber',
    name: 'Rich Amber',
    bgGradientStart: '#2C1A05',
    bgGradientEnd: '#160C02',
    borderColor: '#613C0F',
    accentColor: '#F59E0B',
    chipColor: '#6B400E',
  },
  slate: {
    key: 'slate',
    name: 'Titanium Slate',
    bgGradientStart: '#1E242C',
    bgGradientEnd: '#101419',
    borderColor: '#343F4D',
    accentColor: '#64748B',
    chipColor: '#3A4757',
  },
};

export const DEFAULT_CARD_THEME = 'onyx';

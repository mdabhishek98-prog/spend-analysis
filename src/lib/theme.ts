export const colors = {
  bg: '#F5F4F0',
  card: '#FFFFFF',
  ink: '#15171C',
  ink2: '#5E626B',
  ink3: '#9A9DA4',
  line: '#E8E6E1',
  hero: '#15171C',
  heroMuted: '#A7AAB2',
  heroTrack: '#2A2D35',
  brand: '#3D5AFE',
  brandBg: '#E8ECFF',
  need: '#0E9F6E',
  needBg: '#E3F5EE',
  want: '#F2994A',
  wantText: '#C46A1B',
  wantBg: '#FDF0E4',
  save: '#6C5CE7',
  saveBg: '#EEEBFD',
  danger: '#E5484D',
  dangerBg: '#FDECEC',
  income: '#0E9F6E',
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  heavy: 'PlusJakartaSans_800ExtraBold',
} as const;

export type Weight = keyof typeof fonts;

export const radius = { sm: 12, md: 16, lg: 20, xl: 24 } as const;

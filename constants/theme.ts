import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#26251F',
    background: '#F5F1E8',
    tint: '#2A46D6',
    icon: 'rgba(38,37,31,0.55)',
    tabIconDefault: 'rgba(38,37,31,0.55)',
    tabIconSelected: '#2A46D6',
    // extended tokens
    surface: '#FDFCF9',
    inkMuted: 'rgba(38,37,31,0.55)',
    hairline: 'rgba(38,37,31,0.16)',
    accent: '#2A46D6',
    accentSoft: 'rgba(42,70,214,0.12)',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
    surface: '#1E1F20',
    inkMuted: 'rgba(236,237,238,0.55)',
    hairline: 'rgba(236,237,238,0.16)',
    accent: '#2A46D6',
    accentSoft: 'rgba(42,70,214,0.20)',
  },
};

// Shorthand for use inside screens
export const T = {
  bg:         '#F5F1E8',
  surface:    '#FDFCF9',
  ink:        '#26251F',
  muted:      'rgba(38,37,31,0.55)',
  hairline:   'rgba(38,37,31,0.16)',
  accent:     '#2A46D6',
  accentSoft: 'rgba(42,70,214,0.12)',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

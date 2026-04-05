/**
 * Pre-built themes for PDFBuilder
 * Each theme includes colors, fonts, and custom styles
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  success: string;
  error: string;
}

export interface Theme {
  colors: ThemeColors;
  fonts: { family: string };
  styles: string;
}

export const themes: Record<string, Theme> = {
  modern: {
    colors: {
      primary: '#3B82F6',
      secondary: '#64748B',
      accent: '#10B981',
      background: '#F8FAFC',
      text: '#1E293B',
      success: '#059669',
      error: '#DC2626',
    },
    fonts: { family: 'Inter, system-ui, sans-serif' },
    styles: `
      .header { border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      table { border-radius: 8px; overflow: hidden; }
      .badge { border-radius: 20px; padding: 4px 12px; display: inline-block; }
    `,
  },

  classic: {
    colors: {
      primary: '#1F2937',
      secondary: '#6B7280',
      accent: '#D97706',
      background: '#F9FAFB',
      text: '#111827',
      success: '#059669',
      error: '#DC2626',
    },
    fonts: { family: 'Georgia, serif' },
    styles: `
      .header { border-bottom: 3px double #1F2937; }
      table { border: 1px solid #1F2937; }
    `,
  },

  minimal: {
    colors: {
      primary: '#000000',
      secondary: '#737373',
      accent: '#000000',
      background: '#FAFAFA',
      text: '#171717',
      success: '#059669',
      error: '#DC2626',
    },
    fonts: { family: 'system-ui, sans-serif' },
    styles: `
      .header { border-bottom: 1px solid #E5E5E5; }
      table { border: none; }
      table td, table th { border-bottom: 1px solid #E5E5E5; }
    `,
  },

  corporate: {
    colors: {
      primary: '#1E40AF',
      secondary: '#475569',
      accent: '#0369A1',
      background: '#F1F5F9',
      text: '#0F172A',
      success: '#059669',
      error: '#DC2626',
    },
    fonts: { family: 'Arial, Helvetica, sans-serif' },
    styles: `
      .header { background: linear-gradient(135deg, #1E40AF, #3B82F6); color: white; padding: 20px; }
      table th { background: #1E40AF; color: white; }
    `,
  },
};

/**
 * Font families for different language support
 */
export const fontFamilies: Record<string, string> = {
  default: 'system-ui, sans-serif',
  bangla: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
  arabic: "'Noto Sans Arabic', sans-serif",
};

/**
 * Google Fonts import URLs for different fonts
 */
export const fontImports: Record<string, string> = {
  default: '',
  bangla:
    "@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');",
  arabic:
    "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');",
};

export type ThemeType = keyof typeof themes;
export type FontType = keyof typeof fontFamilies;

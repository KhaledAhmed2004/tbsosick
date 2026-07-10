/**
 * Default Light Theme for EmailBuilder
 *
 * This is the primary theme used for most emails.
 * You can modify these values to match your brand.
 */

import path from 'path';
import config from '../../../../config';
import { IEmailTheme } from '../EmailBuilder';

export const defaultTheme: IEmailTheme = {
  name: 'default',

  colors: {
    // Primary brand color - used for buttons, links, highlights
    primary: '#007AFF',

    // Secondary color - used for secondary actions
    secondary: '#5AC8FA',

    // Background color - outer email background
    background: '#F0F9FF',

    // Surface color - main content area background
    surface: '#FFFFFF',

    // Text colors
    text: '#1F2937',
    textMuted: '#6B7280',

    // Border color
    border: '#E5E7EB',

    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },

  fonts: {
    // Primary font for body text
    primary: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",

    // Heading font
    heading: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  borderRadius: '12px',

  // Logo configuration - update with your logo
  logo: {
    url: path.join(process.cwd(), config.app.logo),
    width: '150',
    height: 'auto',
    alt: config.app.name,
  },

  // Social media links - add your links
  social: {
    facebook: 'https://facebook.com/smartscrub',
    twitter: 'https://twitter.com/smartscrub',
    instagram: 'https://instagram.com/smartscrub',
    linkedin: 'https://linkedin.com/company/smartscrub',
    // youtube: 'https://youtube.com/smartscrub',
  },

  // Company information for footer
  // company: {
  //   name: config.app.name,
  //   address: '123 Smart Street, Tech City, Country',
  //   phone: '+1 234 567 890',
  //   email: 'support@smartscrub.com',
  //   website: 'https://smartscrub.com',
  // },
};

export default defaultTheme;

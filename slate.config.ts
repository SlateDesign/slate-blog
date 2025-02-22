/*
 * @file Theme configuration
 */
import { defineConfig } from './src/helpers/config-helper';

export default defineConfig({
  lang: 'en-US',
  site: 'https://irfankurnia.com',
  avatar: '/avatar.png',
  title: 'Erratic Thoughts and More',
  description: 'A Personal Journal of Irfan Kurnia.',
  lastModified: true,
  readTime: true,
  footer: {
    copyright: '© 2025 Irfan Kurnia',
  }
});

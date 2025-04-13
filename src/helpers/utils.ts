import slateConfig from '~@/slate.config';
import type { ThemeMode } from '@/typings/config';

/**
 * @description: Get full title
 * @param title
 */
export function getFullTitle(title: string) {
  return `${title}${!!title && slateConfig.title ? ' | ' : ''}${slateConfig.title}`;
}

/**
 * @description: Set theme mode
 * @param mode
 */
export function setThemeMode(mode: ThemeMode) {
  document.documentElement.className = mode;
  document.documentElement.dataset.theme = mode;
}

/**
 * @description: process url
 * @param {string} inputStr 
 */
export function processUrl(inputStr: string) {
  // 检查是否以 http:// 或 https:// 开头
  const isUrl = /^https?:\/\//i.test(inputStr);
  
  if (isUrl) {
      return inputStr; // 已经是URL，直接返回
  } else {
      return `${import.meta.env.BASE_URL}${inputStr.startsWith('/') ? '' : '/'}${inputStr}`
  }
}


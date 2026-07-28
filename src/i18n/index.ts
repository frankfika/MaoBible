/**
 * i18next setup — UI strings only.
 * Content language is independent of UI language (see docs §5):
 *   - UI language: button labels, navigation
 *   - Content language: which translation of an article to show
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

const stored = localStorage.getItem('maobible.ui-lang');
const browser = navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';

void i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    en: { translation: en },
  },
  lng: stored ?? browser,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;

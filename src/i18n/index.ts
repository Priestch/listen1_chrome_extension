import { Ref } from 'vue';
import { createI18n, DateTimeFormatResult } from 'vue-i18n';
import useSettings from '../composition/settings';
import en_US from './en_US.json';
import fr_FR from './fr_FR.json';
import zh_CN from './zh_CN.json';
import zh_TC from './zh_TC.json';
const { settings } = useSettings();
const messages = {
  'en-US': en_US,
  'fr-FR': fr_FR,
  'zh-CN': zh_CN,
  'zh-TC': zh_TC
};

export const datetimeFormats = {
  'en-US': {
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }
  },
  'fr-FR': {
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }
  },
  'zh-CN': {
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }
  },
  'zh-TC': {
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }
  }
};
export type Language = keyof typeof messages;
const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN', // set locale
  fallbackLocale: 'en-US', // set fallback locale
  messages // set locale messages
  // If you need to specify other options, you can set other options
  // ...
});
export const setLocale = (language: Language): void => {
  ((<unknown>i18n.global.locale) as Ref<string>).value = language;
  settings.language = language;
  const langMap: { [code: string]: string } = {
    'zh-CN': 'zh-Hans',
    'zh-TC': 'zh-Hant',
    'en-US': 'en',
    'fr-FR': 'fr'
  };
  const htmlLang = langMap[language] || document.documentElement.lang;
  document.documentElement.lang = htmlLang;
};
export default i18n;

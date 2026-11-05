import messages from './en.json';
declare module 'next-intl' {
  interface AppConfig {
    Locale: 'fa' | 'en';
    Messages: typeof messages;
  }
}

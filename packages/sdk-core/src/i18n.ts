/**
 * V3 Feature: Internationalization (i18n) & Localization
 * Provides multi-language support with dynamic content loading
 */

// ==================== Types ====================

export type LocaleCode =
  | 'en' // English
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'it' // Italian
  | 'pt' // Portuguese
  | 'zh' // Chinese
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'ar' // Arabic
  | 'ru' // Russian
  | 'hi' // Hindi
  | 'nl' // Dutch
  | 'sv' // Swedish
  | 'pl' // Polish
  | string; // Allow custom locale codes

export interface Translation {
  [key: string]: string | Translation;
}

export interface LocaleData {
  code: LocaleCode;
  name: string;
  translations: Translation;
  direction?: 'ltr' | 'rtl';
  dateFormat?: string;
  numberFormat?: Intl.NumberFormatOptions;
}

export interface I18nConfig {
  defaultLocale?: LocaleCode;
  fallbackLocale?: LocaleCode;
  detectBrowserLocale?: boolean;
  persistLocale?: boolean;
  storageKey?: string;
  interpolationPattern?: RegExp;
}

export interface InterpolationContext {
  [key: string]: string | number | boolean;
}

// ==================== Internationalization Engine ====================

export class I18n {
  private config: Required<I18nConfig>;
  private locales: Map<LocaleCode, LocaleData> = new Map();
  private currentLocale: LocaleCode;
  private translations: Translation = {};
  private direction: 'ltr' | 'rtl' = 'ltr';

  constructor(config: I18nConfig = {}) {
    this.config = {
      defaultLocale: config.defaultLocale || 'en',
      fallbackLocale: config.fallbackLocale || 'en',
      detectBrowserLocale: config.detectBrowserLocale ?? true,
      persistLocale: config.persistLocale ?? true,
      storageKey: config.storageKey || 'dap_locale',
      interpolationPattern: config.interpolationPattern || /\{\{(\w+)\}\}/g,
    };

    this.currentLocale = this.determineInitialLocale();
  }

  // ==================== Locale Management ====================

  private determineInitialLocale(): LocaleCode {
    // 1. Check localStorage if persistence is enabled
    if (this.config.persistLocale && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.config.storageKey);
        if (stored) return stored as LocaleCode;
      } catch (error) {
        console.warn('[DAP i18n] Failed to load locale from storage:', error);
      }
    }

    // 2. Detect browser locale if enabled
    if (this.config.detectBrowserLocale && typeof navigator !== 'undefined') {
      const browserLocale = this.detectBrowserLocale();
      if (browserLocale) return browserLocale;
    }

    // 3. Use default locale
    return this.config.defaultLocale;
  }

  private detectBrowserLocale(): LocaleCode | null {
    if (typeof navigator === 'undefined') return null;

    const language = navigator.language || (navigator as any).userLanguage;
    if (!language) return null;

    // Extract primary language code (e.g., 'en' from 'en-US')
    const primaryCode = language.split('-')[0].toLowerCase();

    // Check if we have this locale registered
    if (this.locales.has(primaryCode as LocaleCode)) {
      return primaryCode as LocaleCode;
    }

    // Check if we have the full locale code
    if (this.locales.has(language as LocaleCode)) {
      return language as LocaleCode;
    }

    return null;
  }

  registerLocale(localeData: LocaleData): void {
    this.locales.set(localeData.code, localeData);

    // If this is the current locale, load its translations
    if (localeData.code === this.currentLocale) {
      this.loadLocale(localeData.code);
    }
  }

  registerLocales(localesData: LocaleData[]): void {
    localesData.forEach((localeData) => this.registerLocale(localeData));
  }

  getLocale(): LocaleCode {
    return this.currentLocale;
  }

  setLocale(locale: LocaleCode): void {
    if (!this.locales.has(locale)) {
      console.warn(`[DAP i18n] Locale "${locale}" not registered, using fallback`);
      locale = this.config.fallbackLocale;
    }

    this.currentLocale = locale;
    this.loadLocale(locale);

    // Persist to localStorage
    if (this.config.persistLocale && typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.config.storageKey, locale);
      } catch (error) {
        console.warn('[DAP i18n] Failed to save locale to storage:', error);
      }
    }

    // Update document direction
    if (typeof document !== 'undefined') {
      document.documentElement.dir = this.direction;
      document.documentElement.lang = locale;
    }
  }

  private loadLocale(locale: LocaleCode): void {
    const localeData = this.locales.get(locale);

    if (localeData) {
      this.translations = localeData.translations;
      this.direction = localeData.direction || 'ltr';
    } else {
      // Try to load fallback
      const fallbackData = this.locales.get(this.config.fallbackLocale);
      if (fallbackData) {
        this.translations = fallbackData.translations;
        this.direction = fallbackData.direction || 'ltr';
      }
    }
  }

  getAvailableLocales(): LocaleData[] {
    return Array.from(this.locales.values());
  }

  getDirection(): 'ltr' | 'rtl' {
    return this.direction;
  }

  // ==================== Translation ====================

  translate(key: string, context?: InterpolationContext, locale?: LocaleCode): string {
    const targetLocale = locale || this.currentLocale;

    // Get translations for target locale
    let translations = this.translations;
    if (locale && locale !== this.currentLocale) {
      const localeData = this.locales.get(locale);
      translations = localeData?.translations || {};
    }

    // Navigate nested keys (e.g., 'common.buttons.submit')
    const value = this.getNestedTranslation(translations, key);

    if (value === undefined) {
      // Try fallback locale
      if (targetLocale !== this.config.fallbackLocale) {
        const fallbackData = this.locales.get(this.config.fallbackLocale);
        if (fallbackData) {
          const fallbackValue = this.getNestedTranslation(fallbackData.translations, key);
          if (fallbackValue !== undefined) {
            return this.interpolate(fallbackValue, context);
          }
        }
      }

      // Return key if no translation found
      console.warn(`[DAP i18n] Translation missing for key: "${key}" in locale: "${targetLocale}"`);
      return key;
    }

    return this.interpolate(value, context);
  }

  // Alias for translate
  t(key: string, context?: InterpolationContext, locale?: LocaleCode): string {
    return this.translate(key, context, locale);
  }

  private getNestedTranslation(translations: Translation, key: string): string | undefined {
    const keys = key.split('.');
    let value: string | Translation | undefined = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return typeof value === 'string' ? value : undefined;
  }

  private interpolate(template: string, context?: InterpolationContext): string {
    if (!context) return template;

    return template.replace(this.config.interpolationPattern, (match, key) => {
      const value = context[key];
      return value !== undefined ? String(value) : match;
    });
  }

  // ==================== Pluralization ====================

  plural(
    key: string,
    count: number,
    context?: InterpolationContext,
    locale?: LocaleCode
  ): string {
    const pluralKey = this.getPluralKey(key, count, locale);
    const mergedContext = { ...context, count };
    return this.translate(pluralKey, mergedContext, locale);
  }

  private getPluralKey(key: string, count: number, locale?: LocaleCode): string {
    const targetLocale = locale || this.currentLocale;

    // Simple English-like pluralization rules
    // For more complex rules, use a library like Intl.PluralRules
    const pluralForm = this.getPluralForm(count, targetLocale);

    return `${key}.${pluralForm}`;
  }

  private getPluralForm(count: number, locale: LocaleCode): 'zero' | 'one' | 'two' | 'few' | 'many' | 'other' {
    // Use Intl.PluralRules if available
    if (typeof Intl !== 'undefined' && Intl.PluralRules) {
      try {
        const pluralRules = new Intl.PluralRules(locale);
        return pluralRules.select(count) as 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
      } catch (error) {
        // Fallback to simple rules
      }
    }

    // Simple fallback rules (English-like)
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    if (count === 2) return 'two';
    return 'other';
  }

  // ==================== Number & Date Formatting ====================

  formatNumber(value: number, options?: Intl.NumberFormatOptions, locale?: LocaleCode): string {
    const targetLocale = locale || this.currentLocale;

    // Use custom format from locale data if available
    const localeData = this.locales.get(targetLocale);
    const formatOptions = options || localeData?.numberFormat;

    if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
      try {
        return new Intl.NumberFormat(targetLocale, formatOptions).format(value);
      } catch (error) {
        console.warn('[DAP i18n] Number formatting failed:', error);
      }
    }

    return String(value);
  }

  formatDate(date: Date | number, options?: Intl.DateTimeFormatOptions, locale?: LocaleCode): string {
    const targetLocale = locale || this.currentLocale;
    const dateObj = typeof date === 'number' ? new Date(date) : date;

    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      try {
        return new Intl.DateTimeFormat(targetLocale, options).format(dateObj);
      } catch (error) {
        console.warn('[DAP i18n] Date formatting failed:', error);
      }
    }

    return dateObj.toLocaleDateString();
  }

  formatCurrency(value: number, currency: string, locale?: LocaleCode): string {
    const targetLocale = locale || this.currentLocale;

    return this.formatNumber(value, {
      style: 'currency',
      currency,
    }, targetLocale);
  }

  formatRelativeTime(
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    locale?: LocaleCode
  ): string {
    const targetLocale = locale || this.currentLocale;

    if (typeof Intl !== 'undefined' && (Intl as any).RelativeTimeFormat) {
      try {
        return new (Intl as any).RelativeTimeFormat(targetLocale, { numeric: 'auto' }).format(value, unit);
      } catch (error) {
        console.warn('[DAP i18n] Relative time formatting failed:', error);
      }
    }

    return `${value} ${unit}`;
  }

  // ==================== Helper Methods ====================

  exists(key: string, locale?: LocaleCode): boolean {
    const targetLocale = locale || this.currentLocale;
    const localeData = this.locales.get(targetLocale);

    if (!localeData) return false;

    return this.getNestedTranslation(localeData.translations, key) !== undefined;
  }

  getMissingTranslations(targetLocale: LocaleCode, referenceLocale?: LocaleCode): string[] {
    const reference = referenceLocale || this.config.defaultLocale;
    const referenceData = this.locales.get(reference);
    const targetData = this.locales.get(targetLocale);

    if (!referenceData || !targetData) return [];

    const missingKeys: string[] = [];
    const referenceKeys = this.getAllKeys(referenceData.translations);
    const targetKeys = new Set(this.getAllKeys(targetData.translations));

    referenceKeys.forEach((key) => {
      if (!targetKeys.has(key)) {
        missingKeys.push(key);
      }
    });

    return missingKeys;
  }

  private getAllKeys(translations: Translation, prefix = ''): string[] {
    const keys: string[] = [];

    Object.entries(translations).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string') {
        keys.push(fullKey);
      } else if (typeof value === 'object') {
        keys.push(...this.getAllKeys(value as Translation, fullKey));
      }
    });

    return keys;
  }

  // ==================== Data Export ====================

  exportTranslations(locale?: LocaleCode): Translation {
    const targetLocale = locale || this.currentLocale;
    const localeData = this.locales.get(targetLocale);

    return localeData?.translations || {};
  }

  exportAllLocales(): Array<{ locale: LocaleCode; data: LocaleData }> {
    return Array.from(this.locales.entries()).map(([locale, data]) => ({
      locale,
      data,
    }));
  }
}

// ==================== Default Locale Helpers ====================

/**
 * Create default English locale
 */
export function createEnglishLocale(customTranslations: Translation = {}): LocaleData {
  return {
    code: 'en',
    name: 'English',
    direction: 'ltr',
    translations: {
      common: {
        close: 'Close',
        dismiss: 'Dismiss',
        next: 'Next',
        previous: 'Previous',
        complete: 'Complete',
        skip: 'Skip',
        gotIt: 'Got it',
        learnMore: 'Learn more',
      },
      ...customTranslations,
    },
  };
}

/**
 * Create default Spanish locale
 */
export function createSpanishLocale(customTranslations: Translation = {}): LocaleData {
  return {
    code: 'es',
    name: 'Español',
    direction: 'ltr',
    translations: {
      common: {
        close: 'Cerrar',
        dismiss: 'Descartar',
        next: 'Siguiente',
        previous: 'Anterior',
        complete: 'Completar',
        skip: 'Saltar',
        gotIt: 'Entendido',
        learnMore: 'Saber más',
      },
      ...customTranslations,
    },
  };
}

/**
 * Create default French locale
 */
export function createFrenchLocale(customTranslations: Translation = {}): LocaleData {
  return {
    code: 'fr',
    name: 'Français',
    direction: 'ltr',
    translations: {
      common: {
        close: 'Fermer',
        dismiss: 'Ignorer',
        next: 'Suivant',
        previous: 'Précédent',
        complete: 'Terminer',
        skip: 'Passer',
        gotIt: 'Compris',
        learnMore: 'En savoir plus',
      },
      ...customTranslations,
    },
  };
}

/**
 * Create default German locale
 */
export function createGermanLocale(customTranslations: Translation = {}): LocaleData {
  return {
    code: 'de',
    name: 'Deutsch',
    direction: 'ltr',
    translations: {
      common: {
        close: 'Schließen',
        dismiss: 'Verwerfen',
        next: 'Weiter',
        previous: 'Zurück',
        complete: 'Abschließen',
        skip: 'Überspringen',
        gotIt: 'Verstanden',
        learnMore: 'Mehr erfahren',
      },
      ...customTranslations,
    },
  };
}

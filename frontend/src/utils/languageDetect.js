/**
 * Lightweight client-side language detection utility for MindEase.
 *
 * Strategy:
 *  1. Use the BCP-47 language tag returned by the Web Speech API recognition result.
 *  2. For typed text, use Unicode script-range analysis to identify non-Latin
 *     scripts (Devanagari, Bengali, Tamil, Arabic, CJK, etc.) — instant and
 *     dependency-free.
 *  3. Falls back to the browser UI language, then "en".
 */

// Maps a BCP-47 tag (or prefix) to a human-readable label
const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'हिंदी',
  bn: 'বাংলা',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
  ur: 'اردو',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  it: 'Italiano',
  nl: 'Nederlands',
  ru: 'Русский',
  ar: 'العربية',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
};

/**
 * Normalize a BCP-47 tag to just the primary language subtag (e.g. "en-US" → "en").
 */
export function normalizeLang(tag) {
  if (!tag) return 'en';
  return tag.split('-')[0].toLowerCase();
}

/**
 * Return a human-readable label for a language code.
 */
export function languageLabel(code) {
  const base = normalizeLang(code);
  return LANGUAGE_NAMES[base] || code.toUpperCase();
}

/**
 * Map a language code to the best BCP-47 tag for Web Speech API / SpeechSynthesis.
 * Keeps regional accent for recognition so the model is more accurate.
 */
const LANG_TO_BCP47 = {
  en: 'en-US',
  hi: 'hi-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  ur: 'ur-PK',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  pt: 'pt-BR',
  it: 'it-IT',
  nl: 'nl-NL',
  ru: 'ru-RU',
  ar: 'ar-SA',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
};

export function toBCP47(langCode) {
  const base = normalizeLang(langCode);
  return LANG_TO_BCP47[base] || langCode;
}

/**
 * Pick the best SpeechSynthesisVoice for a given language code.
 *
 * Priority order:
 *  1. Local voice whose lang prefix matches exactly (e.g. "hi" for "hi-IN").
 *  2. Any voice (local or remote) whose lang prefix matches exactly.
 *  3. Any voice whose BCP-47 tag starts with the target prefix (catches "en-GB"
 *     when only "en-US" is requested, etc.).
 *  4. null — caller should set utterance.lang as a fallback instead.
 *
 * Returns null if speechSynthesis is unavailable or no match found.
 */
export function pickVoice(langCode) {
  if (!('speechSynthesis' in window)) return null;
  const target = normalizeLang(langCode);           // e.g. "hi"
  const bcp47  = toBCP47(langCode);                 // e.g. "hi-IN"
  const voices = window.speechSynthesis.getVoices();

  // 1. Local voice, exact language prefix match
  const localExact = voices.find(
    v => v.localService && normalizeLang(v.lang) === target
  );
  if (localExact) return localExact;

  // 2. Any voice, exact language prefix match
  const anyExact = voices.find(v => normalizeLang(v.lang) === target);
  if (anyExact) return anyExact;

  // 3. Any voice whose BCP-47 tag starts with the target prefix
  const anyPrefix = voices.find(v => v.lang.toLowerCase().startsWith(target));
  if (anyPrefix) return anyPrefix;

  return null;
}

// ─── Unicode-script based auto-detection for typed text ────────────────────
//
// We test Unicode block ranges in priority order. Each entry is:
//   [regex, langCode]
// The first match wins. Latin text returns null (caller keeps current lang).
//
const SCRIPT_PATTERNS = [
  // Devanagari — Hindi, Marathi (we default to 'hi'; user can refine via picker)
  [/[\u0900-\u097F]/, 'hi'],
  // Bengali
  [/[\u0980-\u09FF]/, 'bn'],
  // Gurmukhi (Punjabi)
  [/[\u0A00-\u0A7F]/, 'pa'],
  // Gujarati
  [/[\u0A80-\u0AFF]/, 'gu'],
  // Oriya / Odia — mapped to 'or' but not in our list; skip
  // Tamil
  [/[\u0B80-\u0BFF]/, 'ta'],
  // Telugu
  [/[\u0C00-\u0C7F]/, 'te'],
  // Kannada
  [/[\u0C80-\u0CFF]/, 'kn'],
  // Malayalam
  [/[\u0D00-\u0D7F]/, 'ml'],
  // Arabic / Urdu (Arabic and Urdu share the same block; we use 'ar' as default)
  [/[\u0600-\u06FF]/, 'ar'],
  // CJK Unified Ideographs — Chinese (simplified default)
  [/[\u4E00-\u9FFF\u3400-\u4DBF]/, 'zh'],
  // Hiragana / Katakana — Japanese
  [/[\u3040-\u30FF]/, 'ja'],
  // Hangul — Korean
  [/[\uAC00-\uD7AF\u1100-\u11FF]/, 'ko'],
  // Cyrillic — Russian
  [/[\u0400-\u04FF]/, 'ru'],
];

/**
 * Detect language from typed text using Unicode script analysis.
 *
 * Returns an ISO-639-1 code if a non-Latin script is detected,
 * or null if the text is Latin / unrecognised (caller should keep current lang).
 *
 * Only fires when the text is at least 2 characters long to avoid flickering
 * on the first keypress.
 */
export function detectScriptLang(text) {
  if (!text || text.trim().length < 2) return null;
  for (const [pattern, code] of SCRIPT_PATTERNS) {
    if (pattern.test(text)) return code;
  }
  return null; // Latin or unknown — keep current language
}

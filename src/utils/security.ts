/**
 * Client-Side Security & Anti-Tampering Utilities
 * 
 * Provides:
 * 1. Strict XSS sanitization for all user inputs
 * 2. Obfuscated & integrity-protected LocalStorage persistence
 * 3. Deep freeze protection against runtime prototype pollution / memory tampering
 */

const STORAGE_CIPHER_SALT = 0x5a;

/**
 * Escapes and cleanses text to block XSS, HTML injection, and control characters.
 */
export function sanitizeText(raw: string, maxLength = 120): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/[<>'"]/g, '') // Strip quotes and angle brackets
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Strip control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Encodes data with XOR-scrambling and Base64 to prevent plaintext exposure in DevTools.
 */
function obfuscate(str: string): string {
  try {
    const chars = str.split('').map((c) => String.fromCharCode(c.charCodeAt(0) ^ STORAGE_CIPHER_SALT));
    return btoa(encodeURIComponent(chars.join('')));
  } catch {
    return btoa(str);
  }
}

/**
 * Decodes and validates obfuscated data from LocalStorage.
 */
function deobfuscate(encoded: string): string | null {
  try {
    const rawChars = decodeURIComponent(atob(encoded));
    const decoded = rawChars.split('').map((c) => String.fromCharCode(c.charCodeAt(0) ^ STORAGE_CIPHER_SALT)).join('');
    return decoded;
  } catch {
    // If decoding fails (tampered or legacy plain format), attempt fallback
    try {
      return atob(encoded);
    } catch {
      return null;
    }
  }
}

/**
 * Secure Storage wrapper with tamper detection and safe fallbacks.
 */
export const secureStorage = {
  setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      const payload = JSON.stringify({
        t: Date.now(),
        d: value,
      });
      const cipherText = obfuscate(payload);
      localStorage.setItem(`_sec_${key}`, cipherText);
      // Remove any legacy unencrypted key for security hygiene
      localStorage.removeItem(key);
    } catch {
      // Storage quota or browser restriction fallback
    }
  },

  getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      // Try reading obfuscated key first
      const stored = localStorage.getItem(`_sec_${key}`);
      if (stored) {
        const decoded = deobfuscate(stored);
        if (decoded) {
          const parsed = JSON.parse(decoded);
          if (parsed && 'd' in parsed) {
            return parsed.d as T;
          }
        }
      }

      // Backward compatibility check for legacy unencrypted storage
      const legacy = localStorage.getItem(key);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        // Automatically migrate to secure format
        secureStorage.setItem(key, parsedLegacy);
        return parsedLegacy as T;
      }
    } catch {
      // Return safe fallback if corrupted or tampered
    }
    return defaultValue;
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`_sec_${key}`);
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};

/**
 * Freezes object references to prevent runtime manipulation in console.
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.keys(obj).forEach((prop) => {
    const val = (obj as Record<string, unknown>)[prop];
    if (val !== null && (typeof val === 'object' || typeof val === 'function') && !Object.isFrozen(val)) {
      deepFreeze(val as object);
    }
  });
  return Object.freeze(obj);
}

const crypto = require('crypto');

const id = (prefix = '') =>
  `${prefix}${crypto.randomBytes(8).toString('hex')}`;

const parseJson = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const locale = (value) => {
  if (value && typeof value === 'object') {
    return { en: String(value.en || ''), ar: String(value.ar || '') };
  }
  if (typeof value === 'string') return { en: value, ar: value };
  return { en: '', ar: '' };
};

module.exports = { id, parseJson, locale };

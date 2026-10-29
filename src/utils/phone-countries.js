export const PHONE_COUNTRIES = [
  { iso: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات', dial: '971', flag: '🇦🇪', lengths: [9] },
  { iso: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية', dial: '966', flag: '🇸🇦', lengths: [9] },
  { iso: 'EG', name: 'Egypt', nameAr: 'مصر', dial: '20', flag: '🇪🇬', lengths: [10] },
  { iso: 'JO', name: 'Jordan', nameAr: 'الأردن', dial: '962', flag: '🇯🇴', lengths: [9] },
  { iso: 'KW', name: 'Kuwait', nameAr: 'الكويت', dial: '965', flag: '🇰🇼', lengths: [8] },
  { iso: 'QA', name: 'Qatar', nameAr: 'قطر', dial: '974', flag: '🇶🇦', lengths: [8] },
  { iso: 'BH', name: 'Bahrain', nameAr: 'البحرين', dial: '973', flag: '🇧🇭', lengths: [8] },
  { iso: 'OM', name: 'Oman', nameAr: 'عُمان', dial: '968', flag: '🇴🇲', lengths: [8] },
  { iso: 'LB', name: 'Lebanon', nameAr: 'لبنان', dial: '961', flag: '🇱🇧', lengths: [7, 8] },
  { iso: 'IQ', name: 'Iraq', nameAr: 'العراق', dial: '964', flag: '🇮🇶', lengths: [10] },
  { iso: 'SY', name: 'Syria', nameAr: 'سوريا', dial: '963', flag: '🇸🇾', lengths: [9, 10] },
  { iso: 'PS', name: 'Palestine', nameAr: 'فلسطين', dial: '970', flag: '🇵🇸', lengths: [9] },
  { iso: 'YE', name: 'Yemen', nameAr: 'اليمن', dial: '967', flag: '🇾🇪', lengths: [9] },
  { iso: 'MA', name: 'Morocco', nameAr: 'المغرب', dial: '212', flag: '🇲🇦', lengths: [9] },
  { iso: 'DZ', name: 'Algeria', nameAr: 'الجزائر', dial: '213', flag: '🇩🇿', lengths: [9] },
  { iso: 'TN', name: 'Tunisia', nameAr: 'تونس', dial: '216', flag: '🇹🇳', lengths: [8] },
  { iso: 'TR', name: 'Turkey', nameAr: 'تركيا', dial: '90', flag: '🇹🇷', lengths: [10] },
  { iso: 'US', name: 'United States', nameAr: 'الولايات المتحدة', dial: '1', flag: '🇺🇸', lengths: [10] },
  { iso: 'GB', name: 'United Kingdom', nameAr: 'بريطانيا', dial: '44', flag: '🇬🇧', lengths: [10] },
  { iso: 'FR', name: 'France', nameAr: 'فرنسا', dial: '33', flag: '🇫🇷', lengths: [9] },
  { iso: 'DE', name: 'Germany', nameAr: 'ألمانيا', dial: '49', flag: '🇩🇪', lengths: [10, 11] },
  { iso: 'IN', name: 'India', nameAr: 'الهند', dial: '91', flag: '🇮🇳', lengths: [10] },
  { iso: 'PK', name: 'Pakistan', nameAr: 'باكستان', dial: '92', flag: '🇵🇰', lengths: [10] },
];

export const DEFAULT_PHONE_COUNTRY = 'AE';

export const getPhoneCountry = (iso) =>
  PHONE_COUNTRIES.find((country) => country.iso === iso) ||
  PHONE_COUNTRIES.find((country) => country.iso === DEFAULT_PHONE_COUNTRY);

export const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

export const parsePhoneValue = (value = '') => {
  const raw = String(value).trim();
  if (!raw) {
    return { iso: DEFAULT_PHONE_COUNTRY, national: '', e164: '' };
  }

  const digits = digitsOnly(raw.startsWith('+') ? raw.slice(1) : raw);
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const matched = sorted.find((country) => digits.startsWith(country.dial));

  if (matched) {
    const national = digits.slice(matched.dial.length);
    return {
      iso: matched.iso,
      national,
      e164: national ? `+${matched.dial}${national}` : '',
    };
  }

  return {
    iso: DEFAULT_PHONE_COUNTRY,
    national: digits,
    e164: digits ? `+${getPhoneCountry(DEFAULT_PHONE_COUNTRY).dial}${digits}` : '',
  };
};

export const buildE164 = (iso, national) => {
  const country = getPhoneCountry(iso);
  const local = digitsOnly(national);
  if (!local) return '';
  return `+${country.dial}${local}`;
};

export const isValidNationalNumber = (iso, national) => {
  const country = getPhoneCountry(iso);
  const local = digitsOnly(national);
  if (!local) return false;
  return country.lengths.includes(local.length);
};

export const getPhoneValidationState = (iso, national) => {
  let local = digitsOnly(national);
  const country = getPhoneCountry(iso);

  if (!local) {
    return { status: 'empty', messageEn: '', messageAr: '' };
  }

  // Users often type a leading trunk 0 with the country already selected.
  if (
    local.startsWith('0') &&
    !country.lengths.includes(local.length) &&
    country.lengths.includes(local.length - 1)
  ) {
    local = local.slice(1);
  }

  const maxLen = Math.max(...country.lengths);

  if (local.length > maxLen) {
    return {
      status: 'invalid',
      messageEn: `Too many digits for ${country.name}`,
      messageAr: `عدد الأرقام أكبر من المسموح لـ ${country.nameAr}`,
    };
  }

  if (country.lengths.includes(local.length)) {
    return {
      status: 'valid',
      messageEn: 'Valid number',
      messageAr: 'رقم صالح',
    };
  }

  return {
    status: 'incomplete',
    messageEn: `Enter ${country.lengths.join(' or ')} digits`,
    messageAr: `أدخل ${country.lengths.join(' أو ')} أرقام`,
  };
};

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  PHONE_COUNTRIES,
  DEFAULT_PHONE_COUNTRY,
  buildE164,
  digitsOnly,
  getPhoneCountry,
  getPhoneValidationState,
  parsePhoneValue,
} from '../../utils/phone-countries.js';

import './phone-input.styles.scss';

const PhoneInput = ({
  value = '',
  onChange,
  language = 'en',
  disabled = false,
  name = 'phone',
  id,
}) => {
  const parsed = useMemo(() => parsePhoneValue(value), [value]);
  const [iso, setIso] = useState(parsed.iso || DEFAULT_PHONE_COUNTRY);
  const [national, setNational] = useState(parsed.national || '');
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const next = parsePhoneValue(value);
    setIso(next.iso || DEFAULT_PHONE_COUNTRY);
    setNational(next.national || '');
  }, [value]);

  useEffect(() => {
    const handleClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const country = getPhoneCountry(iso);
  const validation = getPhoneValidationState(iso, national);
  const maxLen = Math.max(...country.lengths);

  const emit = (nextIso, nextNational) => {
    if (!onChange) return;
    onChange(buildE164(nextIso, nextNational));
  };

  const handleNationalChange = (event) => {
    const next = digitsOnly(event.target.value).slice(0, maxLen);
    setNational(next);
    emit(iso, next);
  };

  const handleSelectCountry = (nextIso) => {
    setIso(nextIso);
    setOpen(false);
    const nextCountry = getPhoneCountry(nextIso);
    const limited = digitsOnly(national).slice(
      0,
      Math.max(...nextCountry.lengths)
    );
    setNational(limited);
    emit(nextIso, limited);
  };

  const statusMessage =
    language === 'ar' ? validation.messageAr : validation.messageEn;

  return (
    <div
      className={`phone-input ${validation.status}`}
      ref={rootRef}
      dir='ltr'
    >
      <div className='phone-input-row'>
        <button
          type='button'
          className='phone-country-btn'
          onClick={() => setOpen((current) => !current)}
          disabled={disabled}
          aria-label='Select country'
        >
          <span className='phone-flag'>{country.flag}</span>
          <span className='phone-dial'>+{country.dial}</span>
          <span className='phone-caret'>▾</span>
        </button>

        <input
          id={id}
          name={name}
          className='phone-national-input'
          type='tel'
          inputMode='numeric'
          autoComplete='tel-national'
          value={national}
          onChange={handleNationalChange}
          disabled={disabled}
          placeholder={String(country.lengths[0]).replace(/./g, '0')}
        />
      </div>

      {open && (
        <div className='phone-country-menu' role='listbox'>
          {PHONE_COUNTRIES.map((item) => (
            <button
              key={item.iso}
              type='button'
              className={`phone-country-option${
                item.iso === iso ? ' selected' : ''
              }`}
              onClick={() => handleSelectCountry(item.iso)}
            >
              <span className='phone-flag'>{item.flag}</span>
              <span className='phone-country-name'>
                {language === 'ar' ? item.nameAr : item.name}
              </span>
              <span className='phone-dial'>+{item.dial}</span>
            </button>
          ))}
        </div>
      )}

      {statusMessage && (
        <span className={`phone-status ${validation.status}`}>
          {statusMessage}
        </span>
      )}
    </div>
  );
};

export default PhoneInput;

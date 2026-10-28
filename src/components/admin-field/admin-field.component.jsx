import { useState } from 'react';

import TranslationModal from '../translation-modal/translation-modal.component.jsx';
import { normalizeLocaleValue } from '../../utils/i18n.js';

const AdminField = ({
  label,
  hint,
  as: Control = 'input',
  children,
  translatable = false,
  localeValue,
  onLocaleChange,
  ...otherProps
}) => {
  const [open, setOpen] = useState(false);
  const normalized = normalizeLocaleValue(localeValue, otherProps.value || '');

  const handleSaveTranslation = (arValue) => {
    if (onLocaleChange) {
      onLocaleChange({
        en: normalized.en,
        ar: arValue,
      });
    }
    setOpen(false);
  };

  const handlePrimaryChange = (event) => {
    if (translatable && onLocaleChange) {
      onLocaleChange({
        en: event.target.value,
        ar: normalized.ar,
      });
    }

    if (otherProps.onChange) {
      otherProps.onChange(event);
    }
  };

  return (
    <label className='admin-field'>
      <span className='admin-field-label-row'>
        <span className='admin-field-label'>{label}</span>
        {translatable && (
          <button
            type='button'
            className={`admin-translate-btn${
              normalized.ar && normalized.ar !== normalized.en ? ' has-translation' : ''
            }`}
            title='Add / edit Arabic translation'
            onClick={(event) => {
              event.preventDefault();
              setOpen(true);
            }}
          >
            🌐
          </button>
        )}
      </span>

      <Control
        className='admin-field-control'
        {...otherProps}
        value={translatable ? normalized.en : otherProps.value}
        onChange={handlePrimaryChange}
      >
        {children}
      </Control>

      {hint && <span className='admin-hint'>{hint}</span>}

      {translatable && (
        <TranslationModal
          open={open}
          title='Arabic translation'
          sourceLabel='English'
          targetLabel='العربية'
          sourceValue={normalized.en}
          targetValue={normalized.ar}
          onClose={() => setOpen(false)}
          onSave={handleSaveTranslation}
        />
      )}
    </label>
  );
};

export default AdminField;

import { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import Button from '../button/button.component.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';

import './translation-modal.styles.scss';

const TranslationModal = ({
  open,
  title,
  sourceLabel,
  targetLabel,
  sourceValue = '',
  targetValue = '',
  onClose,
  onSave,
}) => {
  const { t } = useContext(LanguageContext);
  const [draft, setDraft] = useState(targetValue || '');

  useEffect(() => {
    if (open) setDraft(targetValue || '');
  }, [open, targetValue]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const modal = (
    <div
      className='translation-modal-backdrop'
      role='presentation'
      onClick={onClose}
    >
      <div
        className='translation-modal'
        role='dialog'
        aria-modal='true'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='translation-modal-header'>
          <h3>{title || t('arabicTranslationTitle')}</h3>
          <button
            type='button'
            className='translation-modal-close'
            onClick={onClose}
            aria-label={t('cancel')}
          >
            ×
          </button>
        </div>

        <label className='translation-field'>
          <span>{sourceLabel || t('english')}</span>
          <textarea value={sourceValue} readOnly rows={3} dir='auto' />
        </label>

        <label className='translation-field'>
          <span>{targetLabel || t('arabic')}</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            autoFocus
            dir='auto'
          />
        </label>

        <div className='translation-modal-actions'>
          <Button type='button' buttonType='inverted' onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type='button' onClick={() => onSave(draft)}>
            {t('saveTranslation')}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default TranslationModal;

import { useEffect, useState } from 'react';

import Button from '../button/button.component.jsx';

import './translation-modal.styles.scss';

const TranslationModal = ({
  open,
  title = 'Translation',
  sourceLabel = 'English',
  targetLabel = 'Arabic',
  sourceValue = '',
  targetValue = '',
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState(targetValue || '');

  useEffect(() => {
    if (open) setDraft(targetValue || '');
  }, [open, targetValue]);

  if (!open) return null;

  return (
    <div className='translation-modal-backdrop' role='presentation' onClick={onClose}>
      <div
        className='translation-modal'
        role='dialog'
        aria-modal='true'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='translation-modal-header'>
          <h3>{title}</h3>
          <button type='button' className='translation-modal-close' onClick={onClose}>
            ×
          </button>
        </div>

        <label className='translation-field'>
          <span>{sourceLabel}</span>
          <textarea value={sourceValue} readOnly rows={3} />
        </label>

        <label className='translation-field'>
          <span>{targetLabel}</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            autoFocus
          />
        </label>

        <div className='translation-modal-actions'>
          <Button type='button' buttonType='inverted' onClick={onClose}>
            Cancel
          </Button>
          <Button type='button' onClick={() => onSave(draft)}>
            Save translation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TranslationModal;

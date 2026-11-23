import { useRef, useState } from 'react';
import { useContext } from 'react';

import { LanguageContext } from '../../contexts/language.context.jsx';
import {
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} from '../../utils/cloudinary.js';

import './image-upload.styles.scss';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ImageUpload = ({
  value = '',
  onChange,
  onUploadingChange,
  folder = 'crwn',
  label,
  required = false,
  disabled = false,
}) => {
  const { t } = useContext(LanguageContext);
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const configured = isCloudinaryConfigured();

  const handlePick = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    setError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('chooseImageFile'));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(t('imageTooLarge5'));
      return;
    }
    if (!configured) {
      setError(t('cloudinaryNotConfigured'));
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);
    try {
      const url = await uploadImageToCloudinary(file, { folder });
      onChange?.(url);
    } catch (err) {
      setError(err?.message || t('imageUploadFailed'));
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <div className='image-upload'>
      {label && (
        <span className='image-upload-label'>
          {label}
          {required ? ' *' : ''}
        </span>
      )}

      <div className='image-upload-row'>
        {value ? (
          <img className='image-upload-preview' src={value} alt='' />
        ) : (
          <div className='image-upload-placeholder' aria-hidden>
            —
          </div>
        )}

        <div className='image-upload-actions'>
          <button
            type='button'
            className='image-upload-btn'
            onClick={handlePick}
            disabled={disabled || uploading}
          >
            {uploading ? t('uploadingImage') : t('uploadImage')}
          </button>
          {value && (
            <button
              type='button'
              className='image-upload-btn secondary'
              onClick={() => onChange?.('')}
              disabled={disabled || uploading}
            >
              {t('removeImage')}
            </button>
          )}
          <input
            ref={inputRef}
            type='file'
            accept='image/png,image/jpeg,image/webp,image/gif'
            hidden
            onChange={handleFile}
          />
        </div>
      </div>

      <input
        className='image-upload-url'
        type='url'
        dir='ltr'
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={t('orPasteImageUrl')}
        disabled={disabled || uploading}
      />

      {error && <p className='image-upload-error'>{error}</p>}
      {!configured && (
        <p className='image-upload-hint'>{t('cloudinarySetupHint')}</p>
      )}
    </div>
  );
};

export default ImageUpload;

import { useContext, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';

import Button from '../../components/button/button.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';

import { UserContext } from '../../contexts/user.context.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';
import PhoneInput from '../../components/phone-input/phone-input.component.jsx';

import {
  updateUserProfile,
  uploadProfilePhoto,
} from '../../utils/firebase/firebase.utils.js';
import {
  isValidNationalNumber,
  parsePhoneValue,
} from '../../utils/phone-countries.js';

import './profile.styles.scss';

const MAX_FILE_SIZE = 3 * 1024 * 1024;

const Profile = () => {
  const { currentUser, userProfile, isAuthReady, refreshUserProfile } =
    useContext(UserContext);
  const { language, t } = useContext(LanguageContext);
  const fileInputRef = useRef(null);

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!userProfile) return;

    setDisplayName(userProfile.displayName || '');
    setPhone(userProfile.phone || '');
    setPreviewUrl(userProfile.photoURL || '');
    setSelectedFile(null);
  }, [userProfile]);

  if (!isAuthReady) return <Spinner />;

  if (!currentUser) {
    return <Navigate to='/auth' state={{ from: '/profile' }} replace />;
  }

  const initials = (displayName || currentUser.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    setMessage({ type: '', text: '' });

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: t('chooseImageFile') });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: 'error', text: t('imageTooLarge') });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    setMessage({ type: '', text: '' });

    if (phone) {
      const parsedPhone = parsePhoneValue(phone);
      if (!isValidNationalNumber(parsedPhone.iso, parsedPhone.national)) {
        setMessage({ type: 'error', text: t('requiredPhone') });
        return;
      }
    }

    setIsSaving(true);

    try {
      let photoURL = userProfile?.photoURL || '';

      if (selectedFile) {
        photoURL = await uploadProfilePhoto(currentUser.uid, selectedFile);
      }

      await updateUserProfile(currentUser.uid, {
        displayName,
        phone,
        photoURL,
      });

      await refreshUserProfile(currentUser.uid);
      setSelectedFile(null);
      setMessage({ type: 'success', text: t('profileUpdated') });
    } catch (error) {
      const text =
        error?.message && error.message.startsWith('Please choose')
          ? error.message
          : t('couldNotSaveProfile');
      setMessage({ type: 'error', text });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='profile-container'>
      <div className='profile-header'>
        <h1 className='profile-title'>{t('myProfile')}</h1>
        <p className='profile-subtitle'>{t('profileSubtitle')}</p>
      </div>

      <form className='profile-card' onSubmit={handleSave} noValidate>
        <div className='profile-avatar-section'>
          <div className='profile-avatar'>
            {previewUrl ? (
              <img src={previewUrl} alt='Profile' />
            ) : (
              <span className='profile-avatar-fallback'>{initials}</span>
            )}
          </div>
          <div className='profile-avatar-actions'>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              hidden
              onChange={handleFileChange}
            />
            <Button
              type='button'
              buttonType='inverted'
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              {t('changePhoto')}
            </Button>
            <span className='profile-hint'>{t('photoHint')}</span>
          </div>
        </div>

        <div className='profile-fields'>
          <label className='profile-field'>
            <span className='profile-label'>{t('displayName')}</span>
            <input
              className='profile-input'
              type='text'
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
              autoComplete='name'
              placeholder='Your name'
            />
          </label>

          <label className='profile-field'>
            <span className='profile-label'>{t('email')}</span>
            <input
              className='profile-input'
              type='email'
              value={currentUser.email || ''}
              disabled
              readOnly
            />
          </label>

          <label className='profile-field'>
            <span className='profile-label'>{t('phone')}</span>
            <PhoneInput
              value={phone}
              language={language}
              onChange={setPhone}
            />
          </label>
        </div>

        {message.text && (
          <div
            className={`profile-message ${message.type}`}
            role={message.type === 'error' ? 'alert' : 'status'}
          >
            {message.text}
          </div>
        )}

        <div className='profile-actions'>
          <Button type='submit' disabled={isSaving}>
            {isSaving ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Profile;

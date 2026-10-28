import { useContext, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';

import Button from '../../components/button/button.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';

import { UserContext } from '../../contexts/user.context.jsx';

import {
  updateUserProfile,
  uploadProfilePhoto,
} from '../../utils/firebase/firebase.utils.js';

import './profile.styles.scss';

const MAX_FILE_SIZE = 3 * 1024 * 1024;

const Profile = () => {
  const { currentUser, userProfile, isAuthReady, refreshUserProfile } =
    useContext(UserContext);
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
      setMessage({ type: 'error', text: 'Please choose an image file.' });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: 'error', text: 'Image must be under 3MB.' });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    setMessage({ type: '', text: '' });
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
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      const text =
        error?.message && error.message.startsWith('Please choose')
          ? error.message
          : 'Could not save profile. Please try again.';
      setMessage({ type: 'error', text });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='profile-container'>
      <div className='profile-header'>
        <h1 className='profile-title'>My profile</h1>
        <p className='profile-subtitle'>Update your name, phone and photo</p>
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
              Change photo
            </Button>
            <span className='profile-hint'>
              JPG, PNG or WebP · compressed and saved for free
            </span>
          </div>
        </div>

        <div className='profile-fields'>
          <label className='profile-field'>
            <span className='profile-label'>Display name</span>
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
            <span className='profile-label'>Email</span>
            <input
              className='profile-input'
              type='email'
              value={currentUser.email || ''}
              disabled
              readOnly
            />
          </label>

          <label className='profile-field'>
            <span className='profile-label'>Phone</span>
            <input
              className='profile-input'
              type='tel'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              autoComplete='tel'
              placeholder='Optional'
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
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Profile;

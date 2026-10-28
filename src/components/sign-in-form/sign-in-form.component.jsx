import { useContext, useState } from 'react';

import FormInput from '../form-input/form-input.component.jsx';
import Button from '../button/button.component.jsx';

import { LanguageContext } from '../../contexts/language.context.jsx';

import {
  signInAuthUserWithEmailAndPassword,
  signInWithGooglePopup,
} from '../../utils/firebase/firebase.utils';

import './sign-in-form.styles.scss';

const defaultFormFields = {
  email: '',
  password: '',
};

const ignoredErrorCodes = [
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
];

const SignInForm = () => {
  const { t } = useContext(LanguageContext);
  const [formFields, setFormFields] = useState(defaultFormFields);
  const [errorMessage, setErrorMessage] = useState('');
  const { email, password } = formFields;

  const getErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return t('authWrongPassword');
      case 'auth/user-not-found':
        return t('authUserNotFound');
      case 'auth/too-many-requests':
        return t('authTooMany');
      case 'auth/network-request-failed':
        return t('authNetwork');
      default:
        return t('authSignInFailed');
    }
  };

  const resetFormFields = () => {
    setFormFields(defaultFormFields);
  };

  const signInWithGoogle = async () => {
    setErrorMessage('');

    try {
      await signInWithGooglePopup();
    } catch (error) {
      if (ignoredErrorCodes.includes(error.code)) return;
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    try {
      await signInAuthUserWithEmailAndPassword(email, password);
      resetFormFields();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormFields({ ...formFields, [name]: value });
  };

  return (
    <div className='sign-in-container'>
      <h2>{t('alreadyHaveAccount')}</h2>
      <span>{t('signInSubtitle')}</span>
      <form onSubmit={handleSubmit}>
        <FormInput
          label={t('email')}
          type='email'
          required
          onChange={handleChange}
          name='email'
          value={email}
          autoComplete='email'
        />

        <FormInput
          label={t('password')}
          type='password'
          required
          onChange={handleChange}
          name='password'
          value={password}
          autoComplete='current-password'
        />
        {errorMessage && (
          <span className='error-message' role='alert'>
            {errorMessage}
          </span>
        )}
        <div className='buttons-container'>
          <Button type='submit'>{t('signInBtn')}</Button>
          <Button buttonType='google' type='button' onClick={signInWithGoogle}>
            {t('signWithGoogle')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SignInForm;

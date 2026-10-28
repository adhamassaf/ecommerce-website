import { useContext, useState } from 'react';

import FormInput from '../form-input/form-input.component.jsx';
import Button from '../button/button.component.jsx';

import { LanguageContext } from '../../contexts/language.context.jsx';

import {
  createAuthUserWithEmailAndPassword,
  createUserDocumentFromAuth,
} from '../../utils/firebase/firebase.utils';

import './sign-up-form.styles.scss';

const defaultFormFields = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const SignUpForm = () => {
  const { t } = useContext(LanguageContext);
  const [formFields, setFormFields] = useState(defaultFormFields);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { displayName, email, password, confirmPassword } = formFields;

  const getErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return t('authEmailInUse');
      case 'auth/weak-password':
        return t('authWeakPassword');
      case 'auth/network-request-failed':
        return t('authNetwork');
      default:
        return t('authSignUpFailed');
    }
  };

  const resetFormFields = () => {
    setFormFields(defaultFormFields);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage(t('authPasswordMismatch'));
      return;
    }

    setIsSubmitting(true);

    try {
      const { user } = await createAuthUserWithEmailAndPassword(email, password);
      await createUserDocumentFromAuth(user, { displayName });
      resetFormFields();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormFields({ ...formFields, [name]: value });
  };

  return (
    <div className='sign-up-container'>
      <h2>{t('dontHaveAccount')}</h2>
      <span>{t('signUpSubtitle')}</span>
      <form onSubmit={handleSubmit}>
        <FormInput
          label={t('displayName')}
          type='text'
          required
          onChange={handleChange}
          name='displayName'
          value={displayName}
          autoComplete='name'
        />

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
          autoComplete='new-password'
        />

        <FormInput
          label={t('confirmPassword')}
          type='password'
          required
          onChange={handleChange}
          name='confirmPassword'
          value={confirmPassword}
          autoComplete='new-password'
        />
        {errorMessage && (
          <span className='error-message' role='alert'>
            {errorMessage}
          </span>
        )}
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? t('creatingAccount') : t('signUpBtn')}
        </Button>
      </form>
    </div>
  );
};

export default SignUpForm;

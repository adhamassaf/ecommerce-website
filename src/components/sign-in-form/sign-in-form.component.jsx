import { useState } from 'react';

import FormInput from '../form-input/form-input.component.jsx';
import Button from '../button/button.component.jsx';

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

const getErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/too-many-requests':
      return 'Too many attempts, try again later';
    case 'auth/network-request-failed':
      return 'Network error, check your connection';
    default:
      return 'Sign in failed, please try again';
  }
};

const SignInForm = () => {
  const [formFields, setFormFields] = useState(defaultFormFields);
  const [errorMessage, setErrorMessage] = useState('');
  const { email, password } = formFields;

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
      <h2>Already have an account?</h2>
      <span>Sign in with your email and password</span>
      <form onSubmit={handleSubmit}>
        <FormInput
          label='Email'
          type='email'
          required
          onChange={handleChange}
          name='email'
          value={email}
        />

        <FormInput
          label='Password'
          type='password'
          required
          onChange={handleChange}
          name='password'
          value={password}
        />
        {errorMessage && <span className='error-message'>{errorMessage}</span>}
        <div className='buttons-container'>
          <Button type='submit'>Sign In</Button>
          <Button buttonType='google' type='button' onClick={signInWithGoogle}>
            Sign With Google
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SignInForm;

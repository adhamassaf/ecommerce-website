import { useState } from 'react';

import './form-input.styles.scss';

const EyeIcon = () => (
  <svg
    width='22'
    height='22'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
    <circle cx='12' cy='12' r='3' />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width='22'
    height='22'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' />
    <line x1='1' y1='1' x2='23' y2='23' />
  </svg>
);

const FormInput = ({ label, type, ...otherProps }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPasswordField = type === 'password';
  const inputType = isPasswordField && isPasswordVisible ? 'text' : type;

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((isVisible) => !isVisible);
  };

  return (
    <div className='group'>
      <input
        className={`form-input${isPasswordField ? ' has-toggle' : ''}`}
        type={inputType}
        {...otherProps}
      />
      {label && (
        <label
          className={`${
            otherProps.value.length ? 'shrink' : ''
          } form-input-label`}
        >
          {label}
        </label>
      )}
      {isPasswordField && (
        <button
          type='button'
          className='password-toggle'
          onClick={togglePasswordVisibility}
          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isPasswordVisible}
        >
          {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}
    </div>
  );
};

export default FormInput;

import { useContext } from 'react';
import { Navigate } from 'react-router-dom';

import SignUpForm from '../../components/sign-up-form/sign-up-form.component.jsx';
import SignInForm from '../../components/sign-in-form/sign-in-form.component.jsx';

import { UserContext } from '../../contexts/user.context.jsx';

import './authentication.styles.scss';

const Authentication = () => {
  const { currentUser } = useContext(UserContext);

  if (currentUser) return <Navigate to='/' replace />;

  return (
    <div className='authentication-container'>
      <SignInForm />
      <SignUpForm />
    </div>
  );
};

export default Authentication;
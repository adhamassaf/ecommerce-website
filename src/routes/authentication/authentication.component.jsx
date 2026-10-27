import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import SignUpForm from '../../components/sign-up-form/sign-up-form.component.jsx';
import SignInForm from '../../components/sign-in-form/sign-in-form.component.jsx';

import { UserContext } from '../../contexts/user.context.jsx';

import './authentication.styles.scss';

const Authentication = () => {
  const { currentUser } = useContext(UserContext);
  const location = useLocation();

  const from = location.state ? location.state.from : null;
  const redirectTo =
    typeof from === 'string' && from.startsWith('/') ? from : '/';

  if (currentUser) return <Navigate to={redirectTo} replace />;

  return (
    <div className='authentication-container'>
      <SignInForm />
      <SignUpForm />
    </div>
  );
};

export default Authentication;

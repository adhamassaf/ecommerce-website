import { useContext, useMemo } from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';

import Spinner from '../../components/spinner/spinner.component.jsx';
import { UserContext } from '../../contexts/user.context.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';
import { signOutUser } from '../../utils/firebase/firebase.utils.js';

import './e-services.styles.scss';

const EServices = () => {
  const { currentUser, userProfile, isAuthReady } = useContext(UserContext);
  const { language, t, dir } = useContext(LanguageContext);

  const displayName = useMemo(() => {
    if (language === 'ar') {
      return (
        userProfile?.displayNameAr ||
        userProfile?.displayName ||
        currentUser?.displayNameAr ||
        currentUser?.displayName ||
        currentUser?.email ||
        t('guest')
      );
    }
    return (
      userProfile?.displayName ||
      userProfile?.displayNameAr ||
      currentUser?.displayName ||
      currentUser?.displayNameAr ||
      currentUser?.email ||
      t('guest')
    );
  }, [userProfile, currentUser, t, language]);

  const photoURL =
    userProfile?.photoURL || currentUser?.photoURL || '';

  const today = useMemo(() => {
    const now = new Date();
    const dayName = now.toLocaleDateString(
      language === 'ar' ? 'ar-EG' : 'en-GB',
      { weekday: 'long' }
    );
    const dayNum = now.getDate();
    return { dayName, dayNum };
  }, [language]);

  if (!isAuthReady) return <Spinner />;
  if (!currentUser) {
    return (
      <Navigate
        to='/auth'
        replace
        state={{ from: '/e-services/requests' }}
      />
    );
  }

  const initial = (displayName || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className='eservices-shell' dir={dir} lang={language}>
      <aside className='eservices-sidebar'>
        <div className='eservices-user'>
          {photoURL ? (
            <img src={photoURL} alt='' className='eservices-avatar' />
          ) : (
            <div className='eservices-avatar eservices-avatar-fallback'>
              {initial}
            </div>
          )}
          <p className='eservices-hello'>
            {t('eservicesHello')} {displayName}
          </p>
          <div className='eservices-date'>
            <strong>{today.dayNum}</strong>
            <span>{today.dayName}</span>
          </div>
        </div>

        <nav className='eservices-nav' aria-label={t('eservicesNav')}>
          <NavLink
            to='/e-services/requests'
            className={({ isActive }) =>
              `eservices-nav-link${isActive ? ' active' : ''}`
            }
          >
            <span>{t('myServiceRequests')}</span>
          </NavLink>
          <Link to='/services' className='eservices-nav-link'>
            <span>{t('servicesNav')}</span>
          </Link>
        </nav>

        <button
          type='button'
          className='eservices-signout'
          onClick={() => signOutUser()}
        >
          {t('signOut')}
        </button>
      </aside>

      <main className='eservices-main'>
        <Outlet />
      </main>
    </div>
  );
};

export default EServices;

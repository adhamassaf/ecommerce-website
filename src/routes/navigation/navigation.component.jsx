import { Fragment, useContext } from 'react';
import { Outlet, Link } from 'react-router-dom';

import CartIcon from '../../components/cart-icon/cart-icon.component';
import CartDropdown from '../../components/cart-dropdown/cart-dropdown.component';
import Toast from '../../components/toast/toast.component.jsx';
import AnnouncementBar from '../../components/announcement-bar/announcement-bar.component.jsx';

import { UserContext } from '../../contexts/user.context';
import { CartContext } from '../../contexts/cart.context';
import { LanguageContext } from '../../contexts/language.context.jsx';

import { ReactComponent as CrwnLogo } from '../../assets/crown.svg';

import { signOutUser } from '../../utils/firebase/firebase.utils.js';
import ThemeControls from '../../components/theme-controls/theme-controls.component.jsx';

import './navigation.styles.scss';

const Navigation = () => {
  const { currentUser, userProfile, isAdmin } = useContext(UserContext);
  const { isCartOpen } = useContext(CartContext);
  const { language, setLanguage, t } = useContext(LanguageContext);

  const displayName =
    (userProfile && userProfile.displayName) ||
    (currentUser && currentUser.displayName) ||
    '';
  const photoURL =
    (userProfile && userProfile.photoURL) ||
    (currentUser && currentUser.photoURL) ||
    '';
  const shortName = displayName
    ? displayName.split(' ')[0]
    : currentUser && currentUser.email
      ? currentUser.email.split('@')[0]
      : 'Account';
  const initials = (displayName || shortName || '?').charAt(0).toUpperCase();

  return (
    <Fragment>
      <AnnouncementBar />
      <div className='navigation'>
        <div className='nav-start'>
          <Link className='logo-container' to='/'>
            <CrwnLogo className='logo' />
          </Link>

          <nav className='nav-links' aria-label='Main'>
            <Link className='nav-link' to='/shop'>
              {t('shop')}
            </Link>

            <Link className='nav-link' to='/contactUs'>
              {t('contactUs')}
            </Link>

            {isAdmin && (
              <Link className='nav-link' to='/admin'>
                {t('admin')}
              </Link>
            )}

            {currentUser && (
              <Link className='nav-link' to='/orders'>
                {t('orders')}
              </Link>
            )}

            {currentUser ? (
              <span className='nav-link' onClick={signOutUser}>
                {t('signOut')}
              </span>
            ) : (
              <Link className='nav-link' to='/auth'>
                {t('signIn')}
              </Link>
            )}
          </nav>
        </div>

        <div className='nav-end'>
          <ThemeControls />
          <button
            type='button'
            className='nav-lang-btn'
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            title={t('language')}
            aria-label={t('language')}
          >
            🌐 {language === 'ar' ? 'EN' : 'ع'}
          </button>

          {currentUser && (
            <Link className='nav-user' to='/profile' title={t('myProfile')}>
              <span className='nav-user-avatar'>
                {photoURL ? (
                  <img src={photoURL} alt={shortName} />
                ) : (
                  <span className='nav-user-initials'>{initials}</span>
                )}
              </span>
              <span className='nav-user-name'>{shortName}</span>
            </Link>
          )}

          <div className='nav-cart-wrap'>
            <CartIcon />
            {isCartOpen && <CartDropdown />}
          </div>
        </div>
      </div>
      <Outlet />
      <Toast />
    </Fragment>
  );
};

export default Navigation;

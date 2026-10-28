import { Fragment, useContext } from 'react';
import { Outlet, Link } from 'react-router-dom';

import CartIcon from '../../components/cart-icon/cart-icon.component';
import CartDropdown from '../../components/cart-dropdown/cart-dropdown.component';
import Toast from '../../components/toast/toast.component.jsx';
import AnnouncementBar from '../../components/announcement-bar/announcement-bar.component.jsx';

import { UserContext } from '../../contexts/user.context';
import { CartContext } from '../../contexts/cart.context';

import { ReactComponent as CrwnLogo } from '../../assets/crown.svg';

import { signOutUser } from '../../utils/firebase/firebase.utils.js';

import './navigation.styles.scss';

const Navigation = () => {
  const { currentUser, userProfile, isAdmin } = useContext(UserContext);
  const { isCartOpen } = useContext(CartContext);

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
        <Link className='logo-container' to='/'>
          <CrwnLogo className='logo' />
        </Link>
        <div className='nav-links-container'>
          <Link className='nav-link' to='/shop'>
            SHOP
          </Link>

          {isAdmin && (
            <Link className='nav-link' to='/admin'>
              ADMIN
            </Link>
          )}

          {currentUser && (
            <Link className='nav-link' to='/orders'>
              ORDERS
            </Link>
          )}

          {currentUser ? (
            <span className='nav-link' onClick={signOutUser}>
              SIGN OUT
            </span>
          ) : (
            <Link className='nav-link' to='/auth'>
              SIGN IN
            </Link>
          )}

          {currentUser && (
            <Link className='nav-user' to='/profile' title='My profile'>
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

          <CartIcon />
        </div>
        {isCartOpen && <CartDropdown />}
      </div>
      <Outlet />
      <Toast />
    </Fragment>
  );
};

export default Navigation;

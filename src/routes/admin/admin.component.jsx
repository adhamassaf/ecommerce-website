import { useContext } from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';

import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';
import {
  OverviewIcon,
  CategoriesIcon,
  ProductsIcon,
  OrdersIcon,
  UsersIcon,
  MessagesIcon,
  SettingsIcon,
  ArrowIcon,
} from '../../components/admin-icons/admin-icons.component.jsx';

import { UserContext } from '../../contexts/user.context.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';

import './admin.styles.scss';

const Admin = () => {
  const { currentUser, isAdmin, isAuthReady } = useContext(UserContext);
  const { language, t, dir } = useContext(LanguageContext);

  if (!isAuthReady) return <Spinner />;

  if (!currentUser) return <Navigate to='/auth' replace />;

  if (!isAdmin) {
    return <StatusMessage message={t('noAdminAccess')} />;
  }

  const displayName = currentUser.displayName || currentUser.email || '';
  const initial = displayName.trim().charAt(0).toUpperCase();

  const links = [
    { to: '/admin', label: t('adminOverview'), end: true, Icon: OverviewIcon },
    { to: '/admin/categories', label: t('adminCategories'), Icon: CategoriesIcon },
    { to: '/admin/products', label: t('adminProducts'), Icon: ProductsIcon },
    { to: '/admin/orders', label: t('adminOrders'), Icon: OrdersIcon },
    { to: '/admin/users', label: t('adminUsers'), Icon: UsersIcon },
    { to: '/admin/messages', label: t('adminMessages'), Icon: MessagesIcon },
    { to: '/admin/settings', label: t('adminSettings'), Icon: SettingsIcon },
  ];

  return (
    <div className='admin-container' dir={dir} lang={language}>
      <aside className='admin-sidebar'>
        <div className='admin-brand'>
          <span className='admin-brand-name'>CRWN</span>
          <span className='admin-brand-sub'>{t('adminPanel')}</span>
        </div>
        <nav className='admin-nav' aria-label={t('adminPanel')}>
          {links.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' active' : ''}`
              }
            >
              <Icon className='admin-nav-icon' />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className='admin-sidebar-footer'>
          <div className='admin-user'>
            <span className='admin-avatar' aria-hidden='true'>
              {initial}
            </span>
            <div className='admin-user-info'>
              <span className='admin-user-name' dir='auto'>
                {displayName}
              </span>
              <span className='admin-user-role'>{t('adminRole')}</span>
            </div>
          </div>
          <Link className='admin-back-link' to='/'>
            <ArrowIcon size={18} />
            <span>{t('backToStore')}</span>
          </Link>
        </div>
      </aside>
      <main className='admin-content'>
        <Outlet />
      </main>
    </div>
  );
};

export default Admin;

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
  SettingsIcon,
  ArrowIcon,
} from '../../components/admin-icons/admin-icons.component.jsx';

import { UserContext } from '../../contexts/user.context.jsx';

import './admin.styles.scss';

const ADMIN_LINKS = [
  { to: '/admin', label: 'نظرة عامة', end: true, Icon: OverviewIcon },
  { to: '/admin/categories', label: 'الأقسام', Icon: CategoriesIcon },
  { to: '/admin/products', label: 'المنتجات', Icon: ProductsIcon },
  { to: '/admin/orders', label: 'الطلبات', Icon: OrdersIcon },
  { to: '/admin/users', label: 'المستخدمون', Icon: UsersIcon },
  { to: '/admin/settings', label: 'إعدادات الموقع', Icon: SettingsIcon },
];

const Admin = () => {
  const { currentUser, isAdmin, isAuthReady } = useContext(UserContext);

  if (!isAuthReady) return <Spinner />;

  if (!currentUser) return <Navigate to='/auth' replace />;

  if (!isAdmin) {
    return <StatusMessage message='ليس لديك صلاحية الوصول إلى لوحة التحكم' />;
  }

  const displayName = currentUser.displayName || currentUser.email || '';
  const initial = displayName.trim().charAt(0).toUpperCase();

  return (
    <div className='admin-container' dir='rtl'>
      <aside className='admin-sidebar'>
        <div className='admin-brand'>
          <span className='admin-brand-name'>CRWN</span>
          <span className='admin-brand-sub'>لوحة التحكم</span>
        </div>
        <nav className='admin-nav' aria-label='التنقل في لوحة التحكم'>
          {ADMIN_LINKS.map(({ to, label, end, Icon }) => (
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
              <span className='admin-user-role'>مدير</span>
            </div>
          </div>
          <Link className='admin-back-link' to='/'>
            <ArrowIcon size={18} />
            <span>العودة إلى المتجر</span>
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

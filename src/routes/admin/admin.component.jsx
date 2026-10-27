import { useContext } from 'react';
import { Navigate, NavLink, Outlet } from 'react-router-dom';

import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';

import { UserContext } from '../../contexts/user.context.jsx';

import './admin.styles.scss';

const ADMIN_LINKS = [
  { to: '/admin', label: 'نظرة عامة', end: true },
  { to: '/admin/categories', label: 'الأقسام' },
  { to: '/admin/products', label: 'المنتجات' },
  { to: '/admin/orders', label: 'الطلبات' },
  { to: '/admin/users', label: 'المستخدمون' },
  { to: '/admin/settings', label: 'إعدادات الموقع' },
];

const Admin = () => {
  const { currentUser, isAdmin, isAuthReady } = useContext(UserContext);

  if (!isAuthReady) return <Spinner />;

  if (!currentUser) return <Navigate to='/auth' replace />;

  if (!isAdmin) {
    return <StatusMessage message='ليس لديك صلاحية الوصول إلى لوحة التحكم' />;
  }

  return (
    <div className='admin-container' dir='rtl'>
      <aside className='admin-sidebar'>
        <h2 className='admin-sidebar-title'>لوحة التحكم</h2>
        <nav className='admin-nav'>
          {ADMIN_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className='admin-content'>
        <Outlet />
      </main>
    </div>
  );
};

export default Admin;

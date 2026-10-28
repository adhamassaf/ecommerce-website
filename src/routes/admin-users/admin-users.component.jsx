import { useContext, useEffect, useMemo, useState } from 'react';

import Spinner from '../../components/spinner/spinner.component.jsx';

import { getUserDocuments } from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

import './admin-users.styles.scss';

const FILTERS = [
  { id: 'all', labelKey: 'filterAllUsers' },
  { id: 'admin', labelKey: 'filterAdmins' },
  { id: 'customer', labelKey: 'filterCustomers' },
];

const AdminUsers = () => {
  const { language, t } = useContext(LanguageContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    let isActive = true;

    getUserDocuments()
      .then((documents) => {
        if (!isActive) return;

        const sorted = [...documents].sort(
          (a, b) =>
            (b.createdAt ? b.createdAt.getTime() : 0) -
            (a.createdAt ? a.createdAt.getTime() : 0)
        );

        setUsers(sorted);
      })
      .catch((err) => {
        if (isActive) setErrorMessage(getAdminErrorMessage(err));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((user) => user.isAdmin).length,
      customer: users.filter((user) => !user.isAdmin).length,
    }),
    [users]
  );

  const visibleUsers = useMemo(() => {
    if (roleFilter === 'admin') return users.filter((user) => user.isAdmin);
    if (roleFilter === 'customer') return users.filter((user) => !user.isAdmin);
    return users;
  }, [users, roleFilter]);

  if (isLoading) return <Spinner />;

  return (
    <div className='admin-users-page'>
      <h1 className='admin-title'>{t('usersTitle')}</h1>

      {errorMessage && (
        <div className='admin-alert error' role='alert'>
          {errorMessage}
        </div>
      )}

      {!errorMessage && users.length === 0 && (
        <div className='admin-empty'>{t('noUsersYet')}</div>
      )}

      {users.length > 0 && (
        <>
          <div className='admin-users-filters' role='tablist' aria-label={t('usersTitle')}>
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type='button'
                role='tab'
                aria-selected={roleFilter === filter.id}
                className={`admin-users-filter${
                  roleFilter === filter.id ? ' active' : ''
                }`}
                onClick={() => setRoleFilter(filter.id)}
              >
                <span>{t(filter.labelKey)}</span>
                <em>{counts[filter.id]}</em>
              </button>
            ))}
          </div>

          <p className='admin-meta'>
            {visibleUsers.length} {t('usersCountLabel')}
          </p>

          {visibleUsers.length === 0 ? (
            <div className='admin-empty'>{t('noUsersInFilter')}</div>
          ) : (
            <div className='admin-table-wrapper'>
              <table className='admin-table admin-users-table'>
                <thead>
                  <tr>
                    <th>{t('colName')}</th>
                    <th>{t('colEmail')}</th>
                    <th>{t('colRole')}</th>
                    <th>{t('colPhone')}</th>
                    <th>{t('colJoined')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => {
                    const initials = (user.displayName || user.email || '?')
                      .trim()
                      .charAt(0)
                      .toUpperCase();

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className='admin-user-cell'>
                            <span className='admin-user-avatar'>
                              {user.photoURL ? (
                                <img src={user.photoURL} alt='' />
                              ) : (
                                <span>{initials}</span>
                              )}
                            </span>
                            <span className='admin-user-name' dir='auto'>
                              {user.displayName || '-'}
                            </span>
                          </div>
                        </td>
                        <td dir='ltr'>{user.email || '-'}</td>
                        <td>
                          <span
                            className={`admin-role-badge ${
                              user.isAdmin ? 'is-admin' : 'is-customer'
                            }`}
                          >
                            {user.isAdmin ? t('roleAdmin') : t('roleCustomer')}
                          </span>
                        </td>
                        <td dir='ltr'>{user.phone || '-'}</td>
                        <td dir='ltr'>
                          {user.createdAt
                            ? user.createdAt.toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUsers;

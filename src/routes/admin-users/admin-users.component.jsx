import { useContext, useEffect, useMemo, useState } from 'react';

import AdminField from '../../components/admin-field/admin-field.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getUserDocuments,
  createUserByAdmin,
  setUserDisabled,
  setUserAdminRole,
} from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';
import { LanguageContext } from '../../contexts/language.context.jsx';
import { UserContext } from '../../contexts/user.context.jsx';

import './admin-users.styles.scss';

const FILTERS = [
  { id: 'all', labelKey: 'filterAllUsers' },
  { id: 'admin', labelKey: 'filterAdmins' },
  { id: 'customer', labelKey: 'filterCustomers' },
  { id: 'disabled', labelKey: 'filterDisabledUsers' },
];

const EMPTY_FORM = {
  displayName: '',
  email: '',
  password: '',
  makeAdmin: false,
};

const mapAuthCreateError = (error, t) => {
  const code = error && error.code ? error.code : error && error.message;

  if (code === 'auth/email-already-in-use' || code === 'email-already-in-use') {
    return t('userEmailInUse');
  }
  if (code === 'auth/invalid-email' || code === 'invalid-email') {
    return t('userInvalidEmail');
  }
  if (
    code === 'auth/weak-password' ||
    code === 'weak-password' ||
    code === 'weak-password'
  ) {
    return t('userWeakPassword');
  }
  if (code === 'missing-fields') {
    return t('userMissingFields');
  }

  return getAdminErrorMessage(error);
};

const AdminUsers = () => {
  const { language, t } = useContext(LanguageContext);
  const { currentUser } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState('');

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
      disabled: users.filter((user) => user.disabled).length,
    }),
    [users]
  );

  const visibleUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter === 'admin' && !user.isAdmin) return false;
      if (roleFilter === 'customer' && user.isAdmin) return false;
      if (roleFilter === 'disabled' && !user.disabled) return false;

      if (!term) return true;

      const name = (user.displayName || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [users, roleFilter, searchTerm]);

  const handleFormChange = (field) => (event) => {
    const value =
      field === 'makeAdmin' ? event.target.checked : event.target.value;
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setErrorMessage('');
    setIsSaving(true);

    try {
      const created = await createUserByAdmin({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        makeAdmin: form.makeAdmin,
      });

      setUsers((current) => [created, ...current]);
      setForm(EMPTY_FORM);
      setFeedback({ type: 'success', text: t('userCreatedSuccess') });
    } catch (err) {
      setFeedback({ type: 'error', text: mapAuthCreateError(err, t) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDisabled = async (user) => {
    if (currentUser && currentUser.uid === user.id) {
      setFeedback({ type: 'error', text: t('cannotDisableSelf') });
      return;
    }

    const nextDisabled = !user.disabled;
    setBusyId(user.id);
    setFeedback(null);

    try {
      await setUserDisabled(user.id, nextDisabled);
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, disabled: nextDisabled } : item
        )
      );
      setFeedback({
        type: 'success',
        text: nextDisabled ? t('userDisabledSuccess') : t('userEnabledSuccess'),
      });
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    } finally {
      setBusyId('');
    }
  };

  const handleToggleAdmin = async (user) => {
    if (currentUser && currentUser.uid === user.id) {
      setFeedback({ type: 'error', text: t('cannotDemoteSelf') });
      return;
    }

    const nextIsAdmin = !user.isAdmin;

    if (!nextIsAdmin && counts.admin <= 1) {
      setFeedback({ type: 'error', text: t('cannotRemoveLastAdmin') });
      return;
    }

    setBusyId(user.id);
    setFeedback(null);

    try {
      await setUserAdminRole(user.id, nextIsAdmin);
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, isAdmin: nextIsAdmin } : item
        )
      );
      setFeedback({
        type: 'success',
        text: nextIsAdmin ? t('userPromotedSuccess') : t('userDemotedSuccess'),
      });
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    } finally {
      setBusyId('');
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className='admin-users-page'>
      <h1 className='admin-title'>{t('usersTitle')}</h1>

      {(errorMessage || feedback) && (
        <div
          className={`admin-alert ${
            errorMessage || (feedback && feedback.type === 'error')
              ? 'error'
              : 'success'
          }`}
          role='alert'
        >
          {errorMessage || (feedback && feedback.text)}
        </div>
      )}

      <form className='admin-panel admin-form' onSubmit={handleCreateUser}>
        <h2 className='admin-panel-title admin-form-wide'>
          {t('addUserTitle')}
        </h2>
        <AdminField
          label={t('colName')}
          type='text'
          value={form.displayName}
          onChange={handleFormChange('displayName')}
          autoComplete='off'
        />
        <AdminField
          label={t('colEmail')}
          type='email'
          dir='ltr'
          value={form.email}
          onChange={handleFormChange('email')}
          required
          autoComplete='off'
        />
        <AdminField
          label={t('userPassword')}
          type='password'
          dir='ltr'
          value={form.password}
          onChange={handleFormChange('password')}
          required
          autoComplete='new-password'
          hint={t('userPasswordHint')}
        />
        <label className='admin-checkbox admin-form-wide'>
          <input
            type='checkbox'
            checked={form.makeAdmin}
            onChange={handleFormChange('makeAdmin')}
          />
          <span>{t('makeAdminCheckbox')}</span>
        </label>
        <div className='admin-form-actions'>
          <button className='admin-button' type='submit' disabled={isSaving}>
            {isSaving ? t('saving') : t('addUserBtn')}
          </button>
        </div>
      </form>

      <div className='admin-toolbar admin-users-toolbar'>
        <AdminField
          label={t('searchUsers')}
          type='search'
          dir='auto'
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

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

      {users.length === 0 ? (
        <div className='admin-empty'>{t('noUsersYet')}</div>
      ) : visibleUsers.length === 0 ? (
        <div className='admin-empty'>{t('noUsersInFilter')}</div>
      ) : (
        <div className='admin-table-wrapper'>
          <table className='admin-table admin-users-table'>
            <thead>
              <tr>
                <th>{t('colName')}</th>
                <th>{t('colEmail')}</th>
                <th>{t('colRole')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colPhone')}</th>
                <th>{t('colJoined')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => {
                const initials = (user.displayName || user.email || '?')
                  .trim()
                  .charAt(0)
                  .toUpperCase();
                const isSelf = currentUser && currentUser.uid === user.id;
                const isBusy = busyId === user.id;

                return (
                  <tr
                    key={user.id}
                    className={user.disabled ? 'is-disabled-row' : undefined}
                  >
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
                          {isSelf ? ` (${t('youLabel')})` : ''}
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
                    <td>
                      <span
                        className={`admin-status-badge ${
                          user.disabled ? 'is-disabled' : 'is-active'
                        }`}
                      >
                        {user.disabled ? t('statusDisabled') : t('statusActive')}
                      </span>
                    </td>
                    <td dir='ltr'>{user.phone || '-'}</td>
                    <td dir='ltr'>
                      {user.createdAt
                        ? user.createdAt.toLocaleDateString(
                            language === 'ar' ? 'ar' : 'en-GB',
                            {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            }
                          )
                        : '-'}
                    </td>
                    <td>
                      <div className='admin-actions'>
                        <button
                          type='button'
                          className='admin-link-button'
                          disabled={isBusy || isSelf}
                          onClick={() => handleToggleAdmin(user)}
                        >
                          {user.isAdmin
                            ? t('removeAdminBtn')
                            : t('makeAdminBtn')}
                        </button>
                        <button
                          type='button'
                          className={`admin-link-button ${
                            user.disabled ? '' : 'danger'
                          }`}
                          disabled={isBusy || isSelf}
                          onClick={() => handleToggleDisabled(user)}
                        >
                          {user.disabled
                            ? t('enableUserBtn')
                            : t('disableUserBtn')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

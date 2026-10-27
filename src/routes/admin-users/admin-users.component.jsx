import { useEffect, useState } from 'react';

import Spinner from '../../components/spinner/spinner.component.jsx';

import { getUserDocuments } from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1 className='admin-title'>المستخدمون</h1>

      {errorMessage && (
        <div className='admin-alert error' role='alert'>
          {errorMessage}
        </div>
      )}

      {!errorMessage && users.length === 0 && (
        <div className='admin-empty'>لا يوجد مستخدمون مسجّلون بعد.</div>
      )}

      {users.length > 0 && (
        <>
          <p className='admin-meta'>{users.length} مستخدم</p>
          <div className='admin-table-wrapper'>
            <table className='admin-table'>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td dir='auto'>{user.displayName || '-'}</td>
                    <td dir='ltr'>{user.email || '-'}</td>
                    <td>
                      {user.createdAt
                        ? user.createdAt.toLocaleDateString('en-GB')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUsers;

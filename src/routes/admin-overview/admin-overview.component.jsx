import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';

import { CategoriesContext } from '../../contexts/categories.context.jsx';
import { getUsersCount } from '../../utils/firebase/firebase.utils.js';

const AdminOverview = () => {
  const { categories, isLoading, error } = useContext(CategoriesContext);
  const [usersCount, setUsersCount] = useState(null);

  useEffect(() => {
    let isActive = true;

    getUsersCount()
      .then((count) => {
        if (isActive) setUsersCount(count);
      })
      .catch(() => {
        if (isActive) setUsersCount(null);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const prices = categories.flatMap((category) =>
      category.items.map((item) => Number(item.price) || 0)
    );
    const total = prices.length;
    const average = total
      ? prices.reduce((sum, price) => sum + price, 0) / total
      : 0;

    return { total, average };
  }, [categories]);

  if (isLoading) return <Spinner />;

  if (error) return <StatusMessage message={error} />;

  return (
    <div>
      <h1 className='admin-title'>نظرة عامة</h1>

      <div className='admin-stats'>
        <div className='admin-stat'>
          <span className='admin-stat-value'>{categories.length}</span>
          <span className='admin-stat-label'>قسم</span>
        </div>
        <div className='admin-stat'>
          <span className='admin-stat-value'>{stats.total}</span>
          <span className='admin-stat-label'>منتج</span>
        </div>
        <div className='admin-stat'>
          <span className='admin-stat-value'>
            {usersCount === null ? '-' : usersCount}
          </span>
          <span className='admin-stat-label'>مستخدم مسجّل</span>
        </div>
        <div className='admin-stat'>
          <span className='admin-stat-value'>${stats.average.toFixed(2)}</span>
          <span className='admin-stat-label'>متوسط سعر المنتج</span>
        </div>
      </div>

      <section className='admin-panel'>
        <h2 className='admin-panel-title'>إجراءات سريعة</h2>
        <div className='admin-quick-links'>
          <Link className='admin-button' to='/admin/products'>
            إضافة منتج
          </Link>
          <Link className='admin-button secondary' to='/admin/categories'>
            إضافة قسم
          </Link>
          <Link className='admin-button secondary' to='/admin/settings'>
            تعديل شريط الإعلان
          </Link>
        </div>
      </section>

      <h2 className='admin-panel-title'>المنتجات حسب القسم</h2>
      {categories.length === 0 ? (
        <div className='admin-empty'>لا توجد أقسام بعد.</div>
      ) : (
        <div className='admin-table-wrapper'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>القسم</th>
                <th>عدد المنتجات</th>
                <th>عرض في المتجر</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.title}</td>
                  <td>{category.items.length}</td>
                  <td>
                    <Link to={`/shop/${category.id}`}>فتح القسم</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;

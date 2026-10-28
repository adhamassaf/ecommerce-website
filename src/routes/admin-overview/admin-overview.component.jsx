import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';
import {
  CategoriesIcon,
  ProductsIcon,
  UsersIcon,
  OrdersIcon,
  PriceIcon,
  PlusIcon,
  SettingsIcon,
  ArrowIcon,
} from '../../components/admin-icons/admin-icons.component.jsx';

import { CategoriesContext } from '../../contexts/categories.context.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';
import {
  getOrdersCount,
  getUsersCount,
} from '../../utils/firebase/firebase.utils.js';
import { getLocalized } from '../../utils/i18n.js';

const AdminOverview = () => {
  const { categories, isLoading, error } = useContext(CategoriesContext);
  const { language, t } = useContext(LanguageContext);
  const [usersCount, setUsersCount] = useState(null);
  const [ordersCount, setOrdersCount] = useState(null);

  useEffect(() => {
    let isActive = true;

    getUsersCount()
      .then((count) => {
        if (isActive) setUsersCount(count);
      })
      .catch(() => {
        if (isActive) setUsersCount(null);
      });

    getOrdersCount()
      .then((count) => {
        if (isActive) setOrdersCount(count);
      })
      .catch(() => {
        if (isActive) setOrdersCount(null);
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

  const statCards = [
    {
      key: 'categories',
      tone: 'gold',
      Icon: CategoriesIcon,
      value: categories.length,
      label: t('categoriesCount'),
    },
    {
      key: 'products',
      tone: 'blue',
      Icon: ProductsIcon,
      value: stats.total,
      label: t('productsCount'),
    },
    {
      key: 'users',
      tone: 'green',
      Icon: UsersIcon,
      value: usersCount === null ? '-' : usersCount,
      label: t('usersCount'),
    },
    {
      key: 'orders',
      tone: 'violet',
      Icon: OrdersIcon,
      value: ordersCount === null ? '-' : ordersCount,
      label: t('ordersCount'),
    },
    {
      key: 'price',
      tone: 'rose',
      Icon: PriceIcon,
      value: `$${stats.average.toFixed(2)}`,
      label: t('avgProductPrice'),
    },
  ];

  const maxItems = Math.max(
    1,
    ...categories.map((category) => category.items.length)
  );

  return (
    <div>
      <h1 className='admin-title'>{t('adminOverview')}</h1>

      <div className='admin-stats'>
        {statCards.map(({ key, tone, Icon, value, label }, index) => (
          <div
            className={`admin-stat ${tone}`}
            key={key}
            style={{ '--i': index }}
          >
            <span className='admin-stat-icon'>
              <Icon size={24} />
            </span>
            <div className='admin-stat-body'>
              <span className='admin-stat-value' dir='ltr'>
                {value}
              </span>
              <span className='admin-stat-label'>{label}</span>
            </div>
          </div>
        ))}
      </div>

      <section className='admin-panel'>
        <h2 className='admin-panel-title'>{t('quickActions')}</h2>
        <div className='admin-quick-links'>
          <Link className='admin-button' to='/admin/products'>
            <PlusIcon size={18} />
            {t('addProduct')}
          </Link>
          <Link className='admin-button secondary' to='/admin/orders'>
            <OrdersIcon size={18} />
            {t('viewOrders')}
          </Link>
          <Link className='admin-button secondary' to='/admin/categories'>
            <PlusIcon size={18} />
            {t('addCategory')}
          </Link>
          <Link className='admin-button secondary' to='/admin/settings'>
            <SettingsIcon size={18} />
            {t('editAnnouncement')}
          </Link>
        </div>
      </section>

      <h2 className='admin-panel-title'>{t('productsByCategory')}</h2>
      {categories.length === 0 ? (
        <div className='admin-empty'>{t('noCategoriesYet')}</div>
      ) : (
        <div className='admin-table-wrapper'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>{t('category')}</th>
                <th>{t('productCount')}</th>
                <th>{t('viewInStore')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{getLocalized(category.title, language)}</td>
                  <td>
                    <div className='admin-bar-cell'>
                      <span>{category.items.length}</span>
                      <div className='admin-bar'>
                        <span
                          className='admin-bar-fill'
                          style={{
                            width: `${(category.items.length / maxItems) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <Link
                      className='admin-text-link'
                      to={`/shop/${category.id}`}
                    >
                      {t('open')}
                      <ArrowIcon size={16} />
                    </Link>
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

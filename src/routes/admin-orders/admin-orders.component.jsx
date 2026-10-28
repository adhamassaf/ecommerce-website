import { Fragment, useContext, useEffect, useMemo, useState } from 'react';

import OrderStatusBadge from '../../components/order-status-badge/order-status-badge.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getAllOrders,
  updateOrderStatus,
} from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatMoney,
  formatOrderDate,
  formatOrderNumber,
} from '../../utils/orders.js';

import { LanguageContext } from '../../contexts/language.context.jsx';

import './admin-orders.styles.scss';

const AdminOrders = () => {
  const { language, t } = useContext(LanguageContext);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    let isActive = true;

    getAllOrders()
      .then((documents) => {
        if (isActive) setOrders(documents);
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

  const visibleOrders = useMemo(
    () =>
      statusFilter === 'all'
        ? orders
        : orders.filter((order) => order.status === statusFilter),
    [orders, statusFilter]
  );

  const handleStatusChange = async (order, nextStatus) => {
    if (nextStatus === order.status) return;

    setErrorMessage('');
    setUpdatingId(order.id);

    try {
      await updateOrderStatus(order.id, nextStatus);
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      setErrorMessage(getAdminErrorMessage(err));
    } finally {
      setUpdatingId('');
    }
  };

  const toggleExpanded = (orderId) => {
    setExpandedId((current) => (current === orderId ? '' : orderId));
  };

  const orderCountText =
    visibleOrders.length === 1
      ? `${visibleOrders.length} ${t('orderCountLabel')}`
      : `${visibleOrders.length} ${t('orderCountLabelPlural')}`;

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1 className='admin-title'>{t('ordersTitle')}</h1>

      {errorMessage && (
        <div className='admin-alert error' role='alert'>
          {errorMessage}
        </div>
      )}

      {!errorMessage && orders.length === 0 && (
        <div className='admin-empty'>{t('noOrdersYetAdmin')}</div>
      )}

      {orders.length > 0 && (
        <>
          <div className='admin-toolbar'>
            <label className='admin-field'>
              <span className='admin-field-label'>{t('filterByStatus')}</span>
              <select
                className='admin-field-control'
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value='all'>{t('allOrders')}</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABELS[language]?.[status] ||
                      ORDER_STATUS_LABELS.en[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className='admin-meta'>{orderCountText}</p>

          {visibleOrders.length === 0 ? (
            <div className='admin-empty'>{t('noOrdersForStatus')}</div>
          ) : (
            <div className='admin-table-wrapper'>
              <table className='admin-table'>
                <thead>
                  <tr>
                    <th>{t('orderNumber')}</th>
                    <th>{t('customer')}</th>
                    <th>{t('date')}</th>
                    <th>{t('total')}</th>
                    <th>{t('payment')}</th>
                    <th>{t('status')}</th>
                    <th>{t('details')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <Fragment key={order.id}>
                      <tr>
                        <td dir='ltr'>{formatOrderNumber(order.id)}</td>
                        <td dir='auto'>
                          {order.shipping.fullName || order.userName || '-'}
                        </td>
                        <td dir='ltr'>
                          {formatOrderDate(order.createdAt, language)}
                        </td>
                        <td dir='ltr'>{formatMoney(order.total)}</td>
                        <td>
                          {PAYMENT_METHOD_LABELS[language]?.[
                            order.paymentMethod
                          ] ||
                            PAYMENT_METHOD_LABELS.en[order.paymentMethod] ||
                            order.paymentMethod}
                        </td>
                        <td>
                          <div className='admin-order-status'>
                            <OrderStatusBadge
                              status={order.status}
                              language={language}
                            />
                            <select
                              className='admin-field-control'
                              aria-label={t('changeOrderStatus')}
                              value={order.status}
                              disabled={updatingId === order.id}
                              onChange={(event) =>
                                handleStatusChange(order, event.target.value)
                              }
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {ORDER_STATUS_LABELS[language]?.[status] ||
                                    ORDER_STATUS_LABELS.en[status]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td>
                          <button
                            type='button'
                            className='admin-link-button'
                            onClick={() => toggleExpanded(order.id)}
                            aria-expanded={expandedId === order.id}
                          >
                            {expandedId === order.id ? t('hide') : t('view')}
                          </button>
                        </td>
                      </tr>
                      {expandedId === order.id && (
                        <tr className='admin-order-details-row'>
                          <td colSpan={7}>
                            <div className='admin-order-details'>
                              <div>
                                <h3>{t('productsLabel')}</h3>
                                {order.items.map((item) => (
                                  <div
                                    className='admin-order-item'
                                    key={item.id}
                                  >
                                    <img
                                      className='admin-thumb'
                                      src={item.imageUrl}
                                      alt={item.name}
                                    />
                                    <span dir='auto'>{item.name}</span>
                                    <span dir='ltr'>
                                      {item.quantity} x{' '}
                                      {formatMoney(item.price)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div>
                                <h3>{t('shippingInfo')}</h3>
                                <p dir='auto'>{order.shipping.fullName}</p>
                                <p dir='ltr'>{order.shipping.phone}</p>
                                <p dir='auto'>
                                  {order.shipping.address}
                                  {order.shipping.city
                                    ? `, ${order.shipping.city}`
                                    : ''}
                                </p>
                                {order.userEmail && (
                                  <p dir='ltr'>{order.userEmail}</p>
                                )}
                                {order.shipping.notes && (
                                  <p dir='auto'>
                                    {t('notesLabel')}: {order.shipping.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminOrders;

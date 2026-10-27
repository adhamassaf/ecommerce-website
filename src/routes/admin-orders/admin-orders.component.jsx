import { Fragment, useEffect, useMemo, useState } from 'react';

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

import './admin-orders.styles.scss';

const AdminOrders = () => {
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

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1 className='admin-title'>الطلبات</h1>

      {errorMessage && (
        <div className='admin-alert error' role='alert'>
          {errorMessage}
        </div>
      )}

      {!errorMessage && orders.length === 0 && (
        <div className='admin-empty'>لا توجد طلبات بعد.</div>
      )}

      {orders.length > 0 && (
        <>
          <div className='admin-toolbar'>
            <label className='admin-field'>
              <span className='admin-field-label'>تصفية حسب الحالة</span>
              <select
                className='admin-field-control'
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value='all'>كل الطلبات</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABELS.ar[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className='admin-meta'>{visibleOrders.length} طلب</p>

          {visibleOrders.length === 0 ? (
            <div className='admin-empty'>لا توجد طلبات بهذه الحالة.</div>
          ) : (
            <div className='admin-table-wrapper'>
              <table className='admin-table'>
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>التاريخ</th>
                    <th>المجموع</th>
                    <th>الدفع</th>
                    <th>الحالة</th>
                    <th>تفاصيل</th>
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
                        <td dir='ltr'>{formatOrderDate(order.createdAt)}</td>
                        <td dir='ltr'>{formatMoney(order.total)}</td>
                        <td>{PAYMENT_METHOD_LABELS.ar[order.paymentMethod]}</td>
                        <td>
                          <div className='admin-order-status'>
                            <OrderStatusBadge
                              status={order.status}
                              language='ar'
                            />
                            <select
                              className='admin-field-control'
                              aria-label='تغيير حالة الطلب'
                              value={order.status}
                              disabled={updatingId === order.id}
                              onChange={(event) =>
                                handleStatusChange(order, event.target.value)
                              }
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {ORDER_STATUS_LABELS.ar[status]}
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
                            {expandedId === order.id ? 'إخفاء' : 'عرض'}
                          </button>
                        </td>
                      </tr>
                      {expandedId === order.id && (
                        <tr className='admin-order-details-row'>
                          <td colSpan={7}>
                            <div className='admin-order-details'>
                              <div>
                                <h3>المنتجات</h3>
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
                                      {item.quantity} x {formatMoney(item.price)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div>
                                <h3>بيانات الشحن</h3>
                                <p dir='auto'>{order.shipping.fullName}</p>
                                <p dir='ltr'>{order.shipping.phone}</p>
                                <p dir='auto'>
                                  {order.shipping.address}،{' '}
                                  {order.shipping.city}
                                </p>
                                {order.userEmail && (
                                  <p dir='ltr'>{order.userEmail}</p>
                                )}
                                {order.shipping.notes && (
                                  <p dir='auto'>
                                    ملاحظات: {order.shipping.notes}
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

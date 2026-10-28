import { useContext, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import Button from '../../components/button/button.component.jsx';
import OrderStatusBadge from '../../components/order-status-badge/order-status-badge.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';

import { UserContext } from '../../contexts/user.context.jsx';

import { getUserOrders } from '../../utils/firebase/firebase.utils.js';
import {
  formatMoney,
  formatOrderDate,
  formatOrderNumber,
} from '../../utils/orders.js';

import './orders.styles.scss';

const Orders = () => {
  const { currentUser, isAuthReady } = useContext(UserContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const userId = currentUser ? currentUser.uid : null;

  useEffect(() => {
    if (!userId) return undefined;

    let isActive = true;

    getUserOrders(userId)
      .then((documents) => {
        if (isActive) setOrders(documents);
      })
      .catch(() => {
        if (isActive) setErrorMessage('Could not load your orders, please try again.');
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [userId]);

  if (!isAuthReady) return <Spinner />;

  if (!currentUser) {
    return <Navigate to='/auth' state={{ from: '/orders' }} replace />;
  }

  if (isLoading) return <Spinner />;

  return (
    <div className='orders-container'>
      <div className='orders-header'>
        <h1 className='orders-title'>My orders</h1>
        {orders.length > 0 && (
          <p className='orders-subtitle'>
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </p>
        )}
      </div>

      {errorMessage && (
        <div className='orders-error' role='alert'>
          {errorMessage}
        </div>
      )}

      {!errorMessage && orders.length === 0 && (
        <div className='orders-empty'>
          <div className='orders-empty-icon'>📦</div>
          <h2>No orders yet</h2>
          <p>You haven&apos;t placed any orders. Start exploring our collection.</p>
          <Button type='button' onClick={() => navigate('/shop')}>
            Start shopping
          </Button>
        </div>
      )}

      {orders.length > 0 && (
        <div className='orders-list'>
          {orders.map((order) => (
            <Link
              key={order.id}
              className='order-card'
              to={`/orders/${order.id}`}
            >
              <div className='order-card-left'>
                <span className='order-number'>
                  {formatOrderNumber(order.id)}
                </span>
                <span className='order-date'>
                  {formatOrderDate(order.createdAt)}
                </span>
              </div>

              <div className='order-card-meta'>
                <span className='order-items'>
                  {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
                </span>
                <span className='order-total'>{formatMoney(order.total)}</span>
              </div>

              <div className='order-card-right'>
                <OrderStatusBadge status={order.status} />
                <span className='order-arrow'>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

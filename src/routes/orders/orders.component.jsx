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
      <h1 className='orders-title'>My orders</h1>

      {errorMessage && (
        <div className='orders-error' role='alert'>
          {errorMessage}
        </div>
      )}

      {!errorMessage && orders.length === 0 && (
        <div className='orders-empty'>
          <span>You have not placed any orders yet.</span>
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
              className='order-row'
              to={`/orders/${order.id}`}
            >
              <div className='order-row-main'>
                <span className='order-row-number'>
                  {formatOrderNumber(order.id)}
                </span>
                <span className='order-row-date'>
                  {formatOrderDate(order.createdAt)}
                </span>
              </div>
              <span className='order-row-items'>
                {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
              </span>
              <span className='order-row-total'>{formatMoney(order.total)}</span>
              <OrderStatusBadge status={order.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

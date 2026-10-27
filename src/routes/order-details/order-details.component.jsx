import { useContext, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';

import OrderStatusBadge from '../../components/order-status-badge/order-status-badge.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';

import { UserContext } from '../../contexts/user.context.jsx';

import { getOrderById } from '../../utils/firebase/firebase.utils.js';
import {
  PAYMENT_METHOD_LABELS,
  formatMoney,
  formatOrderDate,
  formatOrderNumber,
} from '../../utils/orders.js';

import './order-details.styles.scss';

const OrderDetails = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const { currentUser, isAuthReady } = useContext(UserContext);

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMissing, setIsMissing] = useState(false);

  const userId = currentUser ? currentUser.uid : null;
  const wasJustPlaced = Boolean(location.state && location.state.placed);

  useEffect(() => {
    if (!userId) return undefined;

    let isActive = true;

    setIsLoading(true);
    setIsMissing(false);

    getOrderById(orderId)
      .then((document) => {
        if (!isActive) return;

        if (document) {
          setOrder(document);
        } else {
          setIsMissing(true);
        }
      })
      .catch(() => {
        if (isActive) setIsMissing(true);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [orderId, userId]);

  if (!isAuthReady) return <Spinner />;

  if (!currentUser) {
    return <Navigate to='/auth' state={{ from: location.pathname }} replace />;
  }

  if (isLoading) return <Spinner />;

  if (isMissing || !order) return <StatusMessage message='Order not found' />;

  const { shipping } = order;

  return (
    <div className='order-details-container'>
      {wasJustPlaced && (
        <div className='order-success' role='status'>
          <strong>Thank you! Your order has been placed.</strong>
          <span>This is a demo store, so nothing will actually be shipped.</span>
        </div>
      )}

      <div className='order-details-header'>
        <div>
          <h1 className='order-details-title'>
            Order {formatOrderNumber(order.id)}
          </h1>
          <span className='order-details-date'>
            {formatOrderDate(order.createdAt)}
          </span>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className='order-details-grid'>
        <div className='order-items'>
          {order.items.map((item) => (
            <div className='order-item' key={item.id}>
              <img src={item.imageUrl} alt={item.name} />
              <div className='order-item-info'>
                <span className='order-item-name'>{item.name}</span>
                <span className='order-item-meta'>
                  {item.quantity} x {formatMoney(item.price)}
                </span>
              </div>
              <span className='order-item-total'>
                {formatMoney(item.quantity * item.price)}
              </span>
            </div>
          ))}
        </div>

        <aside className='order-summary'>
          <h2 className='order-summary-title'>Summary</h2>
          <dl className='order-summary-list'>
            <dt>Payment</dt>
            <dd>{PAYMENT_METHOD_LABELS.en[order.paymentMethod]}</dd>
            <dt>Ship to</dt>
            <dd>
              {shipping.fullName}
              <br />
              {shipping.address}
              <br />
              {shipping.city}
              <br />
              {shipping.phone}
            </dd>
            {shipping.notes && (
              <>
                <dt>Notes</dt>
                <dd>{shipping.notes}</dd>
              </>
            )}
          </dl>
          <div className='order-summary-total'>
            <span>Total</span>
            <span>{formatMoney(order.total)}</span>
          </div>
        </aside>
      </div>

      <Link className='order-back-link' to='/orders'>
        Back to my orders
      </Link>
    </div>
  );
};

export default OrderDetails;

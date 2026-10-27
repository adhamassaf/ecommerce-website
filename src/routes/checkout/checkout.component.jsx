import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { CartContext } from '../../contexts/cart.context.jsx';

import Button from '../../components/button/button.component.jsx';
import CheckoutItem from '../../components/checkout-item/checkout-item.component.jsx';
import OrderForm from '../../components/order-form/order-form.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';

import { formatMoney } from '../../utils/orders.js';

import './checkout.styles.scss';

const Checkout = () => {
  const { cartItems, cartTotal } = useContext(CartContext);
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className='checkout-container'>
        <StatusMessage message='Your cart is empty' />
        <Button type='button' onClick={() => navigate('/shop')}>
          Continue shopping
        </Button>
      </div>
    );
  }

  return (
    <div className='checkout-container'>
      <div className='checkout-header'>
        <div className='header-block'>
          <span>Product</span>
        </div>
        <div className='header-block'>
          <span>Description</span>
        </div>
        <div className='header-block'>
          <span>Quantity</span>
        </div>
        <div className='header-block'>
          <span>Price</span>
        </div>
        <div className='header-block'>
          <span>Remove</span>
        </div>
      </div>
      {cartItems.map((cartItem) => (
        <CheckoutItem key={cartItem.id} cartItem={cartItem} />
      ))}
      <div className='total'>TOTAL: {formatMoney(cartTotal)}</div>
      <OrderForm />
    </div>
  );
};

export default Checkout;

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
      <div className='checkout-container checkout-empty'>
        <div className='checkout-empty-content'>
          <div className='checkout-empty-icon'>🛍️</div>
          <StatusMessage message='Your cart is empty' />
          <p className='checkout-empty-text'>
            Looks like you haven&apos;t added anything yet.
          </p>
          <Button type='button' onClick={() => navigate('/shop')}>
            Continue shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='checkout-container'>
      <div className='checkout-layout'>
        <section className='checkout-cart'>
          <div className='checkout-section-header'>
            <h1 className='checkout-title'>Shopping cart</h1>
            <span className='checkout-count'>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className='checkout-table'>
            <div className='checkout-header'>
              <span className='header-product'>Product</span>
              <span className='header-qty'>Qty</span>
              <span className='header-price'>Price</span>
              <span className='header-remove'></span>
            </div>

            <div className='checkout-items'>
              {cartItems.map((cartItem) => (
                <CheckoutItem key={cartItem.id} cartItem={cartItem} />
              ))}
            </div>
          </div>

          <div className='checkout-summary'>
            <span className='checkout-summary-label'>Subtotal</span>
            <span className='checkout-summary-value'>{formatMoney(cartTotal)}</span>
          </div>
        </section>

        <section className='checkout-form-section'>
          <OrderForm />
        </section>
      </div>
    </div>
  );
};

export default Checkout;

import { useContext } from 'react';

import { CartContext } from '../../contexts/cart.context.jsx';

import './checkout-item.styles.scss';

const CheckoutItem = ({ cartItem }) => {
  const { name, imageUrl, price, quantity } = cartItem;

  const { clearItemFromCart, increaseItemQuantity, removeItemFromCart } =
    useContext(CartContext);

  const clearItemHandler = () => clearItemFromCart(cartItem);
  const addItemHandler = () => increaseItemQuantity(cartItem);
  const removeItemHandler = () => removeItemFromCart(cartItem);

  return (
    <div className='checkout-item-container'>
      <div className='checkout-item-product'>
        <div className='image-container'>
          <img src={imageUrl} alt={name} />
        </div>
        <div className='product-info'>
          <span className='name'>{name}</span>
          <span className='unit-price'>${price}</span>
        </div>
      </div>

      <div className='quantity'>
        <button
          type='button'
          className='qty-btn'
          onClick={removeItemHandler}
          aria-label='Decrease quantity'
        >
          −
        </button>
        <span className='value'>{quantity}</span>
        <button
          type='button'
          className='qty-btn'
          onClick={addItemHandler}
          aria-label='Increase quantity'
        >
          +
        </button>
      </div>

      <span className='price'>${price * quantity}</span>

      <button
        type='button'
        className='remove-button'
        onClick={clearItemHandler}
        aria-label={`Remove ${name}`}
      >
        ×
      </button>
    </div>
  );
};

export default CheckoutItem;

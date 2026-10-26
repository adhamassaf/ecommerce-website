import { useContext } from 'react';

import { ReactComponent as ShoppingIcon } from '../../assets/shopping-bag.svg';

import { CartContext } from '../../contexts/cart.context.jsx';

import './cart-icon.styles.scss';

const CartIcon = () => {
  const { isCartOpen, setIsCartOpen, cartCount, lastAdded } =
    useContext(CartContext);

  const toggleIsCartOpen = () => setIsCartOpen(!isCartOpen);

  return (
    <div className='cart-icon-container' onClick={toggleIsCartOpen}>
      <div
        className={lastAdded ? 'icon-wrapper pulse' : 'icon-wrapper'}
        key={lastAdded ? lastAdded.key : 0}
      >
        <ShoppingIcon className='shopping-icon' />
        <span className='item-count'>{cartCount}</span>
      </div>
    </div>
  );
};

export default CartIcon;
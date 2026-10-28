import { useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { CartContext } from '../../contexts/cart.context.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';

import Button from '../button/button.component.jsx';
import CartItem from '../cart-item/cart-item.component.jsx';

import './cart-dropdown.styles.scss';

const CartDropdown = () => {
  const { cartItems, setIsCartOpen } = useContext(CartContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const clickedInsideDropdown = dropdownRef.current?.contains(event.target);
      const clickedCartIcon = event.target.closest('.cart-icon-container');

      if (!clickedInsideDropdown && !clickedCartIcon) {
        setIsCartOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsCartOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [setIsCartOpen]);

  const goToCheckoutHandler = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className='cart-dropdown-container' ref={dropdownRef}>
      <div className='cart-items'>
        {cartItems.length ? (
          cartItems.map((item) => <CartItem key={item.id} cartItem={item} />)
        ) : (
          <span className='empty-message'>{t('yourCartEmpty')}</span>
        )}
      </div>
      <Button onClick={goToCheckoutHandler}>{t('checkout')}</Button>
    </div>
  );
};

export default CartDropdown;

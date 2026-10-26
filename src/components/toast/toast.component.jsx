import { useContext, useState, useEffect } from 'react';

import { CartContext } from '../../contexts/cart.context.jsx';

import './toast.styles.scss';

const TOAST_DURATION = 2000;

const Toast = () => {
  const { lastAdded } = useContext(CartContext);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!lastAdded) return undefined;

    setIsVisible(true);

    const timer = setTimeout(() => setIsVisible(false), TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [lastAdded]);

  const message = lastAdded
    ? `${lastAdded.name}${
        lastAdded.quantity > 1 ? ` × ${lastAdded.quantity}` : ''
      } added to cart`
    : '';

  return (
    <div className='toast-region' role='status' aria-live='polite'>
      {isVisible && lastAdded && (
        <div className='toast' key={lastAdded.key}>
          <img src={lastAdded.imageUrl} alt='' />
          <span className='toast-text'>{message}</span>
        </div>
      )}
    </div>
  );
};

export default Toast;
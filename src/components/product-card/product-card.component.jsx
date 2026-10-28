import { useContext } from 'react';
import { Link } from 'react-router-dom';

import { CartContext } from '../../contexts/cart.context.jsx';

import Button from '../button/button.component.jsx';
import Highlight from '../highlight/highlight.component.jsx';

import './product-card.styles.scss';

const ProductCard = ({ product, category, highlight }) => {
  const { id, name, price, imageUrl } = product;
  const { addItemToCart } = useContext(CartContext);

  const addProductToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addItemToCart(product);
  };

  const productPath = `/shop/${category}/${id}`;

  return (
    <div className='product-card-container'>
      <Link className='product-card-media' to={productPath}>
        <img src={imageUrl} alt={name} loading='lazy' />
        <div className='product-card-overlay'>
          <Button buttonType='inverted' onClick={addProductToCart}>
            Add to cart
          </Button>
        </div>
      </Link>
      <div className='product-card-footer'>
        <Link className='product-card-name' to={productPath}>
          <Highlight text={name} query={highlight} />
        </Link>
        <span className='product-card-price'>${price}</span>
      </div>
    </div>
  );
};

export default ProductCard;

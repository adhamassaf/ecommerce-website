import { useContext } from 'react';
import { Link } from 'react-router-dom';

import { CartContext } from '../../contexts/cart.context.jsx';

import Button from '../button/button.component.jsx';
import Highlight from '../highlight/highlight.component.jsx';

import './product-card.styles.scss';

const ProductCard = ({ product, category, highlight }) => {
  const { id, name, price, imageUrl } = product;
  const { addItemToCart } = useContext(CartContext);

  const addProductToCart = () => addItemToCart(product);

  const productPath = `/shop/${category}/${id}`;

  return (
    <div className='product-card-container'>
      <Link className='product-card-link' to={productPath}>
        <img src={imageUrl} alt={`${name}`} />
      </Link>
      <div className='footer'>
        <Link className='product-card-link' to={productPath}>
          <span className='name'>
            <Highlight text={name} query={highlight} />
          </span>
        </Link>
        <span className='price'>{price}</span>
      </div>
      <Button buttonType='inverted' onClick={addProductToCart}>
        Add to cart
      </Button>
    </div>
  );
};

export default ProductCard;

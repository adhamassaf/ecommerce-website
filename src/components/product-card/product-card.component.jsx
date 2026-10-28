import { useContext } from 'react';
import { Link } from 'react-router-dom';

import { CartContext } from '../../contexts/cart.context.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';

import Button from '../button/button.component.jsx';
import Highlight from '../highlight/highlight.component.jsx';

import { getLocalized } from '../../utils/i18n.js';

import './product-card.styles.scss';

const ProductCard = ({ product, category, highlight }) => {
  const { id, name, price, imageUrl } = product;
  const { addItemToCart } = useContext(CartContext);
  const { language, t } = useContext(LanguageContext);

  const localizedName = getLocalized(name, language);

  const addProductToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addItemToCart({
      ...product,
      name: localizedName,
    });
  };

  const productPath = `/shop/${category}/${id}`;

  return (
    <div className='product-card-container'>
      <Link className='product-card-media' to={productPath}>
        <img src={imageUrl} alt={localizedName} loading='lazy' />
        <div className='product-card-overlay'>
          <Button buttonType='inverted' onClick={addProductToCart}>
            {t('addToCart')}
          </Button>
        </div>
      </Link>
      <div className='product-card-footer'>
        <Link className='product-card-name' to={productPath}>
          <Highlight text={localizedName} query={highlight} />
        </Link>
        <span className='product-card-price'>${price}</span>
      </div>
    </div>
  );
};

export default ProductCard;

import { useContext, useState, useEffect, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';

import { CategoriesContext } from '../../contexts/categories.context.jsx';
import { CartContext } from '../../contexts/cart.context.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';
import { getLocalized } from '../../utils/i18n.js';

import Button from '../../components/button/button.component.jsx';
import ProductCard from '../../components/product-card/product-card.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';

import './product-details.styles.scss';

const MAX_QUANTITY = 99;

const ProductDetails = () => {
  const { category, productId } = useParams();
  const { categories, categoriesMap, isLoading, error } =
    useContext(CategoriesContext);
  const { addItemToCart } = useContext(CartContext);
  const { language, t } = useContext(LanguageContext);

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setIsAdded(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category, productId]);

  useEffect(() => {
    if (!isAdded) return undefined;

    const timer = setTimeout(() => setIsAdded(false), 2000);

    return () => clearTimeout(timer);
  }, [isAdded]);

  if (isLoading) return <Spinner />;

  if (error) return <StatusMessage message={error} />;

  const products = categoriesMap[category];
  const product = products?.find((item) => String(item.id) === productId);

  if (!product) return <StatusMessage message='Product not found' />;

  const name = getLocalized(product.name, language);
  const { price, imageUrl } = product;
  const categoryLabel = getLocalized(
    categories.find((item) => item.id === category)?.title || category,
    language
  );

  const relatedProducts = products
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  const decreaseQuantity = () => setQuantity((value) => Math.max(1, value - 1));

  const increaseQuantity = () =>
    setQuantity((value) => Math.min(MAX_QUANTITY, value + 1));

  const addToCartHandler = () => {
    addItemToCart({ ...product, name }, quantity);
    setIsAdded(true);
  };

  return (
    <Fragment>
      <div className='product-details-container'>
        <div className='product-image-wrap'>
          <div className='product-image'>
            <img src={imageUrl} alt={name} />
          </div>
        </div>

        <div className='product-info'>
          <nav className='breadcrumb' aria-label='Breadcrumb'>
            <Link to='/shop'>{t('shop')}</Link>
            <span className='separator'>/</span>
            <Link to={`/shop/${category}`}>{categoryLabel}</Link>
          </nav>

          <h1 className='product-name'>{name}</h1>
          <span className='product-price'>${price}</span>

          <div className='product-actions'>
            <div className='quantity-selector'>
              <button
                type='button'
                className='quantity-button'
                onClick={decreaseQuantity}
                disabled={quantity === 1}
                aria-label='Decrease quantity'
              >
                −
              </button>
              <span className='quantity-value'>{quantity}</span>
              <button
                type='button'
                className='quantity-button'
                onClick={increaseQuantity}
                disabled={quantity === MAX_QUANTITY}
                aria-label='Increase quantity'
              >
                +
              </button>
            </div>

            <Button
              className={isAdded ? 'added' : ''}
              onClick={addToCartHandler}
            >
              {isAdded ? t('addedToCart') : t('addToCart')}
            </Button>
          </div>

          <div className='product-meta'>
            <span className='total-price'>
              {t('total')} <strong>${price * quantity}</strong>
            </span>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className='related-products'>
          <div className='related-header'>
            <h2 className='related-title'>
              {t('moreFrom')} {categoryLabel}
            </h2>
            <Link className='related-link' to={`/shop/${category}`}>
              {t('viewAll')}
              <span aria-hidden='true'>→</span>
            </Link>
          </div>
          <div className='related-grid'>
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} category={category} />
            ))}
          </div>
        </section>
      )}
    </Fragment>
  );
};

export default ProductDetails;

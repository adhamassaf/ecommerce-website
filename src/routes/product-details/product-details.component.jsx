import { useContext, useState, useEffect, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';

import { CategoriesContext } from '../../contexts/categories.context.jsx';
import { CartContext } from '../../contexts/cart.context.jsx';

import Button from '../../components/button/button.component.jsx';
import ProductCard from '../../components/product-card/product-card.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';

import './product-details.styles.scss';

const MAX_QUANTITY = 99;

const ProductDetails = () => {
  const { category, productId } = useParams();
  const { categoriesMap, isLoading, error } = useContext(CategoriesContext);
  const { addItemToCart } = useContext(CartContext);

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setIsAdded(false);
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

  const { name, price, imageUrl } = product;

  const relatedProducts = products
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  const decreaseQuantity = () => setQuantity((value) => Math.max(1, value - 1));

  const increaseQuantity = () =>
    setQuantity((value) => Math.min(MAX_QUANTITY, value + 1));

  const addToCartHandler = () => {
    addItemToCart(product, quantity);
    setIsAdded(true);
  };

  return (
    <Fragment>
      <div className='product-details-container'>
        <div className='product-image'>
          <img src={imageUrl} alt={name} />
        </div>
        <div className='product-info'>
          <div className='breadcrumb'>
            <Link to='/shop'>Shop</Link>
            <span className='separator'>/</span>
            <Link to={`/shop/${category}`}>{category.toUpperCase()}</Link>
          </div>
          <h1 className='product-name'>{name}</h1>
          <span className='product-price'>${price}</span>
          <div className='quantity-selector'>
            <button
              type='button'
              className='quantity-button'
              onClick={decreaseQuantity}
              disabled={quantity === 1}
              aria-label='Decrease quantity'
            >
              &#8722;
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
          <Button onClick={addToCartHandler}>
            {isAdded ? 'Added to cart' : 'Add to cart'}
          </Button>
          <span className='total-price'>Total: ${price * quantity}</span>
        </div>
      </div>
      {relatedProducts.length > 0 && (
        <div className='related-products'>
          <h2 className='related-title'>MORE FROM {category.toUpperCase()}</h2>
          <div className='related-grid'>
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} category={category} />
            ))}
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default ProductDetails;

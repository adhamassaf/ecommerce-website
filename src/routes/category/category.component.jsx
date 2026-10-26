import { useContext, Fragment } from 'react';
import { useParams } from 'react-router-dom';

import ProductCard from '../../components/product-card/product-card.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';

import { CategoriesContext } from '../../contexts/categories.context.jsx';

import './category.styles.scss';

const Category = () => {
  const { category } = useParams();
  const { categoriesMap, isLoading, error } = useContext(CategoriesContext);

  if (isLoading) return <Spinner />;

  if (error) return <StatusMessage message={error} />;

  const products = categoriesMap[category];

  if (!products) return <StatusMessage message='Category not found' />;

  return (
    <Fragment>
      <h2 className='category-title'>{category.toUpperCase()}</h2>
      <div className='category-container'>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} category={category} />
        ))}
      </div>
    </Fragment>
  );
};

export default Category;
import { useContext, Fragment } from 'react';
import { useParams } from 'react-router-dom';

import ProductCard from '../../components/product-card/product-card.component.jsx';
import ProductFilters from '../../components/product-filters/product-filters.component.jsx';
import NoResults from '../../components/no-results/no-results.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';

import { CategoriesContext } from '../../contexts/categories.context.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';
import { useProductFilters } from '../../hooks/use-product-filters.js';
import { filterAndSortProducts } from '../../utils/product-filters.js';
import { getLocalized } from '../../utils/i18n.js';

import './category.styles.scss';

const Category = () => {
  const { category } = useParams();
  const { categories, categoriesMap, isLoading, error } =
    useContext(CategoriesContext);
  const { language } = useContext(LanguageContext);
  const { filters, setFilter, resetFilters, hasActiveFilters } =
    useProductFilters();

  if (isLoading) return <Spinner />;

  if (error) return <StatusMessage message={error} />;

  const products = categoriesMap[category];
  const categoryDoc = categories.find((item) => item.id === category);

  if (!products) return <StatusMessage message='Category not found' />;

  const searchableProducts = products.map((product) => ({
    ...product,
    name: getLocalized(product.name, 'en'),
    _name: product.name,
  }));

  const visibleProducts = filterAndSortProducts(searchableProducts, filters);

  return (
    <Fragment>
      <h2 className='category-title'>
        {getLocalized(categoryDoc?.title || category, language)}
      </h2>
      <ProductFilters
        filters={filters}
        onChange={setFilter}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        resultCount={visibleProducts.length}
      />
      {visibleProducts.length > 0 ? (
        <div className='category-container'>
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={{ ...product, name: product._name || product.name }}
              category={category}
              highlight={filters.query}
            />
          ))}
        </div>
      ) : (
        <NoResults onReset={resetFilters} />
      )}
    </Fragment>
  );
};

export default Category;

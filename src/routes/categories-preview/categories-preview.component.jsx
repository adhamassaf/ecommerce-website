import { useContext, useMemo, Fragment } from 'react';

import { CategoriesContext } from '../../contexts/categories.context.jsx';
import CategoryPreview from '../../components/category-preview/category-preview.component.jsx';
import ProductCard from '../../components/product-card/product-card.component.jsx';
import ProductFilters from '../../components/product-filters/product-filters.component.jsx';
import NoResults from '../../components/no-results/no-results.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';

import { useProductFilters } from '../../hooks/use-product-filters.js';
import { filterAndSortProducts } from '../../utils/product-filters.js';
import { getLocalized } from '../../utils/i18n.js';

import './categories-preview.styles.scss';

const CategoriesPreview = () => {
  const { categories, categoriesMap, isLoading, error } =
    useContext(CategoriesContext);
  const { filters, setFilter, resetFilters, hasActiveFilters } =
    useProductFilters();

  const allProducts = useMemo(
    () =>
      categories.flatMap((category) =>
        category.items.map((item) => ({
          ...item,
          category: category.id,
          name: getLocalized(item.name, 'en'),
          _name: item.name,
        }))
      ),
    [categories]
  );

  if (isLoading) return <Spinner />;

  if (error) return <StatusMessage message={error} />;

  const results = hasActiveFilters
    ? filterAndSortProducts(allProducts, filters)
    : [];

  const renderContent = () => {
    if (!hasActiveFilters) {
      return categories.map((category) => (
        <CategoryPreview
          key={category.id}
          title={category.title}
          categoryId={category.id}
          products={category.items}
        />
      ));
    }

    if (results.length === 0) return <NoResults onReset={resetFilters} />;

    return (
      <div className='search-results'>
        {results.map((product) => (
          <ProductCard
            key={`${product.category}-${product.id}`}
            product={{ ...product, name: product._name || product.name }}
            category={product.category}
            highlight={filters.query}
          />
        ))}
      </div>
    );
  };

  return (
    <Fragment>
      <ProductFilters
        filters={filters}
        onChange={setFilter}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        resultCount={results.length}
      />
      {renderContent()}
    </Fragment>
  );
};

export default CategoriesPreview;

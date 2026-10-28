import { useContext } from 'react';

import { DEFAULT_SORT } from '../../utils/product-filters.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

import './product-filters.styles.scss';

const ProductFilters = ({
  filters,
  onChange,
  onReset,
  hasActiveFilters,
  resultCount,
}) => {
  const { t } = useContext(LanguageContext);

  const sortOptions = [
    { value: DEFAULT_SORT, label: t('sortFeatured') },
    { value: 'price-asc', label: t('sortPriceAsc') },
    { value: 'price-desc', label: t('sortPriceDesc') },
    { value: 'name-asc', label: t('sortNameAsc') },
  ];

  return (
    <div className='product-filters-container'>
      <div className='filters-row'>
        <input
          className='filter-input search-input'
          type='search'
          placeholder={t('searchProducts')}
          aria-label={t('searchProducts')}
          value={filters.query}
          onChange={(event) => onChange('query', event.target.value)}
        />
        <select
          className='filter-input sort-select'
          aria-label={t('sortProducts')}
          value={filters.sort}
          onChange={(event) => onChange('sort', event.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          className='filter-input price-input'
          type='number'
          min='0'
          inputMode='numeric'
          placeholder={t('minPrice')}
          aria-label={t('minPrice')}
          value={filters.minPrice}
          onChange={(event) => onChange('minPrice', event.target.value)}
        />
        <input
          className='filter-input price-input'
          type='number'
          min='0'
          inputMode='numeric'
          placeholder={t('maxPrice')}
          aria-label={t('maxPrice')}
          value={filters.maxPrice}
          onChange={(event) => onChange('maxPrice', event.target.value)}
        />
        {hasActiveFilters && (
          <button type='button' className='reset-button' onClick={onReset}>
            {t('clearFilters')}
          </button>
        )}
      </div>
      {hasActiveFilters && (
        <span className='result-count' role='status' aria-live='polite'>
          {resultCount}{' '}
          {resultCount === 1 ? t('productFound') : t('productsFound')}
        </span>
      )}
    </div>
  );
};

export default ProductFilters;

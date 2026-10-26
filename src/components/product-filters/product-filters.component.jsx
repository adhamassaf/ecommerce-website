import { SORT_OPTIONS } from '../../utils/product-filters.js';

import './product-filters.styles.scss';

const ProductFilters = ({
  filters,
  onChange,
  onReset,
  hasActiveFilters,
  resultCount,
}) => (
  <div className='product-filters-container'>
    <div className='filters-row'>
      <input
        className='filter-input search-input'
        type='search'
        placeholder='Search products'
        aria-label='Search products'
        value={filters.query}
        onChange={(event) => onChange('query', event.target.value)}
      />
      <select
        className='filter-input sort-select'
        aria-label='Sort products'
        value={filters.sort}
        onChange={(event) => onChange('sort', event.target.value)}
      >
        {SORT_OPTIONS.map((option) => (
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
        placeholder='Min price'
        aria-label='Minimum price'
        value={filters.minPrice}
        onChange={(event) => onChange('minPrice', event.target.value)}
      />
      <input
        className='filter-input price-input'
        type='number'
        min='0'
        inputMode='numeric'
        placeholder='Max price'
        aria-label='Maximum price'
        value={filters.maxPrice}
        onChange={(event) => onChange('maxPrice', event.target.value)}
      />
      {hasActiveFilters && (
        <button type='button' className='reset-button' onClick={onReset}>
          Clear
        </button>
      )}
    </div>
    {hasActiveFilters && (
      <span className='result-count' role='status' aria-live='polite'>
        {resultCount} {resultCount === 1 ? 'product' : 'products'} found
      </span>
    )}
  </div>
);

export default ProductFilters;

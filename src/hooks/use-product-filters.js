import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { SORT_OPTIONS, DEFAULT_SORT } from '../utils/product-filters.js';

const PARAM_KEYS = {
  query: 'q',
  sort: 'sort',
  minPrice: 'min',
  maxPrice: 'max',
};

const VALID_SORTS = SORT_OPTIONS.map((option) => option.value);

export const useProductFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get(PARAM_KEYS.query) || '';
  const sortParam = searchParams.get(PARAM_KEYS.sort);
  const sort = VALID_SORTS.includes(sortParam) ? sortParam : DEFAULT_SORT;
  const minPrice = searchParams.get(PARAM_KEYS.minPrice) || '';
  const maxPrice = searchParams.get(PARAM_KEYS.maxPrice) || '';

  const filters = useMemo(
    () => ({ query, sort, minPrice, maxPrice }),
    [query, sort, minPrice, maxPrice]
  );

  const hasActiveFilters =
    query.trim() !== '' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    sort !== DEFAULT_SORT;

  const setFilter = useCallback(
    (name, value) => {
      const next = new URLSearchParams(searchParams);

      if (value === '' || value === DEFAULT_SORT) {
        next.delete(PARAM_KEYS[name]);
      } else {
        next.set(PARAM_KEYS[name], value);
      }

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return { filters, setFilter, resetFilters, hasActiveFilters };
};

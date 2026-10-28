export const DEFAULT_SORT = 'default';

export const SORT_OPTIONS = [
  { value: DEFAULT_SORT, label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

const parsePrice = (value) => {
  if (value === '' || value === null || value === undefined) return null;

  const parsed = Number(value);

  return Number.isNaN(parsed) ? null : parsed;
};

export const filterAndSortProducts = (
  products,
  { query, sort, minPrice, maxPrice }
) => {
  const normalizedQuery = query.trim().toLowerCase();
  const min = parsePrice(minPrice);
  const max = parsePrice(maxPrice);

  const filtered = products.filter((product) => {
    const nameValue = product.name;
    const nameText =
      nameValue && typeof nameValue === 'object'
        ? `${nameValue.en || ''} ${nameValue.ar || ''}`
        : String(nameValue || '');
    const searchableText = `${nameText} ${product.category || ''}`.toLowerCase();

    if (normalizedQuery && !searchableText.includes(normalizedQuery)) {
      return false;
    }

    if (min !== null && product.price < min) return false;

    if (max !== null && product.price > max) return false;

    return true;
  });

  switch (sort) {
    case 'price-asc':
      return [...filtered].sort((a, b) => a.price - b.price);
    case 'price-desc':
      return [...filtered].sort((a, b) => b.price - a.price);
    case 'name-asc':
      return [...filtered].sort((a, b) => {
        const nameA =
          a.name && typeof a.name === 'object'
            ? a.name.en || a.name.ar || ''
            : String(a.name || '');
        const nameB =
          b.name && typeof b.name === 'object'
            ? b.name.en || b.name.ar || ''
            : String(b.name || '');
        return nameA.localeCompare(nameB);
      });
    default:
      return filtered;
  }
};

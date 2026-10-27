export const DEFAULT_CATEGORY_ORDER = [
  'hats',
  'jackets',
  'sneakers',
  'womens',
  'mens',
];

export const DEFAULT_CATEGORY_IMAGES = {
  hats: 'https://i.ibb.co/cvpntL1/hats.png',
  jackets: 'https://i.ibb.co/px2tCc3/jackets.png',
  sneakers: 'https://i.ibb.co/0jqHpnp/sneakers.png',
  womens: 'https://i.ibb.co/GCCdy8t/womens.png',
  mens: 'https://i.ibb.co/R70vBrQ/men.png',
};

export const getCategoryImage = (category) =>
  category.imageUrl ||
  DEFAULT_CATEGORY_IMAGES[category.id] ||
  (category.items[0] && category.items[0].imageUrl) ||
  '';

const getCategoryRank = (category) => {
  if (typeof category.order === 'number') return category.order;

  const defaultIndex = DEFAULT_CATEGORY_ORDER.indexOf(category.id);

  return defaultIndex >= 0 ? defaultIndex : 1000;
};

export const sortCategories = (categories) =>
  [...categories].sort(
    (a, b) => getCategoryRank(a) - getCategoryRank(b) || a.id.localeCompare(b.id)
  );

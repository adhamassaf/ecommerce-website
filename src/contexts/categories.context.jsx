import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import { getCategoryDocuments } from '../utils/firebase/firebase.utils.js';
import { sortCategories } from '../utils/category-defaults.js';

export const CategoriesContext = createContext({
  categories: [],
  categoriesMap: {},
  isLoading: true,
  error: null,
  refreshCategories: async () => {},
});

export const CategoriesProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const loadCategories = async () => {
      try {
        const documents = await getCategoryDocuments();
        if (!isCancelled) setCategories(sortCategories(documents));
      } catch (err) {
        if (!isCancelled) {
          setError('Failed to load products. Please try again later.');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadCategories();

    return () => {
      isCancelled = true;
    };
  }, []);

  const refreshCategories = useCallback(async () => {
    const documents = await getCategoryDocuments();
    setCategories(sortCategories(documents));
  }, []);

  const categoriesMap = useMemo(
    () =>
      categories.reduce((acc, category) => {
        acc[category.id] = category.items;
        return acc;
      }, {}),
    [categories]
  );

  const value = {
    categories,
    categoriesMap,
    isLoading,
    error,
    refreshCategories,
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
};

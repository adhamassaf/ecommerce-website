import { createContext, useState, useEffect } from 'react';

import { getCategoriesAndDocuments } from '../utils/firebase/firebase.utils.js';

export const CategoriesContext = createContext({
  categoriesMap: {},
  isLoading: true,
  error: null,
});

export const CategoriesProvider = ({ children }) => {
  const [categoriesMap, setCategoriesMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const getCategoriesMap = async () => {
      try {
        const categoryMap = await getCategoriesAndDocuments('categories');
        if (!isCancelled) setCategoriesMap(categoryMap);
      } catch (err) {
        if (!isCancelled) {
          setError('Failed to load products. Please try again later.');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    getCategoriesMap();

    return () => {
      isCancelled = true;
    };
  }, []);

  const value = { categoriesMap, isLoading, error };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
};
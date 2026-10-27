import { useContext } from 'react';
import { Outlet } from 'react-router-dom';

import Directory from '../../components/directory/directory.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';

import { CategoriesContext } from '../../contexts/categories.context.jsx';
import { getCategoryImage } from '../../utils/category-defaults.js';

const Home = () => {
  const { categories, isLoading, error } = useContext(CategoriesContext);

  if (isLoading) return <Spinner />;

  if (error) return <StatusMessage message={error} />;

  const directoryCategories = categories.map((category) => ({
    id: category.id,
    title: category.title,
    imageUrl: getCategoryImage(category),
  }));

  return (
    <div>
      <Directory categories={directoryCategories} />
      <Outlet />
    </div>
  );
};

export default Home;

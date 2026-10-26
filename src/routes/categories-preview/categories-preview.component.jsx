import { useContext, Fragment } from 'react';

import { CategoriesContext } from '../../contexts/categories.context.jsx';
import CategoryPreview from '../../components/category-preview/category-preview.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';

const CategoriesPreview = () => {
  const { categoriesMap, isLoading, error } = useContext(CategoriesContext);

  if (isLoading) return <Spinner />;

  if (error) return <StatusMessage message={error} />;

  return (
    <Fragment>
      {Object.keys(categoriesMap).map((title) => {
        const products = categoriesMap[title];
        return (
          <CategoryPreview key={title} title={title} products={products} />
        );
      })}
    </Fragment>
  );
};

export default CategoriesPreview;
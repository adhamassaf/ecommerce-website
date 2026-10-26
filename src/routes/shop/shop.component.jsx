import { Routes, Route } from 'react-router-dom';

import CategoriesPreview from '../categories-preview/categories-preview.component';
import Category from '../../routes/category/category.component.jsx';
import ProductDetails from '../product-details/product-details.component.jsx';

import './shop.styles.scss';

const Shop = () => {
  return (
    <Routes>
      <Route index element={<CategoriesPreview />} />
      <Route path=':category' element={<Category />} />
      <Route path=':category/:productId' element={<ProductDetails />} />
    </Routes>
  );
};

export default Shop;
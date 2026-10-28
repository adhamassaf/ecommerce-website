import { Link } from 'react-router-dom';

import ProductCard from '../product-card/product-card.component.jsx';

import './category-preview.styles.scss';

const CategoryPreview = ({ title, products }) => (
  <section className='category-preview-container'>
    <div className='category-preview-header'>
      <h2 className='category-preview-title'>
        <Link to={title}>{title}</Link>
      </h2>
      <Link className='category-preview-link' to={title}>
        View all
        <span aria-hidden='true'>→</span>
      </Link>
    </div>
    <div className='category-preview-grid'>
      {products
        .filter((_, idx) => idx < 4)
        .map((product) => (
          <ProductCard key={product.id} product={product} category={title} />
        ))}
    </div>
  </section>
);

export default CategoryPreview;

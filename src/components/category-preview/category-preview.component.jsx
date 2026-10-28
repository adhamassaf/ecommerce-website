import { useContext } from 'react';
import { Link } from 'react-router-dom';

import ProductCard from '../product-card/product-card.component.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';
import { getLocalized } from '../../utils/i18n.js';

import './category-preview.styles.scss';

const CategoryPreview = ({ title, products, categoryId }) => {
  const { language, t } = useContext(LanguageContext);
  const id = categoryId || title;
  const localizedTitle = getLocalized(title, language);

  return (
    <section className='category-preview-container'>
      <div className='category-preview-header'>
        <h2 className='category-preview-title'>
          <Link to={id}>{localizedTitle}</Link>
        </h2>
        <Link className='category-preview-link' to={id}>
          {t('viewAll')}
          <span aria-hidden='true'>→</span>
        </Link>
      </div>
      <div className='category-preview-grid'>
        {products
          .filter((_, idx) => idx < 4)
          .map((product) => (
            <ProductCard key={product.id} product={product} category={id} />
          ))}
      </div>
    </section>
  );
};

export default CategoryPreview;

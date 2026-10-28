import { useContext } from 'react';

import Button from '../button/button.component.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';

import './no-results.styles.scss';

const NoResults = ({ onReset }) => {
  const { t } = useContext(LanguageContext);

  return (
    <div className='no-results-container'>
      <span className='no-results-message'>{t('noProductsMatch')}</span>
      <Button buttonType='inverted' onClick={onReset}>
        {t('clearFiltersBtn')}
      </Button>
    </div>
  );
};

export default NoResults;

import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { LanguageContext } from '../../contexts/language.context.jsx';
import { getLocalized } from '../../utils/i18n.js';

import './directory-item.styles.scss';

const DirectoryItem = ({ category }) => {
  const { id, imageUrl, title } = category;
  const navigate = useNavigate();
  const { language, t } = useContext(LanguageContext);

  const goToCategory = () => navigate(`/shop/${id}`);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') goToCategory();
  };

  return (
    <div
      className='directory-item-container'
      role='link'
      tabIndex={0}
      onClick={goToCategory}
      onKeyDown={handleKeyDown}
    >
      <div
        className='background-image'
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
      />
      <div className='body'>
        <h2>{getLocalized(title, language)}</h2>
        <p>{t('shopNow')}</p>
      </div>
    </div>
  );
};

export default DirectoryItem;

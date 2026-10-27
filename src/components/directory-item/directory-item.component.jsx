import { useNavigate } from 'react-router-dom';

import './directory-item.styles.scss';

const DirectoryItem = ({ category }) => {
  const { id, imageUrl, title } = category;
  const navigate = useNavigate();

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
        <h2>{title}</h2>
        <p>Shop Now</p>
      </div>
    </div>
  );
};

export default DirectoryItem;

import Button from '../button/button.component.jsx';

import './no-results.styles.scss';

const NoResults = ({ onReset }) => (
  <div className='no-results-container'>
    <span className='no-results-message'>No products match your search</span>
    <Button buttonType='inverted' onClick={onReset}>
      Clear filters
    </Button>
  </div>
);

export default NoResults;

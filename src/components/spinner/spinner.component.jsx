import './spinner.styles.scss';

const Spinner = () => (
  <div className='spinner-overlay'>
    <div className='spinner-container' role='status' aria-label='Loading' />
  </div>
);

export default Spinner;
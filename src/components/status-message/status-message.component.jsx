import './status-message.styles.scss';

const StatusMessage = ({ message }) => (
  <div className='status-message-container'>
    <span className='status-message'>{message}</span>
  </div>
);

export default StatusMessage;
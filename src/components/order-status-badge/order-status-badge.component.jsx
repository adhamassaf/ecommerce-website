import { ORDER_STATUS_LABELS } from '../../utils/orders.js';

import './order-status-badge.styles.scss';

const OrderStatusBadge = ({ status, language = 'en' }) => {
  const labels = ORDER_STATUS_LABELS[language] || ORDER_STATUS_LABELS.en;

  return (
    <span className={`order-status-badge ${status}`}>
      {labels[status] || status}
    </span>
  );
};

export default OrderStatusBadge;

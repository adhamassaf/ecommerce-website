import { useContext } from 'react';

import { ORDER_STATUS_LABELS } from '../../utils/orders.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

import './order-status-badge.styles.scss';

const OrderStatusBadge = ({ status, language: languageProp }) => {
  const { language: contextLanguage } = useContext(LanguageContext);
  const language = languageProp || contextLanguage || 'en';
  const labels = ORDER_STATUS_LABELS[language] || ORDER_STATUS_LABELS.en;

  return (
    <span className={`order-status-badge ${status}`}>
      {labels[status] || status}
    </span>
  );
};

export default OrderStatusBadge;

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export const ORDER_STATUS_LABELS = {
  en: {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  },
  ar: {
    pending: 'جديد',
    processing: 'قيد التجهيز',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
  },
};

export const PAYMENT_METHOD_LABELS = {
  en: {
    cod: 'Cash on delivery',
    'demo-card': 'Card (demo, no real payment)',
  },
  ar: {
    cod: 'الدفع عند الاستلام',
    'demo-card': 'بطاقة (تجريبي)',
  },
};

export const formatOrderNumber = (orderId) =>
  `#${String(orderId).slice(0, 6).toUpperCase()}`;

export const formatMoney = (value) => {
  const amount = Number(value) || 0;

  return `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
};

export const formatOrderDate = (date) =>
  date
    ? date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

export const getOrderErrorMessage = (error) => {
  if (error && error.code === 'permission-denied') {
    return 'You do not have permission to place this order. Please sign in again.';
  }

  if (error && error.code === 'unavailable') {
    return 'Network error, check your connection and try again.';
  }

  return 'Could not place your order, please try again.';
};

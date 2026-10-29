const Icon = ({ size = 20, className, children }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.8'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    {children}
  </svg>
);

export const OverviewIcon = (props) => (
  <Icon {...props}>
    <rect x='3' y='3' width='7' height='7' rx='1.5' />
    <rect x='14' y='3' width='7' height='7' rx='1.5' />
    <rect x='14' y='14' width='7' height='7' rx='1.5' />
    <rect x='3' y='14' width='7' height='7' rx='1.5' />
  </Icon>
);

export const CategoriesIcon = (props) => (
  <Icon {...props}>
    <path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' />
    <line x1='7' y1='7' x2='7.01' y2='7' />
  </Icon>
);

export const ProductsIcon = (props) => (
  <Icon {...props}>
    <path d='M16.5 9.4l-9-5.19' />
    <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' />
    <polyline points='3.27 6.96 12 12.01 20.73 6.96' />
    <line x1='12' y1='22.08' x2='12' y2='12' />
  </Icon>
);

export const OrdersIcon = (props) => (
  <Icon {...props}>
    <path d='M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z' />
    <line x1='3' y1='6' x2='21' y2='6' />
    <path d='M16 10a4 4 0 0 1-8 0' />
  </Icon>
);

export const UsersIcon = (props) => (
  <Icon {...props}>
    <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
    <circle cx='9' cy='7' r='4' />
    <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
    <path d='M16 3.13a4 4 0 0 1 0 7.75' />
  </Icon>
);

export const SettingsIcon = (props) => (
  <Icon {...props}>
    <line x1='4' y1='21' x2='4' y2='14' />
    <line x1='4' y1='10' x2='4' y2='3' />
    <line x1='12' y1='21' x2='12' y2='12' />
    <line x1='12' y1='8' x2='12' y2='3' />
    <line x1='20' y1='21' x2='20' y2='16' />
    <line x1='20' y1='12' x2='20' y2='3' />
    <line x1='1' y1='14' x2='7' y2='14' />
    <line x1='9' y1='8' x2='15' y2='8' />
    <line x1='17' y1='16' x2='23' y2='16' />
  </Icon>
);

export const PriceIcon = (props) => (
  <Icon {...props}>
    <line x1='12' y1='1' x2='12' y2='23' />
    <path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
  </Icon>
);

export const PlusIcon = (props) => (
  <Icon {...props}>
    <line x1='12' y1='5' x2='12' y2='19' />
    <line x1='5' y1='12' x2='19' y2='12' />
  </Icon>
);

export const ArrowIcon = (props) => (
  <Icon {...props}>
    <line x1='5' y1='12' x2='19' y2='12' />
    <polyline points='12 5 19 12 12 19' />
  </Icon>
);

export const MessagesIcon = (props) => (
  <Icon {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Icon>
);


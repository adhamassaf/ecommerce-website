import './button.styles.scss';

export const BUTTON_TYPE_CLASSES = {
  google: 'google-sign-in',
  inverted: 'inverted',
};

const Button = ({ children, buttonType, className = '', ...otherProps }) => {
  const typeClass = BUTTON_TYPE_CLASSES[buttonType] || '';

  return (
    <button
      className={`button-container ${typeClass} ${className}`.trim()}
      {...otherProps}
    >
      {children}
    </button>
  );
};

export default Button;

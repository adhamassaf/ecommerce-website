import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../button/button.component.jsx';
import Spinner from '../spinner/spinner.component.jsx';

import { UserContext } from '../../contexts/user.context.jsx';
import { CartContext } from '../../contexts/cart.context.jsx';
import { CategoriesContext } from '../../contexts/categories.context.jsx';

import { createOrder } from '../../utils/firebase/firebase.utils.js';
import { formatMoney, getOrderErrorMessage } from '../../utils/orders.js';
import {
  isValidNationalNumber,
  parsePhoneValue,
} from '../../utils/phone-countries.js';
import { LanguageContext } from '../../contexts/language.context.jsx';
import PhoneInput from '../phone-input/phone-input.component.jsx';

import './order-form.styles.scss';

const OrderForm = () => {
  const { currentUser, isAuthReady } = useContext(UserContext);
  const { cartItems, cartTotal, clearCart } = useContext(CartContext);
  const {
    categories,
    isLoading: isCatalogLoading,
    error: catalogError,
  } = useContext(CategoriesContext);
  const { language, t } = useContext(LanguageContext);
  const navigate = useNavigate();

  const paymentOptions = [
    { value: 'cod', title: t('codTitle'), description: t('codDesc') },
    { value: 'demo-card', title: t('demoCardTitle'), description: t('demoCardDesc') },
  ];


  const [fields, setFields] = useState({
    fullName: currentUser && currentUser.displayName ? currentUser.displayName : '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthReady) return <Spinner />;

  if (!currentUser) {
    return (
      <div className='order-form-container'>
        <div className='order-signin-prompt'>
          <span>{t('signInToOrder')}</span>
          <Button
            type='button'
            onClick={() => navigate('/auth', { state: { from: '/checkout' } })}
          >
            {t('signIn')}
          </Button>
        </div>
      </div>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFields((current) => ({ ...current, [name]: value }));
  };

  const validate = (shipping) => {
    if (!shipping.fullName) return 'Please enter your full name.';

    const parsedPhone = parsePhoneValue(shipping.phone);
    if (!isValidNationalNumber(parsedPhone.iso, parsedPhone.national)) {
      return t('requiredPhone');
    }

    if (!shipping.address) return 'Please enter your address.';

    if (!shipping.city) return 'Please enter your city.';

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage('');

    const shipping = {
      fullName: fields.fullName.trim(),
      phone: fields.phone.trim(),
      address: fields.address.trim(),
      city: fields.city.trim(),
      notes: fields.notes.trim(),
    };

    const validationMessage = validate(shipping);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    if (isCatalogLoading) {
      setErrorMessage('Products are still loading, please try again.');
      return;
    }

    if (catalogError) {
      setErrorMessage(catalogError);
      return;
    }

    const catalog = new Map(
      categories
        .flatMap((category) => category.items)
        .map((item) => [item.id, item])
    );

    const items = [];

    for (const cartItem of cartItems) {
      const product = catalog.get(cartItem.id);

      if (!product) {
        setErrorMessage(
          `"${cartItem.name}" is no longer available. Please remove it from your cart.`
        );
        return;
      }

      items.push({
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        price: Number(product.price),
        quantity: cartItem.quantity,
      });
    }

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    setIsSubmitting(true);

    try {
      const orderId = await createOrder({
        user: currentUser,
        items,
        total,
        shipping,
        paymentMethod,
      });

      clearCart();
      navigate(`/orders/${orderId}`, { state: { placed: true }, replace: true });
    } catch (error) {
      setErrorMessage(getOrderErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  return (
    <div className='order-form-container'>
      <form className='order-form' onSubmit={handleSubmit} noValidate>
        <div className='order-demo-notice' role='note'>
          {t('demoNotice')}
        </div>

        <h2 className='order-form-title'>{t('shippingDetails')}</h2>
        <div className='order-fields'>
          <label className='order-field'>
            <span className='order-field-label'>{t('fullName')}</span>
            <input
              className='order-field-control'
              name='fullName'
              value={fields.fullName}
              onChange={handleChange}
              maxLength={100}
              autoComplete='name'
            />
          </label>
          <label className='order-field'>
            <span className='order-field-label'>{t('phone')}</span>
            <PhoneInput
              name='phone'
              value={fields.phone}
              language={language}
              onChange={(nextPhone) =>
                setFields((current) => ({ ...current, phone: nextPhone }))
              }
            />
          </label>
          <label className='order-field wide'>
            <span className='order-field-label'>{t('address')}</span>
            <input
              className='order-field-control'
              name='address'
              value={fields.address}
              onChange={handleChange}
              maxLength={200}
              autoComplete='street-address'
            />
          </label>
          <label className='order-field'>
            <span className='order-field-label'>{t('city')}</span>
            <input
              className='order-field-control'
              name='city'
              value={fields.city}
              onChange={handleChange}
              maxLength={100}
              autoComplete='address-level2'
            />
          </label>
          <label className='order-field wide'>
            <span className='order-field-label'>{t('notesOptional')}</span>
            <textarea
              className='order-field-control'
              name='notes'
              value={fields.notes}
              onChange={handleChange}
              maxLength={500}
              rows={3}
            />
          </label>
        </div>

        <h2 className='order-form-title'>{t('paymentMethod')}</h2>
        <div className='payment-options' role='radiogroup'>
          {paymentOptions.map((option) => (
            <label
              key={option.value}
              className={`payment-option${
                paymentMethod === option.value ? ' selected' : ''
              }`}
            >
              <input
                type='radio'
                name='paymentMethod'
                value={option.value}
                checked={paymentMethod === option.value}
                onChange={(event) => setPaymentMethod(event.target.value)}
              />
              <span className='payment-option-text'>
                <strong>{option.title}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>

        {errorMessage && (
          <div className='order-error' role='alert'>
            {errorMessage}
          </div>
        )}

        <div className='order-submit'>
          <span className='order-submit-total'>
            {t('total')}: {formatMoney(cartTotal)}
          </span>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? t('placingOrder') : t('placeOrder')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;

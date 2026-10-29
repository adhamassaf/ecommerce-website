import { useContext, useEffect, useMemo, useState } from 'react';

import PhoneInput from '../../components/phone-input/phone-input.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getSiteSettings,
  submitContactMessage,
} from '../../utils/firebase/firebase.utils.js';
import { getLocalized, normalizeLocaleValue } from '../../utils/i18n.js';
import { LanguageContext } from '../../contexts/language.context.jsx';
import {
  getPhoneValidationState,
  parsePhoneValue,
} from '../../utils/phone-countries.js';

import './contact.styles.scss';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

const normalizeCustomFields = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      id: item.id || '',
      type: ['text', 'textarea', 'select'].includes(item.type)
        ? item.type
        : 'text',
      label: normalizeLocaleValue(item.label),
      required: Boolean(item.required),
      options: Array.isArray(item.options)
        ? item.options.map((opt) => normalizeLocaleValue(opt))
        : [],
    }))
    .filter((item) => item.id)
    .slice(0, 20);
};

const Contact = () => {
  const { language, t, dir } = useContext(LanguageContext);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [customValues, setCustomValues] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let active = true;

    getSiteSettings()
      .then((data) => {
        if (active) setSettings(data || {});
      })
      .catch(() => {
        if (active) setSettings({});
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const customFields = useMemo(
    () => normalizeCustomFields(settings && settings.contactCustomFields),
    [settings]
  );

  const info = useMemo(() => {
    const data = settings || {};
    return {
      title: getLocalized(
        normalizeLocaleValue(data.contactTitle, t('contactUs')),
        language,
        t('contactUs')
      ),
      storeName: getLocalized(
        normalizeLocaleValue(data.contactStoreName),
        language,
        ''
      ),
      address: getLocalized(
        normalizeLocaleValue(data.contactAddress),
        language,
        ''
      ),
      email: data.contactEmail || '',
      phone: data.contactPhone || '',
      lat: Number(data.contactMapLat),
      lng: Number(data.contactMapLng),
      zoom: Number(data.contactMapZoom) || 14,
      mapQuery: String(data.contactMapQuery || '').trim(),
      showMap: data.contactShowMap !== false,
      showStoreInfo: data.contactShowStoreInfo !== false,
      showPhone: data.contactShowPhone !== false,
    };
  }, [settings, language, t]);

  const mapSrc = useMemo(() => {
    if (!info.showMap) return '';

    if (Number.isFinite(info.lat) && Number.isFinite(info.lng)) {
      return `https://maps.google.com/maps?q=${info.lat},${info.lng}&z=${info.zoom}&output=embed`;
    }
    if (info.mapQuery) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(
        info.mapQuery
      )}&z=${info.zoom}&output=embed`;
    }
    if (info.address) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(
        info.address
      )}&z=${info.zoom}&output=embed`;
    }
    return '';
  }, [info]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: '' }));
  };

  const handleCustomChange = (fieldId, value) => {
    setCustomValues((previous) => ({ ...previous, [fieldId]: value }));
    setErrors((previous) => ({ ...previous, [`custom_${fieldId}`]: '' }));
  };

  const validate = () => {
    const next = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!name) next.name = t('contactErrorName');
    if (!email) next.email = t('contactErrorEmail');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = t('contactErrorEmailInvalid');
    }
    if (!subject) next.subject = t('contactErrorSubject');
    if (!message) next.message = t('contactErrorMessage');
    else if (message.length < 10) next.message = t('contactErrorMessageShort');

    if (info.showPhone && form.phone.trim()) {
      const parsed = parsePhoneValue(form.phone);
      const state = getPhoneValidationState(parsed.iso, parsed.national);
      if (state.status !== 'valid') next.phone = t('contactErrorPhone');
    }

    customFields.forEach((field) => {
      const value = String(customValues[field.id] || '').trim();
      if (field.required && !value) {
        next[`custom_${field.id}`] = t('contactErrorRequiredField');
      }
    });

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setIsSubmitting(true);

    const payloadCustomValues = customFields.map((field) => ({
      id: field.id,
      label: getLocalized(field.label, language, field.label.en || field.label.ar),
      value: String(customValues[field.id] || '').trim(),
    }));

    try {
      await submitContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: info.showPhone ? form.phone.trim() : '',
        subject: form.subject.trim(),
        message: form.message.trim(),
        customValues: payloadCustomValues,
      });
      setForm(EMPTY_FORM);
      setCustomValues({});
      setShowSuccess(true);
    } catch (err) {
      const code = err && (err.message || err.code);
      if (code === 'missing-fields') setSubmitError(t('contactErrorRequired'));
      else if (code === 'invalid-email') setSubmitError(t('contactErrorEmailInvalid'));
      else if (code === 'too-long') setSubmitError(t('contactErrorTooLong'));
      else setSubmitError(t('contactErrorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className='contact-page' dir={dir}>
      <header className='contact-hero'>
        <h1>{info.title}</h1>
      </header>

      <div
        className={`contact-layout${info.showMap ? '' : ' contact-layout--no-map'}`}
      >
        <section className='contact-info-panel'>
          {info.showStoreInfo && (
            <>
              {info.storeName && <h2>{info.storeName}</h2>}
              {(info.address || info.email || info.phone) && (
                <ul className='contact-info-list'>
                  {info.address && (
                    <li>
                      <strong>{t('contactAddressLabel')}</strong>
                      <span dir='auto'>{info.address}</span>
                    </li>
                  )}
                  {info.email && (
                    <li>
                      <strong>{t('contactEmailLabel')}</strong>
                      <a href={`mailto:${info.email}`} dir='ltr'>
                        {info.email}
                      </a>
                    </li>
                  )}
                  {info.phone && (
                    <li>
                      <strong>{t('contactPhoneLabel')}</strong>
                      <a href={`tel:${info.phone}`} dir='ltr'>
                        {info.phone}
                      </a>
                    </li>
                  )}
                </ul>
              )}
            </>
          )}

          <form className='contact-form' onSubmit={handleSubmit} noValidate>
            <div className='contact-form-row'>
              <label className='contact-field'>
                <span>
                  {t('contactName')} <em>*</em>
                </span>
                <input
                  type='text'
                  value={form.name}
                  onChange={handleChange('name')}
                  maxLength={100}
                  autoComplete='name'
                />
                {errors.name && <small>{errors.name}</small>}
              </label>
              <label className='contact-field'>
                <span>
                  {t('contactEmail')} <em>*</em>
                </span>
                <input
                  type='email'
                  dir='ltr'
                  value={form.email}
                  onChange={handleChange('email')}
                  maxLength={120}
                  autoComplete='email'
                />
                {errors.email && <small>{errors.email}</small>}
              </label>
            </div>

            <div
              className={`contact-form-row${
                info.showPhone ? '' : ' contact-form-row--single'
              }`}
            >
              <label className='contact-field'>
                <span>
                  {t('contactSubject')} <em>*</em>
                </span>
                <input
                  type='text'
                  value={form.subject}
                  onChange={handleChange('subject')}
                  maxLength={150}
                />
                {errors.subject && <small>{errors.subject}</small>}
              </label>
              {info.showPhone && (
                <div className='contact-field'>
                  <span>{t('contactPhone')}</span>
                  <PhoneInput
                    value={form.phone}
                    onChange={(value) => {
                      setForm((previous) => ({ ...previous, phone: value }));
                      setErrors((previous) => ({ ...previous, phone: '' }));
                    }}
                    language={language}
                  />
                  {errors.phone && <small>{errors.phone}</small>}
                </div>
              )}
            </div>

            {customFields.map((field) => {
              const label = getLocalized(
                field.label,
                language,
                field.label.en || field.label.ar
              );
              const errorKey = `custom_${field.id}`;
              const value = customValues[field.id] || '';

              if (field.type === 'textarea') {
                return (
                  <label
                    key={field.id}
                    className='contact-field contact-field-full'
                  >
                    <span>
                      {label}
                      {field.required ? <em> *</em> : null}
                    </span>
                    <textarea
                      value={value}
                      onChange={(event) =>
                        handleCustomChange(field.id, event.target.value)
                      }
                      rows={4}
                      maxLength={1000}
                    />
                    {errors[errorKey] && <small>{errors[errorKey]}</small>}
                  </label>
                );
              }

              if (field.type === 'select') {
                return (
                  <label key={field.id} className='contact-field'>
                    <span>
                      {label}
                      {field.required ? <em> *</em> : null}
                    </span>
                    <select
                      value={value}
                      onChange={(event) =>
                        handleCustomChange(field.id, event.target.value)
                      }
                    >
                      <option value=''>{t('customFieldSelectPlaceholder')}</option>
                      {field.options.map((option, index) => {
                        const optionLabel = getLocalized(
                          option,
                          language,
                          option.en || option.ar
                        );
                        return (
                          <option key={`${field.id}_${index}`} value={optionLabel}>
                            {optionLabel}
                          </option>
                        );
                      })}
                    </select>
                    {errors[errorKey] && <small>{errors[errorKey]}</small>}
                  </label>
                );
              }

              return (
                <label key={field.id} className='contact-field'>
                  <span>
                    {label}
                    {field.required ? <em> *</em> : null}
                  </span>
                  <input
                    type='text'
                    value={value}
                    onChange={(event) =>
                      handleCustomChange(field.id, event.target.value)
                    }
                    maxLength={300}
                  />
                  {errors[errorKey] && <small>{errors[errorKey]}</small>}
                </label>
              );
            })}

            <label className='contact-field contact-field-full'>
              <span>
                {t('contactMessage')} <em>*</em>
              </span>
              <textarea
                value={form.message}
                onChange={handleChange('message')}
                rows={5}
                maxLength={2000}
              />
              {errors.message && <small>{errors.message}</small>}
            </label>

            {submitError && (
              <div className='contact-form-error' role='alert'>
                {submitError}
              </div>
            )}

            <button
              type='submit'
              className='contact-submit'
              disabled={isSubmitting}
            >
              {isSubmitting ? t('contactSending') : t('contactSend')}
            </button>
          </form>
        </section>

        {info.showMap && (
          <section className='contact-map-panel'>
            {mapSrc ? (
              <iframe
                title={t('contactMapTitle')}
                src={mapSrc}
                loading='lazy'
                referrerPolicy='no-referrer-when-downgrade'
                allowFullScreen
              />
            ) : (
              <div className='contact-map-empty'>{t('contactMapEmpty')}</div>
            )}
          </section>
        )}
      </div>

      {showSuccess && (
        <div
          className='contact-modal-backdrop'
          role='presentation'
          onClick={() => setShowSuccess(false)}
        >
          <div
            className='contact-modal'
            role='dialog'
            aria-modal='true'
            aria-labelledby='contact-success-title'
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id='contact-success-title'>{t('contactSuccessTitle')}</h2>
            <p>{t('contactSuccessBody')}</p>
            <button
              type='button'
              className='contact-submit'
              onClick={() => setShowSuccess(false)}
            >
              {t('contactSuccessClose')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;

import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getServiceById,
  getServices,
} from '../../utils/firebase/firebase.utils.js';
import { getLocalized } from '../../utils/i18n.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

import './service-details.styles.scss';

const linesFromLocale = (value, language) =>
  getLocalized(value, language)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const ServiceDetails = () => {
  const { serviceId } = useParams();
  const { language, t } = useContext(LanguageContext);
  const [service, setService] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([getServiceById(serviceId), getServices()])
      .then(([item, list]) => {
        if (!active) return;
        if (!item || item.enabled === false) {
          setError(t('serviceNotFound'));
          setService(null);
          setRelated([]);
          return;
        }
        setService(item);
        setRelated(
          list.filter(
            (s) =>
              s.enabled !== false &&
              s.id !== item.id &&
              s.categoryId === item.categoryId
          ).slice(0, 4)
        );
      })
      .catch(() => {
        if (active) setError(t('servicesLoadError'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [serviceId, t]);

  const steps = useMemo(
    () => (service ? linesFromLocale(service.steps, language) : []),
    [service, language]
  );
  const requirements = useMemo(
    () => (service ? linesFromLocale(service.requirements, language) : []),
    [service, language]
  );

  if (loading) return <Spinner />;

  if (error || !service) {
    return (
      <div className='service-details-page'>
        <div className='services-empty'>{error || t('serviceNotFound')}</div>
        <Link to='/services' className='service-back'>
          {t('backToServices')}
        </Link>
      </div>
    );
  }

  const meta = [
    { label: t('serviceType'), value: getLocalized(service.serviceType, language) },
    { label: t('serviceFees'), value: getLocalized(service.fees, language) },
    { label: t('serviceDuration'), value: getLocalized(service.duration, language) },
    { label: t('serviceOutput'), value: getLocalized(service.output, language) },
    {
      label: t('serviceAvailability'),
      value: getLocalized(service.availability, language),
    },
  ].filter((item) => item.value);

  return (
    <div className='service-details-page'>
      <div className='service-details-top'>
        <Link to='/services' className='service-back'>
          ← {t('backToServices')}
        </Link>
        <h1 dir='auto'>{getLocalized(service.title, language)}</h1>
      </div>

      <div className='service-details-layout'>
        <div className='service-details-main'>
          <section className='service-block'>
            <h2>{t('aboutService')}</h2>
            <p dir='auto' style={{ whiteSpace: 'pre-wrap' }}>
              {getLocalized(service.about, language) ||
                getLocalized(service.summary, language) ||
                '—'}
            </p>
          </section>

          {steps.length > 0 && (
            <section className='service-block'>
              <h2>{t('serviceSteps')}</h2>
              <ol>
                {steps.map((step) => (
                  <li key={step} dir='auto'>
                    {step}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {requirements.length > 0 && (
            <section className='service-block'>
              <h2>{t('serviceRequirements')}</h2>
              <ul>
                {requirements.map((item) => (
                  <li key={item} dir='auto'>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className='service-details-side'>
          <div className='service-side-card'>
            <h3>{t('serviceInfo')}</h3>
            {meta.length === 0 ? (
              <p className='muted'>—</p>
            ) : (
              <dl>
                {meta.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd dir='auto'>{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <button type='button' className='service-start-main' disabled>
              {t('startService')}
            </button>
            <p className='service-start-hint'>{t('startServiceSoon')}</p>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className='service-related'>
          <h2>{t('relatedServices')}</h2>
          <div className='services-grid'>
            {related.map((item) => (
              <article key={item.id} className='service-card'>
                <h2 dir='auto'>{getLocalized(item.title, language)}</h2>
                <div className='service-card-actions'>
                  <button type='button' className='service-start-btn' disabled>
                    {t('startService')}
                  </button>
                  <Link className='service-details-link' to={`/services/${item.id}`}>
                    {t('serviceDetails')}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ServiceDetails;

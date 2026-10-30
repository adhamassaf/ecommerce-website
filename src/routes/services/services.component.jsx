import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getServiceCategories,
  getServices,
} from '../../utils/firebase/firebase.utils.js';
import { getLocalized } from '../../utils/i18n.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

import './services.styles.scss';

const Services = () => {
  const { language, t } = useContext(LanguageContext);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getServiceCategories(), getServices()])
      .then(([cats, list]) => {
        if (!active) return;
        setCategories(cats);
        setServices(list.filter((s) => s.enabled !== false));
        if (cats.length) setActiveCategory(cats[0].id);
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
  }, [t]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return services.filter((service) => {
      const inCategory =
        activeCategory === 'all' || service.categoryId === activeCategory;
      if (!inCategory) return false;
      if (!term) return true;
      const title = getLocalized(service.title, language).toLowerCase();
      const summary = getLocalized(service.summary, language).toLowerCase();
      return title.includes(term) || summary.includes(term);
    });
  }, [services, activeCategory, query, language]);

  if (loading) return <Spinner />;

  return (
    <div className='services-page'>
      <header className='services-hero'>
        <h1>{t('servicesTitle')}</h1>
        <p>{t('servicesSubtitle')}</p>
      </header>

      <div className='services-toolbar'>
        <label className='services-search'>
          <span className='sr-only'>{t('search')}</span>
          <input
            type='search'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchServices')}
            dir='auto'
          />
        </label>
      </div>

      {error && <div className='services-empty'>{error}</div>}

      {!error && categories.length === 0 && (
        <div className='services-empty'>{t('noServicesYet')}</div>
      )}

      {categories.length > 0 && (
        <div className='services-tabs' role='tablist'>
          <button
            type='button'
            className={`services-tab${activeCategory === 'all' ? ' active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            {t('allServices')}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type='button'
              className={`services-tab${
                activeCategory === category.id ? ' active' : ''
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              {getLocalized(category.title, language)}
            </button>
          ))}
        </div>
      )}

      {!error && visible.length === 0 && categories.length > 0 && (
        <div className='services-empty'>{t('noServicesInFilter')}</div>
      )}

      <div className='services-grid'>
        {visible.map((service) => (
          <article key={service.id} className='service-card'>
            <div className='service-card-icon' aria-hidden='true'>
              <svg viewBox='0 0 24 24' width='36' height='36' fill='none' stroke='currentColor' strokeWidth='1.6'>
                <path d='M12 3l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z' />
                <path d='M9 12l2 2 4-4' />
              </svg>
            </div>
            <h2 dir='auto'>{getLocalized(service.title, language)}</h2>
            {getLocalized(service.summary, language) ? (
              <p dir='auto'>{getLocalized(service.summary, language)}</p>
            ) : null}
            <div className='service-card-actions'>
              <button type='button' className='service-start-btn' disabled>
                {t('startService')}
              </button>
              <Link className='service-details-link' to={`/services/${service.id}`}>
                {t('serviceDetails')}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Services;

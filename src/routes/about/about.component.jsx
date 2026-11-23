import { useContext, useEffect, useState } from 'react';

import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';
import PageCover from '../../components/page-cover/page-cover.component.jsx';

import { LanguageContext } from '../../contexts/language.context.jsx';
import { getAboutPage } from '../../utils/firebase/firebase.utils.js';
import { getLocalized, normalizeLocaleValue } from '../../utils/i18n.js';

import './about.styles.scss';

const emptyLocale = () => ({ en: '', ar: '' });

const About = () => {
  const { language, t, dir } = useContext(LanguageContext);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    let active = true;
    getAboutPage()
      .then((doc) => {
        if (!active) return;
        setData(doc || {});
        setActiveTab(0);
      })
      .catch(() => {
        if (active) setError(t('aboutLoadError'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  if (isLoading) return <Spinner />;
  if (error) return <StatusMessage message={error} />;

  const heroTitle = getLocalized(data?.heroTitle, language);
  const heroText = getLocalized(data?.heroText, language);
  const heroMediaUrl = data?.heroMediaUrl || '';
  const heroPoints = Array.isArray(data?.heroPoints) ? data.heroPoints : [];

  const directorTitle = getLocalized(data?.directorTitle, language);
  const directorName = getLocalized(data?.directorName, language);
  const directorText = getLocalized(data?.directorText, language);
  const directorImageUrl = data?.directorImageUrl || '';

  const orgTitle = getLocalized(data?.orgChartTitle, language);
  const orgImageUrl = data?.orgChartImageUrl || '';

  const valuesTitle = getLocalized(data?.valuesTitle, language);
  const valuesSubtitle = getLocalized(data?.valuesSubtitle, language);
  const values = Array.isArray(data?.values) ? data.values : [];

  const certificatesTitle = getLocalized(data?.certificatesTitle, language);
  const certificates = Array.isArray(data?.certificates) ? data.certificates : [];

  const policyTabs = Array.isArray(data?.policyTabs) ? data.policyTabs : [];
  const partnersTitle = getLocalized(data?.partnersTitle, language);
  const partners = Array.isArray(data?.partners) ? data.partners : [];

  const hasContent =
    heroTitle ||
    directorTitle ||
    values.length ||
    certificates.length ||
    policyTabs.length ||
    partners.length ||
    orgImageUrl;

  const coverTitle = data?.coverTitle || { en: 'About us', ar: 'من نحن' };
  const coverImageUrl = data?.coverImageUrl || '';

  return (
    <div className='about-page' dir={dir}>
      <PageCover
        title={coverTitle}
        imageUrl={coverImageUrl}
        breadcrumbs={[
          { label: t('home'), to: '/' },
          { label: coverTitle },
        ]}
      />

      <div className='about-page-body'>
      {!hasContent && (
        <div className='about-empty'>
          <p>{t('aboutEmpty')}</p>
        </div>
      )}

      {(heroTitle || heroText || heroMediaUrl || heroPoints.length > 0) && (
        <section className='about-section about-hero'>
          <div className='about-hero-text'>
            {heroTitle && <h1>{heroTitle}</h1>}
            {heroText && <p className='about-lead'>{heroText}</p>}
            {heroPoints.length > 0 && (
              <ul className='about-hero-points'>
                {heroPoints.map((point, idx) => (
                  <li key={idx}>
                    <span className='about-point-icon' aria-hidden>
                      {point.iconUrl ? (
                        <img src={point.iconUrl} alt='' />
                      ) : (
                        '◆'
                      )}
                    </span>
                    <span>{getLocalized(point.title, language)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {heroMediaUrl && (
            <div className='about-hero-media'>
              {/\.(mp4|webm)$/i.test(heroMediaUrl) ? (
                <video src={heroMediaUrl} controls playsInline />
              ) : (
                <img src={heroMediaUrl} alt={heroTitle || t('aboutUs')} />
              )}
            </div>
          )}
        </section>
      )}

      {(directorTitle || directorText || directorImageUrl) && (
        <section className='about-section about-director'>
          {directorImageUrl && (
            <div className='about-director-photo'>
              <img src={directorImageUrl} alt={directorName || directorTitle} />
            </div>
          )}
          <div className='about-director-body'>
            {directorTitle && <h2>{directorTitle}</h2>}
            {directorText && (
              <p className='about-director-text'>{directorText}</p>
            )}
            {directorName && (
              <p className='about-director-name'>{directorName}</p>
            )}
          </div>
        </section>
      )}

      {(orgTitle || orgImageUrl) && (
        <section className='about-section about-org'>
          {orgTitle && <h2 className='about-section-title'>{orgTitle}</h2>}
          {orgImageUrl && (
            <div className='about-org-image'>
              <img src={orgImageUrl} alt={orgTitle || t('aboutOrgChart')} />
            </div>
          )}
        </section>
      )}

      {values.length > 0 && (
        <section className='about-section about-values'>
          {valuesTitle && <h2 className='about-section-title'>{valuesTitle}</h2>}
          {valuesSubtitle && (
            <p className='about-section-subtitle'>{valuesSubtitle}</p>
          )}
          <div className='about-values-grid'>
            {values.map((item, idx) => (
              <div className='about-value-card' key={idx}>
                <div className='about-value-icon'>
                  {item.iconUrl ? (
                    <img src={item.iconUrl} alt='' />
                  ) : (
                    <span>{String(idx + 1).padStart(2, '0')}</span>
                  )}
                </div>
                <h3>{getLocalized(item.title, language)}</h3>
                {getLocalized(item.description, language) && (
                  <p>{getLocalized(item.description, language)}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {certificates.length > 0 && (
        <section className='about-section about-certificates'>
          {certificatesTitle && (
            <h2 className='about-section-title'>{certificatesTitle}</h2>
          )}
          <div className='about-certs-grid'>
            {certificates.map((item, idx) => (
              <article className='about-cert-card' key={idx}>
                {item.imageUrl && (
                  <div className='about-cert-image'>
                    <img
                      src={item.imageUrl}
                      alt={getLocalized(item.title, language)}
                    />
                  </div>
                )}
                <div className='about-cert-body'>
                  {item.date && <span className='about-cert-date'>{item.date}</span>}
                  <h3>{getLocalized(item.title, language)}</h3>
                  {item.link && (
                    <a href={item.link} target='_blank' rel='noreferrer'>
                      {t('readMore')}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {policyTabs.length > 0 && (
        <section className='about-section about-policies'>
          <div className='about-tabs'>
            {policyTabs.map((tab, idx) => (
              <button
                key={idx}
                type='button'
                className={`about-tab${activeTab === idx ? ' active' : ''}`}
                onClick={() => setActiveTab(idx)}
              >
                {getLocalized(tab.title, language)}
              </button>
            ))}
          </div>
          <div className='about-tab-panel'>
            <h3>{getLocalized(policyTabs[activeTab]?.title, language)}</h3>
            <div className='about-tab-body'>
              {getLocalized(policyTabs[activeTab]?.body, language)
                .split('\n')
                .filter(Boolean)
                .map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
            </div>
          </div>
        </section>
      )}

      {partners.length > 0 && (
        <section className='about-section about-partners'>
          {partnersTitle && (
            <h2 className='about-section-title'>{partnersTitle}</h2>
          )}
          <div className='about-partners-row'>
            {partners.map((item, idx) => {
              const name = getLocalized(item.name, language);
              const content = item.logoUrl ? (
                <img src={item.logoUrl} alt={name} />
              ) : (
                <span>{name}</span>
              );
              return item.link ? (
                <a
                  className='about-partner'
                  key={idx}
                  href={item.link}
                  target='_blank'
                  rel='noreferrer'
                >
                  {content}
                </a>
              ) : (
                <div className='about-partner' key={idx}>
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      )}
      </div>
    </div>
  );
};

export default About;

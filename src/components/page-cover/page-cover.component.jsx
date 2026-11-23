import { useContext } from 'react';
import { Link } from 'react-router-dom';

import { LanguageContext } from '../../contexts/language.context.jsx';
import { getLocalized } from '../../utils/i18n.js';

import './page-cover.styles.scss';

const PageCover = ({
  title,
  imageUrl = '',
  breadcrumbs = [],
  height = 'medium',
}) => {
  const { language, t, dir } = useContext(LanguageContext);
  const resolvedTitle =
    typeof title === 'string' ? title : getLocalized(title, language);

  return (
    <header
      className={`page-cover page-cover--${height}${imageUrl ? ' has-image' : ''}`}
      dir={dir}
      style={
        imageUrl
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(250,247,242,0.82) 0%, rgba(250,247,242,0.92) 100%), url(${imageUrl})`,
            }
          : undefined
      }
    >
      <div className='page-cover-inner'>
        {breadcrumbs.length > 0 && (
          <nav className='page-cover-breadcrumb' aria-label='breadcrumb'>
            {breadcrumbs.map((crumb, index) => {
              const label =
                typeof crumb.label === 'string'
                  ? crumb.label
                  : getLocalized(crumb.label, language);
              const isLast = index === breadcrumbs.length - 1;
              return (
                <span key={index} className='page-cover-crumb'>
                  {index > 0 && <span className='page-cover-sep'>/</span>}
                  {crumb.to && !isLast ? (
                    <Link to={crumb.to}>{label}</Link>
                  ) : (
                    <span className={isLast ? 'is-current' : undefined}>
                      {label}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>
        )}
        {resolvedTitle ? <h1 className='page-cover-title'>{resolvedTitle}</h1> : null}
      </div>
    </header>
  );
};

export default PageCover;

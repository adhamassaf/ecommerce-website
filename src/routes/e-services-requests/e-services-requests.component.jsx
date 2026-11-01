import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Spinner from '../../components/spinner/spinner.component.jsx';
import { UserContext } from '../../contexts/user.context.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';
import { getUserServiceApplications } from '../../utils/firebase/firebase.utils.js';
import { getLocalized } from '../../utils/i18n.js';

const formatDate = (date) => {
  if (!date) return '-';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const EServicesRequests = () => {
  const { currentUser } = useContext(UserContext);
  const { language, t } = useContext(LanguageContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!currentUser?.uid) return undefined;
    getUserServiceApplications(currentUser.uid)
      .then((docs) => {
        if (active) setItems(docs);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser]);

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className='eservices-page-title'>{t('myServiceRequests')}</h1>

      {items.length === 0 ? (
        <div className='eservices-empty'>
          <p>{t('noServiceRequests')}</p>
          <Link to='/services'>{t('browseServices')}</Link>
        </div>
      ) : (
        <div className='eservices-card'>
          <table className='eservices-table'>
            <thead>
              <tr>
                <th>{t('serviceName')}</th>
                <th>{t('status')}</th>
                <th>{t('date')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td dir='auto'>
                    {typeof item.serviceTitle === 'object'
                      ? getLocalized(item.serviceTitle, language)
                      : item.serviceTitle || item.serviceId}
                  </td>
                  <td>
                    <span
                      className={`eservices-status ${
                        item.status === 'submitted'
                          ? 'submitted'
                          : item.status === 'in_progress'
                            ? 'submitted'
                            : 'draft'
                      }`}
                    >
                      {item.status === 'submitted'
                        ? t('applicationSubmitted')
                        : item.status === 'in_progress'
                          ? t('applicationInProgress')
                          : t('applicationDraft')}
                    </span>
                  </td>
                  <td dir='ltr'>{formatDate(item.createdAt)}</td>
                  <td>
                    <Link to={`/e-services/apply/${item.serviceId}?app=${item.id}`}>
                      {item.status === 'submitted' ? t('view') : t('continue')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EServicesRequests;

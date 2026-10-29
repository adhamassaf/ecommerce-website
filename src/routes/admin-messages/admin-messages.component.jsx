import { Fragment, useContext, useEffect, useMemo, useState } from 'react';

import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
} from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

const AdminMessages = () => {
  const { language, t } = useContext(LanguageContext);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let active = true;

    getContactMessages()
      .then((docs) => {
        if (active) setMessages(docs);
      })
      .catch((err) => {
        if (active) setErrorMessage(getAdminErrorMessage(err));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      all: messages.length,
      new: messages.filter((item) => item.status === 'new').length,
      read: messages.filter((item) => item.status === 'read').length,
    }),
    [messages]
  );

  const visible = useMemo(() => {
    if (statusFilter === 'new') return messages.filter((m) => m.status === 'new');
    if (statusFilter === 'read') return messages.filter((m) => m.status === 'read');
    return messages;
  }, [messages, statusFilter]);

  const handleMark = async (message, status) => {
    setBusyId(message.id);
    setFeedback(null);
    try {
      await updateContactMessageStatus(message.id, status);
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id ? { ...item, status } : item
        )
      );
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async (message) => {
    const ok = window.confirm(t('contactDeleteConfirm'));
    if (!ok) return;

    setBusyId(message.id);
    setFeedback(null);
    try {
      await deleteContactMessage(message.id);
      setMessages((current) => current.filter((item) => item.id !== message.id));
      if (expandedId === message.id) setExpandedId('');
      setFeedback({ type: 'success', text: t('contactDeleted') });
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    } finally {
      setBusyId('');
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1 className='admin-title'>{t('adminMessages')}</h1>

      {(errorMessage || feedback) && (
        <div
          className={`admin-alert ${
            errorMessage || (feedback && feedback.type === 'error')
              ? 'error'
              : 'success'
          }`}
          role='alert'
        >
          {errorMessage || (feedback && feedback.text)}
        </div>
      )}

      <div className='admin-toolbar' style={{ gap: 10, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: t('filterAllUsers'), count: counts.all },
          { id: 'new', label: t('contactStatusNew'), count: counts.new },
          { id: 'read', label: t('contactStatusRead'), count: counts.read },
        ].map((filter) => (
          <button
            key={filter.id}
            type='button'
            className={`admin-button${
              statusFilter === filter.id ? '' : ' secondary'
            }`}
            onClick={() => setStatusFilter(filter.id)}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      <p className='admin-meta'>
        {visible.length} {t('contactMessagesCount')}
      </p>

      {visible.length === 0 ? (
        <div className='admin-empty'>{t('contactNoMessages')}</div>
      ) : (
        <div className='admin-table-wrapper'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>{t('colName')}</th>
                <th>{t('colEmail')}</th>
                <th>{t('contactSubject')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('date')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((message) => (
                <Fragment key={message.id}>
                  <tr>
                    <td dir='auto'>{message.name}</td>
                    <td dir='ltr'>{message.email}</td>
                    <td dir='auto'>{message.subject}</td>
                    <td>
                      <span
                        className={`admin-status-badge ${
                          message.status === 'new' ? 'is-new' : 'is-read'
                        }`}
                      >
                        {message.status === 'new'
                          ? t('contactStatusNew')
                          : t('contactStatusRead')}
                      </span>
                    </td>
                    <td dir='ltr'>
                      {message.createdAt
                        ? message.createdAt.toLocaleString(
                            language === 'ar' ? 'ar' : 'en-GB',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )
                        : '-'}
                    </td>
                    <td>
                      <div className='admin-actions'>
                        <button
                          type='button'
                          className='admin-link-button'
                          onClick={() =>
                            setExpandedId((current) =>
                              current === message.id ? '' : message.id
                            )
                          }
                        >
                          {expandedId === message.id ? t('hide') : t('view')}
                        </button>
                        {message.status === 'new' ? (
                          <button
                            type='button'
                            className='admin-link-button'
                            disabled={busyId === message.id}
                            onClick={() => handleMark(message, 'read')}
                          >
                            {t('contactMarkRead')}
                          </button>
                        ) : (
                          <button
                            type='button'
                            className='admin-link-button'
                            disabled={busyId === message.id}
                            onClick={() => handleMark(message, 'new')}
                          >
                            {t('contactMarkNew')}
                          </button>
                        )}
                        <button
                          type='button'
                          className='admin-link-button danger'
                          disabled={busyId === message.id}
                          onClick={() => handleDelete(message)}
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === message.id && (
                    <tr className='admin-order-details-row'>
                      <td colSpan={6}>
                        <div className='admin-order-details'>
                          <div>
                            <h3>{t('contactMessage')}</h3>
                            <p dir='auto' style={{ whiteSpace: 'pre-wrap' }}>
                              {message.message}
                            </p>
                          </div>
                          <div>
                            <h3>{t('contactPhone')}</h3>
                            <p dir='ltr'>{message.phone || '-'}</p>
                          </div>
                          {Array.isArray(message.customValues) &&
                            message.customValues.length > 0 && (
                              <div className='admin-form-wide'>
                                <h3>{t('customFieldsTitle')}</h3>
                                <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                                  {message.customValues.map((item) => (
                                    <li key={item.id || item.label} dir='auto'>
                                      <strong>{item.label || '-'}: </strong>
                                      <span>{item.value || '-'}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;

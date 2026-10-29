import { Fragment, useContext, useEffect, useMemo, useState } from 'react';

import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  saveContactReply,
} from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';
import {
  isEmailJsConfigured,
  sendContactReplyEmail,
} from '../../utils/emailjs.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

import './admin-messages.styles.scss';

const FILTERS = [
  { id: 'all', labelKey: 'filterAllUsers', countKey: 'all' },
  { id: 'new', labelKey: 'contactStatusNew', countKey: 'new' },
  { id: 'read', labelKey: 'contactStatusRead', countKey: 'read' },
  { id: 'replied', labelKey: 'contactStatusReplied', countKey: 'replied' },
];

const formatMessageDate = (date) => {
  if (!date) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) +
    ' ' +
    date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
};

const AdminMessages = () => {
  const { t } = useContext(LanguageContext);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState('');
  const [busyId, setBusyId] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});

  useEffect(() => {
    if (!feedback || feedback.type === 'error') return undefined;
    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

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
      replied: messages.filter((item) => item.status === 'replied').length,
    }),
    [messages]
  );

  const visible = useMemo(() => {
    if (statusFilter === 'new') return messages.filter((m) => m.status === 'new');
    if (statusFilter === 'read') return messages.filter((m) => m.status === 'read');
    if (statusFilter === 'replied')
      return messages.filter((m) => m.status === 'replied');
    return messages;
  }, [messages, statusFilter]);

  const statusLabel = (status) => {
    if (status === 'read') return t('contactStatusRead');
    if (status === 'replied') return t('contactStatusReplied');
    return t('contactStatusNew');
  };

  const statusClass = (status) => {
    if (status === 'read') return 'is-read';
    if (status === 'replied') return 'is-replied';
    return 'is-new';
  };

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

  const handleSendReply = async (message) => {
    const replyText = (replyDrafts[message.id] || message.replyText || '').trim();
    if (!replyText) {
      setFeedback({ type: 'error', text: t('contactReplyRequired') });
      return;
    }

    if (!isEmailJsConfigured()) {
      setFeedback({ type: 'error', text: t('contactEmailJsMissing') });
      return;
    }

    setBusyId(message.id);
    setFeedback(null);

    try {
      await sendContactReplyEmail({
        toEmail: message.email,
        toName: message.name,
        subject: message.subject,
        originalMessage: message.message,
        replyText,
      });

      await saveContactReply(message.id, replyText);

      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? {
                ...item,
                status: 'replied',
                replyText,
                repliedAt: new Date(),
              }
            : item
        )
      );
      setReplyDrafts((current) => ({ ...current, [message.id]: replyText }));
      setExpandedId('');
      setFeedback({ type: 'success', text: t('contactReplySent') });
    } catch (err) {
      if (
        err?.code === 'emailjs-not-configured' ||
        err?.message === 'emailjs-not-configured'
      ) {
        setFeedback({ type: 'error', text: t('contactEmailJsMissing') });
      } else {
        const detail = err?.message || '';
        setFeedback({
          type: 'error',
          text: detail
            ? `${t('contactReplyFailed')} (${detail})`
            : t('contactReplyFailed'),
        });
      }
    } finally {
      setBusyId('');
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className='admin-messages-page'>
      <h1 className='admin-title'>{t('adminMessages')}</h1>

      {!isEmailJsConfigured() && (
        <div className='admin-alert' role='status'>
          {t('contactEmailJsHint')}
        </div>
      )}

      {errorMessage && (
        <div className='admin-alert error' role='alert'>
          {errorMessage}
        </div>
      )}

      {feedback && (
        <div
          className={`admin-alert${feedback.type === 'error' ? ' error' : ''}`}
          role='status'
        >
          {feedback.text}
        </div>
      )}

      {!errorMessage && messages.length === 0 && (
        <div className='admin-empty'>{t('contactNoMessages')}</div>
      )}

      {messages.length > 0 && (
        <>
          <div className='admin-messages-filters' role='tablist'>
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type='button'
                role='tab'
                aria-selected={statusFilter === filter.id}
                className={`admin-messages-filter${
                  statusFilter === filter.id ? ' active' : ''
                }`}
                onClick={() => setStatusFilter(filter.id)}
              >
                <span>{t(filter.labelKey)}</span>
                <em>{counts[filter.countKey]}</em>
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
                    <th>{t('contactName')}</th>
                    <th>{t('contactEmail')}</th>
                    <th>{t('contactSubject')}</th>
                    <th>{t('colJoined')}</th>
                    <th>{t('colRole')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((message) => (
                    <Fragment key={message.id}>
                      <tr>
                        <td dir='auto'>{message.name || '-'}</td>
                        <td dir='ltr'>{message.email || '-'}</td>
                        <td dir='auto'>{message.subject || '-'}</td>
                        <td dir='ltr'>{formatMessageDate(message.createdAt)}</td>
                        <td>
                          <span
                            className={`admin-message-status ${statusClass(
                              message.status
                            )}`}
                          >
                            {statusLabel(message.status)}
                          </span>
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
                              {expandedId === message.id
                                ? t('hide')
                                : t('view')}
                            </button>
                            {message.status === 'new' && (
                              <button
                                type='button'
                                className='admin-link-button'
                                disabled={busyId === message.id}
                                onClick={() => handleMark(message, 'read')}
                              >
                                {t('contactMarkRead')}
                              </button>
                            )}
                            {message.status === 'read' && (
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
                            <div className='admin-message-details'>
                              <div>
                                <h3>{t('contactMessage')}</h3>
                                <p
                                  dir='auto'
                                  style={{ whiteSpace: 'pre-wrap', margin: 0 }}
                                >
                                  {message.message}
                                </p>
                              </div>
                              <div>
                                <h3>{t('contactPhone')}</h3>
                                <p dir='ltr' style={{ margin: 0 }}>
                                  {message.phone || '-'}
                                </p>
                              </div>
                              {Array.isArray(message.customValues) &&
                                message.customValues.length > 0 && (
                                  <div>
                                    <h3>{t('customFieldsTitle')}</h3>
                                    <ul
                                      style={{
                                        margin: 0,
                                        paddingInlineStart: 18,
                                      }}
                                    >
                                      {message.customValues.map((item) => (
                                        <li
                                          key={item.id || item.label}
                                          dir='auto'
                                        >
                                          <strong>{item.label || '-'}: </strong>
                                          <span>{item.value || '-'}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                              <div>
                                <h3>{t('contactReplyTitle')}</h3>
                                {message.replyText ? (
                                  <p className='admin-meta'>
                                    {t('contactLastReply')}
                                  </p>
                                ) : null}
                                <textarea
                                  className='admin-field-control'
                                  rows={5}
                                  dir='auto'
                                  value={
                                    replyDrafts[message.id] !== undefined
                                      ? replyDrafts[message.id]
                                      : message.replyText || ''
                                  }
                                  onChange={(event) =>
                                    setReplyDrafts((current) => ({
                                      ...current,
                                      [message.id]: event.target.value,
                                    }))
                                  }
                                  placeholder={t('contactReplyPlaceholder')}
                                />
                                <div className='admin-form-actions'>
                                  <button
                                    type='button'
                                    className='admin-button'
                                    disabled={busyId === message.id}
                                    onClick={() => handleSendReply(message)}
                                  >
                                    {busyId === message.id
                                      ? t('contactSendingReply')
                                      : t('contactSendReply')}
                                  </button>
                                </div>
                              </div>
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
        </>
      )}
    </div>
  );
};

export default AdminMessages;

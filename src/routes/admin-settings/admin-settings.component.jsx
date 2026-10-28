import { useContext, useEffect, useState } from 'react';

import AdminField from '../../components/admin-field/admin-field.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getSiteSettings,
  saveSiteSettings,
} from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';
import { getLocalized, normalizeLocaleValue } from '../../utils/i18n.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

const AdminSettings = () => {
  const { language, t } = useContext(LanguageContext);
  const [settings, setSettings] = useState({
    announcementEnabled: false,
    announcementText: { en: '', ar: '' },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let isActive = true;

    getSiteSettings()
      .then((data) => {
        if (!isActive) return;

        setSettings({
          announcementEnabled: Boolean(data.announcementEnabled),
          announcementText: normalizeLocaleValue(data.announcementText),
        });
      })
      .catch((err) => {
        if (isActive) {
          setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) return <Spinner />;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const announcementText = normalizeLocaleValue(settings.announcementText);
    const hasText =
      announcementText.en.trim() || announcementText.ar.trim();

    if (settings.announcementEnabled && !hasText) {
      setFeedback({
        type: 'error',
        text: 'اكتب نص الإعلان أو أوقف عرضه.',
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await saveSiteSettings({
        announcementEnabled: settings.announcementEnabled,
        announcementText: {
          en: announcementText.en.trim(),
          ar: announcementText.ar.trim() || announcementText.en.trim(),
        },
      });
      setSettings((previous) => ({
        ...previous,
        announcementText: {
          en: announcementText.en.trim(),
          ar: announcementText.ar.trim() || announcementText.en.trim(),
        },
      }));
      setFeedback({ type: 'success', text: 'تم حفظ الإعدادات.' });
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1 className='admin-title'>{t('siteSettings')}</h1>

      {feedback && (
        <div className={`admin-alert ${feedback.type}`} role='alert'>
          {feedback.text}
        </div>
      )}

      <form className='admin-panel admin-form' onSubmit={handleSubmit}>
        <h2 className='admin-panel-title admin-form-wide'>{t('announcementBar')}</h2>
        <label className='admin-checkbox admin-form-wide'>
          <input
            type='checkbox'
            checked={settings.announcementEnabled}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                announcementEnabled: event.target.checked,
              }))
            }
          />
          <span>{t('showAnnouncement')}</span>
        </label>
        <div className='admin-form-wide'>
          <AdminField
            as='textarea'
            label={t('announcementTextEn')}
            dir='ltr'
            maxLength={160}
            value={settings.announcementText?.en || ''}
            localeValue={settings.announcementText}
            translatable
            onLocaleChange={(next) =>
              setSettings((previous) => ({
                ...previous,
                announcementText: next,
              }))
            }
            onChange={() => {}}
            hint={t('announcementGlobeHint')}
          />
        </div>
        {(settings.announcementText?.en || settings.announcementText?.ar) && (
          <div className='admin-form-wide'>
            <p className='admin-meta'>{t('preview')}</p>
            <div className='admin-announcement-preview' dir='auto'>
              {getLocalized(settings.announcementText, language)}
            </div>
          </div>
        )}
        <div className='admin-form-actions'>
          <button className='admin-button' type='submit' disabled={isSaving}>
            {isSaving ? t('saving') : t('saveSettings')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;

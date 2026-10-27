import { useEffect, useState } from 'react';

import AdminField from '../../components/admin-field/admin-field.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getSiteSettings,
  saveSiteSettings,
} from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    announcementEnabled: false,
    announcementText: '',
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
          announcementText: data.announcementText || '',
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

    const announcementText = settings.announcementText.trim();

    if (settings.announcementEnabled && !announcementText) {
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
        announcementText,
      });
      setSettings((previous) => ({ ...previous, announcementText }));
      setFeedback({ type: 'success', text: 'تم حفظ الإعدادات.' });
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1 className='admin-title'>إعدادات الموقع</h1>

      {feedback && (
        <div className={`admin-alert ${feedback.type}`} role='alert'>
          {feedback.text}
        </div>
      )}

      <form className='admin-panel admin-form' onSubmit={handleSubmit}>
        <h2 className='admin-panel-title admin-form-wide'>شريط الإعلان</h2>
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
          <span>عرض الشريط أعلى كل صفحات المتجر</span>
        </label>
        <div className='admin-form-wide'>
          <AdminField
            as='textarea'
            label='نص الإعلان'
            dir='auto'
            maxLength={160}
            value={settings.announcementText}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                announcementText: event.target.value,
              }))
            }
            hint='حتى 160 حرفاً.'
          />
        </div>
        {settings.announcementText.trim() && (
          <div className='admin-form-wide'>
            <p className='admin-meta'>معاينة</p>
            <div className='announcement-bar' dir='auto'>
              {settings.announcementText.trim()}
            </div>
          </div>
        )}
        <div className='admin-form-actions'>
          <button className='admin-button' type='submit' disabled={isSaving}>
            {isSaving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;

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
    contactTitle: { en: '', ar: '' },
    contactStoreName: { en: '', ar: '' },
    contactAddress: { en: '', ar: '' },
    contactEmail: '',
    contactPhone: '',
    contactMapLat: '',
    contactMapLng: '',
    contactMapZoom: '14',
    contactMapQuery: '',
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
          contactTitle: normalizeLocaleValue(data.contactTitle),
          contactStoreName: normalizeLocaleValue(data.contactStoreName),
          contactAddress: normalizeLocaleValue(data.contactAddress),
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          contactMapLat:
            data.contactMapLat != null ? String(data.contactMapLat) : '',
          contactMapLng:
            data.contactMapLng != null ? String(data.contactMapLng) : '',
          contactMapZoom:
            data.contactMapZoom != null ? String(data.contactMapZoom) : '14',
          contactMapQuery: data.contactMapQuery || '',
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
        text: t('announcementRequired'),
      });
      return;
    }

    const contactTitle = normalizeLocaleValue(settings.contactTitle);
    const contactStoreName = normalizeLocaleValue(settings.contactStoreName);
    const contactAddress = normalizeLocaleValue(settings.contactAddress);

    const latRaw = settings.contactMapLat.trim();
    const lngRaw = settings.contactMapLng.trim();
    const zoomRaw = settings.contactMapZoom.trim();

    let contactMapLat = null;
    let contactMapLng = null;
    let contactMapZoom = 14;

    if (latRaw || lngRaw) {
      contactMapLat = Number(latRaw);
      contactMapLng = Number(lngRaw);
      if (!Number.isFinite(contactMapLat) || !Number.isFinite(contactMapLng)) {
        setFeedback({ type: 'error', text: t('contactMapCoordsInvalid') });
        return;
      }
    }

    if (zoomRaw) {
      contactMapZoom = Number(zoomRaw);
      if (!Number.isFinite(contactMapZoom) || contactMapZoom < 1 || contactMapZoom > 20) {
        setFeedback({ type: 'error', text: t('contactMapZoomInvalid') });
        return;
      }
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
        contactTitle: {
          en: contactTitle.en.trim(),
          ar: contactTitle.ar.trim() || contactTitle.en.trim(),
        },
        contactStoreName: {
          en: contactStoreName.en.trim(),
          ar: contactStoreName.ar.trim() || contactStoreName.en.trim(),
        },
        contactAddress: {
          en: contactAddress.en.trim(),
          ar: contactAddress.ar.trim() || contactAddress.en.trim(),
        },
        contactEmail: settings.contactEmail.trim(),
        contactPhone: settings.contactPhone.trim(),
        contactMapLat,
        contactMapLng,
        contactMapZoom,
        contactMapQuery: settings.contactMapQuery.trim(),
      });

      setFeedback({ type: 'success', text: t('settingsSaved') });
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

        <h2 className='admin-panel-title admin-form-wide'>{t('contactSettingsTitle')}</h2>
        <AdminField
          label={t('contactTitleField')}
          type='text'
          dir='ltr'
          value={settings.contactTitle?.en || ''}
          localeValue={settings.contactTitle}
          translatable
          onLocaleChange={(next) =>
            setSettings((previous) => ({ ...previous, contactTitle: next }))
          }
          onChange={() => {}}
          hint={t('pressGlobeHint')}
        />
        <AdminField
          label={t('contactStoreNameField')}
          type='text'
          dir='ltr'
          value={settings.contactStoreName?.en || ''}
          localeValue={settings.contactStoreName}
          translatable
          onLocaleChange={(next) =>
            setSettings((previous) => ({ ...previous, contactStoreName: next }))
          }
          onChange={() => {}}
          hint={t('pressGlobeHint')}
        />
        <div className='admin-form-wide'>
          <AdminField
            as='textarea'
            label={t('contactAddressField')}
            dir='ltr'
            value={settings.contactAddress?.en || ''}
            localeValue={settings.contactAddress}
            translatable
            onLocaleChange={(next) =>
              setSettings((previous) => ({ ...previous, contactAddress: next }))
            }
            onChange={() => {}}
            hint={t('pressGlobeHint')}
          />
        </div>
        <AdminField
          label={t('contactEmailLabel')}
          type='email'
          dir='ltr'
          value={settings.contactEmail}
          onChange={(event) =>
            setSettings((previous) => ({
              ...previous,
              contactEmail: event.target.value,
            }))
          }
        />
        <AdminField
          label={t('contactPhoneLabel')}
          type='text'
          dir='ltr'
          value={settings.contactPhone}
          onChange={(event) =>
            setSettings((previous) => ({
              ...previous,
              contactPhone: event.target.value,
            }))
          }
        />
        <AdminField
          label={t('contactMapLat')}
          type='text'
          dir='ltr'
          value={settings.contactMapLat}
          onChange={(event) =>
            setSettings((previous) => ({
              ...previous,
              contactMapLat: event.target.value,
            }))
          }
          hint={t('contactMapCoordsHint')}
        />
        <AdminField
          label={t('contactMapLng')}
          type='text'
          dir='ltr'
          value={settings.contactMapLng}
          onChange={(event) =>
            setSettings((previous) => ({
              ...previous,
              contactMapLng: event.target.value,
            }))
          }
        />
        <AdminField
          label={t('contactMapZoom')}
          type='number'
          min='1'
          max='20'
          value={settings.contactMapZoom}
          onChange={(event) =>
            setSettings((previous) => ({
              ...previous,
              contactMapZoom: event.target.value,
            }))
          }
        />
        <div className='admin-form-wide'>
          <AdminField
            label={t('contactMapQuery')}
            type='text'
            dir='ltr'
            value={settings.contactMapQuery}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                contactMapQuery: event.target.value,
              }))
            }
            hint={t('contactMapQueryHint')}
          />
        </div>

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

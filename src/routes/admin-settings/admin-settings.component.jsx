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

const FIELD_TYPES = ['text', 'textarea', 'select'];

const createFieldId = () =>
  `cf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const emptyField = () => ({
  id: createFieldId(),
  type: 'text',
  label: { en: '', ar: '' },
  required: false,
  options: [],
});

const normalizeCustomFields = (raw) => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const type = FIELD_TYPES.includes(item.type) ? item.type : 'text';
      const options = Array.isArray(item.options)
        ? item.options
            .map((opt) => normalizeLocaleValue(opt))
            .filter((opt) => opt.en.trim() || opt.ar.trim())
            .slice(0, 20)
        : [];

      return {
        id: item.id || createFieldId(),
        type,
        label: normalizeLocaleValue(item.label),
        required: Boolean(item.required),
        options: type === 'select' ? options : [],
      };
    })
    .slice(0, 20);
};

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
    contactShowMap: true,
    contactShowStoreInfo: true,
    contactShowPhone: true,
    contactCustomFields: [],
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
          contactShowMap: data.contactShowMap !== false,
          contactShowStoreInfo: data.contactShowStoreInfo !== false,
          contactShowPhone: data.contactShowPhone !== false,
          contactCustomFields: normalizeCustomFields(data.contactCustomFields),
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

  const updateCustomField = (id, patch) => {
    setSettings((previous) => ({
      ...previous,
      contactCustomFields: previous.contactCustomFields.map((field) =>
        field.id === id ? { ...field, ...patch } : field
      ),
    }));
  };

  const moveCustomField = (index, direction) => {
    setSettings((previous) => {
      const list = [...previous.contactCustomFields];
      const target = index + direction;
      if (target < 0 || target >= list.length) return previous;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      return { ...previous, contactCustomFields: list };
    });
  };

  const removeCustomField = (id) => {
    setSettings((previous) => ({
      ...previous,
      contactCustomFields: previous.contactCustomFields.filter(
        (field) => field.id !== id
      ),
    }));
  };

  const addCustomField = () => {
    setSettings((previous) => {
      if (previous.contactCustomFields.length >= 20) return previous;
      return {
        ...previous,
        contactCustomFields: [...previous.contactCustomFields, emptyField()],
      };
    });
  };

  const addOption = (fieldId) => {
    setSettings((previous) => ({
      ...previous,
      contactCustomFields: previous.contactCustomFields.map((field) => {
        if (field.id !== fieldId) return field;
        if (field.options.length >= 20) return field;
        return {
          ...field,
          options: [...field.options, { en: '', ar: '' }],
        };
      }),
    }));
  };

  const updateOption = (fieldId, optionIndex, localeValue) => {
    setSettings((previous) => ({
      ...previous,
      contactCustomFields: previous.contactCustomFields.map((field) => {
        if (field.id !== fieldId) return field;
        const options = field.options.map((opt, index) =>
          index === optionIndex ? localeValue : opt
        );
        return { ...field, options };
      }),
    }));
  };

  const removeOption = (fieldId, optionIndex) => {
    setSettings((previous) => ({
      ...previous,
      contactCustomFields: previous.contactCustomFields.map((field) => {
        if (field.id !== fieldId) return field;
        return {
          ...field,
          options: field.options.filter((_, index) => index !== optionIndex),
        };
      }),
    }));
  };

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
      if (
        !Number.isFinite(contactMapZoom) ||
        contactMapZoom < 1 ||
        contactMapZoom > 20
      ) {
        setFeedback({ type: 'error', text: t('contactMapZoomInvalid') });
        return;
      }
    }

    const contactCustomFields = [];
    for (const field of settings.contactCustomFields) {
      const label = normalizeLocaleValue(field.label);
      if (!label.en.trim() && !label.ar.trim()) {
        setFeedback({ type: 'error', text: t('customFieldLabelRequired') });
        return;
      }

      const normalized = {
        id: field.id,
        type: FIELD_TYPES.includes(field.type) ? field.type : 'text',
        label: {
          en: label.en.trim(),
          ar: label.ar.trim() || label.en.trim(),
        },
        required: Boolean(field.required),
        options: [],
      };

      if (normalized.type === 'select') {
        const options = (field.options || [])
          .map((opt) => normalizeLocaleValue(opt))
          .map((opt) => ({
            en: opt.en.trim(),
            ar: opt.ar.trim() || opt.en.trim(),
          }))
          .filter((opt) => opt.en);

        if (options.length < 1) {
          setFeedback({ type: 'error', text: t('customFieldOptionsRequired') });
          return;
        }
        normalized.options = options;
      }

      contactCustomFields.push(normalized);
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
        contactShowMap: Boolean(settings.contactShowMap),
        contactShowStoreInfo: Boolean(settings.contactShowStoreInfo),
        contactShowPhone: Boolean(settings.contactShowPhone),
        contactCustomFields,
      });

      setSettings((previous) => ({
        ...previous,
        contactCustomFields,
      }));
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
        <label className='admin-checkbox admin-form-wide'>
          <input
            type='checkbox'
            checked={settings.contactShowStoreInfo}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                contactShowStoreInfo: event.target.checked,
              }))
            }
          />
          <span>{t('contactShowStoreInfo')}</span>
        </label>
        <label className='admin-checkbox admin-form-wide'>
          <input
            type='checkbox'
            checked={settings.contactShowMap}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                contactShowMap: event.target.checked,
              }))
            }
          />
          <span>{t('contactShowMap')}</span>
        </label>
        <label className='admin-checkbox admin-form-wide'>
          <input
            type='checkbox'
            checked={settings.contactShowPhone}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                contactShowPhone: event.target.checked,
              }))
            }
          />
          <span>{t('contactShowPhone')}</span>
        </label>
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
        {settings.contactShowStoreInfo && (
          <>
            <AdminField
              label={t('contactStoreNameField')}
              type='text'
              dir='ltr'
              value={settings.contactStoreName?.en || ''}
              localeValue={settings.contactStoreName}
              translatable
              onLocaleChange={(next) =>
                setSettings((previous) => ({
                  ...previous,
                  contactStoreName: next,
                }))
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
                  setSettings((previous) => ({
                    ...previous,
                    contactAddress: next,
                  }))
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
          </>
        )}
        {settings.contactShowMap && (
          <>
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
          </>
        )}

        <h2 className='admin-panel-title admin-form-wide'>
          {t('customFieldsTitle')}
        </h2>
        <p className='admin-meta admin-form-wide'>{t('customFieldsHint')}</p>

        {settings.contactCustomFields.map((field, index) => (
          <div key={field.id} className='admin-form-wide admin-custom-field-card'>
            <div className='admin-custom-field-toolbar'>
              <strong>
                {t('customFieldItem')} #{index + 1}
              </strong>
              <div className='admin-actions'>
                <button
                  type='button'
                  className='admin-link-button'
                  disabled={index === 0}
                  onClick={() => moveCustomField(index, -1)}
                >
                  {t('moveUp')}
                </button>
                <button
                  type='button'
                  className='admin-link-button'
                  disabled={index === settings.contactCustomFields.length - 1}
                  onClick={() => moveCustomField(index, 1)}
                >
                  {t('moveDown')}
                </button>
                <button
                  type='button'
                  className='admin-link-button danger'
                  onClick={() => removeCustomField(field.id)}
                >
                  {t('delete')}
                </button>
              </div>
            </div>

            <div className='admin-form' style={{ marginTop: 12 }}>
              <AdminField
                label={t('customFieldLabel')}
                type='text'
                dir='ltr'
                value={field.label?.en || ''}
                localeValue={field.label}
                translatable
                onLocaleChange={(next) => updateCustomField(field.id, { label: next })}
                onChange={() => {}}
                hint={t('pressGlobeHint')}
              />
              <label className='admin-field'>
                <span className='admin-field-label'>{t('customFieldType')}</span>
                <select
                  className='admin-field-control'
                  value={field.type}
                  onChange={(event) =>
                    updateCustomField(field.id, {
                      type: event.target.value,
                      options:
                        event.target.value === 'select'
                          ? field.options.length
                            ? field.options
                            : [{ en: '', ar: '' }]
                          : [],
                    })
                  }
                >
                  <option value='text'>{t('customFieldTypeText')}</option>
                  <option value='textarea'>{t('customFieldTypeTextarea')}</option>
                  <option value='select'>{t('customFieldTypeSelect')}</option>
                </select>
              </label>
              <label className='admin-checkbox'>
                <input
                  type='checkbox'
                  checked={field.required}
                  onChange={(event) =>
                    updateCustomField(field.id, { required: event.target.checked })
                  }
                />
                <span>{t('customFieldRequired')}</span>
              </label>
            </div>

            {field.type === 'select' && (
              <div className='admin-custom-field-options'>
                <p className='admin-meta'>{t('customFieldOptions')}</p>
                {field.options.map((option, optionIndex) => (
                  <div key={`${field.id}_opt_${optionIndex}`} className='admin-form'>
                    <AdminField
                      label={`${t('customFieldOption')} ${optionIndex + 1}`}
                      type='text'
                      dir='ltr'
                      value={option.en || ''}
                      localeValue={option}
                      translatable
                      onLocaleChange={(next) =>
                        updateOption(field.id, optionIndex, next)
                      }
                      onChange={() => {}}
                      hint={t('pressGlobeHint')}
                    />
                    <div className='admin-form-actions'>
                      <button
                        type='button'
                        className='admin-link-button danger'
                        onClick={() => removeOption(field.id, optionIndex)}
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type='button'
                  className='admin-button secondary'
                  onClick={() => addOption(field.id)}
                >
                  {t('addOption')}
                </button>
              </div>
            )}
          </div>
        ))}

        <div className='admin-form-actions admin-form-wide'>
          <button
            type='button'
            className='admin-button secondary'
            onClick={addCustomField}
            disabled={settings.contactCustomFields.length >= 20}
          >
            {t('addCustomField')}
          </button>
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

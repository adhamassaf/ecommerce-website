import { useContext, useEffect, useState } from 'react';

import AdminField from '../../components/admin-field/admin-field.component.jsx';
import ImageUpload from '../../components/image-upload/image-upload.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getAboutPage,
  saveAboutPage,
} from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';
import { normalizeLocaleValue } from '../../utils/i18n.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

import './admin-about.styles.scss';

const emptyLocale = () => ({ en: '', ar: '' });

const DEFAULT_DATA = {
  coverTitle: emptyLocale(),
  coverImageUrl: '',
  heroTitle: emptyLocale(),
  heroText: emptyLocale(),
  heroMediaUrl: '',
  heroPoints: [],
  directorTitle: emptyLocale(),
  directorName: emptyLocale(),
  directorText: emptyLocale(),
  directorImageUrl: '',
  orgChartTitle: emptyLocale(),
  orgChartImageUrl: '',
  valuesTitle: emptyLocale(),
  valuesSubtitle: emptyLocale(),
  values: [],
  certificatesTitle: emptyLocale(),
  certificates: [],
  policyTabs: [],
  partnersTitle: emptyLocale(),
  partners: [],
};

const normalizeList = (list, mapper) =>
  Array.isArray(list) ? list.map(mapper) : [];

const AdminAbout = () => {
  const { t } = useContext(LanguageContext);
  const [data, setData] = useState(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let active = true;
    getAboutPage()
      .then((doc) => {
        if (!active) return;
        const raw = doc || {};
        setData({
          ...DEFAULT_DATA,
          ...raw,
          coverTitle: normalizeLocaleValue(raw.coverTitle, { en: 'About us', ar: 'من نحن' }),
          coverImageUrl: raw.coverImageUrl || '',
          heroTitle: normalizeLocaleValue(raw.heroTitle),
          heroText: normalizeLocaleValue(raw.heroText),
          directorTitle: normalizeLocaleValue(raw.directorTitle),
          directorName: normalizeLocaleValue(raw.directorName),
          directorText: normalizeLocaleValue(raw.directorText),
          orgChartTitle: normalizeLocaleValue(raw.orgChartTitle),
          valuesTitle: normalizeLocaleValue(raw.valuesTitle),
          valuesSubtitle: normalizeLocaleValue(raw.valuesSubtitle),
          certificatesTitle: normalizeLocaleValue(raw.certificatesTitle),
          partnersTitle: normalizeLocaleValue(raw.partnersTitle),
          heroPoints: normalizeList(raw.heroPoints, (p) => ({
            title: normalizeLocaleValue(p.title),
            iconUrl: p.iconUrl || '',
          })),
          values: normalizeList(raw.values, (v) => ({
            title: normalizeLocaleValue(v.title),
            description: normalizeLocaleValue(v.description),
            iconUrl: v.iconUrl || '',
          })),
          certificates: normalizeList(raw.certificates, (c) => ({
            title: normalizeLocaleValue(c.title),
            date: c.date || '',
            imageUrl: c.imageUrl || '',
            link: c.link || '',
          })),
          policyTabs: normalizeList(raw.policyTabs, (tab) => ({
            title: normalizeLocaleValue(tab.title),
            body: normalizeLocaleValue(tab.body),
          })),
          partners: normalizeList(raw.partners, (p) => ({
            name: normalizeLocaleValue(p.name),
            logoUrl: p.logoUrl || '',
            link: p.link || '',
          })),
        });
      })
      .catch((err) => setFeedback({ type: 'error', text: getAdminErrorMessage(err) }))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setLocaleField = (field) => (next) =>
    setData((prev) => ({ ...prev, [field]: next }));

  const updateListItem = (listKey, index, patch) => {
    setData((prev) => {
      const list = [...(prev[listKey] || [])];
      list[index] = { ...list[index], ...patch };
      return { ...prev, [listKey]: list };
    });
  };

  const addListItem = (listKey, item) => {
    setData((prev) => ({
      ...prev,
      [listKey]: [...(prev[listKey] || []), item],
    }));
  };

  const removeListItem = (listKey, index) => {
    setData((prev) => ({
      ...prev,
      [listKey]: (prev[listKey] || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      await saveAboutPage(data);
      setFeedback({ type: 'success', text: t('aboutSaved') });
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className='admin-about-page'>
      <h1 className='admin-title'>{t('adminAbout')}</h1>
      <p className='admin-about-hint'>{t('adminAboutHint')}</p>

      {feedback && (
        <div
          className={`admin-alert ${feedback.type === 'error' ? 'error' : 'success'}`}
          role='alert'
        >
          {feedback.text}
        </div>
      )}

      <form className='admin-panel admin-form' onSubmit={handleSave}>
        <h2 className='admin-panel-title admin-form-wide'>{t('pageCoverSection')}</h2>
        <AdminField
          label={t('pageCoverTitle')}
          value={data.coverTitle?.en || ''}
          localeValue={data.coverTitle}
          translatable
          onLocaleChange={setLocaleField('coverTitle')}
          onChange={() => {}}
        />
        <div className='admin-form-wide'>
          <ImageUpload
            label={t('pageCoverImage')}
            value={data.coverImageUrl}
            onChange={(url) => setData((p) => ({ ...p, coverImageUrl: url }))}
            folder='crwn/covers'
          />
        </div>

        <h2 className='admin-panel-title admin-form-wide'>{t('aboutHeroSection')}</h2>
        <AdminField
          label={t('aboutHeroTitle')}
          value={data.heroTitle?.en || ''}
          localeValue={data.heroTitle}
          translatable
          onLocaleChange={setLocaleField('heroTitle')}
          onChange={() => {}}
        />
        <AdminField
          label={t('aboutHeroText')}
          as='textarea'
          value={data.heroText?.en || ''}
          localeValue={data.heroText}
          translatable
          onLocaleChange={setLocaleField('heroText')}
          onChange={() => {}}
        />
        <div className='admin-form-wide'>
          <ImageUpload
            label={t('aboutHeroMedia')}
            value={data.heroMediaUrl}
            onChange={(url) => setData((p) => ({ ...p, heroMediaUrl: url }))}
            folder='crwn/about'
          />
        </div>

        <div className='admin-form-wide admin-about-list'>
          <div className='admin-about-list-head'>
            <h3>{t('aboutHeroPoints')}</h3>
            <button
              type='button'
              className='admin-button secondary'
              onClick={() =>
                addListItem('heroPoints', { title: emptyLocale(), iconUrl: '' })
              }
            >
              + {t('addItem')}
            </button>
          </div>
          {data.heroPoints.map((point, index) => (
            <div className='admin-about-item' key={index}>
              <AdminField
                label={`${t('title')} ${index + 1}`}
                value={point.title?.en || ''}
                localeValue={point.title}
                translatable
                onLocaleChange={(next) =>
                  updateListItem('heroPoints', index, { title: next })
                }
                onChange={() => {}}
              />
              <ImageUpload
                label={t('iconOptional')}
                value={point.iconUrl}
                onChange={(url) =>
                  updateListItem('heroPoints', index, { iconUrl: url })
                }
                folder='crwn/about'
              />
              <button
                type='button'
                className='admin-link-button danger'
                onClick={() => removeListItem('heroPoints', index)}
              >
                {t('delete')}
              </button>
            </div>
          ))}
        </div>

        <h2 className='admin-panel-title admin-form-wide'>{t('aboutDirectorSection')}</h2>
        <AdminField
          label={t('aboutDirectorTitle')}
          value={data.directorTitle?.en || ''}
          localeValue={data.directorTitle}
          translatable
          onLocaleChange={setLocaleField('directorTitle')}
          onChange={() => {}}
        />
        <AdminField
          label={t('aboutDirectorName')}
          value={data.directorName?.en || ''}
          localeValue={data.directorName}
          translatable
          onLocaleChange={setLocaleField('directorName')}
          onChange={() => {}}
        />
        <AdminField
          label={t('aboutDirectorText')}
          as='textarea'
          value={data.directorText?.en || ''}
          localeValue={data.directorText}
          translatable
          onLocaleChange={setLocaleField('directorText')}
          onChange={() => {}}
        />
        <div className='admin-form-wide'>
          <ImageUpload
            label={t('aboutDirectorImage')}
            value={data.directorImageUrl}
            onChange={(url) => setData((p) => ({ ...p, directorImageUrl: url }))}
            folder='crwn/about'
          />
        </div>

        <h2 className='admin-panel-title admin-form-wide'>{t('aboutOrgSection')}</h2>
        <AdminField
          label={t('aboutOrgTitle')}
          value={data.orgChartTitle?.en || ''}
          localeValue={data.orgChartTitle}
          translatable
          onLocaleChange={setLocaleField('orgChartTitle')}
          onChange={() => {}}
        />
        <div className='admin-form-wide'>
          <ImageUpload
            label={t('aboutOrgImage')}
            value={data.orgChartImageUrl}
            onChange={(url) => setData((p) => ({ ...p, orgChartImageUrl: url }))}
            folder='crwn/about'
          />
        </div>

        <h2 className='admin-panel-title admin-form-wide'>{t('aboutValuesSection')}</h2>
        <AdminField
          label={t('title')}
          value={data.valuesTitle?.en || ''}
          localeValue={data.valuesTitle}
          translatable
          onLocaleChange={setLocaleField('valuesTitle')}
          onChange={() => {}}
        />
        <AdminField
          label={t('subtitle')}
          value={data.valuesSubtitle?.en || ''}
          localeValue={data.valuesSubtitle}
          translatable
          onLocaleChange={setLocaleField('valuesSubtitle')}
          onChange={() => {}}
        />
        <div className='admin-form-wide admin-about-list'>
          <div className='admin-about-list-head'>
            <h3>{t('aboutValues')}</h3>
            <button
              type='button'
              className='admin-button secondary'
              onClick={() =>
                addListItem('values', {
                  title: emptyLocale(),
                  description: emptyLocale(),
                  iconUrl: '',
                })
              }
            >
              + {t('addItem')}
            </button>
          </div>
          {data.values.map((item, index) => (
            <div className='admin-about-item' key={index}>
              <AdminField
                label={t('title')}
                value={item.title?.en || ''}
                localeValue={item.title}
                translatable
                onLocaleChange={(next) =>
                  updateListItem('values', index, { title: next })
                }
                onChange={() => {}}
              />
              <AdminField
                label={t('description')}
                value={item.description?.en || ''}
                localeValue={item.description}
                translatable
                onLocaleChange={(next) =>
                  updateListItem('values', index, { description: next })
                }
                onChange={() => {}}
              />
              <ImageUpload
                label={t('iconOptional')}
                value={item.iconUrl}
                onChange={(url) => updateListItem('values', index, { iconUrl: url })}
                folder='crwn/about'
              />
              <button
                type='button'
                className='admin-link-button danger'
                onClick={() => removeListItem('values', index)}
              >
                {t('delete')}
              </button>
            </div>
          ))}
        </div>

        <h2 className='admin-panel-title admin-form-wide'>{t('aboutCertsSection')}</h2>
        <AdminField
          label={t('title')}
          value={data.certificatesTitle?.en || ''}
          localeValue={data.certificatesTitle}
          translatable
          onLocaleChange={setLocaleField('certificatesTitle')}
          onChange={() => {}}
        />
        <div className='admin-form-wide admin-about-list'>
          <div className='admin-about-list-head'>
            <h3>{t('aboutCertificates')}</h3>
            <button
              type='button'
              className='admin-button secondary'
              onClick={() =>
                addListItem('certificates', {
                  title: emptyLocale(),
                  date: '',
                  imageUrl: '',
                  link: '',
                })
              }
            >
              + {t('addItem')}
            </button>
          </div>
          {data.certificates.map((item, index) => (
            <div className='admin-about-item' key={index}>
              <AdminField
                label={t('title')}
                value={item.title?.en || ''}
                localeValue={item.title}
                translatable
                onLocaleChange={(next) =>
                  updateListItem('certificates', index, { title: next })
                }
                onChange={() => {}}
              />
              <AdminField
                label={t('date')}
                value={item.date}
                onChange={(e) =>
                  updateListItem('certificates', index, { date: e.target.value })
                }
              />
              <AdminField
                label={t('linkOptional')}
                value={item.link}
                onChange={(e) =>
                  updateListItem('certificates', index, { link: e.target.value })
                }
              />
              <ImageUpload
                label={t('image')}
                value={item.imageUrl}
                onChange={(url) =>
                  updateListItem('certificates', index, { imageUrl: url })
                }
                folder='crwn/about'
              />
              <button
                type='button'
                className='admin-link-button danger'
                onClick={() => removeListItem('certificates', index)}
              >
                {t('delete')}
              </button>
            </div>
          ))}
        </div>

        <h2 className='admin-panel-title admin-form-wide'>{t('aboutPoliciesSection')}</h2>
        <div className='admin-form-wide admin-about-list'>
          <div className='admin-about-list-head'>
            <h3>{t('aboutPolicyTabs')}</h3>
            <button
              type='button'
              className='admin-button secondary'
              onClick={() =>
                addListItem('policyTabs', {
                  title: emptyLocale(),
                  body: emptyLocale(),
                })
              }
            >
              + {t('addItem')}
            </button>
          </div>
          {data.policyTabs.map((tab, index) => (
            <div className='admin-about-item' key={index}>
              <AdminField
                label={t('tabTitle')}
                value={tab.title?.en || ''}
                localeValue={tab.title}
                translatable
                onLocaleChange={(next) =>
                  updateListItem('policyTabs', index, { title: next })
                }
                onChange={() => {}}
              />
              <AdminField
                label={t('tabBody')}
                as='textarea'
                value={tab.body?.en || ''}
                localeValue={tab.body}
                translatable
                onLocaleChange={(next) =>
                  updateListItem('policyTabs', index, { body: next })
                }
                onChange={() => {}}
              />
              <button
                type='button'
                className='admin-link-button danger'
                onClick={() => removeListItem('policyTabs', index)}
              >
                {t('delete')}
              </button>
            </div>
          ))}
        </div>

        <h2 className='admin-panel-title admin-form-wide'>{t('aboutPartnersSection')}</h2>
        <AdminField
          label={t('title')}
          value={data.partnersTitle?.en || ''}
          localeValue={data.partnersTitle}
          translatable
          onLocaleChange={setLocaleField('partnersTitle')}
          onChange={() => {}}
        />
        <div className='admin-form-wide admin-about-list'>
          <div className='admin-about-list-head'>
            <h3>{t('aboutPartners')}</h3>
            <button
              type='button'
              className='admin-button secondary'
              onClick={() =>
                addListItem('partners', {
                  name: emptyLocale(),
                  logoUrl: '',
                  link: '',
                })
              }
            >
              + {t('addItem')}
            </button>
          </div>
          {data.partners.map((item, index) => (
            <div className='admin-about-item' key={index}>
              <AdminField
                label={t('name')}
                value={item.name?.en || ''}
                localeValue={item.name}
                translatable
                onLocaleChange={(next) =>
                  updateListItem('partners', index, { name: next })
                }
                onChange={() => {}}
              />
              <AdminField
                label={t('linkOptional')}
                value={item.link}
                onChange={(e) =>
                  updateListItem('partners', index, { link: e.target.value })
                }
              />
              <ImageUpload
                label={t('logo')}
                value={item.logoUrl}
                onChange={(url) =>
                  updateListItem('partners', index, { logoUrl: url })
                }
                folder='crwn/about'
              />
              <button
                type='button'
                className='admin-link-button danger'
                onClick={() => removeListItem('partners', index)}
              >
                {t('delete')}
              </button>
            </div>
          ))}
        </div>

        <div className='admin-form-actions admin-form-wide'>
          <button className='admin-button' type='submit' disabled={isSaving}>
            {isSaving ? t('saving') : t('saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAbout;

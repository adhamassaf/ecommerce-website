import { useContext, useEffect, useState } from 'react';

import AdminField from '../../components/admin-field/admin-field.component.jsx';
import ImageUpload from '../../components/image-upload/image-upload.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getPageCovers,
  savePageCovers,
} from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';
import { normalizeLocaleValue } from '../../utils/i18n.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

import './admin-page-covers.styles.scss';

const PAGE_KEYS = [
  { id: 'about', labelKey: 'pageKeyAbout', defaultTitle: { en: 'About us', ar: 'من نحن' } },
  { id: 'contact', labelKey: 'pageKeyContact', defaultTitle: { en: 'Contact us', ar: 'تواصل معنا' } },
  { id: 'shop', labelKey: 'pageKeyShop', defaultTitle: { en: 'Shop', ar: 'المتجر' } },
  { id: 'services', labelKey: 'pageKeyServices', defaultTitle: { en: 'Services', ar: 'الخدمات' } },
  { id: 'orders', labelKey: 'pageKeyOrders', defaultTitle: { en: 'My orders', ar: 'طلباتي' } },
];

const emptyPage = (defaults) => ({
  title: normalizeLocaleValue(defaults || { en: '', ar: '' }),
  imageUrl: '',
});

const AdminPageCovers = () => {
  const { t } = useContext(LanguageContext);
  const [covers, setCovers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let active = true;
    getPageCovers()
      .then((doc) => {
        if (!active) return;
        const raw = doc || {};
        const next = {};
        PAGE_KEYS.forEach((page) => {
          const item = raw[page.id] || {};
          next[page.id] = {
            title: normalizeLocaleValue(item.title, page.defaultTitle.en),
            imageUrl: item.imageUrl || '',
          };
          if (!next[page.id].title.ar) {
            next[page.id].title.ar = page.defaultTitle.ar;
          }
        });
        setCovers(next);
      })
      .catch((err) => setFeedback({ type: 'error', text: getAdminErrorMessage(err) }))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const updatePage = (id, patch) => {
    setCovers((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      await savePageCovers(covers);
      setFeedback({ type: 'success', text: t('pageCoversSaved') });
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className='admin-page-covers'>
      <h1 className='admin-title'>{t('pageCoversAdmin')}</h1>
      <p className='admin-page-covers-hint'>{t('pageCoversHint')}</p>

      {feedback && (
        <div
          className={`admin-alert ${feedback.type === 'error' ? 'error' : 'success'}`}
          role='alert'
        >
          {feedback.text}
        </div>
      )}

      <form className='admin-panel admin-form' onSubmit={handleSave}>
        {PAGE_KEYS.map((page) => {
          const item = covers[page.id] || emptyPage(page.defaultTitle);
          return (
            <div className='admin-page-cover-card admin-form-wide' key={page.id}>
              <h2 className='admin-panel-title'>{t(page.labelKey)}</h2>
              <AdminField
                label={t('pageCoverTitle')}
                value={item.title?.en || ''}
                localeValue={item.title}
                translatable
                onLocaleChange={(next) => updatePage(page.id, { title: next })}
                onChange={() => {}}
              />
              <ImageUpload
                label={t('pageCoverImage')}
                value={item.imageUrl}
                onChange={(url) => updatePage(page.id, { imageUrl: url })}
                folder='crwn/covers'
              />
            </div>
          );
        })}

        <div className='admin-form-actions admin-form-wide'>
          <button className='admin-button' type='submit' disabled={isSaving}>
            {isSaving ? t('saving') : t('saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPageCovers;

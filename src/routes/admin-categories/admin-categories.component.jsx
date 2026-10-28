import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';

import AdminField from '../../components/admin-field/admin-field.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';

import { CategoriesContext } from '../../contexts/categories.context.jsx';
import {
  saveCategoryDocument,
  deleteCategoryDocument,
} from '../../utils/firebase/firebase.utils.js';
import { getCategoryImage } from '../../utils/category-defaults.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';
import { isValidUrl } from '../../utils/is-valid-url.js';
import { slugify } from '../../utils/slugify.js';
import { getLocalized, normalizeLocaleValue } from '../../utils/i18n.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

const EMPTY_FORM = { title: { en: '', ar: '' }, imageUrl: '', order: '' };

const AdminCategories = () => {
  const { categories, isLoading, error, refreshCategories } =
    useContext(CategoriesContext);
  const { language, t } = useContext(LanguageContext);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (isLoading) return <Spinner />;

  if (error) return <StatusMessage message={error} />;

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = () => {
    setForm({ title: { en: '', ar: '' }, imageUrl: '', order: '' });
    setEditingId(null);
  };

  const startEditing = (category) => {
    setEditingId(category.id);
    setForm({
      title: normalizeLocaleValue(category.title),
      imageUrl: category.imageUrl,
      order: category.order === null ? '' : String(category.order),
    });
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = normalizeLocaleValue(form.title);
    const titleEn = title.en.trim();
    const imageUrl = form.imageUrl.trim();
    const id = editingId || slugify(titleEn);
    const order = form.order.trim() === '' ? null : Number(form.order);

    if (!titleEn || !id) {
      setFeedback({ type: 'error', text: 'اكتب اسماً صالحاً للقسم (بالإنجليزية).' });
      return;
    }

    if (!editingId && categories.some((category) => category.id === id)) {
      setFeedback({ type: 'error', text: 'يوجد قسم بهذا الاسم مسبقاً.' });
      return;
    }

    if (imageUrl && !isValidUrl(imageUrl)) {
      setFeedback({
        type: 'error',
        text: 'رابط الصورة غير صالح، يجب أن يبدأ بـ http أو https.',
      });
      return;
    }

    if (order !== null && !Number.isFinite(order)) {
      setFeedback({ type: 'error', text: 'الترتيب يجب أن يكون رقماً.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await saveCategoryDocument(
        id,
        {
          title: { en: titleEn, ar: title.ar.trim() || titleEn },
          imageUrl,
          order,
        },
        { isNew: !editingId }
      );
      await refreshCategories();
      setFeedback({
        type: 'success',
        text: editingId ? 'تم تحديث القسم.' : 'تمت إضافة القسم.',
      });
      resetForm();
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `سيتم حذف القسم "${getLocalized(category.title, language)}" مع جميع منتجاته (${category.items.length}). هل تريد المتابعة؟`
    );

    if (!confirmed) return;

    setFeedback(null);

    try {
      await deleteCategoryDocument(category.id);
      await refreshCategories();
      if (editingId === category.id) resetForm();
      setFeedback({ type: 'success', text: 'تم حذف القسم.' });
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    }
  };

  return (
    <div>
      <h1 className='admin-title'>{t('adminCategories')}</h1>

      {feedback && (
        <div className={`admin-alert ${feedback.type}`} role='alert'>
          {feedback.text}
        </div>
      )}

      <form className='admin-panel admin-form' onSubmit={handleSubmit}>
        <h2 className='admin-panel-title admin-form-wide'>
          {editingId ? t('editCategory') : t('newCategory')}
        </h2>
        <AdminField
          label={t('categoryNameEn')}
          type='text'
          dir='ltr'
          value={form.title?.en || ''}
          localeValue={form.title}
          translatable
          onLocaleChange={(next) =>
            setForm((previous) => ({ ...previous, title: next }))
          }
          onChange={() => {}}
          readOnly={Boolean(editingId)}
          hint={
            editingId
              ? 'لا يمكن تغيير مفتاح القسم بعد إنشائه. يمكن تعديل الترجمة العربية عبر 🌐'
              : 'الاسم الإنجليزي يُستخدم في الرابط. اضغط 🌐 لإضافة الترجمة العربية.'
          }
          required
        />
        <AdminField
          label={t('categoryImageUrl')}
          type='url'
          dir='ltr'
          value={form.imageUrl}
          onChange={handleChange('imageUrl')}
          hint='تظهر في الصفحة الرئيسية. إذا تُرك فارغاً تُستخدم صورة افتراضية.'
        />
        <AdminField
          label={t('categoryOrder')}
          type='number'
          step='1'
          value={form.order}
          onChange={handleChange('order')}
          hint={t('categoryOrderHint')}
        />
        <div className='admin-form-actions'>
          <button className='admin-button' type='submit' disabled={isSaving}>
            {isSaving ? t('saving') : editingId ? t('saveCategory') : t('addCategoryBtn')}
          </button>
          {editingId && (
            <button
              className='admin-button secondary'
              type='button'
              onClick={resetForm}
              disabled={isSaving}
            >
              {t('cancelEdit')}
            </button>
          )}
        </div>
      </form>

      {categories.length === 0 ? (
        <div className='admin-empty'>{t('noCategoriesYet')}</div>
      ) : (
        <div className='admin-table-wrapper'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>{t('image')}</th>
                <th>{t('category')}</th>
                <th>{t('link')}</th>
                <th>{t('categoryOrder')}</th>
                <th>{t('productCount')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <img
                      className='admin-thumb'
                      src={getCategoryImage(category)}
                      alt={getLocalized(category.title, language)}
                    />
                  </td>
                  <td>
                    {getLocalized(category.title, language)}
                    {getLocalized(category.title, 'ar') !== getLocalized(category.title, 'en') && (
                      <div className='admin-hint' dir='auto'>
                        {language === 'ar' ? getLocalized(category.title, 'en') : getLocalized(category.title, 'ar')}
                      </div>
                    )}
                  </td>
                  <td dir='ltr'>
                    <Link to={`/shop/${category.id}`}>/shop/{category.id}</Link>
                  </td>
                  <td>{category.order === null ? '-' : category.order}</td>
                  <td>{category.items.length}</td>
                  <td>
                    <div className='admin-actions'>
                      <button
                        className='admin-link-button'
                        type='button'
                        onClick={() => startEditing(category)}
                      >
                        {t('edit')}
                      </button>
                      <button
                        className='admin-link-button danger'
                        type='button'
                        onClick={() => handleDelete(category)}
                      >
                        {t('delete')}
                      </button>
                    </div>
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

export default AdminCategories;

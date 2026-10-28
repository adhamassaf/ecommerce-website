import { useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import AdminField from '../../components/admin-field/admin-field.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';
import StatusMessage from '../../components/status-message/status-message.component.jsx';

import { CategoriesContext } from '../../contexts/categories.context.jsx';
import {
  saveProductToCategory,
  removeProductFromCategory,
} from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';
import { isValidUrl } from '../../utils/is-valid-url.js';
import { getLocalized, normalizeLocaleValue } from '../../utils/i18n.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

const EMPTY_FORM = {
  name: { en: '', ar: '' },
  price: '',
  imageUrl: '',
  categoryId: '',
};

const AdminProducts = () => {
  const { categories, isLoading, error, refreshCategories } =
    useContext(CategoriesContext);
  const { language, t } = useContext(LanguageContext);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const allProducts = useMemo(
    () =>
      categories.flatMap((category) =>
        category.items.map((item) => ({
          ...item,
          categoryId: category.id,
          categoryTitle: category.title,
        }))
      ),
    [categories]
  );

  const nextId = useMemo(
    () =>
      allProducts.reduce(
        (highest, product) => Math.max(highest, Number(product.id) || 0),
        0
      ) + 1,
    [allProducts]
  );

  const visibleProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return allProducts.filter((product) => {
      const nameEn = getLocalized(product.name, 'en').toLowerCase();
      const nameAr = getLocalized(product.name, 'ar').toLowerCase();
      return (
        (categoryFilter === 'all' || product.categoryId === categoryFilter) &&
        (!term || nameEn.includes(term) || nameAr.includes(term))
      );
    });
  }, [allProducts, categoryFilter, searchTerm]);

  if (isLoading) return <Spinner />;

  if (error) return <StatusMessage message={error} />;

  if (categories.length === 0) {
    return (
      <div>
        <h1 className='admin-title'>{t('adminProducts')}</h1>
        <div className='admin-empty'>
          لا توجد أقسام بعد. <Link to='/admin/categories'>أضف قسماً</Link> أولاً
          ثم أضف المنتجات إليه.
        </div>
      </div>
    );
  }

  const selectedCategoryId = form.categoryId || categories[0].id;

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
  };

  const startEditing = (product) => {
    setEditing({ id: product.id, categoryId: product.categoryId });
    setForm({
      name: normalizeLocaleValue(product.name),
      price: String(product.price),
      imageUrl: product.imageUrl || '',
      categoryId: product.categoryId,
    });
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nameLocale = normalizeLocaleValue(form.name);
    const nameEn = nameLocale.en.trim();
    const imageUrl = form.imageUrl.trim();
    const price = Number(form.price);

    if (!nameEn) {
      setFeedback({ type: 'error', text: 'اكتب اسم المنتج (بالإنجليزية).' });
      return;
    }

    if (form.price.trim() === '' || !Number.isFinite(price) || price < 0) {
      setFeedback({ type: 'error', text: 'اكتب سعراً صحيحاً.' });
      return;
    }

    if (!isValidUrl(imageUrl)) {
      setFeedback({
        type: 'error',
        text: 'رابط الصورة مطلوب ويجب أن يبدأ بـ http أو https.',
      });
      return;
    }

    const product = {
      id: editing ? editing.id : nextId,
      name: { en: nameEn, ar: nameLocale.ar.trim() || nameEn },
      price,
      imageUrl,
    };

    setIsSaving(true);
    setFeedback(null);

    try {
      await saveProductToCategory({
        product,
        fromCategoryId: editing ? editing.categoryId : null,
        toCategoryId: selectedCategoryId,
      });
      await refreshCategories();
      setFeedback({
        type: 'success',
        text: editing ? 'تم تحديث المنتج.' : 'تمت إضافة المنتج.',
      });
      resetForm();
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `حذف المنتج "${getLocalized(product.name, language)}"؟`
    );

    if (!confirmed) return;

    setFeedback(null);

    try {
      await removeProductFromCategory(product.categoryId, product.id);
      await refreshCategories();
      if (editing && editing.id === product.id) resetForm();
      setFeedback({ type: 'success', text: 'تم حذف المنتج.' });
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    }
  };

  return (
    <div>
      <h1 className='admin-title'>{t('adminProducts')}</h1>

      {feedback && (
        <div className={`admin-alert ${feedback.type}`} role='alert'>
          {feedback.text}
        </div>
      )}

      <form className='admin-panel admin-form' onSubmit={handleSubmit}>
        <h2 className='admin-panel-title admin-form-wide'>
          {editing ? 'تعديل المنتج' : 'إضافة منتج جديد'}
        </h2>
        <AdminField
          as='select'
          label='القسم'
          value={selectedCategoryId}
          onChange={handleChange('categoryId')}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {getLocalized(category.title, language)}
            </option>
          ))}
        </AdminField>
        <AdminField
          label={t('productNameEn')}
          type='text'
          dir='ltr'
          value={form.name?.en || ''}
          localeValue={form.name}
          translatable
          onLocaleChange={(next) =>
            setForm((previous) => ({ ...previous, name: next }))
          }
          onChange={() => {}}
          hint={t('pressGlobeHint')}
          required
        />
        <AdminField
          label={t('productPrice')}
          type='number'
          min='0'
          step='0.01'
          value={form.price}
          onChange={handleChange('price')}
          required
        />
        <AdminField
          label={t('productImageUrl')}
          type='url'
          dir='ltr'
          value={form.imageUrl}
          onChange={handleChange('imageUrl')}
          required
        />
        {isValidUrl(form.imageUrl.trim()) && (
          <img
            className='admin-preview'
            src={form.imageUrl.trim()}
            alt='معاينة الصورة'
          />
        )}
        <div className='admin-form-actions'>
          <button className='admin-button' type='submit' disabled={isSaving}>
            {isSaving ? t('saving') : editing ? t('saveChanges') : t('addProduct')}
          </button>
          {editing && (
            <button
              className='admin-button secondary'
              type='button'
              onClick={resetForm}
              disabled={isSaving}
            >
              إلغاء التعديل
            </button>
          )}
        </div>
      </form>

      <div className='admin-toolbar'>
        <AdminField
          label='بحث بالاسم'
          type='search'
          dir='auto'
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <AdminField
          as='select'
          label='تصفية حسب القسم'
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value='all'>كل الأقسام</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {getLocalized(category.title, language)}
            </option>
          ))}
        </AdminField>
      </div>

      <p className='admin-meta'>
        {visibleProducts.length} من أصل {allProducts.length} منتج
      </p>

      {visibleProducts.length === 0 ? (
        <div className='admin-empty'>لا توجد منتجات مطابقة.</div>
      ) : (
        <div className='admin-table-wrapper'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>الصورة</th>
                <th>الاسم</th>
                <th>القسم</th>
                <th>السعر</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={`${product.categoryId}-${product.id}`}>
                  <td>
                    <img
                      className='admin-thumb'
                      src={product.imageUrl}
                      alt={getLocalized(product.name, language)}
                    />
                  </td>
                  <td dir='auto'>
                    {getLocalized(product.name, language)}
                    {getLocalized(product.name, language === 'ar' ? 'en' : 'ar') !==
                      getLocalized(product.name, language) && (
                      <div className='admin-hint'>
                        {getLocalized(product.name, language === 'ar' ? 'en' : 'ar')}
                      </div>
                    )}
                  </td>
                  <td>{getLocalized(product.categoryTitle, language)}</td>
                  <td>${product.price}</td>
                  <td>
                    <div className='admin-actions'>
                      <button
                        className='admin-link-button'
                        type='button'
                        onClick={() => startEditing(product)}
                      >
                        تعديل
                      </button>
                      <button
                        className='admin-link-button danger'
                        type='button'
                        onClick={() => handleDelete(product)}
                      >
                        حذف
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

export default AdminProducts;

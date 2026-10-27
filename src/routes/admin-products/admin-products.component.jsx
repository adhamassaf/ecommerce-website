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

const EMPTY_FORM = { name: '', price: '', imageUrl: '', categoryId: '' };

const AdminProducts = () => {
  const { categories, isLoading, error, refreshCategories } =
    useContext(CategoriesContext);

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

    return allProducts.filter(
      (product) =>
        (categoryFilter === 'all' || product.categoryId === categoryFilter) &&
        (!term || String(product.name || '').toLowerCase().includes(term))
    );
  }, [allProducts, categoryFilter, searchTerm]);

  if (isLoading) return <Spinner />;

  if (error) return <StatusMessage message={error} />;

  if (categories.length === 0) {
    return (
      <div>
        <h1 className='admin-title'>المنتجات</h1>
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
      name: product.name || '',
      price: String(product.price),
      imageUrl: product.imageUrl || '',
      categoryId: product.categoryId,
    });
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const imageUrl = form.imageUrl.trim();
    const price = Number(form.price);

    if (!name) {
      setFeedback({ type: 'error', text: 'اكتب اسم المنتج.' });
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
      name,
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
    const confirmed = window.confirm(`حذف المنتج "${product.name}"؟`);

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
      <h1 className='admin-title'>المنتجات</h1>

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
              {category.title}
            </option>
          ))}
        </AdminField>
        <AdminField
          label='اسم المنتج'
          type='text'
          dir='auto'
          value={form.name}
          onChange={handleChange('name')}
          required
        />
        <AdminField
          label='السعر (بالدولار)'
          type='number'
          min='0'
          step='0.01'
          value={form.price}
          onChange={handleChange('price')}
          required
        />
        <AdminField
          label='رابط صورة المنتج'
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
            {isSaving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة المنتج'}
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
              {category.title}
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
                      alt={product.name}
                    />
                  </td>
                  <td dir='auto'>{product.name}</td>
                  <td>{product.categoryTitle}</td>
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

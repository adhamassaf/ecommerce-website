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

const EMPTY_FORM = { title: '', imageUrl: '', order: '' };

const AdminCategories = () => {
  const { categories, isLoading, error, refreshCategories } =
    useContext(CategoriesContext);

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
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEditing = (category) => {
    setEditingId(category.id);
    setForm({
      title: category.title,
      imageUrl: category.imageUrl,
      order: category.order === null ? '' : String(category.order),
    });
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const imageUrl = form.imageUrl.trim();
    const id = editingId || slugify(title);
    const order = form.order.trim() === '' ? null : Number(form.order);

    if (!title || !id) {
      setFeedback({ type: 'error', text: 'اكتب اسماً صالحاً للقسم.' });
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
        { title, imageUrl, order },
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
      `سيتم حذف القسم "${category.title}" مع جميع منتجاته (${category.items.length}). هل تريد المتابعة؟`
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
      <h1 className='admin-title'>الأقسام</h1>

      {feedback && (
        <div className={`admin-alert ${feedback.type}`} role='alert'>
          {feedback.text}
        </div>
      )}

      <form className='admin-panel admin-form' onSubmit={handleSubmit}>
        <h2 className='admin-panel-title admin-form-wide'>
          {editingId ? 'تعديل القسم' : 'إضافة قسم جديد'}
        </h2>
        <AdminField
          label='اسم القسم'
          type='text'
          dir='auto'
          value={form.title}
          onChange={handleChange('title')}
          readOnly={Boolean(editingId)}
          hint={editingId ? 'لا يمكن تغيير اسم القسم بعد إنشائه.' : undefined}
          required
        />
        <AdminField
          label='رابط صورة القسم'
          type='url'
          dir='ltr'
          value={form.imageUrl}
          onChange={handleChange('imageUrl')}
          hint='تظهر في الصفحة الرئيسية. إذا تُرك فارغاً تُستخدم صورة افتراضية.'
        />
        <AdminField
          label='الترتيب'
          type='number'
          step='1'
          value={form.order}
          onChange={handleChange('order')}
          hint='الأرقام الأصغر تظهر أولاً. الأقسام الأساسية تحتل من 0 إلى 4.'
        />
        <div className='admin-form-actions'>
          <button className='admin-button' type='submit' disabled={isSaving}>
            {isSaving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة القسم'}
          </button>
          {editingId && (
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

      {categories.length === 0 ? (
        <div className='admin-empty'>لا توجد أقسام بعد. أضف أول قسم من النموذج أعلاه.</div>
      ) : (
        <div className='admin-table-wrapper'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>الصورة</th>
                <th>القسم</th>
                <th>الرابط</th>
                <th>الترتيب</th>
                <th>المنتجات</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <img
                      className='admin-thumb'
                      src={getCategoryImage(category)}
                      alt={category.title}
                    />
                  </td>
                  <td>{category.title}</td>
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
                        تعديل
                      </button>
                      <button
                        className='admin-link-button danger'
                        type='button'
                        onClick={() => handleDelete(category)}
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

export default AdminCategories;

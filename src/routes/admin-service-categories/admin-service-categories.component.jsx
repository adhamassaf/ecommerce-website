import { useContext, useEffect, useState } from 'react';

import AdminField from '../../components/admin-field/admin-field.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getServiceCategories,
  saveServiceCategory,
  deleteServiceCategory,
} from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';
import { slugify } from '../../utils/slugify.js';
import { getLocalized, normalizeLocaleValue } from '../../utils/i18n.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

const EMPTY = { title: { en: '', ar: '' }, order: '' };

const AdminServiceCategories = () => {
  const { language, t } = useContext(LanguageContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = async () => {
    const data = await getServiceCategories();
    setItems(data);
  };

  useEffect(() => {
    let active = true;
    getServiceCategories()
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((err) => {
        if (active) setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: normalizeLocaleValue(item.title),
      order: item.order === 0 || item.order ? String(item.order) : '',
    });
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const title = normalizeLocaleValue(form.title);
    const titleEn = title.en.trim();
    const id = editingId || slugify(titleEn);
    const order = form.order.trim() === '' ? 0 : Number(form.order);

    if (!titleEn || !id) {
      setFeedback({ type: 'error', text: t('serviceCatNameRequired') });
      return;
    }
    if (!Number.isFinite(order)) {
      setFeedback({ type: 'error', text: t('serviceOrderInvalid') });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await saveServiceCategory(id, {
        title: { en: titleEn, ar: title.ar.trim() || titleEn },
        order,
      });
      await load();
      setFeedback({
        type: 'success',
        text: editingId ? t('serviceCatUpdated') : t('serviceCatAdded'),
      });
      reset();
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(
      t('serviceCatDeleteConfirm').replace(
        '{name}',
        getLocalized(item.title, language)
      )
    );
    if (!ok) return;
    setFeedback(null);
    try {
      await deleteServiceCategory(item.id);
      await load();
      if (editingId === item.id) reset();
      setFeedback({ type: 'success', text: t('serviceCatDeleted') });
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className='admin-title'>{t('adminServiceCategories')}</h1>

      {feedback && (
        <div className={`admin-alert${feedback.type === 'error' ? ' error' : ''}`}>
          {feedback.text}
        </div>
      )}

      <form className='admin-panel admin-form' onSubmit={handleSubmit}>
        <h2 className='admin-panel-title'>
          {editingId ? t('editServiceCategory') : t('addServiceCategory')}
        </h2>
        <AdminField
          label={t('serviceCategoryNameEn')}
          value={form.title?.en || ''}
          localeValue={form.title}
          translatable
          onLocaleChange={(next) => setForm((p) => ({ ...p, title: next }))}
          onChange={() => {}}
        />
        <label className='admin-field'>
          <span className='admin-field-label'>{t('order')}</span>
          <input
            className='admin-field-control'
            value={form.order}
            onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))}
            inputMode='numeric'
          />
        </label>
        <div className='admin-form-actions'>
          {editingId && (
            <button type='button' className='admin-button secondary' onClick={reset}>
              {t('cancelEdit')}
            </button>
          )}
          <button className='admin-button' type='submit' disabled={saving}>
            {saving ? t('saving') : editingId ? t('saveChanges') : t('add')}
          </button>
        </div>
      </form>

      <div className='admin-table-wrapper' style={{ marginTop: 24 }}>
        <table className='admin-table'>
          <thead>
            <tr>
              <th>{t('serviceCategory')}</th>
              <th>{t('order')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3}>{t('noServiceCategories')}</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td dir='auto'>{getLocalized(item.title, language)}</td>
                  <td>{item.order}</td>
                  <td>
                    <div className='admin-actions'>
                      <button
                        type='button'
                        className='admin-link-button'
                        onClick={() => startEdit(item)}
                      >
                        {t('edit')}
                      </button>
                      <button
                        type='button'
                        className='admin-link-button danger'
                        onClick={() => handleDelete(item)}
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminServiceCategories;

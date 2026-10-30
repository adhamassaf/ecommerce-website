import { useContext, useEffect, useMemo, useState } from 'react';

import AdminField from '../../components/admin-field/admin-field.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getServiceCategories,
  getServices,
  saveService,
  deleteService,
} from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';
import { slugify } from '../../utils/slugify.js';
import { getLocalized, normalizeLocaleValue } from '../../utils/i18n.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

const EMPTY = {
  title: { en: '', ar: '' },
  summary: { en: '', ar: '' },
  about: { en: '', ar: '' },
  steps: { en: '', ar: '' },
  requirements: { en: '', ar: '' },
  serviceType: { en: '', ar: '' },
  fees: { en: '', ar: '' },
  duration: { en: '', ar: '' },
  output: { en: '', ar: '' },
  availability: { en: '', ar: '' },
  categoryId: '',
  order: '',
  enabled: true,
};

const localeField = (label, key, form, setForm, as = 'input') => (
  <div className='admin-form-wide' key={key}>
    <AdminField
      as={as}
      label={label}
      value={form[key]?.en || ''}
      localeValue={form[key]}
      translatable
      onLocaleChange={(next) => setForm((p) => ({ ...p, [key]: next }))}
      onChange={() => {}}
    />
  </div>
);

const AdminServices = () => {
  const { language, t } = useContext(LanguageContext);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const load = async () => {
    const [cats, list] = await Promise.all([
      getServiceCategories(),
      getServices(),
    ]);
    setCategories(cats);
    setServices(list);
  };

  useEffect(() => {
    let active = true;
    Promise.all([getServiceCategories(), getServices()])
      .then(([cats, list]) => {
        if (!active) return;
        setCategories(cats);
        setServices(list);
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

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [categories]);

  const visible = useMemo(
    () =>
      filterCategory === 'all'
        ? services
        : services.filter((s) => s.categoryId === filterCategory),
    [services, filterCategory]
  );

  const reset = () => {
    setForm({
      ...EMPTY,
      categoryId: categories[0]?.id || '',
    });
    setEditingId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: normalizeLocaleValue(item.title),
      summary: normalizeLocaleValue(item.summary),
      about: normalizeLocaleValue(item.about),
      steps: normalizeLocaleValue(item.steps),
      requirements: normalizeLocaleValue(item.requirements),
      serviceType: normalizeLocaleValue(item.serviceType),
      fees: normalizeLocaleValue(item.fees),
      duration: normalizeLocaleValue(item.duration),
      output: normalizeLocaleValue(item.output),
      availability: normalizeLocaleValue(item.availability),
      categoryId: item.categoryId || '',
      order: item.order === 0 || item.order ? String(item.order) : '',
      enabled: item.enabled !== false,
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
      setFeedback({ type: 'error', text: t('serviceNameRequired') });
      return;
    }
    if (!form.categoryId) {
      setFeedback({ type: 'error', text: t('serviceCategoryRequired') });
      return;
    }
    if (!Number.isFinite(order)) {
      setFeedback({ type: 'error', text: t('serviceOrderInvalid') });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await saveService(
        id,
        {
          ...form,
          title: { en: titleEn, ar: title.ar.trim() || titleEn },
          summary: normalizeLocaleValue(form.summary),
          about: normalizeLocaleValue(form.about),
          steps: normalizeLocaleValue(form.steps),
          requirements: normalizeLocaleValue(form.requirements),
          serviceType: normalizeLocaleValue(form.serviceType),
          fees: normalizeLocaleValue(form.fees),
          duration: normalizeLocaleValue(form.duration),
          output: normalizeLocaleValue(form.output),
          availability: normalizeLocaleValue(form.availability),
          categoryId: form.categoryId,
          order,
          enabled: Boolean(form.enabled),
        },
        { isNew: !editingId }
      );
      await load();
      setFeedback({
        type: 'success',
        text: editingId ? t('serviceUpdated') : t('serviceAdded'),
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
      t('serviceDeleteConfirm').replace(
        '{name}',
        getLocalized(item.title, language)
      )
    );
    if (!ok) return;
    try {
      await deleteService(item.id);
      await load();
      if (editingId === item.id) reset();
      setFeedback({ type: 'success', text: t('serviceDeleted') });
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className='admin-title'>{t('adminServices')}</h1>

      {feedback && (
        <div className={`admin-alert${feedback.type === 'error' ? ' error' : ''}`}>
          {feedback.text}
        </div>
      )}

      {categories.length === 0 && (
        <div className='admin-alert'>
          {t('serviceNeedCategoriesFirst')}
        </div>
      )}

      <form className='admin-panel admin-form' onSubmit={handleSubmit}>
        <h2 className='admin-panel-title'>
          {editingId ? t('editService') : t('addService')}
        </h2>

        <label className='admin-field'>
          <span className='admin-field-label'>{t('serviceCategory')}</span>
          <select
            className='admin-field-control'
            value={form.categoryId}
            onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
          >
            <option value=''>{t('selectCategory')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {getLocalized(c.title, language)}
              </option>
            ))}
          </select>
        </label>

        {localeField(t('serviceNameEn'), 'title', form, setForm)}
        {localeField(t('serviceSummaryEn'), 'summary', form, setForm, 'textarea')}
        {localeField(t('serviceAboutEn'), 'about', form, setForm, 'textarea')}
        {localeField(t('serviceStepsEn'), 'steps', form, setForm, 'textarea')}
        {localeField(t('serviceRequirementsEn'), 'requirements', form, setForm, 'textarea')}
        {localeField(t('serviceTypeEn'), 'serviceType', form, setForm)}
        {localeField(t('serviceFeesEn'), 'fees', form, setForm)}
        {localeField(t('serviceDurationEn'), 'duration', form, setForm)}
        {localeField(t('serviceOutputEn'), 'output', form, setForm)}
        {localeField(t('serviceAvailabilityEn'), 'availability', form, setForm)}

        <label className='admin-field'>
          <span className='admin-field-label'>{t('order')}</span>
          <input
            className='admin-field-control'
            value={form.order}
            onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))}
            inputMode='numeric'
          />
        </label>

        <label className='admin-field' style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <input
            type='checkbox'
            checked={Boolean(form.enabled)}
            onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
          />
          <span>{t('serviceEnabled')}</span>
        </label>

        <div className='admin-form-actions'>
          {editingId && (
            <button type='button' className='admin-button secondary' onClick={reset}>
              {t('cancelEdit')}
            </button>
          )}
          <button className='admin-button' type='submit' disabled={saving || !categories.length}>
            {saving ? t('saving') : editingId ? t('saveChanges') : t('add')}
          </button>
        </div>
      </form>

      <div className='admin-toolbar' style={{ marginTop: 24 }}>
        <label className='admin-field'>
          <span className='admin-field-label'>{t('filterByCategory')}</span>
          <select
            className='admin-field-control'
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value='all'>{t('filterAllUsers')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {getLocalized(c.title, language)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className='admin-table-wrapper'>
        <table className='admin-table'>
          <thead>
            <tr>
              <th>{t('serviceName')}</th>
              <th>{t('serviceCategory')}</th>
              <th>{t('order')}</th>
              <th>{t('status')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5}>{t('noServices')}</td>
              </tr>
            ) : (
              visible.map((item) => (
                <tr key={item.id}>
                  <td dir='auto'>{getLocalized(item.title, language)}</td>
                  <td dir='auto'>
                    {getLocalized(categoryMap[item.categoryId]?.title, language) || '-'}
                  </td>
                  <td>{item.order}</td>
                  <td>{item.enabled ? t('enabled') : t('disabled')}</td>
                  <td>
                    <div className='admin-actions'>
                      <button type='button' className='admin-link-button' onClick={() => startEdit(item)}>
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

export default AdminServices;

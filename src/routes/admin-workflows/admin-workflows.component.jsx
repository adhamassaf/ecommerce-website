import { useContext, useEffect, useMemo, useState } from 'react';

import AdminField from '../../components/admin-field/admin-field.component.jsx';
import Spinner from '../../components/spinner/spinner.component.jsx';

import {
  getWorkflows,
  saveWorkflow,
  deleteWorkflow,
} from '../../utils/firebase/firebase.utils.js';
import { getAdminErrorMessage } from '../../utils/admin-errors.js';
import { slugify } from '../../utils/slugify.js';
import { getLocalized, normalizeLocaleValue } from '../../utils/i18n.js';
import { LanguageContext } from '../../contexts/language.context.jsx';

const emptyStage = (index = 0) => ({
  id: `stage_${Date.now()}_${index}`,
  name: { en: '', ar: '' },
  nextStageId: '',
  permission: '',
  order: index,
});

const EMPTY = {
  name: { en: '', ar: '' },
  order: '',
  stages: [emptyStage(0)],
};

const AdminWorkflows = () => {
  const { language, t } = useContext(LanguageContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = async () => {
    const data = await getWorkflows();
    setItems(data);
  };

  useEffect(() => {
    let active = true;
    getWorkflows()
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

  const stageOptions = useMemo(
    () =>
      (form.stages || []).map((stage) => ({
        id: stage.id,
        label: getLocalized(stage.name, language) || stage.id,
      })),
    [form.stages, language]
  );

  const reset = () => {
    setForm({
      name: { en: '', ar: '' },
      order: '',
      stages: [emptyStage(0)],
    });
    setEditingId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: normalizeLocaleValue(item.name),
      order: item.order === 0 || item.order ? String(item.order) : '',
      stages:
        Array.isArray(item.stages) && item.stages.length
          ? item.stages.map((stage, index) => ({
              id: stage.id || `stage_${index + 1}`,
              name: normalizeLocaleValue(stage.name),
              nextStageId: stage.nextStageId || '',
              permission: stage.permission || '',
              order: typeof stage.order === 'number' ? stage.order : index,
            }))
          : [emptyStage(0)],
    });
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateStage = (index, patch) => {
    setForm((prev) => {
      const stages = [...(prev.stages || [])];
      stages[index] = { ...stages[index], ...patch };
      return { ...prev, stages };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = normalizeLocaleValue(form.name);
    const nameEn = name.en.trim();
    const id = editingId || slugify(nameEn);
    const order = form.order.trim() === '' ? 0 : Number(form.order);

    if (!nameEn || !id) {
      setFeedback({ type: 'error', text: t('workflowNameRequired') });
      return;
    }
    if (!Number.isFinite(order)) {
      setFeedback({ type: 'error', text: t('serviceOrderInvalid') });
      return;
    }

    const stages = (form.stages || []).map((stage, index) => {
      const stageName = normalizeLocaleValue(stage.name);
      return {
        id: stage.id || `stage_${index + 1}`,
        name: {
          en: stageName.en.trim() || `Stage ${index + 1}`,
          ar: stageName.ar.trim() || stageName.en.trim() || `المرحلة ${index + 1}`,
        },
        nextStageId: stage.nextStageId || '',
        permission: String(stage.permission || '').trim(),
        order: index,
      };
    });

    if (!stages.length || !stages.some((s) => s.name.en.trim())) {
      setFeedback({ type: 'error', text: t('workflowStagesRequired') });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await saveWorkflow(
        id,
        {
          name: { en: nameEn, ar: name.ar.trim() || nameEn },
          order,
          stages,
        },
        { isNew: !editingId }
      );
      await load();
      setFeedback({
        type: 'success',
        text: editingId ? t('workflowUpdated') : t('workflowAdded'),
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
      t('workflowDeleteConfirm').replace(
        '{name}',
        getLocalized(item.name, language)
      )
    );
    if (!ok) return;
    try {
      await deleteWorkflow(item.id);
      await load();
      if (editingId === item.id) reset();
      setFeedback({ type: 'success', text: t('workflowDeleted') });
    } catch (err) {
      setFeedback({ type: 'error', text: getAdminErrorMessage(err) });
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className='admin-title'>{t('adminWorkflows')}</h1>

      {feedback && (
        <div className={`admin-alert${feedback.type === 'error' ? ' error' : ''}`}>
          {feedback.text}
        </div>
      )}

      <form className='admin-panel admin-form' onSubmit={handleSubmit}>
        <h2 className='admin-panel-title'>
          {editingId ? t('editWorkflow') : t('addWorkflow')}
        </h2>

        <AdminField
          label={t('workflowNameEn')}
          value={form.name?.en || ''}
          localeValue={form.name}
          translatable
          onLocaleChange={(next) => setForm((p) => ({ ...p, name: next }))}
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

        <div className='admin-form-wide'>
          <h3 className='admin-panel-title'>{t('workflowStages')}</h3>
          <p className='admin-meta'>{t('workflowStagesHint')}</p>

          {(form.stages || []).map((stage, index) => (
            <div
              key={stage.id}
              className='admin-panel'
              style={{ marginBottom: 12, padding: 14 }}
            >
              <div className='admin-toolbar' style={{ marginBottom: 8 }}>
                <strong>
                  {t('stage')} #{index + 1}
                </strong>
                {(form.stages || []).length > 1 && (
                  <button
                    type='button'
                    className='admin-link-button danger'
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        stages: prev.stages.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    {t('delete')}
                  </button>
                )}
              </div>

              <AdminField
                label={t('stageNameEn')}
                value={stage.name?.en || ''}
                localeValue={stage.name}
                translatable
                onLocaleChange={(next) => updateStage(index, { name: next })}
                onChange={() => {}}
              />

              <label className='admin-field'>
                <span className='admin-field-label'>{t('nextStage')}</span>
                <select
                  className='admin-field-control'
                  value={stage.nextStageId || ''}
                  onChange={(e) =>
                    updateStage(index, { nextStageId: e.target.value })
                  }
                >
                  <option value=''>{t('noNextStage')}</option>
                  {stageOptions
                    .filter((opt) => opt.id !== stage.id)
                    .map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                </select>
              </label>

              <label className='admin-field'>
                <span className='admin-field-label'>{t('stagePermission')}</span>
                <input
                  className='admin-field-control'
                  value={stage.permission || ''}
                  onChange={(e) =>
                    updateStage(index, { permission: e.target.value })
                  }
                  placeholder={t('stagePermissionPlaceholder')}
                  dir='ltr'
                />
                <span className='admin-meta'>{t('stagePermissionHint')}</span>
              </label>
            </div>
          ))}

          <button
            type='button'
            className='admin-button secondary'
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                stages: [
                  ...(prev.stages || []),
                  emptyStage((prev.stages || []).length),
                ],
              }))
            }
          >
            {t('addStage')}
          </button>
        </div>

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
              <th>{t('workflowName')}</th>
              <th>{t('workflowStages')}</th>
              <th>{t('order')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4}>{t('noWorkflows')}</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td dir='auto'>{getLocalized(item.name, language)}</td>
                  <td>{(item.stages || []).length}</td>
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

export default AdminWorkflows;

import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import Spinner from '../../components/spinner/spinner.component.jsx';
import PhoneInput from '../../components/phone-input/phone-input.component.jsx';

import { UserContext } from '../../contexts/user.context.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';
import {
  getServiceById,
  getWorkflowById,
  createServiceApplication,
  getServiceApplication,
  updateServiceApplication,
} from '../../utils/firebase/firebase.utils.js';
import { getLocalized, normalizeLocaleValue } from '../../utils/i18n.js';

import './e-services-apply.styles.scss';

const EServicesApply = () => {
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const appIdParam = searchParams.get('app') || '';
  const navigate = useNavigate();

  const { currentUser, userProfile } = useContext(UserContext);
  const { language, t } = useContext(LanguageContext);

  const [service, setService] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [applicationId, setApplicationId] = useState(appIdParam);
  const [values, setValues] = useState({});
  const [currentStageId, setCurrentStageId] = useState('');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');

  const displayName =
    userProfile?.displayName ||
    currentUser?.displayName ||
    currentUser?.email ||
    '';
  const photoURL = userProfile?.photoURL || currentUser?.photoURL || '';

  const fields = useMemo(() => {
    if (!service || !Array.isArray(service.formFields)) return [];
    return service.formFields;
  }, [service]);

  const stages = useMemo(() => {
    if (workflow?.stages?.length) return workflow.stages;
    if (service?.workflowSteps?.length) {
      return service.workflowSteps.map((step, index) => ({
        id: `legacy_${index}`,
        name: normalizeLocaleValue(step),
        nextStageId: `legacy_${index + 1}`,
        permission: '',
        order: index,
      }));
    }
    return [
      {
        id: 'draft',
        name: { en: 'Draft', ar: 'المسودة' },
        nextStageId: 'submitted',
        permission: '',
        order: 0,
      },
      {
        id: 'submitted',
        name: { en: 'Submitted', ar: 'مُقدَّم' },
        nextStageId: '',
        permission: '',
        order: 1,
      },
    ];
  }, [workflow, service]);

  const currentStageIndex = useMemo(() => {
    if (!stages.length) return 0;
    const idx = stages.findIndex((s) => s.id === currentStageId);
    return idx >= 0 ? idx : 0;
  }, [stages, currentStageId]);

  const currentStage = stages[currentStageIndex] || null;
  const nextStageId = currentStage?.nextStageId || '';
  const nextStage = stages.find((s) => s.id === nextStageId) || null;
  const isFinalStage = !nextStageId || !nextStage;

  useEffect(() => {
    let active = true;

    const boot = async () => {
      try {
        const svc = await getServiceById(serviceId);
        if (!active) return;
        if (!svc || svc.enabled === false) {
          setError(t('serviceNotFound'));
          setLoading(false);
          return;
        }
        setService(svc);

        let wf = null;
        if (svc.workflowId) {
          wf = await getWorkflowById(svc.workflowId);
          if (active) setWorkflow(wf);
        }

        const resolvedStages =
          wf?.stages?.length > 0
            ? wf.stages
            : svc.workflowSteps?.length
              ? svc.workflowSteps.map((step, index) => ({
                  id: `legacy_${index}`,
                  nextStageId: `legacy_${index + 1}`,
                }))
              : [{ id: 'draft', nextStageId: 'submitted' }, { id: 'submitted' }];

        const firstStageId = resolvedStages[0]?.id || 'draft';

        let appId = appIdParam;
        let existing = null;
        if (appId) {
          existing = await getServiceApplication(appId);
          if (
            !existing ||
            existing.userId !== currentUser?.uid ||
            existing.serviceId !== serviceId
          ) {
            existing = null;
            appId = '';
          }
        }

        if (existing) {
          setApplicationId(existing.id);
          setValues(existing.values || {});
          setStatus(existing.status || 'draft');
          setCurrentStageId(existing.currentStageId || firstStageId);
        } else {
          const initial = {};
          (svc.formFields || []).forEach((field) => {
            initial[field.id] = '';
          });
          if (currentUser?.email) {
            const emailField = (svc.formFields || []).find(
              (f) => f.type === 'email'
            );
            if (emailField) initial[emailField.id] = currentUser.email;
          }
          const newId = await createServiceApplication({
            userId: currentUser.uid,
            userEmail: currentUser.email || '',
            userName: displayName,
            userPhoto: photoURL,
            serviceId,
            serviceTitle: svc.title,
            values: initial,
            status: 'draft',
            workflowId: svc.workflowId || '',
            currentStageId: firstStageId,
          });
          if (!active) return;
          setApplicationId(newId);
          setValues(initial);
          setStatus('draft');
          setCurrentStageId(firstStageId);
          navigate(`/e-services/apply/${serviceId}?app=${newId}`, {
            replace: true,
          });
        }
      } catch (err) {
        if (active) setError(t('servicesLoadError'));
      } finally {
        if (active) setLoading(false);
      }
    };

    if (currentUser?.uid) boot();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, currentUser?.uid]);

  const setField = (id, value) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const validate = () => {
    for (const field of fields) {
      if (!field.required) continue;
      const val = String(values[field.id] ?? '').trim();
      if (!val) return t('fillRequiredFields');
    }
    return '';
  };

  const handleSaveDraft = async () => {
    if (!applicationId) return;
    setSaving(true);
    setFeedback(null);
    try {
      await updateServiceApplication(applicationId, {
        values,
        status,
        currentStageId,
        userName: displayName,
        userPhoto: photoURL,
      });
      setFeedback({ type: 'success', text: t('applicationSaved') });
    } catch (err) {
      setFeedback({ type: 'error', text: t('applicationSaveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitNext = async () => {
    if (!applicationId) return;
    const problem = validate();
    if (problem) {
      setFeedback({ type: 'error', text: problem });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      if (isFinalStage) {
        await updateServiceApplication(applicationId, {
          values,
          status: 'submitted',
          currentStageId,
          userName: displayName,
          userPhoto: photoURL,
        });
        setStatus('submitted');
        setFeedback({ type: 'success', text: t('applicationCompleted') });
      } else {
        const targetStageId = nextStageId;
        await updateServiceApplication(applicationId, {
          values,
          status: 'in_progress',
          currentStageId: targetStageId,
          userName: displayName,
          userPhoto: photoURL,
        });
        setCurrentStageId(targetStageId);
        setStatus('in_progress');
        setFeedback({
          type: 'success',
          text: t('movedToNextStage').replace(
            '{stage}',
            getLocalized(nextStage?.name, language)
          ),
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: t('applicationSaveFailed') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  if (error || !service) {
    return (
      <div className='eservices-empty'>
        {error || t('serviceNotFound')}
        <div>
          <Link to='/services'>{t('backToServices')}</Link>
        </div>
      </div>
    );
  }

  const title = getLocalized(service.title, language);
  const readOnly = status === 'submitted' && isFinalStage;

  return (
    <div className='es-apply'>
      <div className='es-apply-breadcrumb'>
        <Link to='/services'>{t('servicesNav')}</Link>
        <span>/</span>
        <span dir='auto'>{title}</span>
      </div>

      <h1 className='eservices-page-title' dir='auto'>
        {title}
      </h1>

      <div className='es-apply-steps' aria-label={t('workflow')}>
        {stages.map((stage, index) => {
          const done = index < currentStageIndex;
          const active = index === currentStageIndex;
          return (
            <div
              key={stage.id}
              className={`es-apply-step${active ? ' active' : ''}${
                done ? ' done' : ''
              }`}
            >
              <span className='dot'>{index + 1}</span>
              <span className='label'>{getLocalized(stage.name, language)}</span>
            </div>
          );
        })}
      </div>

      <div className='es-apply-applicant eservices-card'>
        {photoURL ? (
          <img src={photoURL} alt='' className='es-apply-photo' />
        ) : (
          <div className='es-apply-photo fallback'>
            {(displayName || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <strong dir='auto'>{displayName}</strong>
          <p dir='ltr'>{currentUser?.email}</p>
        </div>
        <div className='es-apply-ref-wrap'>
          <span className='es-apply-ref' dir='ltr'>
            {applicationId}
          </span>
          {currentStage && (
            <span className='es-apply-stage-badge' dir='auto'>
              {getLocalized(currentStage.name, language)}
            </span>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`es-apply-feedback${
            feedback.type === 'error' ? ' error' : ''
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form
        className='es-apply-form eservices-card'
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitNext();
        }}
      >
        {fields.length === 0 ? (
          <p className='muted'>{t('serviceFormNotConfigured')}</p>
        ) : (
          <div className='es-apply-grid'>
            {fields.map((field) => {
              const label = getLocalized(
                normalizeLocaleValue(field.label),
                language
              );
              const common = {
                id: field.id,
                disabled: readOnly || saving,
                required: Boolean(field.required),
                value: values[field.id] || '',
                onChange: (e) => setField(field.id, e.target.value),
              };

              return (
                <label key={field.id} className='es-field'>
                  <span>
                    {label}
                    {field.required ? ' *' : ''}
                  </span>
                  {field.type === 'textarea' ? (
                    <textarea rows={4} {...common} dir='auto' />
                  ) : field.type === 'select' ? (
                    <select {...common}>
                      <option value=''>{t('selectOption')}</option>
                      {(field.options || []).map((opt, idx) => (
                        <option key={idx} value={getLocalized(opt, 'en')}>
                          {getLocalized(opt, language)}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'phone' ? (
                    <PhoneInput
                      value={values[field.id] || ''}
                      onChange={(val) => setField(field.id, val)}
                      disabled={readOnly || saving}
                    />
                  ) : field.type === 'date' ? (
                    <input type='date' {...common} />
                  ) : field.type === 'email' ? (
                    <input type='email' {...common} dir='ltr' />
                  ) : (
                    <input type='text' {...common} dir='auto' />
                  )}
                </label>
              );
            })}
          </div>
        )}

        {!readOnly && (
          <div className='es-apply-actions'>
            <button
              type='button'
              className='es-btn secondary'
              disabled={saving}
              onClick={handleSaveDraft}
            >
              {saving ? t('saving') : t('saveDraft')}
            </button>
            <button
              type='submit'
              className='es-btn'
              disabled={saving || !fields.length}
            >
              {saving
                ? t('saving')
                : isFinalStage
                  ? t('submitApplication')
                  : t('moveToNextStage')}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default EServicesApply;

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './../Style/App.css';
import './../Style/Dashboard.css';
import { fetchUsers, fetchUserById, submitForm, updateTraining } from '../api';
import { getSession, clearSession } from '../session';
import WordViewerModal from './WordViewerModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import LeftCarousel   from './training/LeftCarousel';
import DateBtn        from './training/DateBtn';
import CustomSelect   from './training/CustomSelect';
import MultiUserSelect from './training/MultiUserSelect';
import FileUploadArea  from './training/FileUploadArea';
import DashboardNavbar from './dashboard/DashboardNavbar';
import Sidebar         from './dashboard/Sidebar';

const MAX_CHARS = 2000;

const PLANT_DEPARTMENTS = [
  'AVOCarbon France',
  'AVOCarbon Cyclam',
  'Assymex Monterry',
  'AVOCarbon Tianjin',
  'AVOCarbon Germany',
  'AVOCarbon Tunisia',
  'AVOCarbon Kunshan',
  'AVOCarbon India',
  'Same Tunisie Service',
  'AVOCarbon Korea',
  'Financial Department',
  'R&D Department',
  'Sales Department',
  'Puschasing Department',
  'HR Department',
  'Group Management',
  'Quality Department',
  'IT Department',
  'Project Managemnt Department',
];

const TRAINING_TYPES = [
  'Tutorials on a new tool or process',
  'Products & Applications Training',
  'Technical Training',
  'Soft Skills Training',
];

const REQUIREMENTS = [
  'New Training',
  'Updating existing Training',
];

/* ── TrainingForm page ────────────────────────────────────────── */
export default function TrainingForm({ training = null, onClose = null, onSaved = null }) {
  const editMode = training !== null;
  const navigate = useNavigate();
  const { member } = getSession() ?? {};

  const handleSignOut = () => {
    clearSession();
    navigate('/login', { replace: true });
  };
  const [users,     setUsers]     = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState({
    trainingModuleName: training?.name ?? '',
    plantDepartment:    training?.department ?? '',
    requester_id:       (training?.requesters ?? []).map(u => String(u.id ?? u)),
    requester_supervisor_id: (training?.requesterSupervisors ?? []).map(u => String(u.id ?? u)),
    typeOfTraining:     training?.type_of_training ?? '',
    requirement:        training?.requirement ?? '',
    trainingObjectives: training?.training_objectives ?? training?.objectives ?? '',
    targetAudience:     training?.target_audience ?? '',
    requestedKPIs:      training?.requested_kpis ?? training?.kpis ?? '',
    desiredPublicationDate: training?.publication_date ? training.publication_date.split('T')[0] : '',
    information:        training?.information ?? '',
  });

  const [photoFiles, setPhotoFiles] = useState([]);
  const [quizFiles,  setQuizFiles]  = useState([]);
  const [existingMedia,   setExistingMedia]   = useState(editMode ? (training?.media   ?? []) : []);
  const [existingQuizzes, setExistingQuizzes] = useState(editMode ? (training?.quizzes ?? []) : []);
  const removedMediaPaths = useRef([]);
  const removedQuizPaths  = useRef([]);
  const [errors,     setErrors]     = useState({});
  const [submitted,  setSubmitted]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [wordViewer, setWordViewer] = useState(null);

  useEffect(() => {
    fetchUsers()
      .then(allUsers => setUsers(allUsers))
      .catch(() => setLoadError('Impossible de charger les utilisateurs depuis le serveur.'));
  }, []);

  // Auto-fill supervisor from manager when requester changes (create mode only)
  useEffect(() => {
    if (editMode || !form.requester_id || form.requester_id.length === 0) return;
    let cancelled = false;

    const resolveManagers = async () => {
      const managerIds = [];
      for (const rid of form.requester_id) {
        // First try from already-loaded users list
        let user = users.find(u => String(u.id) === String(rid));
        // If not found or no manager field, call API
        if (!user || (
          !user.manager_id && !user.manager?.id &&
          !user.reports_to_id && !user.reports_to?.id
        )) {
          user = await fetchUserById(rid).catch(() => null);
        }
        if (!user) continue;
        const mid = user.manager_id ?? user.manager?.id ??
                    user.reports_to_id ?? user.reports_to?.id ?? null;
        if (mid && !managerIds.includes(String(mid))) managerIds.push(String(mid));
      }
      if (cancelled) return;
      if (managerIds.length > 0) {
        setForm(prev => ({ ...prev, requester_supervisor_id: managerIds }));
        setErrors(prev => ({ ...prev, requester_supervisor_id: undefined }));
      }
    };

    resolveManagers();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.requester_id.join(',')]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleRemoveExistingMedia = (index) => {
    const file = existingMedia[index];
    if (file?.file_path) removedMediaPaths.current.push(file.file_path);
    setExistingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingQuiz = (index) => {
    const file = existingQuizzes[index];
    if (file?.file_path) removedQuizPaths.current.push(file.file_path);
    setExistingQuizzes(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    const required = [
      'trainingModuleName', 'plantDepartment',
      'typeOfTraining', 'requirement',
      'trainingObjectives', 'targetAudience', 'requestedKPIs',
      'desiredPublicationDate',
    ];
    required.forEach(f => { if (!form[f]) errs[f] = 'Ce champ est obligatoire.'; });
    if (!form.requester_id || form.requester_id.length === 0) errs.requester_id = 'Ce champ est obligatoire.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (!editMode) setTimeout(() => {
        document.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('name',                form.trainingModuleName);
      data.append('department',          form.plantDepartment);
      form.requester_id.forEach(id            => data.append('requester_id',            id));
      form.requester_supervisor_id.forEach(id => data.append('requester_supervisor_id', id));
      data.append('type_of_training',    form.typeOfTraining);
      data.append('requirement',         form.requirement);
      data.append('training_objectives', form.trainingObjectives);
      data.append('target_audience',     form.targetAudience);
      data.append('requested_kpis',      form.requestedKPIs);
      data.append('publication_date',    form.desiredPublicationDate);
      if (form.information) data.append('information', form.information);
      photoFiles.forEach(f => data.append('media', f));
      quizFiles.forEach(f  => data.append('quiz',  f));
      removedMediaPaths.current.forEach(p => data.append('remove_media', p));
      removedQuizPaths.current.forEach(p  => data.append('remove_quiz',  p));
      if (editMode) {
        const res = await updateTraining(training.id, data);
        onSaved(res.data ?? res);
        onClose();
      } else {
        await submitForm(data);
        setSubmitted(true);
      }
    } catch (err) {
      alert(editMode
        ? `Update failed.\n${err.message}`
        : `Une erreur est survenue lors de l'envoi du formulaire.\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 15);

  /* ── Success screen ── */
  if (!editMode && submitted) {
    return (
      <div className="db-page">
        <DashboardNavbar member={member} onSignOut={handleSignOut} />
        <div className="db-body">
          <Sidebar />
          <main className="db-main">
            <div className="tf-success-wrap">
              <div className="tf-success-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="tf-success-title">Request submitted!</h2>
              <p className="tf-success-sub">Thank you for your request. We will get back to you shortly.</p>
              <button className="tf-success-btn" onClick={() => window.location.reload()}>
                New Request
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  const formCard = (
    <div className="form-card">

      {editMode ? (
        <div className="tf-edit-hd">
          <div className="tf-brand" style={{ padding: '24px 52px 0' }}>
            <img src="/img/logo.PNG" alt="AVO Carbon Group" className="tf-brand-logo" />
            <div className="tf-brand-divider" />
            <h1 className="form-title">Edit Training Request</h1>
          </div>
          <button type="button" className="mdl-close tf-close-btn" onClick={onClose} title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ) : (
        <div className="tf-brand">
          <img src="/img/logo.PNG" alt="AVO Carbon Group" className="tf-brand-logo" />
          <div className="tf-brand-divider" />
          <h1 className="form-title">
            Request for the creation and design of a training module
          </h1>
        </div>
      )}

      {loadError && (
        <div className="load-error">⚠️ {loadError}</div>
      )}

          <form onSubmit={handleSubmit} noValidate>

            {/* 1 ── Training module name */}
            <div className={`fg${errors.trainingModuleName ? ' fg-error' : ''}`}>
              <label>Training module name <span className="req">*</span></label>
              <input
                type="text"
                name="trainingModuleName"
                value={form.trainingModuleName}
                onChange={handleChange}
                placeholder="Incoming form answer"
                className="fi"
              />
              {errors.trainingModuleName && <span className="field-error">{errors.trainingModuleName}</span>}
            </div>

            {/* 2 ── Plant / Department */}
            <div className={`fg${errors.plantDepartment ? ' fg-error' : ''}`}>
              <label>Plant / Department <span className="req">*</span></label>
              <CustomSelect
                name="plantDepartment"
                value={form.plantDepartment}
                onChange={handleChange}
                placeholder="Select Plant / Department"
                options={PLANT_DEPARTMENTS.map(o => ({ value: o, label: o }))}
              />
              {errors.plantDepartment && <span className="field-error">{errors.plantDepartment}</span>}
            </div>

            {/* 3 ── Requester */}
            <div className={`fg${errors.requester_id ? ' fg-error' : ''}`}>
              <label>Requester <span className="req">*</span></label>
              <MultiUserSelect
                name="requester_id"
                value={form.requester_id}
                onChange={handleChange}
                placeholder={users.length === 0 ? 'Chargement...' : 'Select Requester(s)'}
                disabled={users.length === 0}
                options={users.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name}` }))}
              />
              {errors.requester_id && <span className="field-error">{errors.requester_id}</span>}
            </div>

            {/* 4 ── Requester Supervisor (auto-filled from DB) */}
            <div className="fg">
              <label>Requester Supervisor</label>
              {form.requester_supervisor_id.length === 0
                ? <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Auto-filled after selecting requester</p>
                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {form.requester_supervisor_id.map(id => {
                      const u = users.find(u => String(u.id) === String(id));
                      return u
                        ? <span key={id} style={{ background: 'var(--blue-xlt)', color: 'var(--blue)', borderRadius: 6, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>{u.first_name} {u.last_name}</span>
                        : null;
                    })}
                  </div>
              }
            </div>

            {/* 5 ── Type of Training */}
            <div className={`fg${errors.typeOfTraining ? ' fg-error' : ''}`}>
              <label>Type of Training <span className="req">*</span></label>
              <CustomSelect
                name="typeOfTraining"
                value={form.typeOfTraining}
                onChange={handleChange}
                placeholder="Select Type of Training"
                options={TRAINING_TYPES.map(o => ({ value: o, label: o }))}
              />
              {errors.typeOfTraining && <span className="field-error">{errors.typeOfTraining}</span>}
            </div>

            {/* 6 ── Requirement */}
            <div className={`fg${errors.requirement ? ' fg-error' : ''}`}>
              <label>Requirement <span className="req">*</span></label>
              <CustomSelect
                name="requirement"
                value={form.requirement}
                onChange={handleChange}
                placeholder="Select Requirement"
                options={REQUIREMENTS.map(o => ({ value: o, label: o }))}
              />
              {errors.requirement && <span className="field-error">{errors.requirement}</span>}
            </div>

            {/* 7 ── Training objectives */}
            <div className={`fg${errors.trainingObjectives ? ' fg-error' : ''}`}>
              <label>Training objectives <span className="req">*</span></label>
              <p className="fd">At the end of the training, learners should be able to ...</p>
              <textarea
                name="trainingObjectives"
                value={form.trainingObjectives}
                onChange={handleChange}
                className="ft"
                maxLength={MAX_CHARS}
              />
              <div className="cc">{form.trainingObjectives.length} / {MAX_CHARS}</div>
              {errors.trainingObjectives && <span className="field-error">{errors.trainingObjectives}</span>}
            </div>

            {/* 8 ── Target audience */}
            <div className={`fg${errors.targetAudience ? ' fg-error' : ''}`}>
              <label>Target audience (departments or name of specific employees) <span className="req">*</span></label>
              <textarea
                name="targetAudience"
                value={form.targetAudience}
                onChange={handleChange}
                className="ft"
                maxLength={MAX_CHARS}
              />
              <div className="cc">{form.targetAudience.length} / {MAX_CHARS}</div>
              {errors.targetAudience && <span className="field-error">{errors.targetAudience}</span>}
            </div>

            {/* 9 ── Requested KPIs */}
            <div className={`fg${errors.requestedKPIs ? ' fg-error' : ''}`}>
              <label>Requested KPIs <span className="req">*</span></label>
              <p className="fd">example: training completion rate, quiz success rate</p>
              <textarea
                name="requestedKPIs"
                value={form.requestedKPIs}
                onChange={handleChange}
                className="ft"
                maxLength={MAX_CHARS}
              />
              <div className="cc">{form.requestedKPIs.length} / {MAX_CHARS}</div>
              {errors.requestedKPIs && <span className="field-error">{errors.requestedKPIs}</span>}
            </div>

            {/* 10 ── Photo & Video */}
            <FileUploadArea
              label="Photo & Video"
              description="please supply good-quality photos in JPEG or PNG format and videos in MP4 format (if possible, without background sound)"
              files={photoFiles}
              setFiles={setPhotoFiles}
              accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              serverFiles={existingMedia}
              onRemoveServerFile={editMode ? handleRemoveExistingMedia : null}
            />

            {/* 11 ── Quiz */}
            <FileUploadArea
              label="Quiz"
              description="if you would like to add a quiz, please provide us with the questions and answers if possible (about 8-10 questions) in a Word document"
              files={quizFiles}
              setFiles={setQuizFiles}
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              serverFiles={existingQuizzes}
              onRemoveServerFile={editMode ? handleRemoveExistingQuiz : null}
              onFileClick={(src, fname) => setWordViewer({ source: src, name: fname })}
            />

            {/* 12 ── Desired publication date */}
            <div className={`fg${errors.desiredPublicationDate ? ' fg-error' : ''}`}>
              <label>Desired publication date of the training course <span className="req">*</span></label>
              <p className="fd">
                please allow at least <strong className="highlight">15</strong> days for delivery
              </p>
              <DatePicker
                selected={form.desiredPublicationDate ? new Date(form.desiredPublicationDate + 'T00:00:00') : null}
                onChange={(date) => {
                  const val = date ? date.toLocaleDateString('en-CA') : '';
                  setForm(prev => ({ ...prev, desiredPublicationDate: val }));
                  setErrors(prev => ({ ...prev, desiredPublicationDate: undefined }));
                }}
                minDate={minDate}
                dateFormat="dd MMMM yyyy"
                placeholderText="Select date"
                customInput={<DateBtn />}
                calendarClassName="avo-calendar"
                showPopperArrow={false}
                popperPlacement="bottom-start"
              />
              {errors.desiredPublicationDate && <span className="field-error">{errors.desiredPublicationDate}</span>}
            </div>

            {/* 13 ── Information */}
            <div className="fg">
              <label>Information</label>
              <p className="fd">if you wish to add further information to create this training course</p>
              <textarea
                name="information"
                value={form.information}
                onChange={handleChange}
                className="ft"
                maxLength={MAX_CHARS}
              />
              <div className="cc">{form.information.length} / {MAX_CHARS}</div>
            </div>

            {/* Submit */}
            <div className="submit-wrap" style={editMode ? { gap: '16px' } : {}}>
              {editMode && (
                <button type="button" className="upd-cancel-btn" onClick={onClose}>Cancel</button>
              )}
              <button type="submit" className={editMode ? 'upd-save-btn' : 'submit-btn'} disabled={loading}>
                {loading
                  ? (editMode ? 'Saving…' : 'Submitting…')
                  : editMode
                    ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Save Changes</>
                    : 'Submit'
                }
              </button>
            </div>

          </form>
    </div>
  );

  if (editMode) return (
    <>
      {formCard}
      {wordViewer && (
        <WordViewerModal
          source={wordViewer.source}
          name={wordViewer.name}
          onClose={() => setWordViewer(null)}
        />
      )}
    </>
  );

  return (
    <>
      <div className="db-page">
        <DashboardNavbar member={member} onSignOut={handleSignOut} />
        <div className="db-body">
          <Sidebar />
          <main className="db-main">

            {/* Page header */}
            <div className="tf-pg-hd">
              <div className="tf-pg-hd-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div>
                <h1 className="tf-pg-title">New Training Request</h1>
                <p className="tf-pg-sub">Fill in all required fields to submit a training module request.</p>
              </div>
              <div className="tf-pg-logo-wrap">
                <img src="/img/logo.PNG" alt="AVO Carbon Group" className="tf-pg-logo" />
              </div>
            </div>

            {loadError && <div className="load-error">⚠️ {loadError}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="tf-pg-sections">

                {/* ── Section 1: Basic Information ── */}
                <div className="tf-pg-section">
                  <div className="tf-pg-section-hd">
                    <span className="tf-pg-step">1</span>
                    <span>Basic Information</span>
                  </div>
                  <div className="tf-pg-section-body">
                    <div className={`fg${errors.trainingModuleName ? ' fg-error' : ''}`}>
                      <label>Training module name <span className="req">*</span></label>
                      <input type="text" name="trainingModuleName" value={form.trainingModuleName}
                        onChange={handleChange} placeholder="Enter training module name" className="fi" />
                      {errors.trainingModuleName && <span className="field-error">{errors.trainingModuleName}</span>}
                    </div>
                    <div className="tf-pg-row">
                      <div className={`fg${errors.plantDepartment ? ' fg-error' : ''}`}>
                        <label>Plant / Department <span className="req">*</span></label>
                        <CustomSelect name="plantDepartment" value={form.plantDepartment}
                          onChange={handleChange} placeholder="Select Plant / Department"
                          options={PLANT_DEPARTMENTS.map(o => ({ value: o, label: o }))} />
                        {errors.plantDepartment && <span className="field-error">{errors.plantDepartment}</span>}
                      </div>
                      <div className={`fg${errors.typeOfTraining ? ' fg-error' : ''}`}>
                        <label>Type of Training <span className="req">*</span></label>
                        <CustomSelect name="typeOfTraining" value={form.typeOfTraining}
                          onChange={handleChange} placeholder="Select Type of Training"
                          options={TRAINING_TYPES.map(o => ({ value: o, label: o }))} />
                        {errors.typeOfTraining && <span className="field-error">{errors.typeOfTraining}</span>}
                      </div>
                    </div>
                    <div className={`fg${errors.requirement ? ' fg-error' : ''}`} style={{ maxWidth: '50%' }}>
                      <label>Requirement <span className="req">*</span></label>
                      <CustomSelect name="requirement" value={form.requirement}
                        onChange={handleChange} placeholder="Select Requirement"
                        options={REQUIREMENTS.map(o => ({ value: o, label: o }))} />
                      {errors.requirement && <span className="field-error">{errors.requirement}</span>}
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Team ── */}
                <div className="tf-pg-section">
                  <div className="tf-pg-section-hd">
                    <span className="tf-pg-step">2</span>
                    <span>Team</span>
                  </div>
                  <div className="tf-pg-section-body">
                    <div className="tf-pg-row">
                      <div className={`fg${errors.requester_id ? ' fg-error' : ''}`}>
                        <label>Requester <span className="req">*</span></label>
                        <MultiUserSelect name="requester_id" value={form.requester_id}
                          onChange={handleChange}
                          placeholder={users.length === 0 ? 'Loading…' : 'Select Requester(s)'}
                          disabled={users.length === 0}
                          options={users.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name}` }))} />
                        {errors.requester_id && <span className="field-error">{errors.requester_id}</span>}
                      </div>
                      <div className="fg">
                        <label>Requester Supervisor</label>
                        {form.requester_supervisor_id.length === 0
                          ? <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Auto-filled after selecting requester</p>
                          : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                              {form.requester_supervisor_id.map(id => {
                                const u = users.find(u => String(u.id) === String(id));
                                return u
                                  ? <span key={id} style={{ background: 'var(--blue-xlt)', color: 'var(--blue)', borderRadius: 6, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>{u.first_name} {u.last_name}</span>
                                  : null;
                              })}
                            </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Training Content ── */}
                <div className="tf-pg-section">
                  <div className="tf-pg-section-hd">
                    <span className="tf-pg-step">3</span>
                    <span>Training Content</span>
                  </div>
                  <div className="tf-pg-section-body">
                    <div className={`fg${errors.trainingObjectives ? ' fg-error' : ''}`}>
                      <label>Training objectives <span className="req">*</span></label>
                      <p className="fd">At the end of the training, learners should be able to …</p>
                      <textarea name="trainingObjectives" value={form.trainingObjectives}
                        onChange={handleChange} className="ft" maxLength={MAX_CHARS} />
                      <div className="cc">{form.trainingObjectives.length} / {MAX_CHARS}</div>
                      {errors.trainingObjectives && <span className="field-error">{errors.trainingObjectives}</span>}
                    </div>
                    <div className={`fg${errors.targetAudience ? ' fg-error' : ''}`}>
                      <label>Target audience <span className="req">*</span></label>
                      <p className="fd">departments or name of specific employees</p>
                      <textarea name="targetAudience" value={form.targetAudience}
                        onChange={handleChange} className="ft" maxLength={MAX_CHARS} />
                      <div className="cc">{form.targetAudience.length} / {MAX_CHARS}</div>
                      {errors.targetAudience && <span className="field-error">{errors.targetAudience}</span>}
                    </div>
                    <div className={`fg${errors.requestedKPIs ? ' fg-error' : ''}`}>
                      <label>Requested KPIs <span className="req">*</span></label>
                      <p className="fd">example: training completion rate, quiz success rate</p>
                      <textarea name="requestedKPIs" value={form.requestedKPIs}
                        onChange={handleChange} className="ft" maxLength={MAX_CHARS} />
                      <div className="cc">{form.requestedKPIs.length} / {MAX_CHARS}</div>
                      {errors.requestedKPIs && <span className="field-error">{errors.requestedKPIs}</span>}
                    </div>
                    <div className="fg">
                      <label>Additional Information</label>
                      <p className="fd">if you wish to add further information to create this training course</p>
                      <textarea name="information" value={form.information}
                        onChange={handleChange} className="ft" maxLength={MAX_CHARS} />
                      <div className="cc">{form.information.length} / {MAX_CHARS}</div>
                    </div>
                  </div>
                </div>

                {/* ── Section 4: Files & Date ── */}
                <div className="tf-pg-section">
                  <div className="tf-pg-section-hd">
                    <span className="tf-pg-step">4</span>
                    <span>Files &amp; Date</span>
                  </div>
                  <div className="tf-pg-section-body">
                    <FileUploadArea label="Photo & Video"
                      description="please supply good-quality photos in JPEG or PNG format and videos in MP4 format (if possible, without background sound)"
                      files={photoFiles} setFiles={setPhotoFiles}
                      accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,image/jpeg,image/png,image/webp,video/mp4,video/quicktime" />
                    <FileUploadArea label="Quiz"
                      description="if you would like to add a quiz, please provide us with the questions and answers if possible (about 8-10 questions) in a Word document"
                      files={quizFiles} setFiles={setQuizFiles}
                      accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onFileClick={(src, fname) => setWordViewer({ source: src, name: fname })} />
                    <div className={`fg${errors.desiredPublicationDate ? ' fg-error' : ''}`} style={{ maxWidth: '50%' }}>
                      <label>Desired publication date <span className="req">*</span></label>
                      <p className="fd">please allow at least <strong className="highlight">15</strong> days for delivery</p>
                      <DatePicker
                        selected={form.desiredPublicationDate ? new Date(form.desiredPublicationDate + 'T00:00:00') : null}
                        onChange={date => {
                          const val = date ? date.toLocaleDateString('en-CA') : '';
                          setForm(prev => ({ ...prev, desiredPublicationDate: val }));
                          setErrors(prev => ({ ...prev, desiredPublicationDate: undefined }));
                        }}
                        minDate={minDate}
                        dateFormat="dd MMMM yyyy"
                        placeholderText="Select date"
                        customInput={<DateBtn />}
                        calendarClassName="avo-calendar"
                        showPopperArrow={false}
                        popperPlacement="bottom-start"
                      />
                      {errors.desiredPublicationDate && <span className="field-error">{errors.desiredPublicationDate}</span>}
                    </div>
                  </div>
                </div>

              </div>{/* .tf-pg-sections */}

              {/* Submit footer */}
              <div className="tf-pg-footer">
                <button type="submit" className="tf-pg-submit" disabled={loading}>
                  {loading ? (
                    <><span className="tf-pg-spinner" />Submitting…</>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      Submit Request
                    </>
                  )}
                </button>
              </div>

            </form>
          </main>
        </div>
      </div>
      {wordViewer && (
        <WordViewerModal source={wordViewer.source} name={wordViewer.name}
          onClose={() => setWordViewer(null)} />
      )}
    </>
  );
}

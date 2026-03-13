import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTrainings } from '../api';
import { getSession, clearSession } from '../session';
import WordViewerModal from './WordViewerModal';
import MediaModal from './dashboard/MediaModal';
import DashboardNavbar from './dashboard/DashboardNavbar';
import DashboardStats from './dashboard/DashboardStats';
import TrainingsTable from './dashboard/TrainingsTable';
import Sidebar from './dashboard/Sidebar';
import CustomSelect from './training/CustomSelect';
import './../Style/App.css';
import './../Style/Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { member } = getSession();

  const [trainings,   setTrainings]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requesterFilter, setRequesterFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [requirementFilter, setRequirementFilter] = useState('all');
  const [expandedRow, setExpandedRow] = useState(null);
  const [modal,       setModal]       = useState(null);
  const [wordModal,   setWordModal]   = useState(null);

  useEffect(() => {
    fetchTrainings()
      .then(data => setTrainings(data))
      .catch(err  => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  const refresh = () =>
    fetchTrainings()
      .then(data => setTrainings(data))
      .catch(err  => setError(err.message));

  const createOptions = values => Array.from(new Set(values.filter(Boolean)))
    .sort((left, right) => left.localeCompare(right));

  const statusOptions = createOptions(trainings.map(training => training.status));
  const departmentOptions = createOptions(trainings.map(training => training.department));
  const typeOptions = createOptions(trainings.map(training => training.type_of_training));
  const requirementOptions = createOptions(trainings.map(training => training.requirement));

  const requesterOptions = Array.from(
    new Map(
      trainings
        .flatMap(training => training.requesters ?? [])
        .filter(requester => requester?.id != null)
        .map(requester => [
          String(requester.id),
          {
            id: String(requester.id),
            label: requester.display_name
              ?? [requester.first_name, requester.last_name].filter(Boolean).join(' ')
              ?? requester.email
              ?? `Requester #${requester.id}`,
          },
        ])
    ).values()
  ).sort((left, right) => left.label.localeCompare(right.label));

  const statusSelectOptions = [{ value: 'all', label: 'All statuses' }, ...statusOptions.map(option => ({ value: option, label: option }))];
  const requesterSelectOptions = [{ value: 'all', label: 'All requesters' }, ...requesterOptions.map(option => ({ value: option.id, label: option.label }))];
  const departmentSelectOptions = [{ value: 'all', label: 'All departments' }, ...departmentOptions.map(option => ({ value: option, label: option }))];
  const typeSelectOptions = [{ value: 'all', label: 'All types' }, ...typeOptions.map(option => ({ value: option, label: option }))];
  const requirementSelectOptions = [{ value: 'all', label: 'All requirements' }, ...requirementOptions.map(option => ({ value: option, label: option }))];

  const displayed = trainings.filter(t => {
    const requesterSearch = (t.requesters ?? [])
      .flatMap(requester => [
        requester.display_name,
        requester.first_name,
        requester.last_name,
        requester.email,
      ])
      .filter(Boolean)
      .join(' ');

    const matchesSearch = [t.name, t.department, t.type_of_training, requesterSearch]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesRequester = requesterFilter === 'all'
      || (t.requesters ?? []).some(requester => String(requester.id) === requesterFilter);

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || t.department === departmentFilter;
    const matchesType = typeFilter === 'all' || t.type_of_training === typeFilter;
    const matchesRequirement = requirementFilter === 'all' || t.requirement === requirementFilter;

    return matchesSearch
      && matchesRequester
      && matchesStatus
      && matchesDepartment
      && matchesType
      && matchesRequirement;
  });

  const activeFilters = [
    search.trim() ? `Search: ${search.trim()}` : null,
    statusFilter !== 'all' ? `Status: ${statusFilter}` : null,
    requesterFilter !== 'all'
      ? `Requester: ${requesterOptions.find(option => option.id === requesterFilter)?.label ?? requesterFilter}`
      : null,
    departmentFilter !== 'all' ? `Department: ${departmentFilter}` : null,
    typeFilter !== 'all' ? `Type: ${typeFilter}` : null,
    requirementFilter !== 'all' ? `Requirement: ${requirementFilter}` : null,
  ].filter(Boolean);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRequesterFilter('all');
    setDepartmentFilter('all');
    setTypeFilter('all');
    setRequirementFilter('all');
  };

  const stats = {
    total:      trainings.length,
    pending:    trainings.filter(t => t.status === 'pending').length,
    inProgress: trainings.filter(t => t.status === 'in progress').length,
    done:       trainings.filter(t => t.status === 'done').length,
    rejected:   trainings.filter(t => t.status === 'rejected').length,
    updated:    trainings.filter(t => t.status === 'updated').length,
  };

  return (
    <div className="db-page">
      <DashboardNavbar member={member} onSignOut={handleSignOut} />
      <div className="db-body">
        <Sidebar />
        <main className="db-main">

        {/* Welcome */}
        <div className="db-welcome">
          <div>
            <h1 className="db-welcome-title">
              Welcome back, <span>{member.first_name ?? member.display_name}</span> 👋
            </h1>
            <p className="db-welcome-sub">Here's an overview of all training requests.</p>
          </div>
          <button className="db-btn-new" onClick={() => navigate('/training')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Request
          </button>
        </div>

        {/* Stats */}
        <DashboardStats {...stats} />

        {/* Search toolbar */}
        <div className="db-toolbar db-toolbar-modern">
          <div className="db-toolbar-head">
            <div className="db-search-wrap">
              <svg className="db-search-icon" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="db-search"
                type="text"
                placeholder="Search by training, requester, department, type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="db-clear-filters"
              onClick={clearFilters}
              disabled={activeFilters.length === 0}
            >
              Reset filters
            </button>
          </div>

          <div className="db-filter-grid">
            <div className="db-filter-wrap db-filter-wrap-status">
              <label className="db-filter-label">Status</label>
              <CustomSelect
                name="statusFilter"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                options={statusSelectOptions}
                placeholder="All statuses"
              />
            </div>

            <div className="db-filter-wrap db-filter-wrap-requester">
              <label className="db-filter-label">Requester</label>
              <CustomSelect
                name="requesterFilter"
                value={requesterFilter}
                onChange={e => setRequesterFilter(e.target.value)}
                options={requesterSelectOptions}
                placeholder="All requesters"
              />
            </div>

            <div className="db-filter-wrap db-filter-wrap-department">
              <label className="db-filter-label">Department</label>
              <CustomSelect
                name="departmentFilter"
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                options={departmentSelectOptions}
                placeholder="All departments"
              />
            </div>

            <div className="db-filter-wrap db-filter-wrap-type">
              <label className="db-filter-label">Type</label>
              <CustomSelect
                name="typeFilter"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                options={typeSelectOptions}
                placeholder="All types"
              />
            </div>

            <div className="db-filter-wrap db-filter-wrap-requirement">
              <label className="db-filter-label">Requirement</label>
              <CustomSelect
                name="requirementFilter"
                value={requirementFilter}
                onChange={e => setRequirementFilter(e.target.value)}
                options={requirementSelectOptions}
                placeholder="All requirements"
              />
            </div>
          </div>

          <div className="db-toolbar-meta">
            <span className="db-results-count">{displayed.length} result{displayed.length !== 1 ? 's' : ''}</span>
            <div className="db-active-filters">
              {activeFilters.length > 0 ? activeFilters.map(filter => (
                <span key={filter} className="db-filter-pill">{filter}</span>
              )) : <span className="db-filter-pill db-filter-pill-muted">No active filters</span>}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="db-loading">
            <span className="db-spinner" />
            <p>Loading training requests…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="db-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && displayed.length === 0 && (
          <div className="db-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1"
              strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <p>No training requests found.</p>
          </div>
        )}

        {/* Trainings table */}
        {!loading && !error && displayed.length > 0 && (
          <TrainingsTable
            displayed={displayed}
            expandedRow={expandedRow}
            setExpandedRow={setExpandedRow}
            onOpenMedia={(fs, i) => setModal({ files: fs, index: i })}
            onOpenQuiz={f => setWordModal({ url: f.url, name: f.name })}
            currentUserId={member?.id}
          />
        )}

      </main>
      </div>

      {modal && <MediaModal modal={modal} onClose={() => setModal(null)} />}
      {wordModal && (
        <WordViewerModal
          source={wordModal.url}
          name={wordModal.name}
          onClose={() => setWordModal(null)}
        />
      )}

    </div>
  );
}

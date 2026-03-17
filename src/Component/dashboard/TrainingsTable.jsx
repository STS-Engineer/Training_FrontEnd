import React, { useState } from 'react';
import { normalizeFiles, fileKind, isWordDoc } from './fileHelpers';
import { FilesCell } from './MediaModal';
import CompletionModal from './CompletionModal';

const STATUS_LABEL = {
  pending:       { label: 'Pending',     cls: 'badge-pending'   },
  'in progress': { label: 'In Progress', cls: 'badge-progress'  },
  awaiting_owner_validation: { label: 'Awaiting Owner Validation', cls: 'badge-awaiting-owner' },
  done:          { label: 'Done',        cls: 'badge-done'      },
  rejected:      { label: 'Rejected',    cls: 'badge-rejected'  },
  updated:       { label: 'Updated',     cls: 'badge-updated'   },
  stuck:         { label: 'Stuck',       cls: 'badge-stuck'     },
};

const STATUSES = [
  { key: 'pending',     label: 'Pending',     colorKey: 'orange' },
  { key: 'in progress', label: 'In Progress', colorKey: 'indigo' },
  { key: 'awaiting_owner_validation', label: 'Awaiting Owner Validation', colorKey: 'green' },
  { key: 'done',        label: 'Done',        colorKey: 'teal'   },
  { key: 'rejected',    label: 'Rejected',    colorKey: 'red'    },
  { key: 'updated',     label: 'Updated',     colorKey: 'yellow' },
  { key: 'stuck',       label: 'Stuck',       colorKey: 'amber'  },
];

function Badge({ status }) {
  const s = STATUS_LABEL[status] ?? { label: status, cls: 'badge-pending' };
  return <span className={`db-badge ${s.cls}`}>{s.label}</span>;
}

function PeopleCell({ people, avatarClass }) {
  if (!people || people.length === 0) return <span className="tbl-null">—</span>;
  return (
    <div className="tbl-people">
      {people.map(p => (
        <span key={p.id} className="tbl-person">
          <span className={`tbl-avatar ${avatarClass}`}>
            {(p.display_name?.[0] ?? '?').toUpperCase()}
          </span>
          {p.display_name}
        </span>
      ))}
    </div>
  );
}

function TrainingRow({ training: t, index, expandedRow, setExpandedRow,
  onOpenMedia, onOpenQuiz, statusKey,
  showFirstValidation, showSecondValidation, showRejectedAt,
  showTrainerDoneAt, showDocumentation, showLink, showFinalValidation, showOwnerComment,
  currentUserId, onOpenCompletion }) {
  const isExpanded  = expandedRow === t.id;

  const allMedia  = normalizeFiles(t.media   ?? []);
  const photos    = allMedia.filter(f => fileKind(f) === 'image');
  const videos    = allMedia.filter(f => fileKind(f) === 'video');
  const quizFiles = normalizeFiles(t.quizzes ?? []);
  const docFiles  = normalizeFiles(
    t.documentation_path
      ? [{ file_path: t.documentation_path, file_name: t.documentation_name ?? t.documentation_path.split('/').pop() }]
      : []
  );
  const hasDetails = !!(t.training_objectives ?? t.objectives ?? t.information ?? t.requested_kpis ?? t.kpis ?? t.target_audience);

  return (
    <React.Fragment>
      <tr
        className={`tbl-row tbl-row-${t.status ?? 'pending'}${isExpanded ? ' tbl-row-open' : ''}`}
        onClick={() => hasDetails && setExpandedRow(isExpanded ? null : t.id)}
        style={{ cursor: hasDetails ? 'pointer' : 'default' }}
      >
        <td className="tbl-accent" />
        <td className="tbl-td-num">{index + 1}</td>

        {/* Name + expand chevron */}
        <td className="tbl-td-name">
          <div className="tbl-name-wrap">
            <span>{t.name}</span>
            {hasDetails && (
              <svg
                className={`tbl-chevron${isExpanded ? ' tbl-chevron-open' : ''}`}
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </div>
        </td>

        <td>
          {t.department
            ? <span className="tbl-chip tbl-chip-dept">{t.department}</span>
            : <span className="tbl-null">—</span>}
        </td>

        <td>
          {t.type_of_training
            ? <span className="tbl-chip tbl-chip-type">{t.type_of_training}</span>
            : <span className="tbl-null">—</span>}
        </td>

        <td>
          {t.requirement
            ? <span className="tbl-chip tbl-chip-req">{t.requirement}</span>
            : <span className="tbl-null">—</span>}
        </td>

        <td><PeopleCell people={t.requesters ?? []}           avatarClass="tbl-avatar-blue"   /></td>
        <td><PeopleCell people={t.requesterSupervisors ?? []} avatarClass="tbl-avatar-blue"   /></td>

        <td className="tbl-td-date">
          {t.createdAt ?? t.created_at
            ? new Date(t.createdAt ?? t.created_at).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
              })
            : <span className="tbl-null">—</span>}
        </td>

        <td className="tbl-td-date">
          {t.publication_date
            ? new Date(t.publication_date).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
              })
            : <span className="tbl-null">—</span>}
        </td>

        <td onClick={e => e.stopPropagation()}>
          <FilesCell files={photos} onOpen={onOpenMedia} />
        </td>
        <td onClick={e => e.stopPropagation()}>
          <FilesCell files={videos} onOpen={onOpenMedia} />
        </td>
        <td onClick={e => e.stopPropagation()}>
          <FilesCell files={quizFiles} onOpen={(fs, i) => {
            const f = fs[i];
            if (isWordDoc(f.name)) onOpenQuiz(f);
            else onOpenMedia(fs, i);
          }} />
        </td>

        {/* 1st Validation: badge + date, hidden if all null */}
        {showFirstValidation && (
          <td className="tbl-td-validation">
            {t.first_validation ? (
              <div className="tbl-valid-wrap">
                <span className={`tbl-valid-badge tbl-valid-${t.first_validation.replace('_', '-')}`}>
                  {t.first_validation === 'accepted'
                    ? 'Accepted'
                    : t.first_validation === 'rejected'
                      ? 'Rejected'
                      : 'Update Requested'}
                </span>
                {t.first_approved_at && (
                  <span className="tbl-valid-date">
                    {new Date(t.first_approved_at).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            ) : <span className="tbl-null">—</span>}
          </td>
        )}

        {/* Final Validator: always Karen PERROT, shown when 2nd validation column is active */}
        {showSecondValidation && (
          <td>
            <PeopleCell people={[{ id: 'karen-perrot', display_name: 'Karen PERROT' }]} avatarClass="tbl-avatar-indigo" />
          </td>
        )}

        {/* 2nd Validation: badge + date, hidden if all null */}
        {showSecondValidation && (
          <td className="tbl-td-validation">
            {t.second_validation ? (
              <div className="tbl-valid-wrap">
                <span className={`tbl-valid-badge tbl-valid-${t.second_validation.replace('_', '-')}`}>
                  {t.second_validation === 'accepted'
                    ? 'Accepted'
                    : t.second_validation === 'rejected'
                      ? 'Rejected'
                      : 'Update Requested'}
                </span>
                {t.second_approved_at && (
                  <span className="tbl-valid-date">
                    {new Date(t.second_approved_at).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            ) : <span className="tbl-null">—</span>}
          </td>
        )}

        {showTrainerDoneAt && (
          <td className="tbl-td-date">
            {t.trainer_done_at
              ? new Date(t.trainer_done_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : <span className="tbl-null">—</span>}
          </td>
        )}

        {showDocumentation && (
          <td onClick={e => e.stopPropagation()}>
            <FilesCell files={docFiles} onOpen={(fs, i) => {
              const f = fs[i];
              if (isWordDoc(f.name)) onOpenQuiz(f);
              else onOpenMedia(fs, i);
            }} />
          </td>
        )}

        {showLink && (
          <td onClick={e => e.stopPropagation()}>
            {t.link
              ? <a href={t.link} target="_blank" rel="noopener noreferrer">Open link</a>
              : <span className="tbl-null">—</span>}
          </td>
        )}

        {showFinalValidation && (
          <td className="tbl-td-validation">
            {t.final_validation ? (
              <div className="tbl-valid-wrap">
                <span className={`tbl-valid-badge tbl-valid-${t.final_validation.replace('_', '-')}`}>
                  {t.final_validation === 'accepted' ? 'Accepted' : 'Update Requested'}
                </span>
                {t.final_approved_at && (
                  <span className="tbl-valid-date">
                    {new Date(t.final_approved_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            ) : <span className="tbl-null">—</span>}
          </td>
        )}

        {showOwnerComment && (
          <td className="tbl-td-reason">
            {t.owner_comment
              ? <span className="tbl-reject-reason" title={t.owner_comment}>{t.owner_comment}</span>
              : <span className="tbl-null">—</span>}
          </td>
        )}

        <td><Badge status={t.status ?? 'pending'} /></td>

        {statusKey === 'rejected' && (
          <td className="tbl-td-reason">
            {t.manager_comment
              ? <span className="tbl-reject-reason" title={t.manager_comment}>{t.manager_comment}</span>
              : <span className="tbl-null">—</span>}
          </td>
        )}

        {showRejectedAt && (
          <td className="tbl-td-date">
            {t.rejected_at
              ? new Date(t.rejected_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : <span className="tbl-null">—</span>}
          </td>
        )}

        {/* Done button — only for the assigned trainer in In Progress rows */}
        {statusKey === 'in progress' && t.trainer_id != null && Number(currentUserId) === Number(t.trainer_id) && (
          <td className="tbl-td-notify" onClick={e => e.stopPropagation()}>
            <button
              className="tbl-done-btn"
              onClick={() => onOpenCompletion(t)}
              title="Mark as completed and send documentation"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Done
            </button>
          </td>
        )}

      </tr>

      {/* Expandable detail row */}
      {isExpanded && hasDetails && (
        <tr className="tbl-detail-row">
          <td />
          <td colSpan={14
            + (statusKey === 'rejected' ? 1 : 0)
            + (showRejectedAt ? 1 : 0)
            + (showFirstValidation ? 1 : 0)
            + (showSecondValidation ? 2 : 0)
            + (showTrainerDoneAt ? 1 : 0)
            + (showDocumentation ? 1 : 0)
            + (showLink ? 1 : 0)
            + (showFinalValidation ? 1 : 0)
            + (showOwnerComment ? 1 : 0)
            + (statusKey === 'in progress' && t.trainer_id != null && Number(currentUserId) === Number(t.trainer_id) ? 1 : 0)
          }>
            <div className="tbl-detail-inner">
              {t.target_audience && (
                <div className="tbl-detail-block">
                  <span className="tbl-detail-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    Target Audience
                  </span>
                  <p className="tbl-detail-text">{t.target_audience}</p>
                </div>
              )}
              {(t.training_objectives ?? t.objectives) && (
                <div className="tbl-detail-block">
                  <span className="tbl-detail-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                    </svg>
                    Training Objectives
                  </span>
                  <p className="tbl-detail-text">{t.training_objectives ?? t.objectives}</p>
                </div>
              )}
              {(t.requested_kpis ?? t.kpis) && (
                <div className="tbl-detail-block">
                  <span className="tbl-detail-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    KPIs
                  </span>
                  <p className="tbl-detail-text">{t.requested_kpis ?? t.kpis}</p>
                </div>
              )}
              {t.information && (
                <div className="tbl-detail-block">
                  <span className="tbl-detail-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Additional Information
                  </span>
                  <p className="tbl-detail-text">{t.information}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

export default function TrainingsTable({
  displayed, expandedRow, setExpandedRow, onOpenMedia, onOpenQuiz, currentUserId,
}) {
  const [completionTraining, setCompletionTraining] = useState(null);

  // Global checks: if ANY training (across all sections) has the field set,
  // the column is shown in every section table.
  const showFirstValidation  = displayed.some(t => t.first_validation   != null);
  const showSecondValidation = displayed.some(t => t.second_validation  != null);

  return (
    <>
    <div className="tbl-sections">
      {STATUSES.map(({ key, label, colorKey }) => {
        const rows = displayed.filter(t => (t.status ?? 'pending') === key);
        if (!rows.length) return null;
        const showRejectedAt      = key === 'rejected' && rows.some(t => t.rejected_at        != null);
        const showTrainerDoneAt    = rows.some(t => t.trainer_done_at    != null);
        const showDocumentation    = rows.some(t => t.documentation_name != null);
        const showLink             = rows.some(t => t.link               != null);
        const showFinalValidation  = rows.some(t => t.final_validation   != null);
        const showOwnerComment     = rows.some(t => t.owner_comment      != null);
        return (
          <div key={key} className="tbl-section">
            <div className={`tbl-section-hd tbl-sh-${colorKey}`}>
              <span className={`tbl-sh-dot dot-${colorKey}`} />
              <span className="tbl-sh-title">{label}</span>
              <span className="tbl-sh-count">
                {rows.length} request{rows.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="tbl-th-accent" />
                    <th className="tbl-th-num">#</th>
                    <th>Training Name</th>
                    <th>Department</th>
                    <th>Type</th>
                    <th>Requirement</th>
                    <th>Requester(s)</th>
                    <th>Supervisor(s)</th>
                    <th>Created</th>
                    <th>Pub. Date</th>
                    <th>Photos</th>
                    <th>Videos</th>
                    <th>Quiz</th>
                    {showFirstValidation  && <th>1st Validation</th>}
                    {showSecondValidation && <th>Final Validator</th>}
                    {showSecondValidation && <th>2nd Validation</th>}
                    {showTrainerDoneAt    && <th>Trainer Done At</th>}
                    {showDocumentation   && <th>Documentation</th>}
                    {showLink            && <th>Link</th>}
                    {showFinalValidation  && <th>Final Validation</th>}
                    {showOwnerComment     && <th>Owner Comment</th>}
                    <th>Status</th>
                    {key === 'rejected' && <th>Rejection Reason</th>}
                    {showRejectedAt     && <th>Rejected At</th>}
                    {key === 'in progress' && rows.some(r => r.trainer_id != null && Number(currentUserId) === Number(r.trainer_id)) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t, i) => (
                    <TrainingRow
                      key={t.id}
                      training={t}
                      index={i}
                      statusKey={key}
                      showFirstValidation={showFirstValidation}
                      showSecondValidation={showSecondValidation}
                      showRejectedAt={showRejectedAt}
                      showTrainerDoneAt={showTrainerDoneAt}
                      showDocumentation={showDocumentation}
                      showLink={showLink}
                      showFinalValidation={showFinalValidation}
                      showOwnerComment={showOwnerComment}
                      currentUserId={currentUserId}
                      onOpenCompletion={setCompletionTraining}
                      expandedRow={expandedRow}
                      setExpandedRow={setExpandedRow}
                      onOpenMedia={onOpenMedia}
                      onOpenQuiz={onOpenQuiz}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
    {completionTraining && (
      <CompletionModal
        training={completionTraining}
        onClose={() => setCompletionTraining(null)}
        onSuccess={() => { setCompletionTraining(null); window.location.reload(); }}
      />
    )}
    </>
  );
}

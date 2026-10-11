import { useState, useMemo } from 'react';
import { TrendingUp, Plus, Eye, Award, CheckCircle2, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Card, Button, Badge, Select, Input,
  Textarea, Modal, Field, DataTable, UserCell, DateBadge,
} from '../components/ui.jsx';
import { fullName } from '../lib/format.js';
import { canManage } from '../lib/constants.js';

const COMPETENCIES = [
  { key: 'productivity', label: 'Productivity & Execution' },
  { key: 'quality', label: 'Quality of Work' },
  { key: 'communication', label: 'Communication & Collaboration' },
  { key: 'teamwork', label: 'Teamwork & Initiative' },
  { key: 'leadership', label: 'Leadership / Problem Solving' },
];

function RatingStars({ value = 0, size = 14, interactive = false, onChange }) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;

  return (
    <span
      className={`rating-stars-track ${interactive ? 'rating-interactive' : ''}`}
      role="img"
      aria-label={`${numericValue.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((starIdx) => {
        const diff = numericValue - (starIdx - 1);
        const fillPct = Math.max(0, Math.min(100, Math.round(diff * 100)));

        return (
          <span
            key={starIdx}
            className="rating-star-wrapper"
            style={{ width: size, height: size, cursor: interactive ? 'pointer' : 'default' }}
            onClick={interactive && onChange ? () => onChange(starIdx) : undefined}
            title={interactive ? `Rate ${starIdx} star${starIdx > 1 ? 's' : ''}` : undefined}
          >
            {/* Background Empty / Outline Star */}
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              className="rating-star-bg"
              aria-hidden="true"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Foreground Filled Star (clipped for exact fractional precision) */}
            {fillPct > 0 && (
              <span
                className="rating-star-fill"
                style={{ width: `${fillPct}%` }}
                aria-hidden="true"
              >
                <svg
                  width={size}
                  height={size}
                  viewBox="0 0 24 24"
                  className="rating-star-fg"
                >
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function RatingScoreCell({ score }) {
  const num = typeof score === 'number' ? score : parseFloat(score) || 0;
  return (
    <div className="table-rating-cell">
      <RatingStars value={num} size={14} />
      <span className="rating-score-pill">
        <span className="rating-val font-mono">{num.toFixed(1)}</span>
        <span className="rating-slash">/</span>
        <span className="rating-base font-mono">5.0</span>
      </span>
    </div>
  );
}

function PeriodBadge({ period }) {
  return (
    <span className="period-badge font-mono font-semi">
      {period}
    </span>
  );
}

export default function Performance() {
  const { user } = useAuth();
  const reviewer = canManage(user.role);
  const [page, setPage] = useState(1);
  const query = new URLSearchParams({ page, limit: 12 }).toString();
  const { data, loading, refetch } = useFetch(`/performance?${query}`, [query]);
  const { data: options } = useFetch(reviewer ? '/employees/options' : null);

  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    employeeId: '',
    period: 'Q3 2026',
    ratings: {
      productivity: 4,
      quality: 4,
      communication: 4,
      teamwork: 4,
      leadership: 3,
    },
    strengths: '',
    improvements: '',
    goals: '',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.employeeId) {
      toast.error('Please select an employee');
      return;
    }

    setBusy(true);
    try {
      await api.post('/performance', form);
      toast.success('Performance review submitted');
      setFormOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to submit review');
    } finally {
      setBusy(false);
    }
  };

  const reviews = useMemo(() => data?.data || [], [data]);
  const totalReviews = data?.pagination?.total ?? 0;

  const stats = useMemo(() => {
    const total = totalReviews || reviews.length;
    if (reviews.length === 0) {
      return { total: 0, avgScore: '—', topPerformers: 0 };
    }
    const sum = reviews.reduce((acc, r) => acc + (r.overallScore || 0), 0);
    const avg = (sum / reviews.length).toFixed(1);
    const topCount = reviews.filter((r) => (r.overallScore || 0) >= 4.0).length;
    return { total, avgScore: avg, topPerformers: topCount };
  }, [reviews, totalReviews]);

  const columns = [
    {
      header: 'Employee',
      key: 'employee',
      minWidth: 195,
      render: (r) => (
        <UserCell
          name={fullName(r.employee)}
          avatar={r.employee?.avatar}
          subtitle={r.employee?.designation || 'Team Member'}
        />
      ),
    },
    {
      header: 'Period',
      key: 'period',
      minWidth: 95,
      render: (r) => <PeriodBadge period={r.period} />,
    },
    {
      header: 'Rating Score',
      key: 'overallScore',
      minWidth: 165,
      render: (r) => <RatingScoreCell score={r.overallScore} />,
    },
    {
      header: 'Evaluator',
      key: 'reviewer',
      minWidth: 135,
      render: (r) => (
        <span className="text-sm text-2" style={{ whiteSpace: 'nowrap' }}>
          {fullName(r.reviewer) || 'HR / Manager'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      minWidth: 105,
      render: (r) => <Badge status={r.status}>{r.status}</Badge>,
    },
    {
      header: 'Submitted',
      key: 'createdAt',
      minWidth: 115,
      render: (r) => <DateBadge date={r.createdAt} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      minWidth: 85,
      render: (r) => (
        <div className="table-actions-group">
          <button
            type="button"
            className="btn-action-view"
            onClick={() => setViewing(r)}
            title="Inspect evaluation details"
          >
            <Eye size={13} />
            <span>Details</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Performance Evaluations"
        subtitle={reviewer ? 'Evaluate team competency ratings and growth goals' : 'View your performance reviews and feedback'}
        actions={
          reviewer && (
            <Button
              icon={Plus}
              onClick={() => {
                setForm({
                  employeeId: '',
                  period: 'Q3 2026',
                  ratings: { productivity: 4, quality: 4, communication: 4, teamwork: 4, leadership: 3 },
                  strengths: '',
                  improvements: '',
                  goals: '',
                });
                setFormOpen(true);
              }}
            >
              New Evaluation
            </Button>
          )
        }
      />

      {/* KPI Metric Strip */}
      <div className="metric-strip">
        <div className="metric-card">
          <div className="metric-header">
            <span>Evaluations Conducted</span>
            <TrendingUp size={15} style={{ color: 'var(--text-3)' }} />
          </div>
          <div className="metric-value font-mono">{stats.total}</div>
          <div className="metric-meta">
            <span>Recorded review cycles</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Org Avg Rating</span>
            <Award size={15} style={{ color: 'var(--amber-text)' }} />
          </div>
          <div className="metric-value font-mono" style={{ color: 'var(--amber-text)' }}>
            {stats.avgScore} <span className="text-xs font-normal" style={{ color: 'var(--text-3)' }}>/ 5.0</span>
          </div>
          <div className="metric-meta">
            <span>Average across competencies</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>High Performers (≥ 4.0)</span>
            <CheckCircle2 size={15} style={{ color: 'var(--green-text)' }} />
          </div>
          <div className="metric-value font-mono" style={{ color: 'var(--green-text)' }}>
            {stats.topPerformers}
          </div>
          <div className="metric-meta">
            <span>Exceeding expectations</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Evaluation Framework</span>
            <Target size={15} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="metric-value font-mono" style={{ color: 'var(--text)' }}>
            5 Pillars
          </div>
          <div className="metric-meta">
            <span>Execution, Quality & Lead</span>
          </div>
        </div>
      </div>

      {/* Reviews Data Table */}
      <DataTable
        columns={columns}
        data={reviews}
        loading={loading}
        keyField="_id"
        emptyIcon={TrendingUp}
        emptyTitle="No performance reviews recorded"
        emptyMessage={reviewer ? 'Start a new evaluation cycle for team members.' : 'Performance reviews will appear here once submitted by your manager.'}
        emptyAction={
          reviewer && (
            <Button
              variant="secondary"
              icon={Plus}
              onClick={() => {
                setForm({
                  employeeId: '',
                  period: 'Q3 2026',
                  ratings: { productivity: 4, quality: 4, communication: 4, teamwork: 4, leadership: 3 },
                  strengths: '',
                  improvements: '',
                  goals: '',
                });
                setFormOpen(true);
              }}
            >
              Start First Evaluation
            </Button>
          )
        }
        pagination={{
          page,
          pages: data?.pagination?.pages || 1,
          total: totalReviews,
          limit: 12,
          onPage: setPage,
        }}
      />

      {/* New Evaluation Modal */}
      {formOpen && (
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title="New Performance Evaluation"
          subtitle="Score employee competencies and document growth objectives"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={busy}>
                Submit Evaluation
              </Button>
            </>
          }
        >
          <form onSubmit={handleSave}>
            <div className="form-grid-2">
              <Field label="Employee" required>
                <Select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  required
                >
                  <option value="">Select Employee</option>
                  {(options?.data || []).map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.firstName} {m.lastName} ({m.designation})
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Evaluation Period" required>
                <Input
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  placeholder="e.g. Q3 2026 / Annual 2026"
                  required
                />
              </Field>
            </div>

            <div className="mb-4" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, background: 'var(--bg-subtle)' }}>
              <div className="font-semi text-xs uppercase tracking-wide muted mb-3">
                Core Competency Ratings (1 to 5 Stars)
              </div>
              <div className="flex-col gap-3">
                {COMPETENCIES.map((c) => (
                  <div key={c.key} className="flex items-center justify-between" style={{ background: 'var(--surface)', padding: '8px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                    <span className="font-medium text-sm">{c.label}</span>
                    <div className="flex items-center gap-3">
                      <RatingStars
                        value={form.ratings[c.key]}
                        size={18}
                        interactive
                        onChange={(val) =>
                          setForm({
                            ...form,
                            ratings: { ...form.ratings, [c.key]: val },
                          })
                        }
                      />
                      <span className="font-mono font-bold text-sm w-4 text-right">
                        {form.ratings[c.key]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Field label="Key Strengths & Achievements">
              <Textarea
                value={form.strengths}
                onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                rows={2}
                placeholder="High impact contributions and standout work…"
              />
            </Field>

            <Field label="Areas for Growth & Improvement">
              <Textarea
                value={form.improvements}
                onChange={(e) => setForm({ ...form, improvements: e.target.value })}
                rows={2}
                placeholder="Development opportunities and skill gaps…"
              />
            </Field>

            <Field label="Upcoming Goals & Objectives">
              <Textarea
                value={form.goals}
                onChange={(e) => setForm({ ...form, goals: e.target.value })}
                rows={2}
                placeholder="Target goals for next quarter / cycle…"
              />
            </Field>
          </form>
        </Modal>
      )}

      {/* View Details Modal */}
      {viewing && (
        <Modal
          open={Boolean(viewing)}
          onClose={() => setViewing(null)}
          title={`Performance Review: ${fullName(viewing.employee)}`}
          subtitle={`Cycle: ${viewing.period} · Overall Score: ${viewing.overallScore?.toFixed(1)} / 5.0`}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setViewing(null)}>
              Close
            </Button>
          }
        >
          <div className="flex-col gap-4">
            <div className="flex items-center justify-between p-3" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div>
                <div className="font-bold text-sm">{fullName(viewing.employee)}</div>
                <div className="text-xs muted">{viewing.employee?.designation} · {viewing.employee?.department?.name || 'General'}</div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <RatingStars value={viewing.overallScore} size={15} />
                  <span className="rating-score-pill">
                    <span className="rating-val font-mono">{viewing.overallScore?.toFixed(1) || '0.0'}</span>
                    <span className="rating-slash">/</span>
                    <span className="rating-base font-mono">5.0</span>
                  </span>
                </div>
                <div className="text-xs muted mt-1">Evaluated by {viewing.reviewer?.name || 'Manager'}</div>
              </div>
            </div>

            <div>
              <div className="font-semi text-xs uppercase tracking-wide muted mb-2">Competency Breakdown</div>
              <div className="grid-2">
                {COMPETENCIES.map((c) => {
                  const score = viewing.ratings?.[c.key] || 0;
                  return (
                    <div key={c.key} className="flex items-center justify-between p-2" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                      <span className="text-xs font-medium">{c.label}</span>
                      <div className="flex items-center gap-2">
                        <RatingStars value={score} size={13} />
                        <span className="font-mono font-bold text-xs">{score}/5</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {viewing.strengths && (
              <div>
                <div className="font-semi text-xs uppercase tracking-wide muted mb-1">Key Strengths</div>
                <div className="p-3 text-sm text-2" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', lineHeight: 1.6 }}>
                  {viewing.strengths}
                </div>
              </div>
            )}

            {viewing.improvements && (
              <div>
                <div className="font-semi text-xs uppercase tracking-wide muted mb-1">Development Areas</div>
                <div className="p-3 text-sm text-2" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', lineHeight: 1.6 }}>
                  {viewing.improvements}
                </div>
              </div>
            )}

            {viewing.goals && (
              <div>
                <div className="font-semi text-xs uppercase tracking-wide muted mb-1">Next Cycle Objectives</div>
                <div className="p-3 text-sm text-2" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', lineHeight: 1.6 }}>
                  {viewing.goals}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

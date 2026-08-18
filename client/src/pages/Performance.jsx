import { useState, useEffect } from 'react';
import { TrendingUp, Plus, Star, Eye, Pencil, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Card, Button, Badge, Avatar, Loader, EmptyState, Select, Input,
  Textarea, Pagination, Modal, Field, IconButton,
} from '../components/ui.jsx';
import { fmtDate, fullName } from '../lib/format.js';
import { canManage, isPrivileged } from '../lib/constants.js';

const COMPETENCIES = ['productivity', 'quality', 'communication', 'teamwork', 'leadership'];

function Stars({ value = 0, size = 15, onChange }) {
  return (
    <span className="flex gap-1" style={{ color: '#f59e0b' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= Math.round(value) ? '#f59e0b' : 'none'}
          stroke={n <= Math.round(value) ? '#f59e0b' : 'var(--text-3)'}
          onClick={onChange ? () => onChange(n) : undefined}
          style={onChange ? { cursor: 'pointer' } : undefined}
        />
      ))}
    </span>
  );
}

export default function Performance() {
  const { user } = useAuth();
  const reviewer = canManage(user.role);
  const [page, setPage] = useState(1);
  const query = new URLSearchParams({ page, limit: 12 }).toString();
  const { data, loading, refetch } = useFetch(`/performance?${query}`, [query]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const reviews = data?.data || [];

  return (
    <>
      <PageHeader
        title="Performance"
        subtitle={reviewer ? 'Review, rate, and track your team&apos;s growth' : 'View and acknowledge your performance reviews'}
        actions={reviewer && <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>New Review</Button>}
      />

      {loading ? (
        <Loader />
      ) : reviews.length === 0 ? (
        <Card><EmptyState icon={TrendingUp} title="No performance reviews" message={reviewer ? 'Create a review to get started.' : 'Your reviews will appear here once submitted.'} /></Card>
      ) : (
        <div className="grid-cards">
          {reviews.map((r) => (
            <Card key={r._id} hover className="card-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                  <Avatar name={fullName(r.employee)} src={r.employee?.avatar} size={42} />
                  <div style={{ minWidth: 0 }}>
                    <div className="font-semi truncate">{fullName(r.employee)}</div>
                    <div className="text-xs muted truncate">{r.employee?.designation}</div>
                  </div>
                </div>
                <Badge status={r.status}>{r.status}</Badge>
              </div>

              <div className="flex items-center justify-between mt-4" style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)' }}>
                <div>
                  <div className="text-xs muted">{r.period}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Stars value={r.overallScore} />
                    <span className="font-bold">{r.overallScore?.toFixed(1)}</span>
                  </div>
                </div>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--gradient)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                  {r.overallScore ? Math.round((r.overallScore / 5) * 100) : 0}%
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="ghost" icon={Eye} onClick={() => setViewing(r)} className="flex-1">View</Button>
                {reviewer && (
                  <IconButton icon={Pencil} size={15} onClick={() => { setEditing(r); setFormOpen(true); }} />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {data?.pagination && (
        <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} onPage={setPage} />
      )}

      {reviewer && (
        <ReviewForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={refetch} review={editing} privileged={isPrivileged(user.role)} />
      )}
      <ViewReview review={viewing} onClose={() => setViewing(null)} onDone={refetch} canAck={!canManage(user.role)} />
    </>
  );
}

function ReviewForm({ open, onClose, onSaved, review, privileged }) {
  const isEdit = Boolean(review);
  const blank = {
    employee: '', period: `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`,
    ratings: { productivity: 3, quality: 3, communication: 3, teamwork: 3, leadership: 3 },
    strengths: '', improvements: '', reviewerComment: '', status: 'submitted',
  };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const { data: options } = useFetch(open ? '/employees/options' : null);

  // Sync form state whenever the modal opens (for a fresh or existing review).
  useEffect(() => {
    if (!open) return;
    if (review) {
      setForm({
        employee: review.employee?._id || review.employee,
        period: review.period,
        ratings: { ...blank.ratings, ...review.ratings },
        strengths: review.strengths || '',
        improvements: review.improvements || '',
        reviewerComment: review.reviewerComment || '',
        status: review.status,
      });
    } else {
      setForm(blank);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, review]);

  const setRating = (k, v) => setForm((f) => ({ ...f, ratings: { ...f.ratings, [k]: v } }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (isEdit) await api.patch(`/performance/${review._id}`, payload);
      else await api.post('/performance', payload);
      toast.success(isEdit ? 'Review updated' : 'Review created');
      onSaved();
      onClose();
      setForm(blank);
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit Review' : 'New Performance Review'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.employee}>{saving ? 'Saving…' : 'Save review'}</Button>
        </>
      }
    >
      <form onSubmit={save} className="flex-col gap-4">
        <div className="grid-2" style={{ gap: 14 }}>
          <Field label="Employee" required>
            <Select value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} required disabled={isEdit}>
              <option value="">Select employee</option>
              {(options?.data || []).map((m) => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
            </Select>
          </Field>
          <Field label="Review period" required>
            <Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="Q1 2026" required />
          </Field>
        </div>

        <div className="divider" />
        <div className="text-sm font-bold">Competency Ratings</div>
        {COMPETENCIES.map((c) => (
          <div key={c} className="flex items-center justify-between">
            <span className="capitalize text-2 font-semi">{c}</span>
            <Stars value={form.ratings[c]} size={20} onChange={(v) => setRating(c, v)} />
          </div>
        ))}

        <div className="divider" />
        <Field label="Strengths"><Textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} /></Field>
        <Field label="Areas for improvement"><Textarea value={form.improvements} onChange={(e) => setForm({ ...form, improvements: e.target.value })} /></Field>
        <Field label="Reviewer comment"><Textarea value={form.reviewerComment} onChange={(e) => setForm({ ...form, reviewerComment: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
          </Select>
        </Field>
      </form>
    </Modal>
  );
}

function ViewReview({ review, onClose, onDone, canAck }) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  if (!review) return null;

  const ack = async () => {
    setBusy(true);
    try {
      await api.patch(`/performance/${review._id}/acknowledge`, { employeeComment: comment });
      toast.success('Review acknowledged ✅');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const canAcknowledge = canAck && review.status === 'submitted';

  return (
    <Modal
      open={Boolean(review)}
      onClose={onClose}
      size="lg"
      title="Performance Review"
      footer={canAcknowledge && <Button variant="success" icon={CheckCircle2} onClick={ack} disabled={busy}>{busy ? 'Working…' : 'Acknowledge'}</Button>}
    >
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4" style={{ padding: 16, borderRadius: 14, background: 'var(--gradient-soft)' }}>
        <div className="flex items-center gap-3">
          <Avatar name={fullName(review.employee)} src={review.employee?.avatar} size={48} />
          <div>
            <div className="font-bold text-lg">{fullName(review.employee)}</div>
            <div className="text-xs muted">{review.employee?.designation} · {review.period}</div>
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-2"><Stars value={review.overallScore} size={18} /><span className="font-bold text-lg">{review.overallScore?.toFixed(1)}</span></div>
          <Badge status={review.status}>{review.status}</Badge>
        </div>
      </div>

      <div className="text-sm font-bold mb-2">Competencies</div>
      <div className="flex-col gap-2 mb-4">
        {COMPETENCIES.map((c) => (
          <div key={c} className="flex items-center justify-between">
            <span className="capitalize text-2">{c}</span>
            <Stars value={review.ratings?.[c] || 0} />
          </div>
        ))}
      </div>

      {review.goals?.length > 0 && (
        <>
          <div className="text-sm font-bold mb-2">Goals</div>
          <div className="flex-col gap-2 mb-4">
            {review.goals.map((g, i) => (
              <div key={i} className="flex items-center justify-between text-sm" style={{ padding: 10, borderRadius: 10, background: 'var(--surface-2)' }}>
                <span className="text-2">{g.title} <span className="muted">· {g.weight}%</span></span>
                <Stars value={g.rating} size={13} />
              </div>
            ))}
          </div>
        </>
      )}

      {review.strengths && <Block label="Strengths" text={review.strengths} />}
      {review.improvements && <Block label="Areas for improvement" text={review.improvements} />}
      {review.reviewerComment && <Block label="Reviewer comment" text={review.reviewerComment} />}
      {review.employeeComment && <Block label="Employee response" text={review.employeeComment} />}

      {canAcknowledge && (
        <Field label="Your response (optional)" className="mt-2">
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add your comments before acknowledging" />
        </Field>
      )}
    </Modal>
  );
}

function Block({ label, text }) {
  return (
    <div className="mb-4">
      <div className="text-xs font-bold muted mb-2" style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
      <p className="text-sm text-2" style={{ lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

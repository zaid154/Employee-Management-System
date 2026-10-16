import { useState, useMemo } from 'react';
import {
  CalendarDays, Plus, Pencil, Trash2, Calendar, LayoutGrid, List,
  Search, CalendarRange, Clock, CheckCircle2, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Card, Button, Badge, EmptyState, Modal, Field, Input,
  Select, IconButton, ConfirmDialog, DataTable, DateBadge, Segment,
} from '../components/ui.jsx';
import { fmtDateInput, fmtDate } from '../lib/format.js';
import { isPrivileged } from '../lib/constants.js';

const now = new Date();
const currentYear = now.getFullYear();
const YEARS = [currentYear + 1, currentYear, currentYear - 1];

const TYPE_CONFIG = {
  public: { label: 'Public / National', color: 'blue', bg: 'var(--blue-subtle)', border: 'var(--blue-border)', text: 'var(--blue-text)' },
  company: { label: 'Company Off', color: 'purple', bg: 'var(--purple-subtle)', border: 'var(--purple-border)', text: 'var(--purple-text)' },
  optional: { label: 'Restricted / Optional', color: 'amber', bg: 'var(--amber-subtle)', border: 'var(--amber-border)', text: 'var(--amber-text)' },
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const parseDate = (d) => {
  if (!d) return new Date();
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day);
  }
  return new Date(d);
};

const isLongWeekend = (d) => {
  const day = parseDate(d).getDay();
  return day === 1 || day === 5;
};

const getDaysUntil = (d) => {
  const target = parseDate(d).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
};

export default function Holidays() {
  const { user } = useAuth();
  const canEdit = isPrivileged(user?.role);

  const [year, setYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState('grid');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, loading, refetch } = useFetch(`/holidays?year=${year}`, [year]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', type: 'public', description: '' });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const rawItems = useMemo(() => data?.data || [], [data]);

  const items = useMemo(() => {
    return rawItems
      .filter((h) => {
        if (categoryFilter !== 'all' && h.type !== categoryFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return h.name?.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => parseDate(a.date) - parseDate(b.date));
  }, [rawItems, categoryFilter, searchQuery]);

  const upcomingList = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return rawItems.filter((h) => parseDate(h.date) >= today).sort((a, b) => parseDate(a.date) - parseDate(b.date));
  }, [rawItems]);

  const nextHoliday = upcomingList[0] || null;

  const stats = useMemo(() => ({
    total: rawItems.length,
    publicCount: rawItems.filter((h) => h.type === 'public').length,
    companyCount: rawItems.filter((h) => h.type === 'company').length,
    optionalCount: rawItems.filter((h) => h.type === 'optional').length,
    longWeekends: rawItems.filter((h) => isLongWeekend(h.date)).length,
    upcomingCount: upcomingList.length,
  }), [rawItems, upcomingList]);

  const monthsGrouped = useMemo(() => {
    const groups = Array.from({ length: 12 }, () => []);
    items.forEach((h) => groups[parseDate(h.date).getMonth()].push(h));
    return groups;
  }, [items]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', date: '', type: 'public', description: '' });
    setModal(true);
  };

  const openEdit = (h) => {
    setEditing(h);
    setForm({ name: h.name, date: fmtDateInput(h.date), type: h.type || 'public', description: h.description || '' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date) return toast.error('Holiday name and date are required');
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/holidays/${editing._id}`, form);
        toast.success('Holiday updated successfully');
      } else {
        await api.post('/holidays', form);
        toast.success('Holiday added to official calendar');
      }
      setModal(false);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/holidays/${toDelete._id}`);
      toast.success('Holiday removed');
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const tableColumns = [
    {
      header: 'Holiday Date', key: 'date', minWidth: 170,
      render: (h) => (
        <div className="flex items-center gap-2">
          <DateBadge date={h.date} />
          <span className="text-xs muted font-mono font-medium">({parseDate(h.date).toLocaleDateString('en-US', { weekday: 'short' })})</span>
        </div>
      ),
    },
    {
      header: 'Holiday Name & Context', key: 'name', minWidth: 240,
      render: (h) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semi text-sm">{h.name}</span>
            {isLongWeekend(h.date) && <span className="holiday-weekend-tag"><CalendarRange size={10} /> 3-Day Weekend</span>}
          </div>
          {h.description && <p className="text-xs muted mt-1 truncate" style={{ maxWidth: 360 }}>{h.description}</p>}
        </div>
      ),
    },
    {
      header: 'Category', key: 'type', minWidth: 150,
      render: (h) => {
        const cfg = TYPE_CONFIG[h.type] || TYPE_CONFIG.public;
        return <Badge color={cfg.color} dot={false}>{cfg.label}</Badge>;
      },
    },
    {
      header: 'Timeline', key: 'status', minWidth: 130,
      render: (h) => {
        const diff = getDaysUntil(h.date);
        if (diff === 0) return <Badge color="green">Today</Badge>;
        if (diff === 1) return <Badge color="blue">Tomorrow</Badge>;
        if (diff > 1) return <span className="text-xs muted font-mono font-medium">In {diff} days</span>;
        return <span className="text-xs muted font-mono">Passed</span>;
      },
    },
    ...(canEdit ? [{
      header: 'Actions', key: 'actions', align: 'right', minWidth: 100,
      render: (h) => (
        <div className="table-actions-group">
          <IconButton icon={Pencil} variant="ghost" size={14} onClick={() => openEdit(h)} title="Edit holiday" />
          <IconButton icon={Trash2} variant="ghost" size={14} onClick={() => setToDelete(h)} title="Delete holiday" style={{ color: 'var(--red)' }} />
        </div>
      ),
    }] : []),
  ];

  const metrics = [
    { label: `Total Holidays (${year})`, value: stats.total, icon: Calendar, color: 'var(--text-3)', meta: 'Official paid holidays across calendar' },
    { label: 'Upcoming Holidays', value: stats.upcomingCount, icon: Clock, color: 'var(--accent)', meta: 'Remaining in this calendar year' },
    { label: 'Long Weekends', value: stats.longWeekends, icon: CalendarRange, color: 'var(--amber-text)', meta: '3-Day weekend breaks (Fri/Mon)' },
    { label: 'Public vs Company', value: `${stats.publicCount} Pub / ${stats.companyCount} Co`, icon: CalendarDays, color: 'var(--purple-text)', meta: 'Categorized observances' },
  ];

  return (
    <>
      <PageHeader
        title="Official Holiday Calendar"
        subtitle={`Annual company and national holiday schedule for ${year}`}
        actions={
          <div className="flex items-center gap-2">
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ minWidth: 110, height: 34 }}>
              {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
            </Select>
            {canEdit && <Button icon={Plus} onClick={openAdd}>Add Holiday</Button>}
          </div>
        }
      />

      {/* Metrics */}
      <div className="metric-strip">
        {metrics.map((m, idx) => (
          <div key={idx} className="metric-card">
            <div className="metric-header">
              <span>{m.label}</span>
              <m.icon size={15} style={{ color: m.color }} />
            </div>
            <div className="metric-value font-mono" style={{ color: m.color, fontSize: typeof m.value === 'string' ? 18 : undefined }}>
              {m.value}
            </div>
            <div className="metric-meta"><span>{m.meta}</span></div>
          </div>
        ))}
      </div>

      {/* Next Upcoming Holiday Banner */}
      {nextHoliday && (
        <div className="holiday-hero-banner">
          <div className="flex items-center gap-3">
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
              <Calendar size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="holiday-next-pill"><Clock size={11} /> Next Holiday</span>
                {isLongWeekend(nextHoliday.date) && <span className="holiday-weekend-tag"><CalendarRange size={10} /> 3-Day Weekend</span>}
              </div>
              <div className="font-bold text-base mt-1" style={{ color: 'var(--text)' }}>{nextHoliday.name}</div>
              <div className="text-xs muted">
                {fmtDate(nextHoliday.date)} ({parseDate(nextHoliday.date).toLocaleDateString('en-US', { weekday: 'long' })})
                {nextHoliday.description ? ` · ${nextHoliday.description}` : ''}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono font-bold" style={{ fontSize: 18, color: 'var(--accent)' }}>
              {(() => {
                const diff = getDaysUntil(nextHoliday.date);
                return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff} Days`;
              })()}
            </div>
            <div className="text-xs muted">Official Paid Holiday</div>
          </div>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className="filter-bar-enterprise">
        <div className="filter-row-top">
          <Segment
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            options={[
              { value: 'all', label: 'All Holidays', count: stats.total },
              { value: 'public', label: 'Public / National', count: stats.publicCount },
              { value: 'company', label: 'Company Off', count: stats.companyCount },
              { value: 'optional', label: 'Restricted / Optional', count: stats.optionalCount },
            ]}
          />
          <div className="segment" style={{ flexShrink: 0 }}>
            <button type="button" className={`segment-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
              <LayoutGrid size={14} /><span>Grid</span>
            </button>
            <button type="button" className={`segment-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
              <List size={14} /><span>Table</span>
            </button>
          </div>
        </div>

        <div className="filter-row-controls">
          <div className="input-icon filter-search-box">
            <Search size={15} />
            <input type="text" className="input" placeholder="Search holiday by name, description, or keyword…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {(categoryFilter !== 'all' || searchQuery) && (
            <button type="button" className="btn btn-ghost btn-sm text-xs text-3" onClick={() => { setCategoryFilter('all'); setSearchQuery(''); }}>
              <RotateCcw size={13} /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Views */}
      {viewMode === 'table' ? (
        <DataTable columns={tableColumns} data={items} loading={loading} keyField="_id" emptyTitle={`No holidays found for ${year}`} emptyMessage="Try clearing your filter or search query to view all holidays." />
      ) : loading ? (
        <div className="holiday-grid">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="holiday-month-card" style={{ minHeight: 140 }}>
              <div className="holiday-month-header"><div className="skeleton" style={{ width: 80, height: 14 }} /></div>
              <div className="holiday-list"><div className="skeleton" style={{ width: '100%', height: 46 }} /></div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title={`No holidays scheduled for ${year}`}
            message={searchQuery ? 'No holidays match your search query.' : 'Add company and public holidays to inform team leave planning.'}
            action={canEdit && <Button variant="secondary" icon={Plus} onClick={openAdd}>Add Holiday</Button>}
          />
        </Card>
      ) : (
        <div className="holiday-grid">
          {MONTH_NAMES.map((mName, mIdx) => {
            const mHolidays = monthsGrouped[mIdx];
            if (!mHolidays?.length) return null;
            return (
              <div key={mName} className="holiday-month-card">
                <div className="holiday-month-header">
                  <span>{mName} {year}</span>
                  <span className="text-xs muted font-mono">{mHolidays.length} {mHolidays.length === 1 ? 'day' : 'days'}</span>
                </div>
                <div className="holiday-list">
                  {mHolidays.map((h) => {
                    const d = parseDate(h.date);
                    const isPassed = d < new Date(now.toDateString());
                    const cfg = TYPE_CONFIG[h.type] || TYPE_CONFIG.public;
                    return (
                      <div key={h._id} className="holiday-item" style={{ opacity: isPassed ? 0.65 : 1 }}>
                        <div className="holiday-item-date">
                          <span className="holiday-item-day">{d.getDate()}</span>
                          <span className="holiday-item-month">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        </div>
                        <div className="holiday-item-content">
                          <div className="holiday-item-title" title={h.name}>{h.name}</div>
                          <div className="holiday-item-badges">
                            <span className="holiday-cat-pill" style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                              {cfg.label}
                            </span>
                            {isLongWeekend(h.date) && <span className="holiday-weekend-tag"><CalendarRange size={9} /> 3-Day Wknd</span>}
                          </div>
                        </div>
                        {canEdit && (
                          <div className="holiday-item-actions">
                            <IconButton icon={Pencil} variant="ghost" size={13} onClick={() => openEdit(h)} title="Edit" />
                            <IconButton icon={Trash2} variant="ghost" size={13} onClick={() => setToDelete(h)} title="Delete" style={{ color: 'var(--red)' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title={editing ? 'Edit Holiday' : 'Add Official Holiday'}
          subtitle="Configure company-wide paid non-working day"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>{editing ? 'Save Changes' : 'Add Holiday'}</Button>
            </>
          }
        >
          <form onSubmit={handleSave}>
            <Field label="Holiday Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Independence Day, Diwali, New Year's Day" required />
            </Field>
            <div className="form-grid-2">
              <Field label="Holiday Date" required>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </Field>
              <Field label="Category" required>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="public">National / Public Holiday</option>
                  <option value="company">Company Mandatory Off</option>
                  <option value="optional">Restricted / Optional Holiday</option>
                </Select>
              </Field>
            </div>
            {form.date && (
              <div className="p-3 mb-3 flex items-center justify-between" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', padding: '10px 12px' }}>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} style={{ color: 'var(--green-text)' }} />
                  <span>Falls on <strong>{parseDate(form.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong></span>
                </div>
                {isLongWeekend(form.date) && <span className="holiday-weekend-tag"><CalendarRange size={11} /> 3-Day Weekend</span>}
              </div>
            )}
            <Field label="Description / Notes">
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief information or guidelines for employees…" />
            </Field>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Remove Holiday"
        message={`Are you sure you want to remove "${toDelete?.name}" from the official ${year} holiday calendar?`}
        confirmText="Remove Holiday"
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  );
}

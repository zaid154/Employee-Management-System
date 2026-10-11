import { useState, useMemo } from 'react';
import {
  Building2, Plus, Pencil, Trash2, Users, UserCheck, ShieldCheck,
  Search, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Card, Button, Modal, Field, Input, Select,
  Textarea, IconButton, ConfirmDialog, DataTable, UserCell,
} from '../components/ui.jsx';
import { fullName } from '../lib/format.js';
import { isPrivileged } from '../lib/constants.js';

export default function Departments() {
  const { user } = useAuth();
  const canEdit = isPrivileged(user.role);
  const { data, loading, refetch } = useFetch('/departments');
  const { data: options } = useFetch(canEdit ? '/employees/options' : null);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', head: '' });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', code: '', description: '', head: '' });
    setModal(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name,
      code: d.code,
      description: d.description || '',
      head: d.head?._id || '',
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      toast.error('Department name and code are required');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, head: form.head || null };
      if (editing) {
        await api.patch(`/departments/${editing._id}`, payload);
        toast.success('Department updated successfully');
      } else {
        await api.post('/departments', payload);
        toast.success('Department created successfully');
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
      await api.delete(`/departments/${toDelete._id}`);
      toast.success('Department removed');
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const [search, setSearch] = useState('');

  const departments = useMemo(() => data?.data || [], [data]);

  const filteredDepartments = useMemo(() => {
    if (!search.trim()) return departments;
    const q = search.trim().toLowerCase();
    return departments.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.code?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        fullName(d.head)?.toLowerCase().includes(q)
    );
  }, [departments, search]);

  const stats = useMemo(() => {
    const total = departments.length;
    const withHead = departments.filter((d) => Boolean(d.head)).length;
    const totalStaff = departments.reduce((acc, d) => acc + (d.headcount ?? d.employeeCount ?? 0), 0);
    const avgStaff = total > 0 ? (totalStaff / total).toFixed(1) : 0;
    return { total, withHead, totalStaff, avgStaff };
  }, [departments]);

  const columns = [
    {
      header: 'Department',
      key: 'name',
      minWidth: 220,
      render: (d) => (
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              flexShrink: 0,
            }}
          >
            <Building2 size={17} />
          </div>
          <div>
            <div className="font-semi text-sm" style={{ color: 'var(--text)' }}>
              {d.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-3)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '1px 5px',
                }}
              >
                {d.code}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Department Head',
      key: 'head',
      minWidth: 200,
      render: (d) => {
        if (!d.head) {
          return (
            <span
              className="text-xs muted font-mono"
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
              }}
            >
              Unassigned
            </span>
          );
        }
        return (
          <UserCell
            name={fullName(d.head)}
            avatar={d.head.avatar}
            subtitle={d.head.designation || 'Department Lead'}
          />
        );
      },
    },
    {
      header: 'Headcount',
      key: 'headcount',
      minWidth: 140,
      render: (d) => {
        const count = d.headcount ?? d.employeeCount ?? 0;
        return (
          <div className="table-headcount-badge">
            <Users size={13} style={{ color: 'var(--accent)' }} />
            <strong>{count}</strong>
            <span className="staff-label">{count === 1 ? 'staff' : 'staff'}</span>
          </div>
        );
      },
    },
    {
      header: 'Responsibilities / Scope',
      key: 'description',
      minWidth: 260,
      render: (d) => (
        <p className="text-xs text-2" style={{ maxWidth: 420, lineHeight: 1.5, margin: 0 }}>
          {d.description || <span className="muted italic">General functional management</span>}
        </p>
      ),
    },
    ...(canEdit
      ? [
          {
            header: 'Actions',
            key: 'actions',
            align: 'right',
            minWidth: 100,
            render: (d) => (
              <div className="table-actions-group">
                <IconButton
                  icon={Pencil}
                  variant="ghost"
                  size={14}
                  onClick={() => openEdit(d)}
                  title="Edit Department"
                />
                <IconButton
                  icon={Trash2}
                  variant="ghost"
                  size={14}
                  onClick={() => setToDelete(d)}
                  title="Delete Department"
                  style={{ color: 'var(--red)' }}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Departments & Organization"
        subtitle={`${departments.length} functional operational divisions`}
        actions={
          canEdit && (
            <Button icon={Plus} onClick={openAdd}>
              New Department
            </Button>
          )
        }
      />

      {/* KPI Metric Strip */}
      <div className="metric-strip">
        <div className="metric-card">
          <div className="metric-header">
            <span>Total Departments</span>
            <Building2 size={15} style={{ color: 'var(--text-3)' }} />
          </div>
          <div className="metric-value font-mono">{stats.total}</div>
          <div className="metric-meta">
            <span>Active divisions</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Leadership Assigned</span>
            <UserCheck size={15} style={{ color: 'var(--green-text)' }} />
          </div>
          <div className="metric-value font-mono" style={{ color: 'var(--green-text)' }}>
            {stats.withHead} <span className="text-xs muted font-normal">/ {stats.total}</span>
          </div>
          <div className="metric-meta">
            <span>Departments with appointed HOD</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Total Staff Distributed</span>
            <Users size={15} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="metric-value font-mono" style={{ color: 'var(--accent)' }}>
            {stats.totalStaff}
          </div>
          <div className="metric-meta">
            <span>Employees mapped to departments</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Avg Team Size</span>
            <ShieldCheck size={15} style={{ color: 'var(--purple-text)' }} />
          </div>
          <div className="metric-value font-mono">{stats.avgStaff}</div>
          <div className="metric-meta">
            <span>Employees per department</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="filter-bar-enterprise mb-3">
        <div className="filter-row-controls" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="input-icon filter-search-box" style={{ maxWidth: 360, flex: 1 }}>
            <Search size={15} />
            <input
              type="text"
              className="input"
              placeholder="Search by department name, code, or lead…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <button
              className="btn btn-ghost btn-sm text-xs text-3"
              onClick={() => setSearch('')}
              type="button"
            >
              <RotateCcw size={13} /> Clear
            </button>
          )}
          <div className="ml-auto text-xs muted font-mono" style={{ whiteSpace: 'nowrap' }}>
            Showing <strong>{filteredDepartments.length}</strong> of <strong>{departments.length}</strong> divisions
          </div>
        </div>
      </div>

      {/* Department Data Table */}
      <DataTable
        columns={columns}
        data={filteredDepartments}
        loading={loading}
        keyField="_id"
        emptyIcon={Building2}
        emptyTitle="No departments found"
        emptyMessage={
          search
            ? 'No functional departments match your search term. Try resetting your query.'
            : 'Create functional departments to organize employees and reporting lines.'
        }
        emptyAction={
          search ? (
            <Button variant="secondary" icon={RotateCcw} onClick={() => setSearch('')}>
              Clear Search
            </Button>
          ) : canEdit ? (
            <Button variant="secondary" icon={Plus} onClick={openAdd}>
              Add First Department
            </Button>
          ) : null
        }
      />

      {/* Add / Edit Modal */}
      {modal && (
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title={editing ? 'Edit Department' : 'Create New Department'}
          subtitle="Configure department metadata and leadership"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {editing ? 'Save Changes' : 'Create Department'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSave}>
            <div className="form-grid-2">
              <Field label="Department Name" required>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Engineering"
                  required
                />
              </Field>
              <Field label="Department Code" required>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ENG"
                  required
                />
              </Field>
            </div>

            <Field label="Department Head (Manager)">
              <Select
                value={form.head}
                onChange={(e) => setForm({ ...form, head: e.target.value })}
              >
                <option value="">Select Manager</option>
                {(options?.data || []).map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.firstName} {m.lastName} ({m.designation})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Responsibilities, scope, and objectives…"
              />
            </Field>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete the "${toDelete?.name}" department? Employees assigned to this department will need to be reassigned.`}
        confirmText="Delete Department"
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  );
}

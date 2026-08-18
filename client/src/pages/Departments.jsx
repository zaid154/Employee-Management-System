import { useState } from 'react';
import { Building2, Plus, Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Card, Button, Loader, EmptyState, Modal, Field, Input, Select,
  IconButton, ConfirmDialog, Avatar,
} from '../components/ui.jsx';
import { fullName } from '../lib/format.js';
import { isPrivileged, CHART_COLORS } from '../lib/constants.js';

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

  const openAdd = () => { setEditing(null); setForm({ name: '', code: '', description: '', head: '' }); setModal(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({ name: d.name, code: d.code, description: d.description || '', head: d.head?._id || '' });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, head: form.head || null };
      if (editing) await api.patch(`/departments/${editing._id}`, payload);
      else await api.post('/departments', payload);
      toast.success(editing ? 'Department updated' : 'Department created');
      setModal(false);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    setDeleting(true);
    try {
      await api.delete(`/departments/${toDelete._id}`);
      toast.success('Department deleted');
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setDeleting(false);
    }
  };

  const departments = data?.data || [];

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle={`${departments.length} departments`}
        actions={canEdit && <Button icon={Plus} onClick={openAdd}>New Department</Button>}
      />

      {loading ? (
        <Loader />
      ) : departments.length === 0 ? (
        <Card><EmptyState icon={Building2} title="No departments yet" /></Card>
      ) : (
        <div className="grid-cards">
          {departments.map((d, i) => (
            <Card key={d._id} hover className="card-hover">
              <div className="flex items-start justify-between">
                <span style={{ width: 48, height: 48, borderRadius: 13, background: `${CHART_COLORS[i % CHART_COLORS.length]}22`, color: CHART_COLORS[i % CHART_COLORS.length], display: 'grid', placeItems: 'center' }}>
                  <Building2 size={22} />
                </span>
                {canEdit && (
                  <div className="flex gap-1">
                    <IconButton icon={Pencil} size={15} onClick={() => openEdit(d)} />
                    <IconButton icon={Trash2} size={15} onClick={() => setToDelete(d)} style={{ color: 'var(--red)' }} />
                  </div>
                )}
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <h3 className="card-title">{d.name}</h3>
                  <span className="badge gray" style={{ fontFamily: 'monospace' }}>{d.code}</span>
                </div>
                <p className="text-sm muted mt-1" style={{ minHeight: 40, lineHeight: 1.5 }}>{d.description || 'No description provided.'}</p>
              </div>
              <div className="divider" />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm muted">
                  <Users size={15} /> {d.headcount} member{d.headcount !== 1 ? 's' : ''}
                </span>
                {d.head ? (
                  <span className="flex items-center gap-2 text-sm">
                    <Avatar name={fullName(d.head)} src={d.head.avatar} size={26} />
                    <span className="font-semi truncate" style={{ maxWidth: 110 }}>{fullName(d.head)}</span>
                  </span>
                ) : (
                  <span className="text-xs muted">No head assigned</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Department' : 'New Department'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        <form onSubmit={save} className="flex-col gap-4">
          <div className="grid-2" style={{ gap: 14 }}>
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="Code" required>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="ENG" required />
            </Field>
          </div>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Department head">
            <Select value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })}>
              <option value="">None</option>
              {(options?.data || []).map((m) => (
                <option key={m._id} value={m._id}>{m.firstName} {m.lastName} · {m.designation}</option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={del}
        loading={deleting}
        title="Delete department?"
        message={`Delete the ${toDelete?.name} department? Departments with employees can't be deleted.`}
      />
    </>
  );
}

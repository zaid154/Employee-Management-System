import { useState } from 'react';
import { Palmtree, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Card, Button, Badge, Loader, EmptyState, Modal, Field, Input,
  Select, IconButton, ConfirmDialog,
} from '../components/ui.jsx';
import { fmtDateInput } from '../lib/format.js';
import { isPrivileged } from '../lib/constants.js';

const now = new Date();
const YEARS = [now.getFullYear() + 1, now.getFullYear(), now.getFullYear() - 1];
const TYPE_COLORS = { public: 'blue', optional: 'amber', company: 'violet' };

export default function Holidays() {
  const { user } = useAuth();
  const canEdit = isPrivileged(user.role);
  const [year, setYear] = useState(now.getFullYear());
  const { data, loading, refetch } = useFetch(`/holidays?year=${year}`, [year]);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', type: 'public', description: '' });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => { setEditing(null); setForm({ name: '', date: '', type: 'public', description: '' }); setModal(true); };
  const openEdit = (h) => { setEditing(h); setForm({ name: h.name, date: fmtDateInput(h.date), type: h.type, description: h.description || '' }); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.patch(`/holidays/${editing._id}`, form);
      else await api.post('/holidays', form);
      toast.success(editing ? 'Holiday updated' : 'Holiday added');
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
      await api.delete(`/holidays/${toDelete._id}`);
      toast.success('Holiday removed');
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setDeleting(false);
    }
  };

  const items = data?.data || [];
  const upcoming = items.filter((h) => new Date(h.date) >= new Date(now.toDateString()));

  return (
    <>
      <PageHeader
        title="Holiday Calendar"
        subtitle={`${items.length} holidays · ${upcoming.length} upcoming`}
        actions={
          <>
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ minWidth: 110 }}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
            {canEdit && <Button icon={Plus} onClick={openAdd}>Add Holiday</Button>}
          </>
        }
      />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <Card><EmptyState icon={Palmtree} title="No holidays for this year" /></Card>
      ) : (
        <div className="grid-cards">
          {items.map((h) => {
            const d = new Date(h.date);
            const past = d < new Date(now.toDateString());
            return (
              <Card key={h._id} hover className="card-hover" style={{ opacity: past ? 0.6 : 1 }}>
                <div className="flex items-start gap-3">
                  <div style={{ width: 58, textAlign: 'center', background: 'var(--gradient)', color: '#fff', borderRadius: 12, padding: '8px 0', flexShrink: 0 }}>
                    <div className="font-bold" style={{ fontSize: '1.3rem', lineHeight: 1 }}>{d.getDate()}</div>
                    <div className="text-xs" style={{ opacity: 0.9 }}>{d.toLocaleDateString('en-IN', { month: 'short' })}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold truncate">{h.name}</h3>
                      {canEdit && (
                        <div className="flex gap-1">
                          <IconButton icon={Pencil} size={14} onClick={() => openEdit(h)} />
                          <IconButton icon={Trash2} size={14} onClick={() => setToDelete(h)} style={{ color: 'var(--red)' }} />
                        </div>
                      )}
                    </div>
                    <div className="text-xs muted">{d.toLocaleDateString('en-IN', { weekday: 'long' })}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge color={TYPE_COLORS[h.type]} dot={false}>{h.type}</Badge>
                      {!past && new Date(h.date) - new Date() < 30 * 86400000 && <span className="badge green">Upcoming</span>}
                    </div>
                    {h.description && <p className="text-sm muted mt-2">{h.description}</p>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Holiday' : 'Add Holiday'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        <form onSubmit={save} className="flex-col gap-4">
          <Field label="Holiday name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <div className="grid-2" style={{ gap: 14 }}>
            <Field label="Date" required>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="public">Public</option>
                <option value="optional">Optional</option>
                <option value="company">Company</option>
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={del}
        loading={deleting}
        title="Remove holiday?"
        message={`Remove ${toDelete?.name} from the calendar?`}
      />
    </>
  );
}

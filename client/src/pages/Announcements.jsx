import { useState } from 'react';
import { Megaphone, Plus, Pin, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Card, Button, Badge, Loader, EmptyState, Modal, Field, Input,
  Textarea, Select, IconButton, ConfirmDialog,
} from '../components/ui.jsx';
import { timeAgo } from '../lib/format.js';
import { isPrivileged } from '../lib/constants.js';

const CATEGORY_COLORS = { general: 'blue', policy: 'violet', event: 'cyan', holiday: 'green', urgent: 'red' };

export default function Announcements() {
  const { user } = useAuth();
  const canEdit = isPrivileged(user.role);
  const { data, loading, refetch } = useFetch('/announcements');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', category: 'general', pinned: false });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => { setEditing(null); setForm({ title: '', body: '', category: 'general', pinned: false }); setModal(true); };
  const openEdit = (a) => { setEditing(a); setForm({ title: a.title, body: a.body, category: a.category, pinned: a.pinned }); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.patch(`/announcements/${editing._id}`, form);
      else await api.post('/announcements', form);
      toast.success(editing ? 'Announcement updated' : 'Announcement posted 📣');
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
      await api.delete(`/announcements/${toDelete._id}`);
      toast.success('Announcement deleted');
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setDeleting(false);
    }
  };

  const items = data?.data || [];

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Company news, policies and updates"
        actions={canEdit && <Button icon={Plus} onClick={openAdd}>New Announcement</Button>}
      />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <Card><EmptyState icon={Megaphone} title="No announcements yet" message="Company updates will show up here." /></Card>
      ) : (
        <div className="flex-col gap-4">
          {items.map((a) => (
            <Card key={a._id} className={a.pinned ? 'card-hover' : ''} style={a.pinned ? { borderColor: 'var(--brand-1)' } : undefined}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3" style={{ minWidth: 0 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-soft)', color: 'var(--brand-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Megaphone size={20} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="card-title">{a.title}</h3>
                      {a.pinned && <span className="badge violet"><Pin size={11} /> Pinned</span>}
                      <Badge color={CATEGORY_COLORS[a.category]} dot={false}>{a.category}</Badge>
                    </div>
                    <div className="text-xs muted mt-1">
                      {a.author?.name || 'System'} · {timeAgo(a.createdAt)}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <IconButton icon={Pencil} size={15} onClick={() => openEdit(a)} />
                    <IconButton icon={Trash2} size={15} onClick={() => setToDelete(a)} style={{ color: 'var(--red)' }} />
                  </div>
                )}
              </div>
              <p className="text-2 mt-3" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{a.body}</p>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Announcement' : 'New Announcement'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Post'}</Button>
          </>
        }
      >
        <form onSubmit={save} className="flex-col gap-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Message" required>
            <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} style={{ minHeight: 130 }} required />
          </Field>
          <div className="grid-2" style={{ gap: 14 }}>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {['general', 'policy', 'event', 'holiday', 'urgent'].map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </Select>
            </Field>
            <label className="flex items-center gap-2 pointer" style={{ marginTop: 24 }}>
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} style={{ width: 16, height: 16 }} />
              <span className="text-sm font-semi">Pin to top</span>
            </label>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={del}
        loading={deleting}
        title="Delete announcement?"
        message={`Delete "${toDelete?.title}"? This can't be undone.`}
      />
    </>
  );
}

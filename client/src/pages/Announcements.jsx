import { useState } from 'react';
import { Megaphone, Plus, Pin, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Card, Button, Badge, TableSkeleton, EmptyState, Modal, Field, Input,
  Textarea, Select, IconButton, ConfirmDialog,
} from '../components/ui.jsx';
import { timeAgo, fmtDate } from '../lib/format.js';
import { isPrivileged } from '../lib/constants.js';

const CATEGORY_COLORS = {
  general: 'blue',
  policy: 'purple',
  event: 'cyan',
  holiday: 'green',
  urgent: 'red',
};

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

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', body: '', category: 'general', pinned: false });
    setModal(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      title: a.title,
      body: a.body,
      category: a.category,
      pinned: a.pinned,
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) {
      toast.error('Title and message are required');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/announcements/${editing._id}`, form);
        toast.success('Announcement updated');
      } else {
        await api.post('/announcements', form);
        toast.success('Announcement published');
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
      await api.delete(`/announcements/${toDelete._id}`);
      toast.success('Announcement removed');
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const items = data?.data || [];

  return (
    <>
      <PageHeader
        title="Company Notice Board"
        subtitle="Official broadcasts, policy notices, and updates"
        actions={
          canEdit && (
            <Button icon={Plus} onClick={openAdd}>
              Post Notice
            </Button>
          )
        }
      />

      {loading ? (
        <div className="flex-col gap-3">
          <Card style={{ height: 90 }} />
          <Card style={{ height: 90 }} />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title="No announcements posted"
            message="Company broadcast notices and policy updates will appear here."
            action={
              canEdit && (
                <Button variant="secondary" icon={Plus} onClick={openAdd}>
                  Post Announcement
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="flex-col gap-3">
          {items.map((a) => (
            <Card
              key={a._id}
              pad={false}
              style={{
                borderLeft: a.pinned ? '3px solid var(--accent)' : '1px solid var(--border)',
              }}
            >
              <div className="card-pad">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                        {a.title}
                      </h3>
                      {a.pinned && (
                        <span className="badge purple">
                          <Pin size={11} /> Pinned
                        </span>
                      )}
                      <Badge color={CATEGORY_COLORS[a.category]} dot={false}>
                        {a.category}
                      </Badge>
                    </div>

                    <div className="text-xs muted mb-3">
                      Posted by <strong>{a.author?.name || 'HR Admin'}</strong> · {timeAgo(a.createdAt)} ({fmtDate(a.createdAt)})
                    </div>

                    <p className="text-sm text-2" style={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {a.body}
                    </p>
                  </div>

                  {canEdit && (
                    <div className="flex gap-1">
                      <IconButton
                        icon={Pencil}
                        variant="ghost"
                        size={14}
                        onClick={() => openEdit(a)}
                        title="Edit Notice"
                      />
                      <IconButton
                        icon={Trash2}
                        variant="ghost"
                        size={14}
                        onClick={() => setToDelete(a)}
                        title="Delete Notice"
                        style={{ color: 'var(--red)' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title={editing ? 'Edit Announcement' : 'Post New Notice'}
          subtitle="Publish an official broadcast to all employees"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {editing ? 'Save Changes' : 'Publish Notice'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSave}>
            <Field label="Notice Title" required>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Q4 Company Town Hall & Annual Strategy Meeting"
                required
              />
            </Field>

            <div className="form-grid-2">
              <Field label="Category" required>
                <Select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="general">General Update</option>
                  <option value="policy">Policy / HR Guideline</option>
                  <option value="event">Company Event</option>
                  <option value="holiday">Holiday Notice</option>
                  <option value="urgent">Urgent Announcement</option>
                </Select>
              </Field>

              <Field label="Pin to Top">
                <Select
                  value={form.pinned ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, pinned: e.target.value === 'true' })}
                >
                  <option value="false">Standard Notice</option>
                  <option value="true">Pin to Top of Notice Board</option>
                </Select>
              </Field>
            </div>

            <Field label="Notice Content" required>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={5}
                placeholder="Full announcement details, instructions, or agenda…"
                required
              />
            </Field>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Notice"
        message="Are you sure you want to remove this announcement from the company notice board?"
        confirmText="Delete Notice"
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  );
}

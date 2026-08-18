import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Pencil, Trash2, Eye, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch, useDebounce } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Card, Button, Badge, Avatar, Loader, EmptyState, SearchInput,
  Select, Pagination, ConfirmDialog, IconButton,
} from '../components/ui.jsx';
import EmployeeForm from '../components/EmployeeForm.jsx';
import { fullName } from '../lib/format.js';
import { isPrivileged, EMPLOYEE_STATUSES } from '../lib/constants.js';

export default function Employees() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = isPrivileged(user.role);

  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  const query = new URLSearchParams({
    page,
    limit: 12,
    ...(debounced && { search: debounced }),
    ...(dept && { department: dept }),
    ...(status && { status }),
  }).toString();

  const { data, loading, refetch } = useFetch(`/employees?${query}`, [query]);
  const { data: deptData } = useFetch('/departments');
  const { data: mgrData } = useFetch(canEdit ? '/employees/options' : null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const del = async () => {
    setDeleting(true);
    try {
      await api.delete(`/employees/${toDelete._id}`);
      toast.success('Employee removed');
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setDeleting(false);
    }
  };

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (e) => { setEditing(e); setFormOpen(true); };

  const employees = data?.data || [];

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={`${data?.pagination?.total ?? 0} people in your organisation`}
        actions={canEdit && <Button icon={UserPlus} onClick={openAdd}>Add Employee</Button>}
      />

      <Card pad={false} className="mb-4" style={{ padding: 16 }}>
        <div className="toolbar" style={{ margin: 0 }}>
          <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, ID…" />
          <div className="input-icon" style={{ minWidth: 170 }}>
            <Filter size={15} />
            <Select value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }} style={{ paddingLeft: 38 }}>
              <option value="">All departments</option>
              {(deptData?.data || []).map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </Select>
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ minWidth: 150 }}>
            <option value="">All statuses</option>
            {EMPLOYEE_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </Select>
        </div>
      </Card>

      {loading ? (
        <Loader />
      ) : employees.length === 0 ? (
        <Card><EmptyState icon={Users} title="No employees found" message="Try adjusting your filters or add a new employee." /></Card>
      ) : (
        <Card pad={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e._id}>
                    <td>
                      <div className="flex items-center gap-3 pointer" onClick={() => navigate(`/employees/${e._id}`)}>
                        <Avatar name={fullName(e)} src={e.avatar} size={38} />
                        <div style={{ minWidth: 0 }}>
                          <div className="strong truncate">{fullName(e)}</div>
                          <div className="text-xs muted truncate">{e.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge gray" style={{ fontFamily: 'monospace' }}>{e.employeeId}</span></td>
                    <td>{e.department?.name || '—'}</td>
                    <td>{e.designation}</td>
                    <td className="capitalize">{e.employmentType}</td>
                    <td><Badge status={e.status}>{e.status}</Badge></td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <IconButton icon={Eye} size={16} onClick={() => navigate(`/employees/${e._id}`)} title="View" />
                        {canEdit && <IconButton icon={Pencil} size={16} onClick={() => openEdit(e)} title="Edit" />}
                        {canEdit && (
                          <IconButton icon={Trash2} size={16} onClick={() => setToDelete(e)} title="Remove" style={{ color: 'var(--red)' }} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} onPage={setPage} />
          </div>
        </Card>
      )}

      <EmployeeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refetch}
        employee={editing}
        departments={deptData?.data || []}
        managers={mgrData?.data || []}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={del}
        loading={deleting}
        title="Remove employee?"
        message={`This will permanently remove ${toDelete ? fullName(toDelete) : ''} and any linked login account. This can't be undone.`}
        confirmText="Remove employee"
      />
    </>
  );
}

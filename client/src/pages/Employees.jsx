import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Pencil, Trash2, Eye, RotateCcw, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch, useDebounce } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Button, Badge, DataTable, UserCell, DateBadge,
  Select, ConfirmDialog, IconButton, Segment,
} from '../components/ui.jsx';
import EmployeeForm from '../components/EmployeeForm.jsx';
import { fullName } from '../lib/format.js';
import { isPrivileged } from '../lib/constants.js';

export default function Employees() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = isPrivileged(user.role);

  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const query = new URLSearchParams({
    page,
    limit: 12,
    ...(debouncedSearch && { search: debouncedSearch }),
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/employees/${toDelete._id}`);
      toast.success('Employee record removed');
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setFormOpen(true);
  };

  const resetFilters = () => {
    setSearch('');
    setDept('');
    setStatus('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || dept || status);

  const employees = data?.data || [];
  const totalEmployees = data?.pagination?.total ?? 0;

  // Define Table Columns
  const columns = useMemo(
    () => [
      {
        header: 'Employee',
        key: 'employee',
        minWidth: 220,
        render: (e) => (
          <UserCell
            name={fullName(e)}
            avatar={e.avatar}
            subtitle={e.email}
            onClick={() => navigate(`/employees/${e._id}`)}
          />
        ),
      },
      {
        header: 'Employee ID',
        key: 'employeeId',
        minWidth: 120,
        render: (e) => (
          <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {e.employeeId}
          </span>
        ),
      },
      {
        header: 'Department',
        key: 'department',
        minWidth: 150,
        render: (e) => <span className="font-medium">{e.department?.name || '—'}</span>,
      },
      {
        header: 'Designation',
        key: 'designation',
        minWidth: 160,
        render: (e) => e.designation,
      },
      {
        header: 'Type',
        key: 'employmentType',
        width: 120,
        render: (e) => (
          <span className="capitalize text-xs font-semi" style={{ color: 'var(--text-2)' }}>
            {e.employmentType || 'full-time'}
          </span>
        ),
      },
      {
        header: 'Status',
        key: 'status',
        width: 110,
        render: (e) => <Badge status={e.status}>{e.status}</Badge>,
      },
      {
        header: 'Actions',
        key: 'actions',
        width: 130,
        align: 'right',
        render: (e) => (
          <div className="table-actions-group">
            <IconButton
              icon={Eye}
              variant="ghost"
              size={14}
              onClick={() => navigate(`/employees/${e._id}`)}
              title="View Profile"
            />
            {canEdit && (
              <>
                <IconButton
                  icon={Pencil}
                  variant="ghost"
                  size={14}
                  onClick={() => openEdit(e)}
                  title="Edit Employee"
                />
                <IconButton
                  icon={Trash2}
                  variant="ghost"
                  size={14}
                  onClick={() => setToDelete(e)}
                  title="Remove Employee"
                  style={{ color: 'var(--red)' }}
                />
              </>
            )}
          </div>
        ),
      },
    ],
    [canEdit, navigate]
  );

  return (
    <>
      <PageHeader
        title="Employee Directory"
        subtitle={`${totalEmployees} total staff members in organization`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={refetch} title="Refresh Directory">
              Refresh
            </Button>
            {canEdit && (
              <Button icon={UserPlus} onClick={openAdd}>
                Add Employee
              </Button>
            )}
          </div>
        }
      />

      {/* Enhanced Filter Bar */}
      <div className="filter-bar-enterprise">
        <div className="filter-row-top">
          <Segment
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Employees' },
              { value: 'active', label: 'Active Staff' },
              { value: 'on-leave', label: 'On Leave' },
              { value: 'probation', label: 'Probation' },
              { value: 'resigned', label: 'Resigned' },
            ]}
          />

          {hasActiveFilters && (
            <button
              className="btn btn-ghost btn-sm text-xs text-3"
              onClick={resetFilters}
              type="button"
            >
              <RotateCcw size={13} />
              Reset Filters
            </button>
          )}
        </div>

        <div className="filter-row-controls">
          <div className="input-icon filter-search-box">
            <Search size={15} />
            <input
              type="text"
              className="input"
              placeholder="Search by name, email, designation, or ID…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-select">
            <Select
              value={dept}
              onChange={(e) => {
                setDept(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Departments</option>
              {(deptData?.data || []).map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Unified Enterprise DataTable */}
      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        emptyIcon={Users}
        emptyTitle="No employees found"
        emptyMessage={
          hasActiveFilters
            ? 'No staff members match your current filters. Try resetting the filters.'
            : 'No employee records are registered yet.'
        }
        emptyAction={
          hasActiveFilters ? (
            <Button variant="secondary" icon={RotateCcw} onClick={resetFilters}>
              Clear Filters
            </Button>
          ) : canEdit ? (
            <Button icon={UserPlus} onClick={openAdd}>
              Add New Employee
            </Button>
          ) : null
        }
        pagination={{
          page: data?.pagination?.page || 1,
          pages: data?.pagination?.pages || 1,
          total: totalEmployees,
          limit: 12,
          onPage: setPage,
        }}
      />

      {/* Employee Add/Edit Modal */}
      {formOpen && (
        <EmployeeForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          employee={editing}
          departments={deptData?.data || []}
          managers={mgrData?.data || []}
          onSaved={() => {
            setFormOpen(false);
            refetch();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Remove Employee"
        message={`Are you sure you want to remove ${toDelete ? fullName(toDelete) : 'this employee'}? This will archive their employee profile and access.`}
        confirmText="Remove Employee"
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  );
}

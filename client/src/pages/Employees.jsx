import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Users, Pencil, Trash2, Eye, RotateCcw, RefreshCw, Search,
  UserCheck, UserX, Clock, Shield, IndianRupee, Landmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch, useDebounce } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Button, Badge, DataTable, UserCell, DateBadge,
  Select, ConfirmDialog, IconButton, Segment, Modal, Field, Input
} from '../components/ui.jsx';
import EmployeeForm from '../components/EmployeeForm.jsx';
import { fullName } from '../lib/format.js';
import { isPrivileged } from '../lib/constants.js';

export default function Employees() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = isPrivileged(user.role);

  const [activeTab, setActiveTab] = useState('directory');
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
  const { data: pendingData, loading: pendingLoading, refetch: refetchPending } = useFetch(canEdit ? '/employees/pending-registrations' : null);
  const pendingList = pendingData?.data || [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Onboard modal state
  const [onboardCandidate, setOnboardCandidate] = useState(null);
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    role: 'employee',
    department: '',
    designation: 'Software Associate',
    employmentType: 'full-time',
    dateOfJoining: new Date().toISOString().split('T')[0],
    salary: { basic: 40000, hra: 20000, allowances: 10000 },
    bank: { accountName: '', accountNumber: '', bankName: 'HDFC Bank', ifsc: '' },
  });

  // Rejection modal state
  const [toReject, setToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('Application requirements not met');
  const [rejecting, setRejecting] = useState(false);

  const handleOpenOnboard = (candidate) => {
    setOnboardCandidate(candidate);
    setOnboardForm({
      role: 'employee',
      department: deptData?.data?.[0]?._id || '',
      designation: 'Software Associate',
      employmentType: 'full-time',
      dateOfJoining: new Date().toISOString().split('T')[0],
      salary: { basic: 40000, hra: 20000, allowances: 10000 },
      bank: {
        accountName: candidate.name,
        accountNumber: '',
        bankName: 'HDFC Bank',
        ifsc: '',
      },
    });
  };

  const handleApproveOnboard = async (e) => {
    e.preventDefault();
    if (!onboardForm.department) {
      toast.error('Please assign a department');
      return;
    }
    if (!onboardForm.designation.trim()) {
      toast.error('Please assign a designation title');
      return;
    }

    setOnboardLoading(true);
    try {
      const payload = {
        role: onboardForm.role,
        department: onboardForm.department,
        designation: onboardForm.designation.trim(),
        employmentType: onboardForm.employmentType,
        dateOfJoining: onboardForm.dateOfJoining,
        salary: {
          basic: Number(onboardForm.salary.basic) || 0,
          hra: Number(onboardForm.salary.hra) || 0,
          allowances: Number(onboardForm.salary.allowances) || 0,
        },
        bank: {
          accountName: onboardForm.bank.accountName.trim() || onboardCandidate.name,
          accountNumber: onboardForm.bank.accountNumber.trim(),
          bankName: onboardForm.bank.bankName.trim(),
          ifsc: onboardForm.bank.ifsc.trim().toUpperCase(),
        },
      };

      const res = await api.post(`/employees/approve-registration/${onboardCandidate._id}`, payload);
      toast.success(res.data.message || `Account activated and ${onboardCandidate.name} onboarded!`);
      setOnboardCandidate(null);
      refetchPending();
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || err.message || 'Onboarding approval failed');
    } finally {
      setOnboardLoading(false);
    }
  };

  const handleRejectCandidate = async () => {
    if (!toReject) return;
    setRejecting(true);
    try {
      await api.post(`/employees/reject-registration/${toReject._id}`, { reason: rejectReason.trim() });
      toast.success('Registration request rejected');
      setToReject(null);
      refetchPending();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Rejection failed');
    } finally {
      setRejecting(false);
    }
  };

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

  // Define Table Columns for Pending Registration Requests
  const pendingColumns = useMemo(
    () => [
      {
        header: 'Applicant',
        key: 'name',
        minWidth: 200,
        render: (p) => (
          <UserCell
            name={p.name}
            subtitle={p.email}
          />
        ),
      },
      {
        header: 'Mobile Contact',
        key: 'phone',
        minWidth: 140,
        render: (p) => <span className="font-mono text-xs">{p.phone || '—'}</span>,
      },
      {
        header: 'Submitted',
        key: 'createdAt',
        minWidth: 120,
        render: (p) => <DateBadge date={p.createdAt} />,
      },
      {
        header: 'Verification Status',
        key: 'status',
        minWidth: 150,
        render: () => (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 4,
            background: 'rgba(245, 158, 11, 0.12)',
            color: 'var(--amber-text, #d97706)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            Email Verified &bull; Pending Review
          </span>
        ),
      },
      {
        header: 'Actions',
        key: 'actions',
        width: 220,
        align: 'right',
        render: (p) => (
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="primary"
              icon={UserCheck}
              onClick={() => handleOpenOnboard(p)}
            >
              Review &amp; Onboard
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={UserX}
              onClick={() => {
                setToReject(p);
                setRejectReason('Application requirements not met');
              }}
              style={{ color: 'var(--red)' }}
            >
              Reject
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title={canEdit ? 'Employee Management' : user?.role === 'manager' ? 'My Team Directory' : 'Company Directory'}
        subtitle={canEdit ? `${totalEmployees} staff members & ${pendingList.length} pending onboardings` : user?.role === 'manager' ? `${totalEmployees} team members reporting to you` : `${totalEmployees} colleagues in organization`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={() => { refetch(); refetchPending(); }} title="Refresh Directory">
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

      {/* Admin/HR Sub-Navigation Switcher */}
      {canEdit && (
        <div style={{ marginBottom: 16 }}>
          <Segment
            options={[
              { value: 'directory', label: 'Active Staff Directory', count: totalEmployees },
              { value: 'pending', label: 'Pending Onboarding', count: pendingList.length },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </div>
      )}

      {/* TAB 1: ACTIVE STAFF DIRECTORY */}
      {activeTab === 'directory' && (
        <>
          {/* Enhanced Filter Bar */}
          <div className="filter-bar-enterprise filter-bar-compact">
            <div className="filter-row-controls" style={{ width: '100%' }}>
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

              <div className="filter-select" style={{ minWidth: 150 }}>
                <Select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active Staff</option>
                  <option value="on-leave">On Leave</option>
                  <option value="probation">Probation</option>
                  <option value="resigned">Resigned</option>
                </Select>
              </div>

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
        </>
      )}

      {/* TAB 2: PENDING REGISTRATION APPROVALS */}
      {activeTab === 'pending' && (
        <DataTable
          columns={pendingColumns}
          data={pendingList}
          loading={pendingLoading}
          emptyIcon={UserCheck}
          emptyTitle="No pending onboarding requests"
          emptyMessage="All registered employee applications have been reviewed and activated. New submissions will appear here for Admin review."
        />
      )}

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

      {/* Onboard & Activate Candidate Modal */}
      {onboardCandidate && (
        <Modal
          open={Boolean(onboardCandidate)}
          onClose={() => setOnboardCandidate(null)}
          title="Review & Onboard Applicant"
          subtitle={`Assign role, department, and initial salary for ${onboardCandidate.name}`}
          maxWidth={640}
        >
          <form onSubmit={handleApproveOnboard}>
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{onboardCandidate.name}</div>
              <div className="text-xs muted" style={{ marginTop: 2 }}>
                {onboardCandidate.email} &bull; {onboardCandidate.phone || 'No phone recorded'}
              </div>
            </div>

            <div className="form-grid-2">
              <Field label="System Role" required>
                <Select value={onboardForm.role} onChange={(e) => setOnboardForm({ ...onboardForm, role: e.target.value })}>
                  <option value="employee">Employee (Standard Staff)</option>
                  <option value="manager">Team Manager</option>
                  <option value="hr">HR Manager</option>
                </Select>
              </Field>

              <Field label="Department" required>
                <Select value={onboardForm.department} onChange={(e) => setOnboardForm({ ...onboardForm, department: e.target.value })} required>
                  <option value="">Select Department</option>
                  {(deptData?.data || []).map((d) => (
                    <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="form-grid-3" style={{ marginTop: 8 }}>
              <Field label="Designation" required>
                <Input
                  type="text"
                  placeholder="e.g. Frontend Engineer"
                  value={onboardForm.designation}
                  onChange={(e) => setOnboardForm({ ...onboardForm, designation: e.target.value })}
                  required
                />
              </Field>
              <Field label="Employment Type">
                <Select value={onboardForm.employmentType} onChange={(e) => setOnboardForm({ ...onboardForm, employmentType: e.target.value })}>
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </Select>
              </Field>
              <Field label="Date of Joining" required>
                <Input
                  type="date"
                  value={onboardForm.dateOfJoining}
                  onChange={(e) => setOnboardForm({ ...onboardForm, dateOfJoining: e.target.value })}
                  required
                />
              </Field>
            </div>

            <div style={{ marginTop: 14, marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <IndianRupee size={13} style={{ color: 'var(--emerald)' }} />
              Compensation Setup (₹ / month)
            </div>

            <div className="form-grid-3">
              <Field label="Basic (₹)" required>
                <Input
                  type="number"
                  min="0"
                  value={onboardForm.salary.basic}
                  onChange={(e) => setOnboardForm({ ...onboardForm, salary: { ...onboardForm.salary, basic: Number(e.target.value) } })}
                  required
                />
              </Field>
              <Field label="HRA (₹)">
                <Input
                  type="number"
                  min="0"
                  value={onboardForm.salary.hra}
                  onChange={(e) => setOnboardForm({ ...onboardForm, salary: { ...onboardForm.salary, hra: Number(e.target.value) } })}
                />
              </Field>
              <Field label="Allowances (₹)">
                <Input
                  type="number"
                  min="0"
                  value={onboardForm.salary.allowances}
                  onChange={(e) => setOnboardForm({ ...onboardForm, salary: { ...onboardForm.salary, allowances: Number(e.target.value) } })}
                />
              </Field>
            </div>

            <div style={{ marginTop: 14, marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Landmark size={13} style={{ color: 'var(--blue)' }} />
              Disbursement Account
            </div>

            <div className="form-grid-3">
              <Field label="Bank Name">
                <Input
                  type="text"
                  placeholder="e.g. HDFC Bank"
                  value={onboardForm.bank.bankName}
                  onChange={(e) => setOnboardForm({ ...onboardForm, bank: { ...onboardForm.bank, bankName: e.target.value } })}
                />
              </Field>
              <Field label="Account Number">
                <Input
                  type="text"
                  placeholder="Account Number"
                  value={onboardForm.bank.accountNumber}
                  onChange={(e) => setOnboardForm({ ...onboardForm, bank: { ...onboardForm.bank, accountNumber: e.target.value } })}
                />
              </Field>
              <Field label="IFSC Code">
                <Input
                  type="text"
                  placeholder="IFSC Code"
                  value={onboardForm.bank.ifsc}
                  onChange={(e) => setOnboardForm({ ...onboardForm, bank: { ...onboardForm.bank, ifsc: e.target.value.toUpperCase() } })}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-3 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <Button variant="secondary" onClick={() => setOnboardCandidate(null)} disabled={onboardLoading} type="button">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={onboardLoading} icon={UserCheck}>
                Approve &amp; Activate Account
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Candidate Modal */}
      {toReject && (
        <Modal
          open={Boolean(toReject)}
          onClose={() => setToReject(null)}
          title="Reject Registration Application"
          subtitle={`Provide a reason for rejecting ${toReject.name}'s registration request`}
        >
          <div className="flex-col gap-3">
            <Field label="Rejection Reason" required>
              <Input
                type="text"
                placeholder="e.g. Duplicate account / Incomplete candidate documentation"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setToReject(null)} disabled={rejecting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRejectCandidate} loading={rejecting} icon={UserX}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
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

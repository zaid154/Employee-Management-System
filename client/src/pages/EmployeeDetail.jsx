import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Building2, UserCircle,
  Wallet, CreditCard, ShieldAlert, Pencil, User, FileText, CheckCircle,
  Camera, Upload, FileCheck, CheckCircle2, XCircle, Trash2, ExternalLink, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  Card, CardHeader, Loader, Badge, Avatar, Button, EmptyState, Tabs,
  Modal, Field, Input, Select, IconButton
} from '../components/ui.jsx';
import { DonutChart } from '../components/charts.jsx';
import { money, fmtDate, fullName } from '../lib/format.js';
import { isPrivileged, CHART_COLORS } from '../lib/constants.js';
import EmployeeForm from '../components/EmployeeForm.jsx';

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-3)',
          flexShrink: 0,
        }}
      >
        <Icon size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-xs muted">{label}</div>
        <div className="font-medium text-sm truncate" style={{ color: 'var(--text)', marginTop: 1 }}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, refetch } = useFetch(`/employees/${id}`, [id]);
  const { data: deptData } = useFetch(isPrivileged(user.role) ? '/departments' : null);
  const { data: mgrData } = useFetch(isPrivileged(user.role) ? '/employees/options' : null);

  const [activeTab, setActiveTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Document upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('aadhaar');
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [uploadDocFile, setUploadDocFile] = useState(null);
  const [docUploading, setDocUploading] = useState(false);

  // Document verification modal state
  const [verifyDocModal, setVerifyDocModal] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('verified');
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [verifySubmitting, setVerifySubmitting] = useState(false);

  if (loading) return <Loader label="Loading employee profile…" />;
  if (!data?.data) {
    return (
      <Card>
        <EmptyState
          title="Employee not found"
          message="The requested employee record does not exist or has been removed."
          action={<Button onClick={() => navigate('/employees')}>Return to Directory</Button>}
        />
      </Card>
    );
  }

  const e = data.data;
  const s = e.salary || {};
  const gross = (s.basic || 0) + (s.hra || 0) + (s.allowances || 0);
  const totalDeductions = (s.pf || 0) + (s.professionalTax || 0);
  const netMonthly = gross - totalDeductions;

  const salaryData = [
    { label: 'Basic Salary', value: s.basic || 0, color: CHART_COLORS[0] },
    { label: 'HRA', value: s.hra || 0, color: CHART_COLORS[1] },
    { label: 'Special Allowances', value: s.allowances || 0, color: CHART_COLORS[2] },
  ];

  const balance = e.leaveBalance || {};
  const canEdit = isPrivileged(user.role);
  const ownId = user.employee?._id || user.employee;
  const isOwn = ownId && String(ownId) === String(e._id);
  const canSeeSalary = canEdit || isOwn;

  const handleAvatarUpload = async (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarUploading(true);
    const toastId = toast.loading('Uploading profile picture to Cloudinary...');
    try {
      await api.post(`/employees/${id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Profile photo updated!', { id: toastId });
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Avatar upload failed', { id: toastId });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDocumentUpload = async (evt) => {
    evt.preventDefault();
    if (!uploadDocFile) {
      toast.error('Please choose a document file to upload');
      return;
    }
    const formData = new FormData();
    formData.append('document', uploadDocFile);
    formData.append('documentType', uploadDocType);
    formData.append('title', uploadDocTitle.trim() || uploadDocFile.name);

    setDocUploading(true);
    const toastId = toast.loading('Uploading document to Cloudinary...');
    try {
      await api.post(`/employees/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Document uploaded for verification!', { id: toastId });
      setUploadModalOpen(false);
      setUploadDocFile(null);
      setUploadDocTitle('');
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Document upload failed', { id: toastId });
    } finally {
      setDocUploading(false);
    }
  };

  const handleVerifyDocument = async () => {
    if (!verifyDocModal) return;
    setVerifySubmitting(true);
    try {
      await api.patch(`/employees/${id}/documents/${verifyDocModal._id}/verify`, {
        status: verifyStatus,
        adminRemarks: verifyRemarks.trim(),
      });
      toast.success(`Document marked as ${verifyStatus}!`);
      setVerifyDocModal(null);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Verification update failed');
    } finally {
      setVerifySubmitting(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/employees/${id}/documents/${docId}`);
      toast.success('Document removed');
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Delete failed');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Personal', icon: User },
    { id: 'employment', label: 'Job & Role', icon: Briefcase },
    ...(canSeeSalary ? [{ id: 'compensation', label: 'Salary & Banking', icon: Wallet }] : []),
    { id: 'leaves', label: 'Leave Quotas', icon: Calendar },
    { id: 'documents', label: 'Documents & Verification', icon: FileCheck, count: (e.documents || []).length },
  ];

  return (
    <>
      {/* Back button */}
      <div className="mb-3">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/employees')}
          style={{ paddingLeft: 0 }}
        >
          <ArrowLeft size={14} /> Back to Directory
        </button>
      </div>

      {/* Header Profile Summary */}
      <Card pad={false} className="mb-4">
        <div className="card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div className="flex items-center gap-4">
            <div style={{ position: 'relative' }}>
              <Avatar name={fullName(e)} src={e.avatar} size={56} />
              {(canEdit || isOwn) && (
                <label
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    background: 'var(--accent)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                  title="Upload profile picture to Cloudinary"
                >
                  <Camera size={12} />
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                    disabled={avatarUploading}
                  />
                </label>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  {fullName(e)}
                </h1>
                <span className="table-cell-mono" style={{ fontSize: 11, padding: '2px 6px', background: 'var(--bg-subtle)', borderRadius: 4 }}>
                  {e.employeeId}
                </span>
                <Badge status={e.status}>{e.status}</Badge>
              </div>
              <div className="text-sm muted mt-1">
                {e.designation} · {e.department?.name || 'General'}
              </div>
            </div>
          </div>

          {canEdit && (
            <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
              Edit Profile
            </Button>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ padding: '0 20px' }}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </Card>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid-2">
          <Card pad={false}>
            <CardHeader title="Personal Information" subtitle="Contact and identity details" />
            <div className="card-pad">
              <DetailItem icon={Mail} label="Email Address" value={e.email} />
              <DetailItem icon={Phone} label="Phone Number" value={e.phone} />
              <DetailItem icon={UserCircle} label="Gender" value={<span className="capitalize">{e.gender}</span>} />
              <DetailItem icon={Calendar} label="Date of Birth" value={e.dateOfBirth ? fmtDate(e.dateOfBirth) : '—'} />
              <DetailItem icon={MapPin} label="Residential Address" value={e.address} />
            </div>
          </Card>

          <Card pad={false}>
            <CardHeader title="Emergency Contact" subtitle="Next of kin / trusted contact" />
            <div className="card-pad">
              <DetailItem icon={ShieldAlert} label="Contact Name" value={e.emergencyContact?.name} />
              <DetailItem icon={UserCircle} label="Relationship" value={e.emergencyContact?.relation} />
              <DetailItem icon={Phone} label="Emergency Phone" value={e.emergencyContact?.phone} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'employment' && (
        <div className="grid-2">
          <Card pad={false}>
            <CardHeader title="Employment Details" subtitle="Position and reporting structure" />
            <div className="card-pad">
              <DetailItem icon={Briefcase} label="Designation" value={e.designation} />
              <DetailItem icon={Building2} label="Department" value={e.department?.name} />
              <DetailItem icon={UserCircle} label="Reporting Manager" value={e.manager ? fullName(e.manager) : 'None assigned'} />
              <DetailItem icon={Briefcase} label="Employment Type" value={<span className="capitalize">{e.employmentType}</span>} />
              <DetailItem icon={Calendar} label="Date of Joining" value={fmtDate(e.dateOfJoining)} />
            </div>
          </Card>

          <Card pad={false}>
            <CardHeader title="Work Status" subtitle="Current status within company" />
            <div className="card-pad flex-col gap-3">
              <div className="flex justify-between items-center" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm muted">Employment Status</span>
                <Badge status={e.status}>{e.status}</Badge>
              </div>
              <div className="flex justify-between items-center" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm muted">Employee ID</span>
                <span className="table-cell-mono">{e.employeeId}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'compensation' && (
        <div className="grid-2">
          <Card pad={false}>
            <CardHeader
              title="Salary Breakdown"
              subtitle="Monthly earnings and statutory deductions"
              action={<span className="badge green">{money(gross)}/mo gross</span>}
            />
            <div className="card-pad">
              <DonutChart data={salaryData} centerValue={money(gross)} centerLabel="Gross" size={160} />
              <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="muted">Provident Fund (PF)</span>
                  <span className="font-semi font-mono" style={{ color: 'var(--red-text)' }}>
                    − {money(s.pf)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="muted">Professional Tax</span>
                  <span className="font-semi font-mono" style={{ color: 'var(--red-text)' }}>
                    − {money(s.professionalTax)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <span>Net Take-Home Pay</span>
                  <span className="font-mono" style={{ color: 'var(--green-text)' }}>
                    {money(netMonthly)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card pad={false}>
            <CardHeader title="Banking &amp; Statutory Details" subtitle="Disbursement account info" />
            <div className="card-pad">
              <DetailItem icon={CreditCard} label="Bank Name" value={e.bank?.bankName} />
              <DetailItem icon={User} label="Account Holder Name" value={e.bank?.accountName} />
              <DetailItem icon={CreditCard} label="Account Number" value={e.bank?.accountNumber} />
              <DetailItem icon={Building2} label="IFSC Code" value={e.bank?.ifscCode} />
              <DetailItem icon={FileText} label="PAN / Tax ID" value={e.bank?.pan} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'leaves' && (
        <Card pad={false}>
          <CardHeader title="Annual Leave Allocation" subtitle="Remaining quota balance for the current calendar year" />
          <div className="card-pad">
            <div className="grid-3">
              {['casual', 'sick', 'earned'].map((t, i) => (
                <div
                  key={t}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    textAlign: 'center',
                  }}
                >
                  <div className="font-bold text-2xl font-mono" style={{ color: CHART_COLORS[i] }}>
                    {balance[t] ?? 0}
                  </div>
                  <div className="text-xs muted capitalize mt-1">{t} Leave Days Left</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* TAB: DOCUMENTS & CLOUDINARY VERIFICATION */}
      {activeTab === 'documents' && (
        <Card pad={false}>
          <CardHeader
            title="Verified Identity &amp; Compliance Documents"
            subtitle="Cloudinary encrypted storage with Admin review and verification status"
            action={
              (canEdit || isOwn) && (
                <Button icon={Upload} size="sm" onClick={() => setUploadModalOpen(true)}>
                  Upload Document
                </Button>
              )
            }
          />
          <div className="card-pad">
            {(!e.documents || e.documents.length === 0) ? (
              <EmptyState
                icon={FileText}
                title="No documents uploaded"
                message="No compliance documents (Aadhaar, PAN, Resume, Educational Certificates) have been uploaded for this employee yet."
                action={
                  (canEdit || isOwn) && (
                    <Button icon={Upload} size="sm" onClick={() => setUploadModalOpen(true)}>
                      Upload Document
                    </Button>
                  )
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {e.documents.map((doc) => (
                  <div
                    key={doc._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: doc.status === 'verified' ? 'var(--emerald)' : doc.status === 'rejected' ? 'var(--red)' : 'var(--amber)',
                        }}
                      >
                        <FileText size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                          {doc.title || doc.fileName}
                        </div>
                        <div className="text-xs muted" style={{ marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className="capitalize font-mono" style={{ textTransform: 'uppercase', fontSize: 10.5 }}>{doc.documentType}</span>
                          &bull;
                          <span>{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : 'Cloudinary File'}</span>
                          &bull;
                          <span>Uploaded {fmtDate(doc.uploadedAt)}</span>
                        </div>
                        {doc.adminRemarks && (
                          <div style={{ fontSize: 11.5, color: doc.status === 'rejected' ? 'var(--red-text)' : 'var(--text-3)', marginTop: 4 }}>
                            <strong>Admin Note:</strong> {doc.adminRemarks}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: 11,
                          fontWeight: 600,
                          background: doc.status === 'verified' ? 'rgba(16, 185, 129, 0.12)' : doc.status === 'rejected' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: doc.status === 'verified' ? 'var(--emerald-text, #10b981)' : doc.status === 'rejected' ? 'var(--red-text, #ef4444)' : 'var(--amber-text, #d97706)',
                          border: `1px solid ${doc.status === 'verified' ? 'rgba(16, 185, 129, 0.25)' : doc.status === 'rejected' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                        }}
                      >
                        {doc.status === 'verified' ? 'Verified' : doc.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                      </span>

                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title="View document on Cloudinary"
                      >
                        <ExternalLink size={13} /> View
                      </a>

                      {canEdit && doc.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="primary"
                          icon={CheckCircle2}
                          onClick={() => {
                            setVerifyDocModal(doc);
                            setVerifyStatus('verified');
                            setVerifyRemarks('');
                          }}
                        >
                          Verify
                        </Button>
                      )}

                      {(canEdit || isOwn) && (
                        <IconButton
                          icon={Trash2}
                          variant="ghost"
                          size={14}
                          onClick={() => handleDeleteDocument(doc._id)}
                          title="Delete Document"
                          style={{ color: 'var(--red)' }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <Modal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          title="Upload Verification Document"
          subtitle="File will be stored securely on Cloudinary for administrative review"
        >
          <form onSubmit={handleDocumentUpload}>
            <Field label="Document Classification" required>
              <Select value={uploadDocType} onChange={(e) => setUploadDocType(e.target.value)}>
                <option value="aadhaar">Aadhaar Card</option>
                <option value="pan">PAN Card</option>
                <option value="passport">Passport</option>
                <option value="education">Educational Certificate / Degree</option>
                <option value="resume">Professional Resume</option>
                <option value="bank_proof">Bank Account Proof / Cheque</option>
                <option value="other">Other Official Document</option>
              </Select>
            </Field>

            <Field label="Document Title / Label">
              <Input
                type="text"
                placeholder="e.g. Government ID Proof / Degree Certificate"
                value={uploadDocTitle}
                onChange={(e) => setUploadDocTitle(e.target.value)}
              />
            </Field>

            <Field label="Select Document File" required>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setUploadDocFile(e.target.files?.[0] || null)}
                required
              />
              <span className="text-xs muted mt-1" style={{ fontSize: 11 }}>
                Accepted formats: PDF, PNG, JPG, JPEG, WEBP (Max 10 MB)
              </span>
            </Field>

            <div className="flex justify-end gap-2 pt-3 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <Button variant="secondary" onClick={() => setUploadModalOpen(false)} disabled={docUploading} type="button">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={docUploading} icon={Upload}>
                Upload to Cloudinary
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin Document Verification Modal */}
      {verifyDocModal && (
        <Modal
          open={Boolean(verifyDocModal)}
          onClose={() => setVerifyDocModal(null)}
          title="Review Document Compliance"
          subtitle={`Audit and record verification status for ${verifyDocModal.title || verifyDocModal.fileName}`}
        >
          <div className="flex-col gap-3">
            <Field label="Verification Decision" required>
              <Select value={verifyStatus} onChange={(e) => setVerifyStatus(e.target.value)}>
                <option value="verified">Verified (Approved)</option>
                <option value="rejected">Rejected (Needs Re-upload)</option>
              </Select>
            </Field>

            <Field label="Reviewer Remarks / Notes">
              <Input
                type="text"
                placeholder="e.g. Identity verified against government database / Blurry image"
                value={verifyRemarks}
                onChange={(e) => setVerifyRemarks(e.target.value)}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <Button variant="secondary" onClick={() => setVerifyDocModal(null)} disabled={verifySubmitting}>
                Cancel
              </Button>
              <Button variant={verifyStatus === 'verified' ? 'primary' : 'danger'} onClick={handleVerifyDocument} loading={verifySubmitting} icon={CheckCircle2}>
                Save Review Decision
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Form Modal */}
      {canEdit && (
        <EmployeeForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={refetch}
          employee={e}
          departments={deptData?.data || []}
          managers={mgrData?.data || []}
        />
      )}
    </>
  );
}

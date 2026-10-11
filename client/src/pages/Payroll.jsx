import { useState, useMemo, useCallback } from 'react';
import {
  Wallet, Calculator, Eye, CheckCircle2, Trash2, Printer, TrendingUp, TrendingDown,
  Building, RefreshCw, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Button, Badge, DataTable, UserCell, DateBadge, Select,
  Modal, Field, IconButton, ConfirmDialog, Input,
} from '../components/ui.jsx';
import { money, fmtDate, fullName, MONTHS, monthName } from '../lib/format.js';
import { isPrivileged } from '../lib/constants.js';

const now = new Date();
const YEARS = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

export default function Payroll() {
  const { user } = useAuth();
  const canRun = isPrivileged(user.role);

  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const query = new URLSearchParams({
    page,
    limit: 15,
    ...(month && { month }),
    ...(year && { year }),
    ...(status && { status }),
  }).toString();

  const { data, loading, refetch } = useFetch(`/payroll?${query}`, [query]);

  const [genOpen, setGenOpen] = useState(false);
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());

  const [viewSlip, setViewSlip] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  // Payment Recording Modal State
  const [paySlipTarget, setPaySlipTarget] = useState(null);
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [payRef, setPayRef] = useState('');
  const [paidAtDate, setPaidAtDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);

  const openPaymentModal = useCallback((slip) => {
    setPaySlipTarget(slip);
    setPayMethod('bank_transfer');
    setPayRef(`UTR-${Date.now().toString(36).toUpperCase()}`);
    setPaidAtDate(new Date().toISOString().split('T')[0]);
    setPayNote('');
  }, []);

  const handleConfirmPayment = async (e) => {
    if (e) e.preventDefault();
    if (!paySlipTarget) return;
    if (!payRef.trim()) {
      toast.error('Payment reference or transaction ID is required');
      return;
    }
    setPaying(true);
    try {
      await api.patch(`/payroll/${paySlipTarget._id}/pay`, {
        paymentReference: payRef.trim(),
        paymentMethod: payMethod,
        paidAt: paidAtDate ? new Date(paidAtDate).toISOString() : new Date().toISOString(),
        note: payNote.trim(),
      });
      toast.success('Payment recorded and payslip confirmed as paid');
      setPaySlipTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to record payment');
    } finally {
      setPaying(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post('/payroll/generate', { month: Number(genMonth), year: Number(genYear) });
      toast.success(res.data?.message || 'Payroll generated successfully');
      setGenOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Payroll generation failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/payroll/${toDelete._id}`);
      toast.success('Payslip deleted');
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const resetFilters = () => {
    setMonth('');
    setYear('');
    setStatus('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(month || year || status);

  const slips = data?.data || [];
  const totals = data?.totals || { net: 0, gross: 0 };
  const totalSlips = data?.pagination?.total ?? 0;

  // Define Table Columns
  const columns = useMemo(
    () => [
      ...(canRun ? [{
        header: 'Employee',
        key: 'employee',
        minWidth: 200,
        render: (p) => {
          const empName = fullName(p.employee) || 'Employee';
          const empDept = p.employee?.department?.name || '';
          const empId = p.employee?.employeeId || '';
          const sub = [empId, empDept].filter(Boolean).join(' · ');
          return <UserCell name={empName} avatar={p.employee?.avatar} subtitle={sub} />;
        },
      }] : []),
      {
        header: 'Pay Period',
        key: 'period',
        minWidth: 130,
        render: (p) => (
          <div className="table-date-badge">
            <span style={{ whiteSpace: 'nowrap' }}>{monthName(p.month)} {p.year}</span>
          </div>
        ),
      },
      {
        header: 'Basic Salary',
        key: 'basic',
        minWidth: 110,
        align: 'right',
        className: 'table-cell-num',
        render: (p) => (
          <span style={{ whiteSpace: 'nowrap' }}>
            {money(p.basic || p.earnings?.basic)}
          </span>
        ),
      },
      {
        header: 'Gross Pay',
        key: 'gross',
        minWidth: 110,
        align: 'right',
        className: 'table-cell-num font-semi',
        render: (p) => (
          <span style={{ whiteSpace: 'nowrap' }}>
            {money(p.grossEarnings ?? p.grossPay ?? (p.basic + (p.hra || 0) + (p.allowances || 0) + (p.bonus || 0)))}
          </span>
        ),
      },
      {
        header: 'Deductions',
        key: 'deductions',
        minWidth: 115,
        align: 'right',
        className: 'table-cell-num',
        render: (p) => {
          const ded = p.totalDeductions ?? ((p.pf || 0) + (p.professionalTax || 0) + (p.tax || 0) + (p.lopDeduction || 0) + (p.otherDeductions || 0));
          return (
            <span style={{ color: ded > 0 ? 'var(--red-text)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>
              {ded > 0 ? `− ${money(ded)}` : money(0)}
            </span>
          );
        },
      },
      {
        header: 'Net Payable',
        key: 'netPay',
        minWidth: 120,
        align: 'right',
        className: 'table-cell-num font-bold',
        render: (p) => (
          <span style={{ color: 'var(--green-text)', fontSize: 13.5, whiteSpace: 'nowrap' }}>
            {money(p.netPay)}
          </span>
        ),
      },
      {
        header: 'Status',
        key: 'status',
        minWidth: 120,
        render: (p) => (
          <div>
            <Badge status={p.status}>{p.status}</Badge>
            {p.status === 'paid' && p.paymentReference && (
              <div
                className="font-mono text-3 mt-0.5"
                style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}
                title={`Ref: ${p.paymentReference} (${p.paymentMethod || 'bank_transfer'})`}
              >
                {p.paymentReference}
              </div>
            )}
          </div>
        ),
      },
      {
        header: 'Actions',
        key: 'actions',
        width: 165,
        minWidth: 165,
        align: 'right',
        render: (p) => (
          <div className="table-actions-group">
            <button
              type="button"
              className="btn-action-view"
              onClick={() => setViewSlip(p)}
              title="View Payslip Statement"
            >
              <Eye size={13} />
              <span>Slip</span>
            </button>
            {canRun && p.status !== 'paid' && (
              <button
                type="button"
                className="btn-action-approve"
                onClick={() => openPaymentModal(p)}
                title="Record Payment & Disburse"
              >
                <CheckCircle2 size={13} />
                <span>Pay</span>
              </button>
            )}
            {canRun && p.status !== 'paid' && (
              <IconButton
                icon={Trash2}
                variant="ghost"
                size={14}
                onClick={() => setToDelete(p)}
                title="Delete Slip"
                style={{ color: 'var(--red)' }}
              />
            )}
          </div>
        ),
      },
    ],
    [canRun, openPaymentModal]
  );

  return (
    <>
      <PageHeader
        title={canRun ? 'Payroll & Compensation' : 'My Payslips'}
        subtitle={canRun ? 'Generate monthly payroll batches, calculate statutory deductions, and issue payslips' : 'View and download your monthly salary statements'}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={refetch} title="Refresh Data">
              Refresh
            </Button>
            {canRun && (
              <Button icon={Calculator} onClick={() => setGenOpen(true)}>
                Run Payroll Batch
              </Button>
            )}
          </div>
        }
      />

      {canRun && (
        <div className="metric-strip">
          <div className="metric-card">
            <div className="metric-header">
              <span className="font-semi">Total Gross Pay</span>
              <TrendingUp size={15} style={{ color: 'var(--blue)' }} />
            </div>
            <div className="metric-value font-mono">{money(totals.gross)}</div>
            <div className="metric-meta">Gross earnings across period</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="font-semi">Total Deductions</span>
              <TrendingDown size={15} style={{ color: 'var(--red)' }} />
            </div>
            <div className="metric-value font-mono" style={{ color: 'var(--red-text)' }}>
              {money(totals.deductions ?? Math.max(0, totals.gross - totals.net))}
            </div>
            <div className="metric-meta">PF, taxes &amp; penalties</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="font-semi">Net Take-Home Pay</span>
              <Wallet size={15} style={{ color: 'var(--green)' }} />
            </div>
            <div className="metric-value font-mono" style={{ color: 'var(--green-text)' }}>
              {money(totals.net)}
            </div>
            <div className="metric-meta">Net disbursed to staff</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="font-semi">Total Payslips</span>
              <Calculator size={15} style={{ color: 'var(--purple-text, #8b5cf6)' }} />
            </div>
            <div className="metric-value font-mono">{totalSlips}</div>
            <div className="metric-meta">Generated statements</div>
          </div>
        </div>
      )}

      {/* Enhanced Filter Bar */}
      <div className="filter-bar-enterprise filter-bar-compact">
        <div className="filter-row-controls">
          <div className="filter-select" style={{ minWidth: 160 }}>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statements</option>
              <option value="draft">Draft</option>
              <option value="processed">Processed</option>
              <option value="paid">Paid</option>
            </Select>
          </div>

          <div className="filter-select" style={{ minWidth: 160 }}>
            <Select
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Months</option>
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </Select>
          </div>

          <div className="filter-select" style={{ minWidth: 140 }}>
            <Select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Years</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
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
        data={slips}
        loading={loading}
        emptyIcon={Wallet}
        emptyTitle="No payroll records found"
        emptyMessage={
          hasActiveFilters
            ? 'No payslips match your current filters. Try resetting the filters.'
            : 'No payroll records have been generated yet for this period.'
        }
        emptyAction={
          hasActiveFilters ? (
            <Button variant="secondary" icon={RotateCcw} onClick={resetFilters}>
              Clear Filters
            </Button>
          ) : canRun ? (
            <Button icon={Calculator} onClick={() => setGenOpen(true)}>
              Generate Payroll Batch
            </Button>
          ) : null
        }
        pagination={{
          page: data?.pagination?.page || 1,
          pages: data?.pagination?.pages || 1,
          total: totalSlips,
          limit: 15,
          onPage: setPage,
        }}
      />

      {/* Generate Batch Modal */}
      {genOpen && (
        <Modal
          open={genOpen}
          onClose={() => setGenOpen(false)}
          title="Run Monthly Payroll Batch"
          subtitle="Calculate salaries and statutory deductions for all active staff"
          footer={
            <>
              <Button variant="secondary" onClick={() => setGenOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} loading={busy} icon={Calculator}>
                Generate Batch
              </Button>
            </>
          }
        >
          <form onSubmit={handleGenerate}>
            <div className="form-grid-2">
              <Field label="Payroll Month" required>
                <Select value={genMonth} onChange={(e) => setGenMonth(e.target.value)}>
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Payroll Year" required>
                <Select value={genYear} onChange={(e) => setGenYear(e.target.value)}>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <p className="text-xs text-3 mt-2" style={{ lineHeight: 1.5 }}>
              This will automatically compute gross salary, PF contributions, professional tax, leave deductions, and net payable for all eligible employees for the selected period.
            </p>
          </form>
        </Modal>
      )}

      {/* View / Print Payslip Modal */}
      {viewSlip && (
        <Modal
          open={Boolean(viewSlip)}
          onClose={() => setViewSlip(null)}
          title="Salary Statement / Payslip"
          subtitle={`Pay Period: ${monthName(viewSlip.month)} ${viewSlip.year}`}
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setViewSlip(null)}>
                Close
              </Button>
              <Button icon={Printer} onClick={() => window.print()}>
                Print Payslip
              </Button>
            </>
          }
        >
          <div className="payslip-sheet printable-area">
            {/* Payslip Header */}
            <div className="payslip-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Building size={20} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>PeoplePay Inc.</span>
                </div>
                <div className="text-xs text-3">Enterprise HR &amp; Payroll Solutions</div>
                <div className="text-xs text-3">GSTIN / Tax ID: 27AABCP1234F1Z5</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>PAYSLIP</div>
                <div className="text-xs text-3 font-mono">
                  {monthName(viewSlip.month)?.toUpperCase()} {viewSlip.year}
                </div>
                <div className="mt-1">
                  <Badge status={viewSlip.status}>{viewSlip.status}</Badge>
                </div>
              </div>
            </div>

            {/* Employee Meta Grid */}
            <div className="grid-2 mb-4" style={{ fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
              <div>
                <div><strong>Employee:</strong> {fullName(viewSlip.employee)}</div>
                <div className="text-xs text-3 mt-1"><strong>ID:</strong> {viewSlip.employee?.employeeId}</div>
                <div className="text-xs text-3 mt-1"><strong>Designation:</strong> {viewSlip.employee?.designation}</div>
              </div>
              <div>
                <div><strong>Department:</strong> {viewSlip.employee?.department?.name || 'General'}</div>
                <div className="text-xs text-3 mt-1"><strong>Bank A/C:</strong> {viewSlip.employee?.bank?.accountNumber || '—'}</div>
                <div className="text-xs text-3 mt-1"><strong>Payment Date:</strong> {viewSlip.paidAt ? fmtDate(viewSlip.paidAt) : 'Pending'}</div>
                {viewSlip.status === 'paid' && viewSlip.paymentReference && (
                  <div className="text-xs text-3 mt-1 font-mono">
                    <strong>Ref/UTR:</strong> {viewSlip.paymentReference} ({viewSlip.paymentMethod || 'bank_transfer'})
                  </div>
                )}
                {viewSlip.status === 'paid' && viewSlip.paidBy && (
                  <div className="text-xs text-3 mt-1">
                    <strong>Disbursed By:</strong> {viewSlip.paidBy?.name || viewSlip.paidBy?.email || 'Admin'}
                  </div>
                )}
                {viewSlip.note && (
                  <div className="text-xs text-3 mt-1">
                    <strong>Notes:</strong> {viewSlip.note}
                  </div>
                )}
              </div>
            </div>

            {/* Earnings & Deductions Table */}
            <div className="grid-2 mb-4">
              {/* Earnings */}
              <div>
                <table className="payslip-table">
                  <thead>
                    <tr>
                      <th>Earnings Item</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Basic Salary</td>
                      <td style={{ textAlign: 'right' }} className="font-mono">{money(viewSlip.basic || viewSlip.earnings?.basic)}</td>
                    </tr>
                    <tr>
                      <td>House Rent Allowance (HRA)</td>
                      <td style={{ textAlign: 'right' }} className="font-mono">{money(viewSlip.hra || viewSlip.earnings?.hra)}</td>
                    </tr>
                    <tr>
                      <td>Special Allowances</td>
                      <td style={{ textAlign: 'right' }} className="font-mono">{money(viewSlip.allowances || viewSlip.earnings?.allowances)}</td>
                    </tr>
                    {viewSlip.bonus > 0 && (
                      <tr>
                        <td>Performance Bonus</td>
                        <td style={{ textAlign: 'right' }} className="font-mono">{money(viewSlip.bonus)}</td>
                      </tr>
                    )}
                    <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-subtle)' }}>
                      <td>Total Gross Earnings</td>
                      <td style={{ textAlign: 'right' }} className="font-mono">{money(viewSlip.grossEarnings || viewSlip.grossPay)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions */}
              <div>
                <table className="payslip-table">
                  <thead>
                    <tr>
                      <th>Deduction Item</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Provident Fund (PF)</td>
                      <td style={{ textAlign: 'right', color: 'var(--red-text)' }} className="font-mono">
                        {money(viewSlip.pf || viewSlip.deductions?.pf)}
                      </td>
                    </tr>
                    <tr>
                      <td>Professional Tax</td>
                      <td style={{ textAlign: 'right', color: 'var(--red-text)' }} className="font-mono">
                        {money(viewSlip.professionalTax || viewSlip.deductions?.tax)}
                      </td>
                    </tr>
                    {(viewSlip.lopDeduction > 0) && (
                      <tr>
                        <td>Loss of Pay (LOP)</td>
                        <td style={{ textAlign: 'right', color: 'var(--red-text)' }} className="font-mono">
                          {money(viewSlip.lopDeduction)}
                        </td>
                      </tr>
                    )}
                    {((viewSlip.tax > 0) || (viewSlip.otherDeductions > 0)) && (
                      <tr>
                        <td>TDS / Other Deductions</td>
                        <td style={{ textAlign: 'right', color: 'var(--red-text)' }} className="font-mono">
                          {money((viewSlip.tax || 0) + (viewSlip.otherDeductions || 0))}
                        </td>
                      </tr>
                    )}
                    <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-subtle)' }}>
                      <td>Total Deductions</td>
                      <td style={{ textAlign: 'right', color: 'var(--red-text)' }} className="font-mono">
                        {money(viewSlip.totalDeductions ?? ((viewSlip.pf || 0) + (viewSlip.professionalTax || 0) + (viewSlip.tax || 0) + (viewSlip.lopDeduction || 0) + (viewSlip.otherDeductions || 0)))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Salary Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-subtle)',
                padding: '12px 18px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Net Take-Home Pay</div>
                <div className="text-xs text-3">Amount transferred to salary account</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green-text)', fontFamily: 'var(--font-mono)' }}>
                {money(viewSlip.netPay)}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {paySlipTarget && (
        <Modal
          open={Boolean(paySlipTarget)}
          onClose={() => !paying && setPaySlipTarget(null)}
          title="Record Salary Payment"
          subtitle={`Disbursement for ${fullName(paySlipTarget.employee)} (${monthName(paySlipTarget.month)} ${paySlipTarget.year})`}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setPaySlipTarget(null)} disabled={paying}>
                Cancel
              </Button>
              <Button icon={CheckCircle2} onClick={handleConfirmPayment} loading={paying}>
                Confirm &amp; Record Payment
              </Button>
            </>
          }
        >
          <form onSubmit={handleConfirmPayment}>
            {/* Net Amount Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-text)' }}>Net Payable Amount</div>
                <div className="text-xs text-3">
                  Bank: {paySlipTarget.employee?.bank?.bankName || 'Direct Transfer'} (A/C: {paySlipTarget.employee?.bank?.accountNumber || '—'})
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green-text)', fontFamily: 'var(--font-mono)' }}>
                {money(paySlipTarget.netPay)}
              </div>
            </div>

            <div className="form-grid-2">
              <Field label="Payment Method" required>
                <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option value="bank_transfer">Direct Bank Transfer / NEFT / RTGS</option>
                  <option value="upi">UPI / Instant Corporate Transfer</option>
                  <option value="cheque">Company Cheque</option>
                  <option value="cash">Cash Disbursement</option>
                </Select>
              </Field>

              <Field label="Payment Date" required>
                <Input
                  type="date"
                  value={paidAtDate}
                  onChange={(e) => setPaidAtDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </Field>
            </div>

            <Field label="Payment Reference / Transaction ID / UTR" required hint="e.g. Bank UTR number, UPI transaction ID, or Cheque serial">
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UTR8473920194 or CHQ-004928"
                  required
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPayRef(`PAY-${Date.now().toString(36).toUpperCase()}`)}
                  title="Generate system reference"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Auto-Gen
                </Button>
              </div>
            </Field>

            <Field label="Remarks / Disbursement Notes" className="mt-3">
              <Input
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                placeholder="Optional payment notes or accounting reference"
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
        title="Delete Payslip"
        message="Are you sure you want to delete this payslip record? This action cannot be undone."
        confirmText="Delete Slip"
        confirmVariant="danger"
        loading={busy}
      />
    </>
  );
}

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Search, ChevronLeft, ChevronRight, Inbox, AlertTriangle,
  MoreVertical, Check, Info, AlertCircle, Loader2
} from 'lucide-react';
import { initials, fmtDate, fmtDateRange } from '../lib/format.js';
import { badgeColor } from '../lib/constants.js';

/* ---------------- Button ---------------- */
export function Button({
  variant = 'primary',
  size,
  icon: Icon,
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    size === 'lg' && 'btn-lg',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} disabled={disabled || loading} {...props}>
      {loading ? <Spinner size={size === 'sm' ? 13 : 15} color="currentColor" /> : Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, className = '', size = 16, variant = 'secondary', ...props }) {
  const cls = variant === 'ghost' ? 'icon-btn icon-btn-ghost' : 'icon-btn';
  return (
    <button className={`${cls} ${className}`} {...props}>
      <Icon size={size} />
    </button>
  );
}

/* ---------------- Card ---------------- */
export function Card({ children, className = '', pad = true, ...props }) {
  const cls = ['card', pad && 'card-pad', className].filter(Boolean).join(' ');
  return (
    <div className={cls} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`card-header ${className}`}>
      <div>
        <div className="card-title">{title}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ---------------- Badge / Status Chip ---------------- */
export function Badge({ children, color, status, dot = true, className = '' }) {
  const c = color || badgeColor(status || children);
  return (
    <span className={`badge ${c} ${className}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

/* ---------------- Avatar ---------------- */
export function Avatar({ name, src, size = 36, className = '' }) {
  return (
    <span
      className={`avatar ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={name}
    >
      {src ? <img src={src} alt={name || 'Avatar'} /> : initials(name)}
    </span>
  );
}

/* ---------------- Form Fields ---------------- */
export function Field({ label, error, hint, children, required, className = '' }) {
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field-label">
          {label} {required && <span className="field-required">*</span>}
        </label>
      )}
      {children}
      {error && <span className="field-error">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`input ${className}`} {...props} />;
}

export function Textarea({ className = '', rows = 3, ...props }) {
  return <textarea className={`textarea ${className}`} rows={rows} {...props} />;
}

export function Select({ children, className = '', ...props }) {
  return (
    <select className={`select ${className}`} {...props}>
      {children}
    </select>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '', ...props }) {
  return (
    <div className={`input-icon ${className}`}>
      <Search size={15} />
      <input className="input" value={value} onChange={onChange} placeholder={placeholder} {...props} />
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
        >
          <motion.div
            className={`modal ${size === 'lg' ? 'modal-lg' : size === 'xl' ? 'modal-xl' : ''}`}
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.15 }}
          >
            <div className="modal-header">
              <div>
                <h3 className="card-title">{title}</h3>
                {subtitle && <p className="card-subtitle">{subtitle}</p>}
              </div>
              <IconButton icon={X} variant="ghost" onClick={onClose} size={16} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Confirm Dialog ---------------- */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex gap-3 items-start">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: confirmVariant === 'danger' ? 'var(--red-subtle)' : 'var(--blue-subtle)',
            border: `1px solid ${confirmVariant === 'danger' ? 'var(--red-border)' : 'var(--blue-border)'}`,
            color: confirmVariant === 'danger' ? 'var(--red)' : 'var(--blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={18} />
        </div>
        <div>
          <p className="text-sm text-2" style={{ lineHeight: 1.6 }}>
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Skeletons & Loaders ---------------- */
export function Spinner({ size = 18, className = '', color = 'currentColor' }) {
  const s = typeof size === 'number' ? size : 18;
  return (
    <svg
      className={`spinner ${className}`}
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke={color}
        strokeWidth="2.5"
        strokeOpacity="0.2"
      />
      <path
        d="M12 2.5C17.2467 2.5 21.5 6.75329 21.5 12"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Loader({
  label = 'Loading…',
  fullscreen = false,
  size = 26,
  className = '',
}) {
  return (
    <div className={`loader-container ${fullscreen ? 'loader-fullscreen' : ''} ${className}`}>
      <div className="loader-inner">
        <Spinner size={size} color="var(--primary)" />
        {label && <span className="loader-label">{label}</span>}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="table-container">
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <div className="skeleton skeleton-text" style={{ width: i === 0 ? 110 : 80, height: 12, margin: 0 }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c}>
                    {c === 0 ? (
                      <div className="flex items-center gap-2.5">
                        <div className="skeleton skeleton-circle" style={{ width: 28, height: 28, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="skeleton skeleton-text" style={{ width: '85%', height: 13, marginBottom: 5 }} />
                          <div className="skeleton skeleton-text" style={{ width: '50%', height: 10, margin: 0 }} />
                        </div>
                      </div>
                    ) : c === 1 ? (
                      <div className="skeleton skeleton-text" style={{ width: 70, height: 14, margin: 0 }} />
                    ) : c === 2 ? (
                      <div className="skeleton" style={{ width: 64, height: 20, borderRadius: 12 }} />
                    ) : c === cols - 1 ? (
                      <div className="flex justify-end gap-1.5">
                        <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 4 }} />
                        <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 4 }} />
                      </div>
                    ) : (
                      <div className="skeleton skeleton-text" style={{ width: 85, height: 13, margin: 0 }} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Universal Enterprise DataTable ---------------- */
export function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyIcon = Inbox,
  emptyTitle = 'No records found',
  emptyMessage,
  emptyAction,
  pagination,
  onRowClick,
  keyField = '_id',
  className = '',
}) {
  if (loading) {
    return <TableSkeleton rows={pagination?.limit || 6} cols={columns.length || 6} />;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          message={emptyMessage}
          action={emptyAction}
        />
      </Card>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  style={{
                    width: col.width,
                    minWidth: col.minWidth,
                    maxWidth: col.maxWidth,
                    textAlign: col.align || 'left',
                  }}
                  className={col.headerClassName || ''}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => {
              const rowKey = row[keyField] || rowIdx;
              return (
                <tr
                  key={rowKey}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      style={{
                        textAlign: col.align || 'left',
                        minWidth: col.minWidth,
                        width: col.width,
                      }}
                      className={col.className || ''}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          page={pagination.page || 1}
          pages={pagination.pages || 1}
          total={pagination.total ?? data.length}
          limit={pagination.limit || 15}
          onPage={pagination.onPage}
        />
      )}
    </div>
  );
}

/* ---------------- Table Cell Helpers ---------------- */
export function UserCell({ name, avatar, subtitle, badge, onClick }) {
  return (
    <div
      className={`table-user-cell ${onClick ? 'pointer' : ''}`}
      onClick={onClick}
    >
      <Avatar name={name} src={avatar} size={32} />
      <div style={{ minWidth: 0 }}>
        <div className="table-user-name">{name}</div>
        {subtitle && <div className="table-user-sub">{subtitle}</div>}
      </div>
      {badge && <div className="ml-1">{badge}</div>}
    </div>
  );
}

export function DateBadge({ date, formatOpts }) {
  return (
    <div className="table-date-badge">
      <span>{fmtDate(date, formatOpts)}</span>
    </div>
  );
}

export function DateRangeBadge({ start, end }) {
  return (
    <div className="table-date-badge">
      <span>{fmtDateRange(start, end)}</span>
    </div>
  );
}

export function DaysPill({ days }) {
  return (
    <span className="table-days-pill">
      {days} {days === 1 ? 'day' : 'days'}
    </span>
  );
}

export function CardSkeleton() {
  return (
    <Card className="flex-col gap-3">
      <div className="skeleton skeleton-text" style={{ width: '40%', height: 16 }} />
      <div className="skeleton skeleton-text" style={{ width: '80%', height: 14 }} />
      <div className="skeleton skeleton-text" style={{ width: '60%', height: 14 }} />
    </Card>
  );
}

/* ---------------- Empty State ---------------- */
export function EmptyState({ icon: Icon = Inbox, title = 'No records found', message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={22} />
      </div>
      <div className="empty-title">{title}</div>
      {message && <div className="empty-message">{message}</div>}
      {action && <div>{action}</div>}
    </div>
  );
}

/* ---------------- Alert Banner ---------------- */
export function AlertBanner({ type = 'info', title, message, children }) {
  const Icon = type === 'danger' ? AlertCircle : type === 'warning' ? AlertTriangle : Info;
  return (
    <div className={`alert-banner ${type}`}>
      <Icon size={17} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        {title && <div className="font-semi mb-1">{title}</div>}
        {message && <div>{message}</div>}
        {children}
      </div>
    </div>
  );
}

/* ---------------- Progress Meter ---------------- */
export function Progress({ value = 0, max = 100, color = 'var(--accent)', height = 6 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ width: '100%', height, backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, transition: 'width 0.3s ease' }} />
    </div>
  );
}

/* ---------------- Segmented Tabs ---------------- */
export function Segment({ options, value, onChange }) {
  return (
    <div className="segment">
      {options.map((o) => (
        <button
          key={o.value}
          className={`segment-btn ${value === o.value ? 'active' : ''}`}
          onClick={() => onChange(o.value)}
          type="button"
        >
          <span>{o.label}</span>
          {o.count !== undefined && (
            <span className={`segment-badge ${value === o.value ? 'active' : ''}`}>
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <div
          key={t.id}
          className={`tab-item ${activeTab === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <t.icon size={15} />}
          <span>{t.label}</span>
          {t.count !== undefined && <span className="tab-badge">{t.count}</span>}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Pagination ---------------- */
export function Pagination({ page = 1, pages = 1, total = 0, limit = 15, onPage }) {
  if (!total || total <= 0) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);

  return (
    <div className="pagination">
      <span>
        Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{total}</strong> records
      </span>
      {pages > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            title="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: pages }).map((_, i) => {
            const p = i + 1;
            if (p === 1 || p === pages || (p >= page - 1 && p <= page + 1)) {
              return (
                <button
                  key={p}
                  className={`pagination-btn ${p === page ? 'active' : ''}`}
                  onClick={() => onPage(p)}
                >
                  {p}
                </button>
              );
            }
            if (p === page - 2 || p === page + 2) {
              return <span key={p} style={{ padding: '0 4px', color: 'var(--text-3)' }}>…</span>;
            }
            return null;
          })}
          <button
            className="pagination-btn"
            disabled={page >= pages}
            onClick={() => onPage(page + 1)}
            title="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Page Header ---------------- */
export function PageHeader({ title, subtitle, actions, breadcrumbs }) {
  return (
    <div className="page-header">
      <div>
        {breadcrumbs && <div className="breadcrumbs mb-1">{breadcrumbs}</div>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

/* ---------------- Action Dropdown Menu ---------------- */
export function ActionMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <IconButton
        icon={MoreVertical}
        variant="ghost"
        size={15}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 32,
            width: 170,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-dropdown)',
            padding: 4,
            zIndex: 50,
          }}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick?.();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '6px 10px',
                fontSize: 12.5,
                color: item.danger ? 'var(--red)' : 'var(--text)',
                borderRadius: 'var(--radius-xs)',
                textAlign: 'left',
              }}
              className="btn-ghost"
            >
              {item.icon && <item.icon size={14} />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, ChevronLeft, ChevronRight, Inbox, AlertTriangle } from 'lucide-react';
import { initials } from '../lib/format.js';
import { badgeColor } from '../lib/constants.js';

/* ---------------- Button ---------------- */
export function Button({ variant = 'primary', size, icon: Icon, children, className = '', ...props }) {
  const cls = ['btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className].filter(Boolean).join(' ');
  return (
    <button className={cls} {...props}>
      {Icon && <Icon size={size === 'sm' ? 15 : 17} />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, className = '', size = 18, ...props }) {
  return (
    <button className={`icon-btn ${className}`} {...props}>
      <Icon size={size} />
    </button>
  );
}

/* ---------------- Card ---------------- */
export function Card({ children, className = '', hover = false, pad = true, ...props }) {
  const cls = ['card', pad && 'card-pad', hover && 'card-hover', className].filter(Boolean).join(' ');
  return (
    <div className={cls} {...props}>
      {children}
    </div>
  );
}

/* ---------------- Badge ---------------- */
export function Badge({ children, color, status, dot = true }) {
  const c = color || badgeColor(status || children);
  return (
    <span className={`badge ${c}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

/* ---------------- Avatar ---------------- */
export function Avatar({ name, src, size = 40, className = '' }) {
  return (
    <span
      className={`avatar ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      title={name}
    >
      {src ? <img src={src} alt={name} /> : initials(name)}
    </span>
  );
}

/* ---------------- Form fields ---------------- */
export function Field({ label, error, children, required, className = '' }) {
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="label">
          {label} {required && <span style={{ color: 'var(--red)' }}>*</span>}
        </label>
      )}
      {children}
      {error && <span className="hint">{error}</span>}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`input ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`textarea ${className}`} {...props} />;
}

export function Select({ children, className = '', ...props }) {
  return (
    <select className={`select ${className}`} {...props}>
      {children}
    </select>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`input-icon ${className}`} style={{ minWidth: 220 }}>
      <Search size={16} />
      <input className="input" value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, children, footer, size }) {
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
            className={`modal ${size === 'lg' ? 'modal-lg' : ''}`}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <div className="modal-header">
              <h3 className="card-title">{title}</h3>
              <IconButton icon={X} onClick={onClose} size={18} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Confirm dialog ---------------- */
export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmText = 'Delete', loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Working…' : confirmText}
          </Button>
        </>
      }
    >
      <div className="flex gap-3 items-start">
        <span
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(239,68,68,0.12)',
            color: 'var(--red)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={20} />
        </span>
        <p className="text-2" style={{ lineHeight: 1.6 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
}

/* ---------------- Loading / empty ---------------- */
export function Spinner({ className = '' }) {
  return <span className={`spinner ${className}`} />;
}

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="center-screen flex-col gap-3">
      <Spinner />
      <span className="muted text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={26} />
      </div>
      <h4 style={{ color: 'var(--text)', marginBottom: 4 }}>{title}</h4>
      {message && <p className="text-sm" style={{ maxWidth: 340, margin: '0 auto' }}>{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------------- Progress ---------------- */
export function Progress({ value = 0, max = 100, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color || undefined }} />
    </div>
  );
}

/* ---------------- Segmented control ---------------- */
export function Segment({ options, value, onChange }) {
  return (
    <div className="segment">
      {options.map((o) => (
        <button
          key={o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Pagination ---------------- */
export function Pagination({ page, pages, total, onPage }) {
  if (!pages || pages <= 1) return total ? <div className="pagination"><span className="muted text-sm">{total} total</span></div> : null;
  const nums = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(pages, from + 4);
  for (let i = from; i <= to; i += 1) nums.push(i);

  return (
    <div className="pagination">
      <span className="muted text-sm">
        Page {page} of {pages} · {total} total
      </span>
      <div className="page-dots">
        <button className="page-dot" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={15} />
        </button>
        {nums.map((n) => (
          <button key={n} className={`page-dot ${n === page ? 'active' : ''}`} onClick={() => onPage(n)}>
            {n}
          </button>
        ))}
        <button className="page-dot" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Page header ---------------- */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

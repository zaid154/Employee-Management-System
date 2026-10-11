import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: '4rem',
          fontWeight: 800,
          lineHeight: 1,
          color: 'var(--text-3)',
          fontFamily: 'var(--font-mono)',
          marginBottom: 16,
        }}
      >
        404
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
        Page Not Found
      </h1>
      <p className="muted text-sm mb-4" style={{ maxWidth: 380 }}>
        The requested resource or page does not exist in your workspace.
      </p>
      <Link to="/">
        <Button icon={Home}>Return to Dashboard</Button>
      </Link>
    </div>
  );
}

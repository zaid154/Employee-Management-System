import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div className="center-screen flex-col gap-4 text-center" style={{ minHeight: '100vh' }}>
      <div className="text-2xl gradient-text" style={{ fontSize: '5rem', fontWeight: 800, lineHeight: 1 }}>404</div>
      <div>
        <h1 className="text-xl font-bold">Page not found</h1>
        <p className="muted mt-1">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      </div>
      <Link to="/">
        <Button icon={Home}>Back to dashboard</Button>
      </Link>
    </div>
  );
}

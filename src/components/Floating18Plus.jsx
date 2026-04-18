import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Floating18Plus() {
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Link
        to="/page/18plus"
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full shadow-lg hover:shadow-xl hover:border-primary/30 transition-all group"
      >
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">18+</span>
      </Link>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, Calendar, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import moment from 'moment';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    base44.entities.Post.filter({ status: 'published' }, '-published_at', 50).then(p => {
      setPosts(p); setLoading(false);
    });
  }, []);

  const categories = ['all', ...new Set(posts.map(p => p.category).filter(Boolean))];
  const filtered = posts.filter(p => {
    if (category !== 'all' && p.category !== category) return false;
    if (search && !`${p.title} ${p.excerpt}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold mb-2">Blog & Analysis</h1>
        <p className="text-muted-foreground">Expert insights, match previews, and sports analysis.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search posts..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map(c => (
          <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c)} className="capitalize">
            {c}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
            <Link key={p.id} to={`/blog/${p.slug}`} className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:border-primary/20 hover:shadow-md transition-all">
              {p.featured_image ? (
                <img src={p.featured_image} alt={p.title} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">No image</span>
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {p.category && (
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{p.category}</span>
                  )}
                </div>
                <h2 className="font-heading text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">{p.title}</h2>
                {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">{p.excerpt}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                  {p.author_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{p.author_name}</span>}
                  {p.published_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{moment(p.published_at).format('MMM D, YYYY')}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">No posts found.</p>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import moment from 'moment';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Post.filter({ slug, status: 'published' }).then(posts => {
      setPost(posts[0] || null); setLoading(false);
    });
  }, [slug]);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-64 bg-muted rounded" />
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-muted rounded" />)}</div>
      </div>
    </div>
  );

  if (!post) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h2 className="font-heading text-2xl font-bold mb-4">Post Not Found</h2>
      <Link to="/blog"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Blog</Button></Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Blog
      </Link>

      {post.category && (
        <span className="text-xs font-bold text-primary uppercase tracking-wider mb-3 block">{post.category}</span>
      )}
      <h1 className="font-heading text-4xl sm:text-5xl font-bold leading-tight mb-6">{post.title}</h1>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
        {post.author_name && <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{post.author_name}</span>}
        {post.published_at && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{moment(post.published_at).format('MMMM D, YYYY')}</span>}
        {post.tags && <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" />{post.tags}</span>}
      </div>

      {post.featured_image && (
        <img src={post.featured_image} alt={post.title} className="w-full h-64 sm:h-80 object-cover rounded-xl mb-8" />
      )}

      <div className="prose prose-slate max-w-none leading-relaxed">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </div>
  );
}
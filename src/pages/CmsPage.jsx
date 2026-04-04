import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import localDb from '@/lib/localDb';

export default function CmsPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pages = localDb.pages.getAll();
    const found = pages.find(p => p.slug === slug && p.status === 'active');
    setPage(found || null);
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-6xl font-bold text-slate-200 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-700 mb-2">Page Not Found</h2>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist.</p>
        <a href="/" className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
          Go Home
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {page.featured_image && (
        <div className="w-full h-64 md:h-80 lg:h-96 overflow-hidden">
          <img 
            src={page.featured_image} 
            alt={page.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <article className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {page.title}
          </h1>
          {page.meta_description && (
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {page.meta_description}
            </p>
          )}
        </header>
        <div 
          className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: page.content || '<p class="text-center text-slate-500">No content yet.</p>' }}
        />
      </article>
    </div>
  );
}

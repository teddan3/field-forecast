import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Heart, Trash2, Edit, Send, User, Crown, Shield, Lock, Plus, Search, Filter, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import community from '@/lib/community';
import useCurrentUser from '@/hooks/useCurrentUser';

const CATEGORIES = [
  { value: 'all', label: 'All Posts' },
  { value: 'predictions', label: 'Predictions' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'strategies', label: 'Strategies' },
  { value: 'tips', label: 'Tips & Tricks' },
  { value: 'general', label: 'General' },
];

export default function Community() {
  const { user, isPremium, isVip } = useCurrentUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' });
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    community.seedDemoData();
    loadPosts();
  }, []);

  const loadPosts = () => {
    setLoading(true);
    const allPosts = community.getPosts();
    setPosts(allPosts);
    setLoading(false);
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) {
      toast.error('Please fill in all fields');
      return;
    }

    const post = community.createPost(newPost);
    toast.success('Post created successfully!');
    setNewPost({ title: '', content: '', category: 'general' });
    setShowNewPost(false);
    loadPosts();
  };

  const handleLike = (postId) => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }
    community.likePost(postId);
    loadPosts();
  };

  const handleDeletePost = (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    const result = community.deletePost(postId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Post deleted');
      if (selectedPost?.id === postId) setSelectedPost(null);
      loadPosts();
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    community.addComment(selectedPost.id, newComment);
    setComments(community.getComments(selectedPost.id));
    setNewComment('');
    toast.success('Comment added');
  };

  const openPost = (post) => {
    setSelectedPost(post);
    setComments(community.getComments(post.id));
  };

  const filteredPosts = posts.filter(post => {
    if (category !== 'all' && post.category !== category) return false;
    if (search && !post.title.toLowerCase().includes(search.toLowerCase()) && 
        !post.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getRoleBadge = (role, membership) => {
    if (membership === 'vip' || role === 'admin') {
      return <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold text-xs font-medium">VIP</span>;
    }
    if (membership === 'premium') {
      return <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">Premium</span>;
    }
    return <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">Free</span>;
  };

  // Premium gate for non-premium users
  if (!isPremium && !isVip) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold mb-4">Premium Community</h1>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Join our exclusive community of sports analysts and enthusiasts. 
            Get access to live discussions, premium predictions, and share insights with fellow members.
          </p>
          <Link to="/pricing">
            <Button size="lg" className="gap-2">
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </Button>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Exclusive Access</h3>
            <p className="text-sm text-muted-foreground">Connect with other premium members and share insights</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <MessageSquare className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Live Discussions</h3>
            <p className="text-sm text-muted-foreground">Engage in real-time discussions about matches and predictions</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Premium Tips</h3>
            <p className="text-sm text-muted-foreground">Get exclusive betting strategies from experienced members</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Community
          </h1>
          <p className="text-muted-foreground mt-1">Connect with fellow sports enthusiasts</p>
        </div>
        <Button onClick={() => setShowNewPost(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-2xl w-full">
            <h2 className="font-heading text-xl font-bold mb-4">Create New Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Enter post title..."
                  required
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Share your thoughts..."
                  rows={5}
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowNewPost(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Post</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getRoleBadge(selectedPost.user_role, selectedPost.user_membership)}
                  <span className="text-sm text-muted-foreground">{selectedPost.user_name}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(selectedPost.created_at)}</span>
                </div>
                <h2 className="font-heading text-2xl font-bold">{selectedPost.title}</h2>
              </div>
              <button onClick={() => setSelectedPost(null)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            
            <p className="text-muted-foreground whitespace-pre-wrap mb-6">{selectedPost.content}</p>
            
            <div className="border-t border-border pt-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments ({comments.length})
              </h3>
              
              <div className="space-y-4 mb-6">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.user_name}</span>
                        {getRoleBadge(comment.user_role)}
                        <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleAddComment} className="flex gap-3">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-card rounded-xl border border-border animate-pulse" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">No posts found</p>
          <p className="text-sm mt-1">Be the first to create a post!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <div
              key={post.id}
              className="bg-card rounded-xl border border-border p-5 hover:border-primary/20 transition-colors cursor-pointer"
              onClick={() => openPost(post)}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {getRoleBadge(post.user_role, post.user_membership)}
                    <span className="text-sm font-medium">{post.user_name}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs capitalize">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${post.likes?.includes(user?.id) ? 'fill-primary text-primary' : ''}`} />
                      {post.likes?.length || 0}
                    </button>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4" />
                      {community.getComments(post.id).length}
                    </span>
                    {(post.user_id === user?.id || user?.role === 'admin') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                        className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80 ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STORAGE_PREFIX = 'ff_';

const getStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorage = (key, value) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const community = {
  getPosts() {
    return getStorage('community_posts', []);
  },

  getPost(id) {
    return this.getPosts().find(p => p.id === id);
  },

  createPost(data) {
    const posts = this.getPosts();
    const currentUser = JSON.parse(localStorage.getItem('ff_current_user') || '{}');
    
    const newPost = {
      id: generateId(),
      user_id: currentUser.id || 'anonymous',
      user_name: currentUser.full_name || currentUser.email || 'Anonymous',
      user_role: currentUser.role || 'user',
      user_membership: currentUser.membership_type || 'free',
      title: data.title,
      content: data.content,
      category: data.category || 'general',
      likes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    posts.unshift(newPost);
    setStorage('community_posts', posts);
    return newPost;
  },

  updatePost(id, data) {
    const posts = this.getPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    
    const currentUser = JSON.parse(localStorage.getItem('ff_current_user') || '{}');
    if (posts[idx].user_id !== currentUser.id && currentUser.role !== 'admin') {
      return { error: 'Unauthorized' };
    }
    
    posts[idx] = { ...posts[idx], ...data, updated_at: new Date().toISOString() };
    setStorage('community_posts', posts);
    return posts[idx];
  },

  deletePost(id) {
    const posts = this.getPosts();
    const currentUser = JSON.parse(localStorage.getItem('ff_current_user') || '{}');
    const post = posts.find(p => p.id === id);
    
    if (!post) return { error: 'Post not found' };
    if (post.user_id !== currentUser.id && currentUser.role !== 'admin') {
      return { error: 'Unauthorized' };
    }
    
    setStorage('community_posts', posts.filter(p => p.id !== id));
    return true;
  },

  getComments(postId) {
    return getStorage('community_comments', []).filter(c => c.post_id === postId);
  },

  addComment(postId, content) {
    const comments = getStorage('community_comments', []);
    const currentUser = JSON.parse(localStorage.getItem('ff_current_user') || '{}');
    
    const newComment = {
      id: generateId(),
      post_id: postId,
      user_id: currentUser.id || 'anonymous',
      user_name: currentUser.full_name || currentUser.email || 'Anonymous',
      user_role: currentUser.role || 'user',
      content,
      created_at: new Date().toISOString(),
    };
    
    comments.push(newComment);
    setStorage('community_comments', comments);
    return newComment;
  },

  deleteComment(commentId) {
    const comments = getStorage('community_comments', []);
    const currentUser = JSON.parse(localStorage.getItem('ff_current_user') || '{}');
    const comment = comments.find(c => c.id === commentId);
    
    if (!comment) return { error: 'Comment not found' };
    if (comment.user_id !== currentUser.id && currentUser.role !== 'admin') {
      return { error: 'Unauthorized' };
    }
    
    setStorage('community_comments', comments.filter(c => c.id !== commentId));
    return true;
  },

  likePost(postId) {
    const posts = this.getPosts();
    const currentUser = JSON.parse(localStorage.getItem('ff_current_user') || '{}');
    const idx = posts.findIndex(p => p.id === postId);
    if (idx === -1) return null;
    
    const userId = currentUser.id || 'anonymous';
    const likes = posts[idx].likes || [];
    
    if (likes.includes(userId)) {
      posts[idx].likes = likes.filter(l => l !== userId);
    } else {
      posts[idx].likes.push(userId);
    }
    
    setStorage('community_posts', posts);
    return posts[idx];
  },

  seedDemoData() {
    const existingPosts = this.getPosts();
    if (existingPosts.length > 0) return;

    const demoPosts = [
      {
        id: 'demo_post_1',
        user_id: 'demo_user_1',
        user_name: 'John Smith',
        user_role: 'premium',
        user_membership: 'premium',
        title: 'Champions League Final Prediction',
        content: 'Based on current form and statistics, I predict a 2-1 victory for Real Madrid. Their defensive record in knockout stages has been exceptional. What do you all think?',
        category: 'predictions',
        likes: ['user_1', 'user_2', 'user_3'],
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'demo_post_2',
        user_id: 'demo_user_2',
        user_name: 'Sarah Johnson',
        user_role: 'premium',
        user_membership: 'premium',
        title: 'Premier League Weekend Preview',
        content: 'This weekend promises exciting matches! Key games to watch: Man City vs Arsenal will determine the title race, while Liverpool looks to maintain their lead against Chelsea.',
        category: 'analysis',
        likes: ['user_1', 'user_4'],
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'demo_post_3',
        user_id: 'demo_user_3',
        user_name: 'Mike Williams',
        user_role: 'vip',
        user_membership: 'vip',
        title: 'NBA Playoff Betting Strategy',
        content: 'For those interested in NBA playoffs, I recommend focusing on home court advantage and recent injury reports. The data shows home teams win 65% of playoff games.',
        category: 'strategies',
        likes: ['user_2', 'user_3', 'user_5'],
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    const demoComments = [
      {
        id: 'demo_comment_1',
        post_id: 'demo_post_1',
        user_id: 'user_1',
        user_name: 'Tom Baker',
        user_role: 'premium',
        content: 'Great analysis! I agree with the 2-1 prediction.',
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'demo_comment_2',
        post_id: 'demo_post_1',
        user_id: 'user_2',
        user_name: 'Emma Davis',
        user_role: 'vip',
        content: 'I think it could be a draw. Both defenses are solid.',
        created_at: new Date(Date.now() - 900000).toISOString(),
      },
    ];

    setStorage('community_posts', demoPosts);
    setStorage('community_comments', demoComments);
  },
};

export default community;

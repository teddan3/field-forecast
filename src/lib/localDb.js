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

const deleteStorage = (key) => {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
    return true;
  } catch {
    return false;
  }
};

export const localDb = {
  pages: {
    getAll: () => getStorage('pages', []),
    get: (id) => getStorage('pages', []).find(p => p.id === id),
    create: (data) => {
      const pages = getStorage('pages', []);
      const newPage = { ...data, id: `page_${Date.now()}`, created_date: new Date().toISOString(), updated_date: new Date().toISOString() };
      pages.push(newPage);
      setStorage('pages', pages);
      return newPage;
    },
    update: (id, data) => {
      const pages = getStorage('pages', []);
      const idx = pages.findIndex(p => p.id === id);
      if (idx !== -1) {
        pages[idx] = { ...pages[idx], ...data, updated_date: new Date().toISOString() };
        setStorage('pages', pages);
        return pages[idx];
      }
      return null;
    },
    delete: (id) => {
      const pages = getStorage('pages', []);
      setStorage('pages', pages.filter(p => p.id !== id));
      return true;
    },
  },

  sections: {
    getAll: () => getStorage('sections', []),
    get: (id) => getStorage('sections', []).find(s => s.id === id),
    getByPage: (page) => getStorage('sections', []).filter(s => s.page === page).sort((a, b) => a.order - b.order),
    getByName: (page, name) => getStorage('sections', []).find(s => s.page === page && s.name === name),
    create: (data) => {
      const sections = getStorage('sections', []);
      const newSection = { ...data, id: `section_${Date.now()}`, created_date: new Date().toISOString(), updated_date: new Date().toISOString() };
      sections.push(newSection);
      setStorage('sections', sections);
      return newSection;
    },
    update: (id, data) => {
      const sections = getStorage('sections', []);
      const idx = sections.findIndex(s => s.id === id);
      if (idx !== -1) {
        sections[idx] = { ...sections[idx], ...data, updated_date: new Date().toISOString() };
        setStorage('sections', sections);
        return sections[idx];
      }
      return null;
    },
    delete: (id) => {
      const sections = getStorage('sections', []);
      setStorage('sections', sections.filter(s => s.id !== id));
      return true;
    },
  },

  media: {
    getAll: () => getStorage('media', []),
    get: (id) => getStorage('media', []).find(m => m.id === id),
    create: (data) => {
      const media = getStorage('media', []);
      const newMedia = { ...data, id: `media_${Date.now()}`, created_date: new Date().toISOString() };
      media.push(newMedia);
      setStorage('media', media);
      return newMedia;
    },
    update: (id, data) => {
      const media = getStorage('media', []);
      const idx = media.findIndex(m => m.id === id);
      if (idx !== -1) {
        media[idx] = { ...media[idx], ...data };
        setStorage('media', media);
        return media[idx];
      }
      return null;
    },
    delete: (id) => {
      const media = getStorage('media', []);
      setStorage('media', media.filter(m => m.id !== id));
      return true;
    },
  },

  users: {
    getAll: () => getStorage('users', []),
    get: (id) => getStorage('users', []).find(u => u.id === id),
    getByEmail: (email) => getStorage('users', []).find(u => u.email === email),
    create: (data) => {
      const users = getStorage('users', []);
      if (users.find(u => u.email === data.email)) {
        return { error: 'Email already exists' };
      }
      const newUser = {
        ...data,
        id: `user_${Date.now()}`,
        membership_type: data.membership_type || 'free',
        membership_status: data.membership_status || 'active',
        membership_expiry_date: data.membership_expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_date: new Date().toISOString(),
      };
      users.push(newUser);
      setStorage('users', users);
      return newUser;
    },
    update: (id, data) => {
      const users = getStorage('users', []);
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...data, updated_date: new Date().toISOString() };
        setStorage('users', users);
        return users[idx];
      }
      return null;
    },
    delete: (id) => {
      const users = getStorage('users', []);
      setStorage('users', users.filter(u => u.id !== id));
      return true;
    },
    login: (email, password) => {
      const users = getStorage('users', []);
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        const token = `token_${Date.now()}_${Math.random().toString(36).substr(2)}`;
        setStorage('auth_token', token);
        setStorage('current_user', user);
        return { user, token };
      }
      return { error: 'Invalid credentials' };
    },
    logout: () => {
      deleteStorage('auth_token');
      deleteStorage('current_user');
      return true;
    },
    getCurrentUser: () => getStorage('current_user', null),
    isAuthenticated: () => !!getStorage('auth_token', null),
  },

  seo: {
    getAll: () => getStorage('seo', []),
    get: (page) => getStorage('seo', []).find(s => s.page === page),
    upsert: (page, data) => {
      const seo = getStorage('seo', []);
      const idx = seo.findIndex(s => s.page === page);
      if (idx !== -1) {
        seo[idx] = { ...seo[idx], ...data };
      } else {
        seo.push({ page, ...data });
      }
      setStorage('seo', seo);
      return seo[idx] || { page, ...data };
    },
  },

  plans: {
    getAll: () => getStorage('plans', [
      { id: 'free', name: 'Free', price: 0, features: ['Free daily odds', 'Basic predictions', 'Community access'] },
      { id: 'premium', name: 'Premium', price: 29.99, features: ['All free features', 'Premium predictions', 'Email support', 'Early access'] },
      { id: 'vip', name: 'VIP', price: 99.99, features: ['All premium features', 'VIP predictions', 'Phone support', 'Exclusive tips', '1-on-1 consultation'] },
    ]),
  },

  payments: {
    getAll: () => getStorage('payments', []),
    get: (id) => getStorage('payments', []).find(p => p.id === id),
    create: (data) => {
      const payments = getStorage('payments', []);
      const newPayment = { ...data, id: `payment_${Date.now()}`, created_date: new Date().toISOString() };
      payments.push(newPayment);
      setStorage('payments', payments);
      return newPayment;
    },
    update: (id, data) => {
      const payments = getStorage('payments', []);
      const idx = payments.findIndex(p => p.id === id);
      if (idx !== -1) {
        payments[idx] = { ...payments[idx], ...data };
        setStorage('payments', payments);
        return payments[idx];
      }
      return null;
    },
  },

  settings: {
    getAll: () => getStorage('settings', {}),
    get: (key) => getStorage('settings', {})[key],
    set: (key, value) => {
      const settings = getStorage('settings', {});
      settings[key] = value;
      setStorage('settings', settings);
      return settings;
    },
    setMultiple: (data) => {
      const settings = getStorage('settings', {});
      Object.assign(settings, data);
      setStorage('settings', settings);
      return settings;
    },
  },

  activity: {
    getAll: () => getStorage('activity', []),
    log: (data) => {
      const activity = getStorage('activity', []);
      const newLog = { ...data, id: `log_${Date.now()}`, created_date: new Date().toISOString() };
      activity.unshift(newLog);
      if (activity.length > 500) activity.pop();
      setStorage('activity', activity);
      return newLog;
    },
    clear: () => setStorage('activity', []),
  },

  initialize: () => {
    if (!getStorage('initialized', false)) {
      setStorage('pages', [
        { id: 'page_home', title: 'Home', slug: '/', route: '/', page_type: 'home', status: 'active' },
        { id: 'page_free_odds', title: 'Free Odds', slug: 'free-odds', route: '/free-odds', page_type: 'listing', status: 'active' },
        { id: 'page_premium_odds', title: 'Premium Odds', slug: 'premium-odds', route: '/premium-odds', page_type: 'listing', status: 'active' },
        { id: 'page_sports', title: 'Sports', slug: 'sports', route: '/sports', page_type: 'listing', status: 'active' },
        { id: 'page_pricing', title: 'Pricing', slug: 'pricing', route: '/pricing', page_type: 'pricing', status: 'active' },
        { id: 'page_blog', title: 'Blog', slug: 'blog', route: '/blog', page_type: 'blog', status: 'active' },
        { id: 'page_contact', title: 'Contact', slug: 'contact', route: '/contact', page_type: 'contact', status: 'active' },
        { id: 'page_about', title: 'About Us', slug: 'about', route: '/page/about', page_type: 'default', status: 'active', meta_title: 'About Field Forecast', meta_description: 'Learn about our expert team', content: '<h1>About Us</h1><p>We are a team of sports analysts...</p>' },
      ]);
      
      setStorage('sections', [
        // Home page sections
        { id: 'sec_home_1', page: 'home', name: 'hero', section_type: 'hero', title: 'Data-Driven Odds Intelligence', subtitle: 'Access professional-grade sports analysis and odds intelligence. Trusted by analysts who demand precision.', cta_primary_text: 'View Free Odds', cta_primary_link: '/free-odds', cta_secondary_text: 'Go Premium', cta_secondary_link: '/pricing', badge_text: 'Field Forecast Odds Prediction System', image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1600', status: 'active', order: 1 },
        { id: 'sec_home_2', page: 'home', name: 'stats', section_type: 'stats', stats: JSON.stringify([{ label: 'Matches Daily', value: '200+' }, { label: 'Success Rate', value: '78%' }, { label: 'Active Members', value: '12K+' }, { label: 'Sports Covered', value: '15+' }]), status: 'active', order: 2 },
        { id: 'sec_home_3', page: 'home', name: 'features', section_type: 'features', title: 'Why Choose Field Forecast?', subtitle: 'Professional-grade intelligence for serious analysts', features: JSON.stringify([
          { icon: 'TrendingUp', title: 'Precision Analytics', desc: 'Algorithmic odds analysis with 78%+ historical accuracy across all major leagues.' },
          { icon: 'Shield', title: 'Verified Data', desc: 'Every prediction is backed by statistical models and expert verification.' },
          { icon: 'Crown', title: 'VIP Intelligence', desc: 'Exclusive high-confidence picks and advanced insights for our VIP members.' },
          { icon: 'Zap', title: 'Real-Time Updates', desc: 'Live odds and instant notifications when key predictions are published.' },
          { icon: 'Users', title: 'Expert Community', desc: 'Join 12,000+ analysts who rely on Field Forecast for their sports intelligence.' },
          { icon: 'Star', title: 'Multi-Sport Coverage', desc: 'Football, basketball, tennis, and 15+ sports with deep market analysis.' }
        ]), status: 'active', order: 3 },
        { id: 'sec_home_4', page: 'home', name: 'about', section_type: 'content', title: 'About Field Forecast', subtitle: 'Your trusted sports intelligence platform', content: '<p>Field Forecast is your premier destination for data-driven sports analysis and betting intelligence. Our team of expert analysts combines advanced statistical models with years of sports betting experience to deliver accurate predictions.</p><p>We cover over 15 sports leagues worldwide, providing daily odds analysis and premium predictions for our members.</p>', status: 'active', order: 4 },
        { id: 'sec_home_5', page: 'home', name: 'free_odds_preview', section_type: 'content', title: 'Today\'s Free Predictions', subtitle: 'Get started with our daily free odds', content: '<p>Check out our free daily predictions for today\'s top matches across all major leagues.</p>', cta_text: 'View All Free Odds', cta_link: '/free-odds', status: 'active', order: 5 },
        { id: 'sec_home_6', page: 'home', name: 'cta', section_type: 'cta', title: 'Unlock the Full Intelligence Suite', subtitle: 'Get access to all premium odds, advanced analysis, and VIP predictions.', cta_text: 'View Membership Plans', cta_link: '/pricing', status: 'active', order: 6 },
        
        // Free Odds page sections
        { id: 'sec_free_1', page: 'free-odds', name: 'page_header', section_type: 'header', title: 'Free Odds', subtitle: "Today's best free predictions and odds analysis.", status: 'active', order: 1 },
        
        // Premium Odds page sections
        { id: 'sec_premium_1', page: 'premium-odds', name: 'page_header', section_type: 'header', title: 'Premium Odds', subtitle: 'Exclusive high-value predictions for our premium members.', status: 'active', order: 1 },
        
        // Sports page sections
        { id: 'sec_sports_1', page: 'sports', name: 'page_header', section_type: 'header', title: 'Sports Categories', subtitle: 'Browse predictions by sport. We cover major leagues worldwide.', status: 'active', order: 1 },
        { id: 'sec_sports_2', page: 'sports', name: 'sports_grid', section_type: 'grid', title: 'Featured Sports', subtitle: 'Our most popular sports for predictions', grid_items: JSON.stringify([
          { name: 'Football', icon: '⚽', count: '500+', color: '#22c55e' },
          { name: 'Basketball', icon: '🏀', count: '300+', color: '#f97316' },
          { name: 'Tennis', icon: '🎾', count: '200+', color: '#06b6d4' },
          { name: 'Baseball', icon: '⚾', count: '150+', color: '#ef4444' },
          { name: 'Hockey', icon: '🏒', count: '100+', color: '#3b82f6' },
          { name: 'Soccer', icon: '⚽', count: '400+', color: '#22c55e' }
        ]), status: 'active', order: 2 },
        
        // Pricing page sections
        { id: 'sec_pricing_1', page: 'pricing', name: 'page_header', section_type: 'header', title: 'Membership Plans', subtitle: 'Choose the plan that fits your analysis needs.', status: 'active', order: 1 },
        
        // Blog page sections
        { id: 'sec_blog_1', page: 'blog', name: 'page_header', section_type: 'header', title: 'Analysis & Insights', subtitle: 'Expert analysis, betting tips, and sports news.', status: 'active', order: 1 },
        
        // Contact page sections
        { id: 'sec_contact_1', page: 'contact', name: 'page_header', section_type: 'header', title: 'Get in Touch', subtitle: 'Have questions? We\'d love to hear from you.', status: 'active', order: 1 },
        { id: 'sec_contact_2', page: 'contact', name: 'contact_info', section_type: 'contact', email: 'support@fieldforecast.com', phone: '+1 (555) 123-4567', address: 'Sports Analytics Center\n123 Prediction Lane\nNew York, NY 10001', status: 'active', order: 2 },
      ]);
      
      setStorage('users', [
        { id: 'user_admin', full_name: 'Admin User', email: 'admin@fieldforecast.com', password: 'admin123', role: 'admin', membership_type: 'premium', membership_status: 'active' },
        { id: 'user_editor', full_name: 'Editor User', email: 'editor@fieldforecast.com', password: 'editor123', role: 'editor', membership_type: 'free', membership_status: 'active' },
      ]);
      setStorage('media', []);
      setStorage('initialized', true);
    }
  },
};

localDb.initialize();

export default localDb;

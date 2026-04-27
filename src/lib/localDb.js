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
        { id: 'page_about', title: 'About Us', slug: 'about', route: '/page/about', page_type: 'default', status: 'active', meta_title: 'About Field Forecast', meta_description: 'Empowering sports fans with accurate data and insightful predictions', content: '<h2>Who We Are</h2><p>Field Forecast is your trusted source for sports data and predictions. We empower sports fans, analysts, and professionals with accurate, real-time sports information.</p><h3>Our Mission</h3><p>At Field Forecast, our mission is to empower sports fans, analysts, and professionals with accurate, real-time sports data and insightful predictions. We deliver comprehensive coverage across multiple sports to help you make smarter decisions and stay connected to the game.</p><h3>What We Offer</h3><p>We provide instant scores, detailed match statistics, historical records, team and player information, and data-driven predictions for sports including football, baseball, basketball, handball, hockey, rugby, and volleyball. Our platform combines trusted data sources with advanced analytics to bring you meaningful insights in a user-friendly format.</p><h3>Sports News</h3><p>Beyond scores and stats, Field Forecast keeps you informed with the latest sports news, updates, and expert analyses. Our dedicated news section covers breaking stories, player transfers, match previews, and in-depth features to ensure you never miss a moment in the world of sports.</p><h3>Our Vision</h3><p>We aspire to be a leading global hub for sports data by continuously enhancing our platform, expanding our sports coverage, and introducing innovative features that meet the evolving needs of the sports community worldwide.</p><h3>Our Commitment</h3><p>Transparency, reliability, and user trust are at the core of everything we do. We are dedicated to maintaining a stable and secure platform that supports informed sports fandom and professional analysis alike.</p><h3>Join Our Community</h3><p>Thank you for choosing Field Forecast as your trusted source for sports information. Together, we stay ahead of the game.</p>' },
      ]);

      // Ensure legal pages exist for footer links (added separately to avoid editing large embedded content)
      const existing = getStorage('pages', []);
      const toAdd = [];
      if (!existing.find(p => p.slug === 'terms')) {
        toAdd.push({ id: 'page_terms', title: 'Terms and Conditions', slug: 'terms', route: '/page/terms', page_type: 'default', status: 'active', meta_title: 'Terms and Conditions', meta_description: 'Terms and conditions for using Field Forecast', content: '<h2>Terms and Conditions</h2><p>These are the terms and conditions for using Field Forecast. This is a placeholder page. Please replace with your official terms.</p>' });
      }
      if (!existing.find(p => p.slug === 'privacy')) {
        toAdd.push({ id: 'page_privacy', title: 'Privacy Policy', slug: 'privacy', route: '/page/privacy', page_type: 'default', status: 'active', meta_title: 'Privacy Policy', meta_description: 'Privacy policy for Field Forecast', content: '<h2>Privacy Policy</h2><p>This is the privacy policy placeholder. Please replace with your official privacy policy content.</p>' });
      }
      if (!existing.find(p => p.slug === 'copyright')) {
        toAdd.push({ id: 'page_copyright', title: 'Copyright', slug: 'copyright', route: '/page/copyright', page_type: 'default', status: 'active', meta_title: 'Copyright', meta_description: 'Copyright information for Field Forecast', content: '<h2>Copyright</h2><p>All content on Field Forecast is protected by copyright. This is a placeholder copyright page.</p>' });
      }
      if (toAdd.length) setStorage('pages', existing.concat(toAdd));
      
      setStorage('sections', [
        // Home page sections
        { id: 'sec_home_1', page: 'home', name: 'hero', section_type: 'hero', title: 'Data-Driven Odds Intelligence', subtitle: 'Access professional-grade sports analysis and odds intelligence. Trusted by analysts who demand precision.', cta_primary_text: 'View Free Odds', cta_primary_link: '/free-odds', cta_secondary_text: 'Go Premium', cta_secondary_link: '/pricing', badge_text: 'Field Forecast Odds Prediction System', image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1600', status: 'active', order: 1 },
        { id: 'sec_home_2', page: 'home', name: 'stats', section_type: 'stats', stats: JSON.stringify([{ label: 'Sports Covered', value: '7+' }, { label: 'Leagues Worldwide', value: '50+' }, { label: 'Active Users', value: '10K+' }, { label: 'Predictions Daily', value: '500+' }]), status: 'active', order: 2 },
        { id: 'sec_home_3', page: 'home', name: 'features', section_type: 'features', title: 'Why Choose Field Forecast?', subtitle: 'Your trusted source for sports data and predictions', features: JSON.stringify([
          { icon: 'TrendingUp', title: 'Real-Time Scores', desc: 'Instant live scores and match updates across all major sports leagues worldwide.' },
          { icon: 'Shield', title: 'Accurate Predictions', desc: 'Data-driven predictions powered by advanced analytics and expert analysis.' },
          { icon: 'Star', title: 'Comprehensive Coverage', desc: 'Football, baseball, basketball, handball, hockey, rugby, and volleyball coverage.' },
          { icon: 'Zap', title: 'Instant Updates', desc: 'Get notified immediately when scores change or new predictions are available.' },
          { icon: 'Users', title: 'Expert Analysis', desc: 'In-depth match previews, player stats, and expert insights on every game.' },
          { icon: 'Newspaper', title: 'Sports News', desc: 'Breaking stories, transfer news, and in-depth features from the sports world.' }
        ]), status: 'active', order: 3 },
        { id: 'sec_home_4', page: 'home', name: 'about', section_type: 'content', title: 'About Field Forecast', subtitle: 'Empowering sports fans with accurate data and insightful predictions', content: '<h3>Our Mission</h3><p>At Field Forecast, our mission is to empower sports fans, analysts, and professionals with accurate, real-time sports data and insightful predictions. We deliver comprehensive coverage across multiple sports to help you make smarter decisions and stay connected to the game.</p><h3>What We Offer</h3><p>We provide instant scores, detailed match statistics, historical records, team and player information, and data-driven predictions for sports including football, baseball, basketball, handball, hockey, rugby, and volleyball. Our platform combines trusted data sources with advanced analytics to bring you meaningful insights in a user-friendly format.</p><h3>Our Vision</h3><p>We aspire to be a leading global hub for sports data by continuously enhancing our platform, expanding our sports coverage, and introducing innovative features that meet the evolving needs of the sports community worldwide.</p><h3>Our Commitment</h3><p>Transparency, reliability, and user trust are at the core of everything we do. We are dedicated to maintaining a stable and secure platform that supports informed sports fandom and professional analysis alike.</p>', status: 'active', order: 4 },
        { id: 'sec_home_5', page: 'home', name: 'free_odds_preview', section_type: 'content', title: 'Today\'s Free Predictions', subtitle: 'Get started with our daily free odds', content: '<p>Check out our free daily predictions for today\'s top matches across all major leagues.</p>', cta_text: 'View All Free Odds', cta_link: '/free-odds', status: 'active', order: 5 },
        { id: 'sec_home_6', page: 'home', name: 'cta', section_type: 'cta', title: 'Unlock the Full Intelligence Suite', subtitle: 'Get access to all premium odds, advanced analysis, and VIP predictions.', cta_text: 'View Membership Plans', cta_link: '/pricing', status: 'active', order: 6 },
        
        // Free Odds page sections
        { id: 'sec_free_1', page: 'free-odds', name: 'page_header', section_type: 'header', title: 'Free Odds', subtitle: "Today's best free predictions and odds analysis.", status: 'active', order: 1 },
        
        // Premium Odds page sections
        { id: 'sec_premium_1', page: 'premium-odds', name: 'page_header', section_type: 'header', title: 'Premium Odds', subtitle: 'Exclusive high-value predictions for our premium members.', status: 'active', order: 1 },
        
        // Sports page sections
        { id: 'sec_sports_1', page: 'sports', name: 'page_header', section_type: 'header', title: 'Sports Categories', subtitle: 'Browse predictions by sport. We cover major leagues worldwide.', status: 'active', order: 1 },
        { id: 'sec_sports_2', page: 'sports', name: 'sports_grid', section_type: 'grid', title: 'Sports We Cover', subtitle: 'Comprehensive coverage across major sports worldwide', grid_items: JSON.stringify([
          { name: 'Football', icon: '⚽', count: 'Premier League, La Liga, Serie A', color: '#22c55e' },
          { name: 'Basketball', icon: '🏀', count: 'NBA, EuroLeague', color: '#f97316' },
          { name: 'Baseball', icon: '⚾', count: 'MLB, KBO', color: '#ef4444' },
          { name: 'Hockey', icon: '🏒', count: 'NHL', color: '#3b82f6' },
          { name: 'Handball', icon: '🤾', count: 'EHF Champions League', color: '#8b5cf6' },
          { name: 'Rugby', icon: '🏉', count: '6 Nations, Rugby World Cup', color: '#ec4899' },
          { name: 'Volleyball', icon: '🏐', count: 'World League, Champions League', color: '#f59e0b' },
          { name: 'Tennis', icon: '🎾', count: 'ATP, WTA, Grand Slams', color: '#06b6d4' }
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

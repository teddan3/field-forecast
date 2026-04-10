import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AdminLogin from './components/AdminLogin';

const DEV_MODE = true;

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import CmsPage from './pages/CmsPage';
import FreeOdds from './pages/FreeOdds';
import PremiumOdds from './pages/PremiumOdds';
import SportsCategories from './pages/SportsCategories';
import MembershipPricing from './pages/MembershipPricing';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import Community from './pages/Community';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import AdminOdds from './pages/admin/AdminOdds';
import AdminMatches from './pages/admin/AdminMatches';
import AdminContent from './pages/admin/AdminContent';
import AdminHomepage from './pages/admin/AdminHomepage';
import AdminSeo from './pages/admin/AdminSeo';
import AdminBlog from './pages/admin/AdminBlog';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPlans from './pages/admin/AdminPlans';
import AdminContacts from './pages/admin/AdminContacts';
import AdminSports from './pages/admin/AdminSports';
import AdminMedia from './pages/admin/AdminMedia';
import AdminPayments from './pages/admin/AdminPayments';
import AdminApiSettings from './pages/admin/AdminApiSettings';
import AdminSettings from './pages/admin/AdminSettings';
import AdminActivityLog from './pages/admin/AdminActivityLog';
import AdminRoles from './pages/admin/AdminRoles';
import AdminPageBuilder from './pages/admin/AdminPageBuilder';
import AdminPageSections from './pages/admin/AdminPageSections';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Dev Admin Login */}
      {DEV_MODE && (
        <Route path="/admin/login" element={<AdminLogin />} />
      )}

      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/free-odds" element={<FreeOdds />} />
        <Route path="/premium-odds" element={<PremiumOdds />} />
        <Route path="/sports" element={<SportsCategories />} />
        <Route path="/pricing" element={<MembershipPricing />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/community" element={<Community />} />
        <Route path="/page/:slug" element={<CmsPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/pagebuilder" element={<AdminPageBuilder />} />
        <Route path="/admin/odds" element={<AdminOdds />} />
        <Route path="/admin/matches" element={<AdminMatches />} />
        <Route path="/admin/content" element={<AdminContent />} />
        <Route path="/admin/homepage" element={<AdminHomepage />} />
        <Route path="/admin/seo" element={<AdminSeo />} />
        <Route path="/admin/blog" element={<AdminBlog />} />
        <Route path="/admin/media" element={<AdminMedia />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/roles" element={<AdminRoles />} />
        <Route path="/admin/plans" element={<AdminPlans />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/sections" element={<AdminPageSections />} />
        <Route path="/admin/contacts" element={<AdminContacts />} />
        <Route path="/admin/sports" element={<AdminSports />} />
        <Route path="/admin/api" element={<AdminApiSettings />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/activity" element={<AdminActivityLog />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
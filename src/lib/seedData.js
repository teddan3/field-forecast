import { base44 } from '@/api/base44Client';

const DEV_MODE = true;

export const seedDemoData = async () => {
  if (!DEV_MODE) return;

  try {
    const [existingPages, existingSections] = await Promise.all([
      base44.entities.PageContent.list('-created_date', 1),
      base44.entities.HomepageSection.list('-created_date', 1),
    ]);

    if (existingPages.length === 0) {
      const pages = [
        { title: 'Home', slug: '/', meta_title: 'Field Forecast - Sports Predictions', meta_description: 'Expert sports predictions and betting odds', content: 'Welcome to Field Forecast', status: 'active' },
        { title: 'Free Odds', slug: 'free-odds', meta_title: 'Free Sports Odds', meta_description: 'Free daily sports betting odds', content: 'Free betting tips and odds', status: 'active' },
        { title: 'Premium Odds', slug: 'premium-odds', meta_title: 'Premium Predictions', meta_description: 'Premium sports predictions for members', content: 'Premium predictions for subscribers', status: 'active' },
        { title: 'About Us', slug: 'about', meta_title: 'About Field Forecast', meta_description: 'Learn about our expert team', content: 'About our company and team', status: 'active' },
        { title: 'Contact', slug: 'contact', meta_title: 'Contact Us', meta_description: 'Get in touch with our team', content: 'Contact information', status: 'active' },
      ];

      for (const page of pages) {
        try {
          await base44.entities.PageContent.create(page);
        } catch (e) {}
      }
      console.log('Demo pages created');
    }

    if (existingSections.length === 0) {
      const sections = [
        {
          section_name: 'hero',
          section_title: 'Expert Sports Predictions',
          section_subtitle: 'Get winning tips from industry experts',
          content: 'Join thousands of successful bettors who trust our predictions.',
          image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1200',
          cta_text: 'Get Started',
          cta_link: '/pricing',
          status: 'active',
          display_order: 1,
        },
        {
          section_name: 'features',
          section_title: 'Why Choose Us',
          section_subtitle: 'The best sports prediction platform',
          content: JSON.stringify([
            { icon: 'trophy', title: 'Expert Analysis', description: 'Predictions from seasoned analysts' },
            { icon: 'chart', title: 'Win Rate', description: 'Over 85% accuracy on premium tips' },
            { icon: 'clock', title: 'Real Time', description: 'Live updates and instant notifications' },
          ]),
          status: 'active',
          display_order: 2,
        },
        {
          section_name: 'cta',
          section_title: 'Ready to Win?',
          section_subtitle: 'Start your winning streak today',
          content: 'Join our premium membership and get access to exclusive predictions.',
          cta_text: 'View Plans',
          cta_link: '/pricing',
          status: 'active',
          display_order: 3,
        },
        {
          section_name: 'testimonials',
          section_title: 'What Our Members Say',
          section_subtitle: 'Trusted by thousands of bettors',
          content: JSON.stringify([
            { name: 'John D.', text: 'Best predictions I have ever used. Won big last weekend!' },
            { name: 'Sarah M.', text: 'The premium tips are incredibly accurate. Highly recommend!' },
            { name: 'Mike R.', text: 'Easy to use and the results speak for themselves.' },
          ]),
          status: 'active',
          display_order: 4,
        },
      ];

      for (const section of sections) {
        try {
          await base44.entities.HomepageSection.create(section);
        } catch (e) {}
      }
      console.log('Demo sections created');
    }

    if (existingPages.length === 0 || existingSections.length === 0) {
      console.log('Demo data seeding complete');
    }
  } catch (err) {
    console.log('Seed skipped (may need Base44 connection)');
  }
};

export default seedDemoData;

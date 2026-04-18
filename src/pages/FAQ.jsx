import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Shield, Mail, MapPin, Globe, Users, TrendingUp, Award, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const faqs = [
  {
    question: "What is Field Forecasts?",
    answer: "Field Forecasts is a sports intelligence platform that provides live scores, sports data, insights, and trend-based predictions to help fans and analysts stay informed about matches around the world."
  },
  {
    question: "Where does Field Forecasts get its data?",
    answer: "We source our information from trusted sports data providers who supply verified match updates, statistics, team details, and event information."
  },
  {
    question: "Are the predictions guaranteed?",
    answer: "Our predictions are based on observed trends, performance patterns, and available data. They are meant to guide and inform users, not guarantee outcomes."
  },
  {
    question: "What sports or leagues are covered?",
    answer: "Field Forecasts aims to provide global coverage, including major and minor leagues across football and other sports. Coverage may expand as the platform grows."
  },
  {
    question: "Who is Field Forecasts made for?",
    answer: "Our platform serves everyday fans, bettors, analysts, fantasy players, and anyone who wants organized sports information in one place."
  },
  {
    question: "Does Field Forecasts charge for access?",
    answer: "Some features may be free, while advanced tools or sections may require a subscription depending on future platform development."
  },
  {
    question: "How often is the information updated?",
    answer: "Match events and data are updated in real time as provided by our partners. Update speeds may vary depending on the league or data source."
  },
  {
    question: "How does Field Forecasts ensure transparency?",
    answer: "We present data and insights clearly, avoid unrealistic claims, and aim to give users straightforward access to sports information without exaggeration."
  },
  {
    question: "What makes Field Forecasts different?",
    answer: "Our focus is on clarity, transparency, global coverage, easy navigation, and continuous system improvements that enhance user experience."
  },
  {
    question: "How is Field Forecasts improving its platform?",
    answer: "We are consistently upgrading our systems, expanding coverage, refining our features, and adding new tools to deliver more value to every visitor."
  },
  {
    question: "Does Field Forecasts encourage gambling?",
    answer: "Our platform provides sports information and trend-based insights for general knowledge and entertainment. Users make their own independent decisions."
  },
  {
    question: "How can I contact Field Forecasts?",
    answer: "You can reach us through our website's contact page or support section for inquiries, suggestions, or collaboration requests."
  }
];

const stats = [
  { icon: Globe, value: "50+", label: "Leagues Worldwide" },
  { icon: TrendingUp, value: "500+", label: "Matches Daily" },
  { icon: Users, value: "10K+", label: "Active Users" },
  { icon: Clock, value: "24/7", label: "Live Updates" }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary/5 border-b">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground text-lg">
            Find answers to common questions about Field Forecasts
          </p>
        </div>
      </section>

      {/* Stats */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-5 pb-5 text-muted-foreground">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-card rounded-2xl border border-primary/20 p-8 text-center">
          <h2 className="font-heading text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find the answer you're looking for? Contact our support team.
          </p>
          <Button asChild>
            <Link to="/contact" className="gap-2">
              <Mail className="w-4 h-4" />
              Contact Us
            </Link>
          </Button>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <section className="bg-muted/30 border-t">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-heading font-bold mb-4">Important Disclaimer</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Field Forecasts provides sports information and trend-based insights for general knowledge and entertainment purposes only. 
              The data and predictions presented on this platform are based on information from trusted third-party providers and are intended 
              to help users stay informed about sports events worldwide. We do not encourage, promote, or facilitate gambling. 
              Users make their own independent decisions regarding any betting activities. Field Forecasts shall not be held responsible for any 
              losses or damages resulting from the use of this information. Please gamble responsibly and seek professional advice 
              if needed.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
import React from 'react';
import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PricingCard = ({ title, price, description, features, notIncluded, isPopular, buttonText }) => (
  <div className={`relative flex flex-col p-8 glass-panel rounded-[2rem] transition-all hover:scale-105 duration-300 ${
    isPopular ? 'border-blue-500 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] bg-blue-900/10' : 'border-white/10'
  }`}>
    {isPopular && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-xs font-bold text-white uppercase tracking-wide">
        Most Popular
      </div>
    )}
    
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-6 h-10">{description}</p>
      <div className="flex items-baseline text-white">
        <span className="text-5xl font-extrabold tracking-tight">৳{price}</span>
        <span className="ml-1 text-xl font-medium text-gray-400">/mo</span>
      </div>
    </div>
    
    <ul className="flex-1 space-y-4 mb-8">
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-start">
          <Check className="w-5 h-5 text-blue-400 shrink-0 mr-3" />
          <span className="text-gray-300 text-sm">{feature}</span>
        </li>
      ))}
      {notIncluded && notIncluded.map((feature, idx) => (
        <li key={`not-${idx}`} className="flex items-start opacity-50">
          <X className="w-5 h-5 text-gray-500 shrink-0 mr-3" />
          <span className="text-gray-400 text-sm">{feature}</span>
        </li>
      ))}
    </ul>
    
    <Link 
      to="/login?register=true" 
      className={`w-full py-4 px-6 rounded-xl font-semibold text-center transition-all ${
        isPopular 
          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
          : 'bg-white/10 hover:bg-white/20 text-white'
      }`}
    >
      {buttonText}
    </Link>
  </div>
);

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-gray-400">
              Choose the plan that best fits your legal research needs. All plans include access to the core Bangladesh Acts database.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard 
              title="Basic"
              price="0"
              description="Perfect for students and casual researchers."
              features={[
                "Access to all 1,484 acts",
                "Basic semantic search",
                "50 AI queries per month",
                "Standard response speed"
              ]}
              notIncluded={[
                "Legal document summarization",
                "Case law cross-referencing",
                "Priority email support"
              ]}
              buttonText="Get Started Free"
            />
            
            <PricingCard 
              title="Pro"
              price="1,200"
              description="For legal professionals and law firms."
              isPopular={true}
              features={[
                "Everything in Basic",
                "Unlimited AI queries",
                "Fastest response speed (GPU prioritized)",
                "Legal document summarization",
                "Export citations to PDF/Word",
                "Priority email support"
              ]}
              buttonText="Upgrade to Pro"
            />
            
            <PricingCard 
              title="Enterprise"
              price="Custom"
              description="For large law firms and corporate legal departments."
              features={[
                "Everything in Pro",
                "Dedicated account manager",
                "Custom act fine-tuning",
                "API access",
                "SSO authentication",
                "24/7 phone & email support"
              ]}
              buttonText="Contact Sales"
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;

import React from 'react';
import { Check, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "0",
      desc: "For occasional legal queries",
      features: [
        "Standard Gemini AI Chat",
        "Browse Lawyer Directory",
        "Book Consultations",
        "Basic Session History"
      ],
      missing: [
        "RAG-Verified Citations",
        "Document Analysis (PDF/Docx)",
        "Priority Lawyer Matching",
        "Unlimited AI Queries"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "299",
      desc: "For serious legal needs & research",
      features: [
        "Standard Gemini AI Chat",
        "Browse Lawyer Directory",
        "Book Consultations",
        "Basic Session History",
        "RAG-Verified Citations (BD Penal Code)",
        "Document Analysis (PDF/Docx)",
        "Priority Lawyer Matching",
        "Unlimited AI Queries"
      ],
      missing: [],
      cta: "Upgrade to Pro",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      desc: "For law firms & organizations",
      features: [
        "Everything in Pro",
        "Manage Multiple Lawyers",
        "Firm Booking Dashboard",
        "White-labeled Client Portal",
        "API Access",
        "Dedicated Account Manager"
      ],
      missing: [],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="py-24 bg-zinc-950 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-zinc-50 tracking-tight mb-4">
            Transparent Pricing for Everyone
          </h1>
          <p className="text-xl text-zinc-400">
            Choose the plan that fits your legal needs. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <Card 
              key={idx} 
              className={`relative flex flex-col ${
                plan.popular 
                  ? 'border-violet-500 shadow-2xl shadow-violet-900/20 md:-mt-4 md:mb-4 bg-zinc-900/80 backdrop-blur-sm' 
                  : 'bg-zinc-900'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Badge variant="pro" className="bg-violet-600 text-white border-none px-4 py-1 text-sm shadow-lg shadow-violet-900/50">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pt-8">
                <h3 className="text-2xl font-semibold text-zinc-50 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-3xl font-bold text-zinc-50">Tk.</span>
                  <span className="text-5xl font-extrabold text-zinc-50">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-zinc-500 font-medium">/mo</span>}
                </div>
                <p className="text-sm text-zinc-400">{plan.desc}</p>
              </CardHeader>
              
              <CardContent className="flex-1">
                <ul className="space-y-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                      <span className="text-sm text-zinc-300">{f}</span>
                    </li>
                  ))}
                  {plan.missing.map((m, i) => (
                    <li key={i} className="flex items-start gap-3 opacity-50">
                      <X className="h-5 w-5 text-zinc-600 shrink-0" />
                      <span className="text-sm text-zinc-400">{m}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-violet-600 hover:bg-violet-500' : ''}`}
                  variant={plan.popular ? 'primary' : 'secondary'}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}

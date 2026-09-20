import React from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { User, Gavel, Building2, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const [params] = useSearchParams();
  const role = params.get('role');

  if (!role) {
    return <Navigate to="/roles" replace />;
  }
  const roleConfig = {
    client: {
      icon: User,
      title: 'Client account',
      text: 'No documents required. Start chatting instantly.',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    lawyer: {
      icon: Gavel,
      title: 'Join as a verified advocate',
      text: 'After signup you will upload your Bar Council ID for verification.',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    firm: {
      icon: Building2,
      title: 'Register your law firm',
      text: 'After signup you will create your firm profile and add lawyers.',
      color: 'text-violet-500',
      bg: 'bg-violet-500/10'
    }
  };

  const config = roleConfig[role] || roleConfig.client;
  const Icon = config.icon;

  const clerkAppearance = {
    baseTheme: dark,
    variables: { 
      colorPrimary: '#2563eb', 
      colorBackground: '#09090b', 
      colorInputBackground: '#18181b', 
      colorInputText: '#fafafa', 
      colorText: '#fafafa' 
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4 flex flex-col">
      <div className="max-w-md mx-auto w-full">
        
        <Link to="/roles" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-50 transition-colors mb-6">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to roles
        </Link>

        {/* Role Banner */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex items-start gap-4 shadow-sm">
          <div className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${config.bg} ${config.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-zinc-50 font-semibold mb-0.5">{config.title}</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">{config.text}</p>
          </div>
        </div>

        {/* Clerk SignUp */}
        <div className="flex justify-center">
          <SignUp signInUrl="/login" appearance={clerkAppearance} />
        </div>
        
      </div>
    </div>
  );
}

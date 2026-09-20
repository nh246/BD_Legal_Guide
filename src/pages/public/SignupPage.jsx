import React, { useState } from 'react';
import { SignUp } from '@clerk/clerk-react';
import { User, Briefcase, Building2 } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    {
      id: 'client',
      title: 'Client',
      desc: 'I need legal guidance or a lawyer',
      icon: User
    },
    {
      id: 'lawyer',
      title: 'Solo Lawyer',
      desc: 'I want to provide legal services',
      icon: Briefcase
    },
    {
      id: 'firm',
      title: 'Law Firm',
      desc: 'I want to manage a team of lawyers',
      icon: Building2
    }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex flex-col items-center justify-center p-4">
      
      {!selectedRole ? (
        <div className="max-w-3xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-50 mb-3">Join BD Legal Guide AI</h1>
            <p className="text-zinc-400">Select how you want to use the platform to continue.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card 
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className="cursor-pointer hover:border-blue-500 hover:bg-zinc-800/50 transition-all group p-6 text-center"
              >
                <div className="h-16 w-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center mb-6 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors text-zinc-400">
                  <role.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-50 mb-2">{role.title}</h3>
                <p className="text-sm text-zinc-400">{role.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
          <button 
            onClick={() => setSelectedRole(null)}
            className="mb-6 text-sm text-zinc-400 hover:text-zinc-50 transition-colors"
          >
            ← Back to Role Selection
          </button>
          
          <SignUp 
            routing="hash" 
            unsafeMetadata={{ role: selectedRole }}
            appearance={{
              elements: {
                card: "bg-zinc-900 border border-zinc-800 shadow-xl rounded-xl",
                headerTitle: "text-zinc-50 font-bold",
                headerSubtitle: "text-zinc-400",
                socialButtonsBlockButton: "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-50",
                socialButtonsBlockButtonText: "text-zinc-50 font-medium",
                dividerLine: "bg-zinc-800",
                dividerText: "text-zinc-500",
                formFieldLabel: "text-zinc-300",
                formFieldInput: "bg-zinc-950 border-zinc-800 text-zinc-50 focus:ring-blue-500 focus:border-blue-500",
                formButtonPrimary: "bg-blue-600 hover:bg-blue-500 text-white",
                footerActionText: "text-zinc-400",
                footerActionLink: "text-blue-500 hover:text-blue-400"
              }
            }}
          />
        </div>
      )}

    </div>
  );
}

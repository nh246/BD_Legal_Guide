import React from 'react';
import { Link } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
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
    <div className="min-h-screen bg-zinc-950 flex flex-col py-16 px-4">
      <div className="max-w-md mx-auto w-full">
        
        {/* Ghost Link */}
        <Link to="/" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-50 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Home
        </Link>

        {/* Clerk SignIn */}
        <div className="flex justify-center">
          <SignIn signUpUrl="/roles" appearance={clerkAppearance} />
        </div>

      </div>
    </div>
  );
}

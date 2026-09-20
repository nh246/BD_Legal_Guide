import React from 'react';
import { Scale, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-gray-900/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Scale className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-gray-300">
              BD<span className="text-white">LegalAI</span>
            </span>
          </div>
          
          <div className="flex space-x-6 text-sm text-gray-400">
            <Link to="#" className="hover:text-blue-400 transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-blue-400 transition-colors">Terms</Link>
            <Link to="#" className="hover:text-blue-400 transition-colors">Contact</Link>
          </div>
          
          <div className="text-sm text-gray-500 mt-4 md:mt-0 flex items-center">
            Made with <Heart className="h-3 w-3 text-red-500 mx-1" /> for Bangladesh
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

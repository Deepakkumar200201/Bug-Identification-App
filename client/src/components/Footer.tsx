import { Link } from "wouter";

import { 
  Bug, 
  Camera, 
  BookOpen, 
  FileText, 
  Database, 
  Star, 
  FileQuestion, 
  Book, 
  HelpCircle, 
  Shield, 
  Mail, 
  ExternalLink,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  // Prepare social icon paths outside of JSX to avoid conditional hooks issue
  const socialIcons = {
    facebook: <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />,
    twitter: <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />,
    instagram: <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.067-.06-1.407-.06-4.123v-.08c0-2.643.012-2.987.06-4.043.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.455 2.525c.636-.247 1.363-.416 2.427-.465C9.957 2.013 10.3 2 12.315 2z" />,
    github: <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  };

  // Premium features section
  const premiumSection = (
    <div>
      <p className="text-sm text-gray-300 mb-3">
        Try our premium features for enhanced bug identification
      </p>
      <Link href="/premium">
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white w-full">
          View Premium Options
        </Button>
      </Link>
    </div>
  );

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-950 text-white pt-20 pb-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-indigo-600/50 to-primary/50"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          {/* Company column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <Bug className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl tracking-tight">
                BugID<span className="text-primary">Pro</span>
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Our advanced Gemini AI-powered platform provides instant and accurate bug identification with rich information about each species.
            </p>
            
            <div className="mb-8 bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              {premiumSection}
            </div>
          </div>
          
          {/* Quick links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white/90 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Features
            </h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  <span>Camera Identification</span>
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary transition-colors flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Personal Logbook</span>
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>Bug Database</span>
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary transition-colors flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Species Information</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white/90 flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              Resources
            </h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Featured Insects</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center gap-2">
                  <FileQuestion className="h-4 w-4" />
                  <span>Identification Help</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>API Access</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>FAQs & Support</span>
                </a>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white/90 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Company
            </h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>About Us</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Privacy Policy</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Terms of Service</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Contact</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Newsletter */}
        <div className="bg-gradient-to-r from-primary/20 to-indigo-600/20 rounded-xl p-6 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-1">Stay updated with BugID Pro</h4>
              <p className="text-gray-300 text-sm">Get the latest bug identification tips and feature updates</p>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white"
              />
              <Button className="bg-white text-primary hover:bg-white/90">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-0">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} BugID Pro. All rights reserved.
            </p>
            <div className="flex gap-4 text-xs text-gray-500">
              <a href="#" className="hover:text-gray-300">Privacy</a>
              <a href="#" className="hover:text-gray-300">Terms</a>
              <a href="#" className="hover:text-gray-300">Cookies</a>
            </div>
          </div>
          
          <div className="flex space-x-5">
            {/* Social icons - using the prepared paths to avoid conditional rendering */}
            {(['facebook', 'twitter', 'instagram', 'github'] as const).map(platform => (
              <a 
                key={platform}
                href="#" 
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label={platform}
              >
                <div className="h-8 w-8 rounded-full border border-gray-700 flex items-center justify-center hover:border-primary">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {socialIcons[platform]}
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
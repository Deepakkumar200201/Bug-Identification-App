import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Bug, 
  Search, 
  Book, 
  Home as HomeIcon, 
  Info,
  Users,
  GraduationCap,
  Download,
  Globe
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export function Header() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-gradient-to-r from-primary/90 to-indigo-700/90 text-white shadow-md relative z-20">
      {/* Top notification bar */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 py-1.5 px-4 text-xs sm:text-sm text-white text-center font-medium">
        Using Gemini AI technology for accurate insect identification
      </div>
      
      <div className="container mx-auto flex h-16 items-center justify-between py-2 px-4">
        <div className="flex items-center gap-2">
          <Bug className="h-7 w-7 text-white" />
          <Link href="/" className="flex items-center gap-1">
            <span className="font-bold text-2xl tracking-tight">
              BugID
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white">
            <HomeIcon className="h-4 w-4" />
            Home
          </Link>
          <Link href="/home" className="flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white">
            <Search className="h-4 w-4" />
            Identify
          </Link>
          <Link href="/field-guide" className="flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white">
            <Book className="h-4 w-4" />
            Field Guide
          </Link>
          <Link href="/community" className="flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white">
            <Users className="h-4 w-4" />
            Community
          </Link>
          <Link href="/education" className="flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white">
            <GraduationCap className="h-4 w-4" />
            Learn
          </Link>
          <Link href="/about" className="flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white">
            <Info className="h-4 w-4" />
            About
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-1 rounded-md text-white focus:outline-none" 
            onClick={toggleMobileMenu}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary/95 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" className="block px-3 py-2 text-white hover:bg-white/10 rounded-md">
              <div className="flex items-center gap-3">
                <HomeIcon className="h-5 w-5" />
                Home
              </div>
            </Link>
            <Link href="/home" className="block px-3 py-2 text-white hover:bg-white/10 rounded-md">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5" />
                Identify
              </div>
            </Link>
            <Link href="/field-guide" className="block px-3 py-2 text-white hover:bg-white/10 rounded-md">
              <div className="flex items-center gap-3">
                <Book className="h-5 w-5" />
                Field Guide
              </div>
            </Link>
            <Link href="/community" className="block px-3 py-2 text-white hover:bg-white/10 rounded-md">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                Community
              </div>
            </Link>
            <Link href="/education" className="block px-3 py-2 text-white hover:bg-white/10 rounded-md">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5" />
                Learn
              </div>
            </Link>
            <Link href="/about" className="block px-3 py-2 text-white hover:bg-white/10 rounded-md">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5" />
                About
              </div>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
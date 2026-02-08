import logoImage from 'figma:asset/90c5d6bf4c03d5cb5ffab3af18389097f479007b.png';
import { Button } from './ui/button';
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Navigation() {
  return (
    <nav className="border-b border-border bg-background/95 sticky top-0 z-50 backdrop-blur-sm transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand (Left) */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center gap-3 group cursor-pointer transition-transform hover:scale-105 active:scale-95">
              <img
                src={logoImage}
                alt="DataIQ Logo"
                className="h-16 sm:h-20 w-auto object-contain transition-transform group-hover:scale-110"
              />
              <span className="font-bold text-xl sm:text-2xl text-primary">DataIQ</span>
            </Link>
          </div>

          {/* Navigation Links (Center) */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-5 lg:gap-8 text-sm px-4">
            <a href="#product" className="text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">Product</a>
            <a href="#use-cases" className="text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">Use Cases</a>
            <a href="#connectors" className="text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">Connectors</a>
            <a href="#security" className="text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">Security</a>
            <a href="#solutions" className="text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">Solutions</a>
            <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">Pricing</Link>
            <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">FAQ</Link>
          </div>

          {/* Action Buttons (Right) */}
          <div className="flex items-center flex-shrink-0 gap-3 sm:gap-4">
            <Link to="/login">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors" title="Log In">
                <User className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="rounded-full px-8 h-12 text-base font-bold text-white bg-primary hover:bg-blue-500 hover:shadow-lg active:scale-95 transition-all shadow-sm">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
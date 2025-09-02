import { Heart, Shield, Users, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-neutral-100 border-t border-neutral-200 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Care Echo Logo" 
                className="w-[10rem] h-12 object-contain"
              />
            </Link>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Supporting healthcare professionals with compassionate survey tools designed for wellness and insight.
            </p>
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Heart className="h-4 w-4 text-accent-teal" />
              <span>Made with care for caregivers</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-neutral-900">Quick Access</h4>
            <nav className="flex flex-col space-y-3">
              <Link to="/survey" className="text-neutral-600 hover:text-brand-red-600 transition-colors text-sm focus-ring">
                Shift Check-In
              </Link>
              <Link to="/" className="text-neutral-600 hover:text-brand-red-600 transition-colors text-sm focus-ring">
                Dashboard
              </Link>
              <a href="#" className="text-neutral-600 hover:text-brand-red-600 transition-colors text-sm focus-ring">
                Analytics
              </a>
              <a href="#" className="text-neutral-600 hover:text-brand-red-600 transition-colors text-sm focus-ring">
                Resources
              </a>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-neutral-900">Support</h4>
            <nav className="flex flex-col space-y-3">
              <a href="#" className="text-neutral-600 hover:text-brand-red-600 transition-colors text-sm focus-ring">
                Help Center
              </a>
              <a href="#" className="text-neutral-600 hover:text-brand-red-600 transition-colors text-sm focus-ring">
                Privacy Policy
              </a>
              <a href="#" className="text-neutral-600 hover:text-brand-red-600 transition-colors text-sm focus-ring">
                Terms of Service
              </a>
              <a href="#" className="text-neutral-600 hover:text-brand-red-600 transition-colors text-sm focus-ring">
                Contact Us
              </a>
            </nav>
          </div>

          {/* Contact & Values */}
          <div className="space-y-4">
            <h4 className="font-semibold text-neutral-900">Our Values</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <Shield className="h-4 w-4 text-brand-red-600" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <Users className="h-4 w-4 text-accent-teal" />
                <span>Staff-Centered Design</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <Mail className="h-4 w-4 text-brand-red-600" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-neutral-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-neutral-600">
            © {new Date().getFullYear()} Care Echo. Built with compassion for healthcare heroes by{" "}
            <a 
              href="https://zenwareai.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent-teal hover:text-brand-red-600 transition-colors focus-ring"
            >
              ZenwareAI
            </a>
            .
          </p>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-neutral-600 hover:text-brand-red-600 transition-colors text-sm focus-ring">
              Accessibility
            </a>
            <a href="#" className="text-neutral-600 hover:text-brand-red-600 transition-colors text-sm focus-ring">
              Security
            </a>
            <a href="#" className="text-neutral-600 hover:text-brand-red-600 transition-colors text-sm focus-ring">
              Status
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
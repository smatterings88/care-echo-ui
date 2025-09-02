import { Heart, Shield, Users, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-healthcare-green rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CE</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Care Echo</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Supporting healthcare professionals with compassionate survey tools designed for wellness and insight.
            </p>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 text-healthcare-green" />
              <span>Made with care for caregivers</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Access</h4>
            <nav className="flex flex-col space-y-3">
              <Link to="/survey" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Shift Check-In
              </Link>
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Dashboard
              </Link>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Analytics
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Resources
              </a>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Support</h4>
            <nav className="flex flex-col space-y-3">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Help Center
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Contact Us
              </a>
            </nav>
          </div>

          {/* Contact & Values */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Our Values</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-healthcare-green" />
                <span>Staff-Centered Design</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2024 Care Echo. Built with compassion for healthcare heroes.
          </p>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Accessibility
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Security
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Status
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
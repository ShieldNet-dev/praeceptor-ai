import { Shield, Github, Twitter, Linkedin } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const links = {
    product: [
      { label: "Features", action: () => scrollToSection('features') },
      { label: "Pricing", action: () => {} },
      { label: "Curriculum", action: () => scrollToSection('curriculum') },
      { label: "Enterprise", action: () => {} },
    ],
    resources: [
      { label: "Documentation", action: () => {} },
      { label: "Blog", action: () => {} },
      { label: "Community", action: () => {} },
      { label: "Support", action: () => {} },
    ],
    company: [
      { label: "About", action: () => {} },
      { label: "Careers", action: () => {} },
      { label: "Privacy", action: () => {} },
      { label: "Terms", action: () => navigate('/terms') },
    ],
  };

  return (
    <footer className="relative border-t border-border/50 bg-card/30">
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">Praeceptor AI</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Your intelligent cybersecurity tutor. Learn security concepts, practice skills, 
              and advance your career with AI-powered education.
            </p>
            <div className="flex gap-4">
              {[Github, Twitter, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4 capitalize">{category}</h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={item.action}
                      className="text-muted-foreground hover:text-primary transition-colors text-left"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Praeceptor AI. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground font-mono">
            <span className="text-primary">{'>'}</span> Securing the future, one lesson at a time
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
